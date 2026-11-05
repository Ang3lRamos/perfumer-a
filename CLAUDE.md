@AGENTS.md

# Perfumería — convenciones del proyecto

Tienda de perfumes original (dropshipping, contraentrega en Bogotá) con agente de IA en WhatsApp y panel admin.
Next.js 16 (App Router, `cacheComponents`), TypeScript, Tailwind 4, Supabase, Zod, Vitest.

## Capas (la regla de ESLint en `eslint.config.mjs` las hace cumplir)
- `src/core/` — dominio puro: tipos, reglas, funciones puras. No importa `next`, `react`, `@supabase/*`,
  `@anthropic-ai/*` ni `@/infra|features|app`. Habla con el exterior por interfaces en `puertos.ts`.
- `src/infra/` — implementaciones de los puertos (Supabase, Claude, WhatsApp). Validan con Zod todo lo que entra.
- `src/features/<funcionalidad>/` — UI y datos de cada pantalla (catálogo, ficha, panel...). Componentes ≤ ~200 líneas.
- `src/app/` — solo rutas y composición. Sin lógica.
- `src/config/negocio/` — el vertical. Lo específico de perfumes (familias, géneros, filtros, rangos de precio,
  cobertura) vive aquí. Otro negocio = otro archivo + cambiar `index.ts`. No escribir "perfume" en core/infra.
- `src/config/env.ts` — variables de entorno validadas con Zod al arrancar.

## Datos
- Migraciones en `supabase/migrations/` (timestamp + nombre). RLS en todas las tablas; el admin se reconoce por
  `app_metadata.rol = 'admin'`. El servidor del agente usará la secret key.
- Datos personales solo en `clientes`. `eventos` nunca guarda teléfono, nombre ni dirección.
- Pedidos nacen en `pendiente_confirmacion` y las transiciones se validan en el dominio y en un trigger.
- Costos en `costos_variante` (solo admin), no en `variantes`. El PDF del proveedor trae COSTOS: el precio de venta
  se calcula al generar el seed con `negocio.reglaPrecio` (`core/catalogo/precio.ts → precioVenta`). Reimportar
  recalcula los precios, salvo los marcados `precio_manual` desde el panel; la disponibilidad siempre manda el proveedor.
- Catálogo del distribuidor: `npm run catalogo:importar -- <pdf>` → `supabase/datos/catalogo-distribuidor.json` +
  `public/productos/*.webp`; luego `npm run catalogo:seed` → `supabase/seed.sql`. Se cruza por `slug`:
  reimportar actualiza precios y disponibilidad sin cambiar códigos. `supabase/datos/fichas-borrador.ts` es un
  borrador de género/familia sin verificar (`ficha_verificada = false`).
- Imágenes: `productos.imagenes text[]` (la primera es la principal). `npm run catalogo:imagenes` busca fotos en
  las tiendas Shopify oficiales de cada marca y las guarda en `supabase/datos/imagenes-oficiales.json`; si una
  tienda responde con límite de peticiones se omite y conserva lo anterior (no se reintenta ni se disfraza el
  cliente). Las de `cdn.shopify.com` se piden al ancho exacto con `src/infra/imagenes/cargador.ts`.
- Fichas (descripción, pirámide de notas, ocasiones): `supabase/datos/fichas-oficiales.json`, extraídas SOLO del
  texto oficial de la marca (`textos-oficiales.json`, que guarda `catalogo:imagenes`). `npm run catalogo:fichas`
  completa las que falten con Claude (salida estructurada). Si la marca no da notas, no se inventan.
- El código de producto (`LAT-051`) es un contrato con el agente: va en el mensaje prellenado de WhatsApp
  (`core/catalogo/referencia.ts`).

## Agente (core/conversacion)
- `orquestador.ts` aplica las reglas duras en orden: idempotencia por id del canal → modo humano (no llama al
  modelo) → límite por minuto → pedido explícito de persona (sin modelo) → bucle de tool use → guarda de montos
  (solo montos devueltos por herramientas; un reintento con nota de sistema y luego escala) → guardar y medir.
