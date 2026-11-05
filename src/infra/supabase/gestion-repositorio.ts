import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { FilaPrecio, GestionRepositorio } from "@/core/panel/gestion";
import { aCombo, aPromocion, COLUMNAS_COMBO, COLUMNAS_PROMOCION, filaCombo, filaPromocion } from "./catalogo-repositorio";

const filaProducto = z.object({
  id: z.uuid(),
  codigo: z.string(),
  marca: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  variantes: z.array(
    z.object({
      id: z.uuid(),
      tamano_ml: z.number().int(),
      precio_cop: z.number().int().nullable(),
      disponible: z.boolean(),
      precio_manual: z.boolean(),
      // Relación 1 a 1: PostgREST la entrega como objeto, no como lista.
      costos_variante: z.object({ costo_cop: z.number().int() }).nullable(),
    }),
  ),
});

function comprobar(error: { message: string } | null, accion: string) {
  if (error) throw new Error(`Error al ${accion}: ${error.message}`);
}

/** RLS no da error cuando filtra una escritura: simplemente no toca filas. Sin esto, un fallo parecería un éxito. */
function comprobarFilas(data: unknown[] | null, accion: string) {
  if (!data?.length) throw new Error(`Error al ${accion}: no se modificó ningún registro.`);
}

/** Necesita un cliente con sesión de admin: RLS decide qué se puede leer y escribir. */
export function crearGestionRepositorio(cliente: SupabaseClient): GestionRepositorio {
  return {
    async filasPrecio() {
      const { data, error } = await cliente
        .from("productos")
        .select(
          "id, codigo, marca, nombre, activo, variantes (id, tamano_ml, precio_cop, disponible, precio_manual, costos_variante (costo_cop))",
        )
        .order("marca")
        .order("codigo");
      comprobar(error, "consultar precios");
      return z
        .array(filaProducto)
        .parse(data)
        .flatMap((producto) =>
          producto.variantes
            .map(
              (v): FilaPrecio => ({
                varianteId: v.id,
                productoId: producto.id,
                codigo: producto.codigo,
                marca: producto.marca,
                nombre: producto.nombre,
                tamanoMl: v.tamano_ml,
                precioCop: v.precio_cop,
                costoCop: v.costos_variante?.costo_cop ?? null,
                disponible: v.disponible,
                precioManual: v.precio_manual,
                productoActivo: producto.activo,
              }),
            )
            .sort((a, b) => a.tamanoMl - b.tamanoMl),
        );
    },
    async guardarPrecio(varianteId, { precioCop, disponible, manual }) {
      const { data, error } = await cliente
        .from("variantes")
        .update({ precio_cop: precioCop, disponible, precio_manual: manual })
        .eq("id", varianteId)
        .select("id");
      comprobar(error, "guardar el precio");
      comprobarFilas(data, "guardar el precio");
    },
    async promociones() {
      const { data, error } = await cliente.from("promociones").select(COLUMNAS_PROMOCION).order("creado_at", { ascending: false });
      comprobar(error, "consultar promociones");
      return z.array(filaPromocion).parse(data).map(aPromocion);
    },
    async guardarPromocion(id, datos) {
      const fila = {
        nombre: datos.nombre,
        tipo: datos.tipo,
        valor: datos.valor,
        alcance: datos.alcance,
        marca: datos.marca,
        producto_ids: datos.productoIds,
        inicia_at: datos.iniciaAt,
        termina_at: datos.terminaAt,
      };
      const consulta = id ? cliente.from("promociones").update(fila).eq("id", id) : cliente.from("promociones").insert(fila);
      const { data, error } = await consulta.select("id");
      comprobar(error, "guardar la promoción");
      comprobarFilas(data, "guardar la promoción");
    },
    async activarPromocion(id, activa) {
      const { data, error } = await cliente.from("promociones").update({ activa }).eq("id", id).select("id");
      comprobar(error, "cambiar la promoción");
      comprobarFilas(data, "cambiar la promoción");
    },
    async eliminarPromocion(id) {
      const { data, error } = await cliente.from("promociones").delete().eq("id", id).select("id");
      comprobar(error, "eliminar la promoción");
      comprobarFilas(data, "eliminar la promoción");
    },
    async combos() {
      const { data, error } = await cliente.from("combos").select(COLUMNAS_COMBO).order("codigo", { ascending: false });
      comprobar(error, "consultar combos");
      return z.array(filaCombo).parse(data).map(aCombo);
    },
    async guardarCombo(id, datos) {
      const { error } = await cliente.rpc("guardar_combo", {
        p_id: id,
        p_nombre: datos.nombre,
        p_descripcion: datos.descripcion,
        p_precio_cop: datos.precioCop,
        p_inicia_at: datos.iniciaAt,
        p_termina_at: datos.terminaAt,
        p_items: datos.items,
      });
      comprobar(error, "guardar el combo");
    },
    async activarCombo(id, activo) {
      const { data, error } = await cliente.from("combos").update({ activo }).eq("id", id).select("id");
      comprobar(error, "cambiar el combo");
      comprobarFilas(data, "cambiar el combo");
    },
    async eliminarCombo(id) {
      const { data, error } = await cliente.from("combos").delete().eq("id", id).select("id");
      comprobar(error, "eliminar el combo");
      comprobarFilas(data, "eliminar el combo");
    },
  };
}
