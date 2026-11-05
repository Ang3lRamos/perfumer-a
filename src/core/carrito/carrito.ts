import { formatearCop } from "../catalogo/precio";

export interface LineaCarrito {
  varianteId: string;
  codigo: string;
  marca: string;
  nombre: string;
  /** Un combo no tiene ficha propia ni un solo tamaño. */
  slug: string | null;
  tamanoMl: number | null;
  precioCop: number;
  imagen: string | null;
  cantidad: number;
  /** Lo que incluye un combo. */
  detalle?: string;
}

export const CANTIDAD_MAXIMA = 10;

const acotar = (cantidad: number) => Math.min(CANTIDAD_MAXIMA, Math.max(1, Math.trunc(cantidad)));

/** Si la variante ya está, suma cantidades; el precio se actualiza al más reciente del catálogo. */
export function agregar(lineas: LineaCarrito[], nueva: LineaCarrito): LineaCarrito[] {
  const existente = lineas.find((l) => l.varianteId === nueva.varianteId);
  if (!existente) return [...lineas, { ...nueva, cantidad: acotar(nueva.cantidad) }];
  return lineas.map((l) =>
    l.varianteId === nueva.varianteId ? { ...nueva, cantidad: acotar(l.cantidad + nueva.cantidad) } : l,
  );
}

export function cambiarCantidad(lineas: LineaCarrito[], varianteId: string, cantidad: number): LineaCarrito[] {
  return lineas.map((l) => (l.varianteId === varianteId ? { ...l, cantidad: acotar(cantidad) } : l));
}

export function quitar(lineas: LineaCarrito[], varianteId: string): LineaCarrito[] {
  return lineas.filter((l) => l.varianteId !== varianteId);
}

export const totalUnidades = (lineas: LineaCarrito[]) => lineas.reduce((suma, l) => suma + l.cantidad, 0);

export const totalCop = (lineas: LineaCarrito[]) => lineas.reduce((suma, l) => suma + l.precioCop * l.cantidad, 0);

/**
 * Mensaje prellenado para WhatsApp. Cada línea lleva "ref. XXX-000" para que el agente identifique
 * los productos; los precios son los que vio el cliente y el agente los vuelve a validar.
 */
export function mensajePedido(lineas: LineaCarrito[]): string {
  const detalle = lineas.map(
    (l) =>
      `• ${l.cantidad} × ${l.marca} ${l.nombre}${l.tamanoMl ? ` ${l.tamanoMl} ml` : ""} (ref. ${l.codigo}) — ${formatearCop(l.precioCop * l.cantidad)}`,
  );
  return ["Hola, quiero hacer este pedido:", ...detalle, `Total sin envío: ${formatearCop(totalCop(lineas))}`].join("\n");
}
