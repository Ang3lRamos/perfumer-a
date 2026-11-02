import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { negocio, type Atributos } from "@/config/negocio";
import type { CatalogoRepositorio } from "@/core/catalogo/puertos";
import type { Producto } from "@/core/catalogo/tipos";

const COLUMNAS = `
  id, codigo, slug, marca, nombre, tipo, inspiracion_nota, presentacion, descripcion,
  atributos, ficha_verificada, imagen_url,
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
  imagen_url: z.string().nullable(),
  variantes: z.array(
    z.object({
      id: z.uuid(),
      tamano_ml: z.number().int(),
      precio_cop: z.number().int().nullable(),
      disponible: z.boolean(),
    }),
  ),
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
    imagenUrl: fila.imagen_url,
    variantes: fila.variantes
      .map((v) => ({ id: v.id, tamanoMl: v.tamano_ml, precioCop: v.precio_cop, disponible: v.disponible }))
      .sort((a, b) => a.tamanoMl - b.tamanoMl),
  };
}

export function crearCatalogoRepositorio(cliente: SupabaseClient): CatalogoRepositorio<Atributos> {
  async function obtenerPorCodigo(codigo: string): Promise<Producto<Atributos> | null> {
    const { data, error } = await cliente
      .from("productos")
      .select(COLUMNAS)
      .eq("activo", true)
      .eq("codigo", codigo.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(`Error consultando producto ${codigo}: ${error.message}`);
    return data ? aProducto(filaProducto.parse(data)) : null;
  }

  return {
    async listarActivos() {
      const { data, error } = await cliente
        .from("productos")
        .select(COLUMNAS)
        .eq("activo", true)
        .order("marca")
        .order("codigo");
      if (error) throw new Error(`Error listando catálogo: ${error.message}`);
      return z.array(filaProducto).parse(data).map(aProducto);
    },
    obtenerPorCodigo,
  };
}