- El historial es append-only: los bloques del modelo se guardan y reenvían intactos. La sesión se corta solo por
  inactividad (12 h); si se alarga demasiado se escala, nunca se recorta el principio.
- Herramientas en `herramientas/`, una por responsabilidad, con esquema Zod validado antes de ejecutar.
- Los precios de un pedido salen del catálogo en `pedidos/armar-pedido.ts`, nunca del modelo.
- Chat de pruebas: `npm run dev` → `/dev/chat` (solo en desarrollo; conversaciones y pedidos en memoria).
- Modelo por `ANTHROPIC_MODEL` (por defecto `claude-opus-5-5`), esfuerzo por `ANTHROPIC_EFFORT` (por defecto `low`).

## Panel (features/panel)
- `/admin` (tablero de solo lectura) y `/admin/entrar`. Sesión de Supabase en cookies; `exigirAdmin()` valida con
  `auth.getUser()` antes de consultar y RLS vuelve a filtrar. Lo que lea la sesión va dentro de `<Suspense>`, sin `use cache`.
- Dar acceso: crear el usuario en Supabase Auth y `update auth.users set raw_app_meta_data = raw_app_meta_data ||
  '{"rol":"admin"}' where email = '...';`. Debe volver a entrar para que el token traiga el rol.
- Métricas puras en `core/panel/metricas.ts`. El tablero no pide datos personales. Vista previa: `/dev/panel` (solo desarrollo).
- Ventas = pedidos `entregado` (contraentrega: antes no se ha cobrado). Días según `negocio.zonaHoraria`.
- Gestión (`features/panel/gestion`): `/admin/precios`, `/admin/promociones`, `/admin/combos`; vista previa en `/dev/panel/gestion`.
  Toda acción pasa por `ejecutar()`, que exige admin y refresca la tienda con `updateTag`.

## Precios, promociones y combos
- `variantes.precio_cop` es el precio base. `aplicarPromociones` lo convierte en precio efectivo al leer el catálogo, así
  tienda, filtros, carrito, agente y `armarPedido` usan la misma cifra (`precioAnteriorCop` es el tachado). No se acumulan:
  gana el menor precio. El panel lee siempre el precio base.
- Guardar un precio distinto al de la regla marca `precio_manual`, y `catalogo:seed` lo respeta al reimportar. Igual a la regla: vuelve a automático.
- Combos (`CMB-000`): precio fijo, sin promociones encima. Se ocultan si un producto se agota. En un pedido van como una
  fila por unidad (`repartirCombo`) con la parte proporcional del precio, para que la suma cuadre exacta.
- La caché de la tienda dura hasta el próximo inicio o fin de promoción/combo (entre 5 min y 1 h, `segundosHastaProximoCambio`).
- Migrar antes de desplegar: el código nuevo lee `promociones` y `combos` al compilar. Sin las tablas el build falla y sigue la versión anterior.

## Comandos
- `npm run dev` · `npm test` · `npm run typecheck` · `npm run lint`
- Red corporativa con inspección TLS: exportar `NODE_OPTIONS=--use-system-ca` antes de `dev`/`build`.

## Estilo
- Código y nombres de dominio en español; sin comentarios que repitan el código, solo el porqué.
- Diseño: tokens en `src/app/globals.css` (blanco y negro: papel, tinta, acento; radio 2px; sin sombras). Productos sin
  foto de calidad (`core/catalogo/imagenes.ts`) se muestran con `ui/EtiquetaProducto`, nunca con la foto borrosa del PDF. Tipografías:
  Instrument Serif (display), Hanken Grotesk (texto), JetBrains Mono (etiquetas y códigos).
- Movimiento: solo `transform`/`opacity`, tokens `--dur-*`/`--ease-*`, respetar `prefers-reduced-motion`.
- Interacción (skills en `.claude/skills/`, sobre todo `apple-design`): lo tocable lleva `presion`; las barras flotantes,
  `material`; los `<dialog>` deslizables, `hoja` + `hoja-abajo`/`hoja-lado` y `ui/useArrastreCierre` en su encabezado;
  los paneles flotantes, `panel`. Entran y salen por el mismo camino, con transiciones interrumpibles, no keyframes.
