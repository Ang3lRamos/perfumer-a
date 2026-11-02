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
  recalcula precios: cuando el panel permita ajustes por producto, habrá que preservarlos.
- Catálogo del distribuidor: `npm run catalogo:importar -- <pdf>` → `supabase/datos/catalogo-distribuidor.json` +
  `public/productos/*.webp`; luego `npm run catalogo:seed` → `supabase/seed.sql`. Se cruza por `slug`:
  reimportar actualiza precios y disponibilidad sin cambiar códigos. `supabase/datos/fichas-borrador.ts` es un
  borrador de género/familia sin verificar (`ficha_verificada = false`).
- Imágenes: `productos.imagenes text[]` (la primera es la principal). `npm run catalogo:imagenes` busca fotos en
  las tiendas Shopify oficiales de cada marca y las guarda en `supabase/datos/imagenes-oficiales.json`; si una
  tienda responde con límite de peticiones se omite y conserva lo anterior (no se reintenta ni se disfraza el
  cliente). Las de `cdn.shopify.com` se piden al ancho exacto con `src/infra/imagenes/cargador.ts`.
- El código de producto (`LAT-051`) es un contrato con el agente: va en el mensaje prellenado de WhatsApp
  (`core/catalogo/referencia.ts`).

## Comandos
- `npm run dev` · `npm test` · `npm run typecheck` · `npm run lint`
- Red corporativa con inspección TLS: exportar `NODE_OPTIONS=--use-system-ca` antes de `dev`/`build`.

## Estilo
- Código y nombres de dominio en español; sin comentarios que repitan el código, solo el porqué.
- Diseño: tokens en `src/app/globals.css` (blanco y negro: papel, tinta, acento; radio 2px; sin sombras). Productos sin
  foto de calidad (`core/catalogo/imagenes.ts`) se muestran con `ui/EtiquetaProducto`, nunca con la foto borrosa del PDF. Tipografías:
  Instrument Serif (display), Hanken Grotesk (texto), JetBrains Mono (etiquetas y códigos).
- Movimiento: solo `transform`/`opacity`, tokens `--dur-*`/`--ease-*`, respetar `prefers-reduced-motion`.
