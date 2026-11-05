import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { negocio, type Atributos } from "@/config/negocio";
import type { CatalogoRepositorio } from "@/core/catalogo/puertos";
import type { Producto } from "@/core/catalogo/tipos";
import { resolverCombos, type Combo } from "@/core/combos/combos";
import {
  ALCANCES_PROMOCION,
  aplicarPromociones,
  segundosHastaProximoCambio,
  TIPOS_DESCUENTO,
  type Promocion,
} from "@/core/promociones/promociones";

const COLUMNAS = `
  id, codigo, slug, marca, nombre, tipo, inspiracion_nota, presentacion, descripcion,
  atributos, ficha_verificada, imagenes,
  variantes (id, tamano_ml, precio_cop, disponible)
`;

const filaProducto = z.object({
  id: z.uuid(),
  codigo: z.string(),
  slug: z.string(),
  marca: z.string(),
  nombre: z.string(),
  tipo: z.enum(["original", "inspirado", "marca_propia"]),
  inspiracion_nota: z.string().nullable(),
  presentacion: z.string().nullable(),
  descripcion: z.string().nullable(),
  atributos: negocio.atributos,
  ficha_verificada: z.boolean(),
  imagenes: z.array(z.string()),
  variantes: z.array(
    z.object({
      id: z.uuid(),
      tamano_ml: z.number().int(),
      precio_cop: z.number().int().nullable(),
      disponible: z.boolean(),
    }),
  ),
});

const fechaIso = z.iso.datetime({ offset: true }).nullable();

export const COLUMNAS_PROMOCION = "id, nombre, tipo, valor, alcance, marca, producto_ids, activa, inicia_at, termina_at";

export const filaPromocion = z.object({
  id: z.uuid(),
  nombre: z.string(),
  tipo: z.enum(TIPOS_DESCUENTO),
  valor: z.number().int(),
  alcance: z.enum(ALCANCES_PROMOCION),
  marca: z.string().nullable(),
  producto_ids: z.array(z.uuid()),
  activa: z.boolean(),
  inicia_at: fechaIso,
  termina_at: fechaIso,
});

export const aPromocion = (fila: z.infer<typeof filaPromocion>): Promocion => ({
  id: fila.id,
  nombre: fila.nombre,
  tipo: fila.tipo,
  valor: fila.valor,
  alcance: fila.alcance,
  marca: fila.marca,
  productoIds: fila.producto_ids,
  activa: fila.activa,
  iniciaAt: fila.inicia_at,
  terminaAt: fila.termina_at,
});

export const COLUMNAS_COMBO = "id, codigo, nombre, descripcion, precio_cop, activo, inicia_at, termina_at, combo_items (variante_id, cantidad)";

export const filaCombo = z.object({
  id: z.uuid(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  precio_cop: z.number().int(),
  activo: z.boolean(),
  inicia_at: fechaIso,
  termina_at: fechaIso,
  combo_items: z.array(z.object({ variante_id: z.uuid(), cantidad: z.number().int() })),
});

export const aCombo = (fila: z.infer<typeof filaCombo>): Combo => ({
  id: fila.id,
  codigo: fila.codigo,
  nombre: fila.nombre,
  descripcion: fila.descripcion,
  precioCop: fila.precio_cop,
  activo: fila.activo,
  iniciaAt: fila.inicia_at,
  terminaAt: fila.termina_at,
  items: fila.combo_items.map((i) => ({ varianteId: i.variante_id, cantidad: i.cantidad })),
});

function aProducto(fila: z.infer<typeof filaProducto>): Producto<Atributos> {
  return {
    id: fila.id,
    codigo: fila.codigo,
    slug: fila.slug,
    marca: fila.marca,
    nombre: fila.nombre,
    tipo: fila.tipo,
    inspiracionNota: fila.inspiracion_nota,
    presentacion: fila.presentacion,
    descripcion: fila.descripcion,
    atributos: fila.atributos,
    fichaVerificada: fila.ficha_verificada,
    imagenes: fila.imagenes,
    variantes: fila.variantes
      .map((v) => ({ id: v.id, tamanoMl: v.tamano_ml, precioCop: v.precio_cop, disponible: v.disponible }))
      .sort((a, b) => a.tamanoMl - b.tamanoMl),
  };
}

async function leerProductos(cliente: SupabaseClient) {
  const { data, error } = await cliente.from("productos").select(COLUMNAS).eq("activo", true).order("marca").order("codigo");
  if (error) throw new Error(`Error listando catálogo: ${error.message}`);
  return z.array(filaProducto).parse(data).map(aProducto);
}

async function leerPromociones(cliente: SupabaseClient) {
  const { data, error } = await cliente.from("promociones").select(COLUMNAS_PROMOCION);
  if (error) throw new Error(`Error listando promociones: ${error.message}`);
  return z.array(filaPromocion).parse(data).map(aPromocion);
}

async function leerCombos(cliente: SupabaseClient) {
  const { data, error } = await cliente.from("combos").select(COLUMNAS_COMBO).order("codigo");
  if (error) throw new Error(`Error listando combos: ${error.message}`);
  return z.array(filaCombo).parse(data).map(aCombo);
}

export function crearCatalogoRepositorio(cliente: SupabaseClient, reloj: () => Date = () => new Date()) {
  async function leerTienda() {
    const [productos, promociones, combos] = await Promise.all([leerProductos(cliente), leerPromociones(cliente), leerCombos(cliente)]);
    const ahora = reloj();
    const catalogo = aplicarPromociones(productos, promociones, ahora);
    return {
      catalogo,
      combos: resolverCombos(combos, catalogo, ahora),
      segundosVigentes: segundosHastaProximoCambio([...promociones, ...combos], ahora),
    };
  }

  return {
    leerTienda,
    listarActivos: async () => (await leerTienda()).catalogo,
    obtenerPorCodigo: async (codigo: string) => (await leerTienda()).catalogo.find((p) => p.codigo === codigo.toUpperCase()) ?? null,
    listarCombos: async () => (await leerTienda()).combos,
  } satisfies CatalogoRepositorio<Atributos> & { leerTienda: unknown };
}
