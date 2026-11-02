import type { Producto } from "../catalogo/tipos";
import type { DatosEnvio, ItemPedido, ItemSolicitado } from "./tipos";

export type ResultadoArmado =
  | { ok: true; items: ItemPedido[]; totalCop: number }
  | { ok: false; motivo: string };

const normalizarCiudad = (ciudad: string) =>
  ciudad
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(d\.?\s?c\.?|colombia)\b/g, "")
    .replace(/[^a-z ]/g, "")
    .trim();

export function ciudadCubierta(ciudad: string, ciudadesCubiertas: string[]): boolean {
  return ciudadesCubiertas.some((c) => normalizarCiudad(c) === normalizarCiudad(ciudad));
}

/**
 * Convierte lo que pidió el cliente en ítems con precio real del catálogo. Los precios nunca vienen
 * del modelo ni del cliente: se toman aquí, de la base, en el momento de crear el pedido.
 */
export function armarPedido(
  solicitados: ItemSolicitado[],
  envio: DatosEnvio,
  catalogo: Producto[],
  ciudadesCubiertas: string[],
): ResultadoArmado {
  if (!solicitados.length) return { ok: false, motivo: "El pedido no tiene productos." };
  if (!ciudadCubierta(envio.ciudad, ciudadesCubiertas)) {
    return { ok: false, motivo: `Por ahora solo despachamos a ${ciudadesCubiertas.join(", ")}.` };
  }

  const items: ItemPedido[] = [];
  for (const solicitado of solicitados) {
    const producto = catalogo.find((p) => p.codigo === solicitado.codigo.toUpperCase());
    if (!producto) return { ok: false, motivo: `No existe el producto ${solicitado.codigo}.` };
    const variante = producto.variantes.find((v) => v.tamanoMl === solicitado.tamanoMl);
    if (!variante) {
      const tamanos = producto.variantes.map((v) => `${v.tamanoMl} ml`).join(", ");
      return { ok: false, motivo: `${producto.nombre} viene en ${tamanos}, no en ${solicitado.tamanoMl} ml.` };
    }
    if (!variante.disponible || variante.precioCop === null) {
      return { ok: false, motivo: `${producto.marca} ${producto.nombre} está agotado.` };
    }
    items.push({
      varianteId: variante.id,
      codigo: producto.codigo,
      descripcion: `${producto.marca} ${producto.nombre}`,
      tamanoMl: variante.tamanoMl,
      cantidad: solicitado.cantidad,
      precioUnitarioCop: variante.precioCop,
    });
  }

  const totalCop = items.reduce((suma, item) => suma + item.precioUnitarioCop * item.cantidad, 0);
  return { ok: true, items, totalCop };
}
