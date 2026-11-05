import { z } from "zod";
import { valoresDeAtributo } from "../../catalogo/facetas";
import { estaDisponible, filtrarCatalogo, ordenarCatalogo } from "../../catalogo/filtrar";
import type { Producto } from "../../catalogo/tipos";
import { describirPieza } from "../../combos/combos";
import type { ConfigAgente, Herramienta } from "./tipos";

const MAX_RESULTADOS = 8;
const MAX_RECOMENDACIONES = 3;

/** Vista compacta para el modelo: solo lo que puede decir, con disponibilidad y precio reales. */
function resumen(producto: Producto) {
  return {
    codigo: producto.codigo,
    marca: producto.marca,
    nombre: producto.nombre,
    tipo: producto.tipo,
    presentacion: producto.presentacion,
    atributos: producto.atributos,
    tamanos: producto.variantes.map((v) => ({
      ml: v.tamanoMl,
      precio: v.precioCop,
      disponible: v.disponible,
      ...(v.precioAnteriorCop && { precio_anterior: v.precioAnteriorCop, promocion: v.promocion }),
    })),
  };
}

const montosDe = (productos: Producto[]) =>
  productos.flatMap((p) =>
    p.variantes.flatMap((v) => [v.precioCop, v.precioAnteriorCop]).filter((precio): precio is number => typeof precio === "number"),
  );

function esquemaAtributos(config: ConfigAgente) {
  return z
    .object(
      Object.fromEntries(
        config.atributosFiltrables.map((a) => [
          a.clave,
          z
            .array(z.enum(a.opciones.map((o) => o.valor) as [string, ...string[]]))
            .optional()
            .describe(`${a.etiqueta}: ${a.opciones.map((o) => o.valor).join(", ")}`),
        ]),
      ),
    )
    .partial();
}

export function buscarProductos(config: ConfigAgente) {
  const esquema = z.object({
    texto: z.string().optional().describe("Nombre, marca o código, ej. 'khamrah' o 'LAT-051'"),
    marca: z.string().optional(),
    precio_min: z.number().int().positive().optional(),
    precio_max: z.number().int().positive().optional(),
    atributos: esquemaAtributos(config).optional(),
  });
  return {
    nombre: "buscar_productos",
    descripcion: `Busca ${config.nombreProducto.plural} en el catálogo. Devuelve hasta ${MAX_RESULTADOS} con precio y disponibilidad reales.`,
    esquema,
    async ejecutar(entrada, { deps }) {
      const catalogo = await deps.catalogo.listarActivos();
      // El modelo escribe la marca como sea ("lattafa", "LATTAFA"); se compara sin mayúsculas.
      const marcas = entrada.marca
        ? catalogo.filter((p) => p.marca.toLowerCase() === entrada.marca?.toLowerCase().trim()).map((p) => p.marca)
        : [];
      if (entrada.marca && !marcas.length) return { ok: true, datos: { total: 0, productos: [] } };
      const encontrados = filtrarCatalogo(catalogo, {
        texto: entrada.texto,
        marcas,
        precioMin: entrada.precio_min,
        precioMax: entrada.precio_max,
        atributos: entrada.atributos as Record<string, string[]> | undefined,
      });
      const primeros = ordenarCatalogo(encontrados, "relevancia").slice(0, MAX_RESULTADOS);
      return { ok: true, datos: { total: encontrados.length, productos: primeros.map(resumen) }, montos: montosDe(primeros) };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}

export function obtenerProducto(config: ConfigAgente) {
  const esquema = z.object({ codigo: z.string().describe("Código del producto, ej. LAT-051") });
  return {
    nombre: "obtener_producto",
    descripcion: `Detalle de un ${config.nombreProducto.singular} por código: precio y disponibilidad actuales.`,
    esquema,
    async ejecutar({ codigo }, { deps }) {
      const producto = await deps.catalogo.obtenerPorCodigo(codigo);
      if (!producto) return { ok: false, error: `No existe el producto ${codigo}.` };
      return { ok: true, datos: { ...resumen(producto), descripcion: producto.descripcion }, montos: montosDe([producto]) };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}

export function verCombos() {
  const esquema = z.object({});
  return {
    nombre: "ver_combos",
    descripcion: "Combos disponibles hoy (códigos CMB-000) con su precio fijo, lo que incluyen y lo que costaría por separado.",
    esquema,
    async ejecutar(_entrada, { deps }) {
      const combos = await deps.catalogo.listarCombos();
      const ahorro = (c: (typeof combos)[number]) => Math.max(0, c.precioSueltoCop - c.precioCop);
      return {
        ok: true,
        datos: {
          combos: combos.map((c) => ({
            codigo: c.codigo,
            nombre: c.nombre,
            descripcion: c.descripcion,
            precio: c.precioCop,
            precio_por_separado: c.precioSueltoCop,
            ahorro: ahorro(c),
            incluye: c.piezas.map(describirPieza),
          })),
        },
        montos: combos.flatMap((c) => [c.precioCop, c.precioSueltoCop, ahorro(c)]).filter((monto) => monto > 0),
      };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}

/** Puntaje = cuántas preferencias cumple el producto; sin coincidencias no se recomienda. */
function puntaje(producto: Producto, preferencias: Record<string, string[]>): number {
  return Object.entries(preferencias).reduce(
    (total, [clave, valores]) => total + valoresDeAtributo(producto, clave).filter((v) => valores.includes(v)).length,
    0,
  );
}

export function recomendar(config: ConfigAgente) {
  const esquema = z.object({
    atributos: esquemaAtributos(config),
    presupuesto_max: z.number().int().positive().optional(),
  });
  return {
    nombre: "recomendar",
    descripcion: `Recomienda hasta ${MAX_RECOMENDACIONES} ${config.nombreProducto.plural} disponibles según las preferencias del cliente.`,
    esquema,
    async ejecutar({ atributos, presupuesto_max }, { deps }) {
      const preferencias = atributos as Record<string, string[]>;
      const candidatos = filtrarCatalogo(await deps.catalogo.listarActivos(), {
        soloDisponibles: true,
        precioMax: presupuesto_max,
      }).filter(estaDisponible);
      const elegidos = candidatos
        .map((producto) => ({ producto, puntos: puntaje(producto, preferencias) }))
        .filter(({ puntos }) => puntos > 0)
        .sort((a, b) => b.puntos - a.puntos)
        .slice(0, MAX_RECOMENDACIONES)
        .map(({ producto }) => producto);
      return { ok: true, datos: { recomendaciones: elegidos.map(resumen) }, montos: montosDe(elegidos) };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}
