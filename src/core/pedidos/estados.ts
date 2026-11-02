export const ESTADOS_PEDIDO = [
  "pendiente_confirmacion",
  "confirmado",
  "enviado_a_distribuidor",
  "despachado",
  "entregado",
  "rechazado_en_puerta",
  "cancelado",
] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

// Misma tabla que el trigger validar_transicion_pedido de la base: el dominio da el error claro,
// la base garantiza que nadie se la salte.
const TRANSICIONES: Partial<Record<EstadoPedido, EstadoPedido[]>> = {
  pendiente_confirmacion: ["confirmado", "cancelado"],
  confirmado: ["enviado_a_distribuidor", "cancelado"],
  enviado_a_distribuidor: ["despachado", "cancelado"],
  despachado: ["entregado", "rechazado_en_puerta"],
};

export function puedeTransicionar(desde: EstadoPedido, hacia: EstadoPedido): boolean {
  return TRANSICIONES[desde]?.includes(hacia) ?? false;
}

export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  pendiente_confirmacion: "Recibido, pendiente de confirmar",
  confirmado: "Confirmado",
  enviado_a_distribuidor: "En preparación",
  despachado: "Despachado, en camino",
  entregado: "Entregado",
  rechazado_en_puerta: "No recibido",
  cancelado: "Cancelado",
};
