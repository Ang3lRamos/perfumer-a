import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { PanelRepositorio } from "@/core/panel/metricas";
import { ESTADOS_PEDIDO } from "@/core/pedidos/estados";

// Tope de PostgREST por defecto. Si el negocio lo alcanza, las métricas deberán pasar a vistas agregadas en SQL.
const LIMITE_PEDIDOS = 1000;

// Sin cliente_id ni envio: el tablero no necesita datos personales, así que ni siquiera los pide.
const filaPedido = z.object({
  numero: z.number().int(),
  estado: z.enum(ESTADOS_PEDIDO),
  creado_at: z.iso.datetime({ offset: true }),
  pedido_items: z.array(
    z.object({
      cantidad: z.number().int(),
      precio_unitario_cop: z.number().int(),
      costo_unitario_cop: z.number().int().nullable(),
    }),
  ),
});

const filaProducto = z.object({
  marca: z.string(),
  activo: z.boolean(),
  ficha_verificada: z.boolean(),
  imagenes: z.array(z.string()),
  variantes: z.array(
    z.object({
      precio_cop: z.number().int().nullable(),
      disponible: z.boolean(),
      // Relación 1 a 1 (la llave primaria es la foránea): PostgREST la entrega como objeto, no como lista.
      costos_variante: z.object({ costo_cop: z.number().int() }).nullable(),
    }),
  ),
});

/** Necesita un cliente con sesión de admin: RLS decide qué se ve, este código no se salta nada. */
export function crearPanelRepositorio(cliente: SupabaseClient): PanelRepositorio {
  return {
    async pedidos() {
      const { data, error } = await cliente
        .from("pedidos")
        .select("numero, estado, creado_at, pedido_items (cantidad, precio_unitario_cop, costo_unitario_cop)")
        .order("creado_at", { ascending: false })
        .limit(LIMITE_PEDIDOS);
      if (error) throw new Error(`Error consultando pedidos: ${error.message}`);
      return z.array(filaPedido).parse(data).map((fila) => ({
        numero: fila.numero,
        estado: fila.estado,
        creadoAt: new Date(fila.creado_at),
        items: fila.pedido_items.map((item) => ({
          cantidad: item.cantidad,
          precioUnitarioCop: item.precio_unitario_cop,
          costoUnitarioCop: item.costo_unitario_cop,
        })),
      }));
    },
    async productos() {
      const { data, error } = await cliente
        .from("productos")
        .select("marca, activo, ficha_verificada, imagenes, variantes (precio_cop, disponible, costos_variante (costo_cop))");
      if (error) throw new Error(`Error consultando productos: ${error.message}`);
      return z.array(filaProducto).parse(data).map((fila) => ({
        marca: fila.marca,
        activo: fila.activo,
        fichaVerificada: fila.ficha_verificada,
        imagenes: fila.imagenes,
        variantes: fila.variantes.map((v) => ({
          precioCop: v.precio_cop,
          costoCop: v.costos_variante?.costo_cop ?? null,
          disponible: v.disponible,
        })),
      }));
    },
  };
}
