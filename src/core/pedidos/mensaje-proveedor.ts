import type { Pedido } from "./tipos";

/**
 * Borrador del mensaje para el proveedor. No se envía solo: el dueño lo revisa y lo aprueba desde el
 * panel. Incluye lo que el proveedor necesita para despachar y nada de precios de venta ni márgenes.
 */
export function mensajeParaProveedor(pedido: Pedido): string {
  const productos = pedido.items.map((i) => `• ${i.cantidad} × ${i.descripcion} ${i.tamanoMl} ml`);
  const { envio } = pedido;
  return [
    `Hola, pedido #${pedido.numero} para despachar:`,
    ...productos,
    "",
    `Entregar a: ${envio.nombre}`,
    `Teléfono: ${envio.telefono}`,
    `Dirección: ${envio.direccion}, ${envio.barrio}, ${envio.ciudad}`,
    ...(pedido.notas ? [`Notas: ${pedido.notas}`] : []),
  ].join("\n");
}
