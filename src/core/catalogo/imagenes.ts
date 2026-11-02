import type { Producto } from "./tipos";

/**
 * Las fotos locales salen del PDF del distribuidor (~300 px, borrosas en pantallas actuales) y no se muestran
 * al público. Solo cuentan las fotos con URL externa: oficiales de la marca o agregadas a mano.
 */
export function fotosDeCalidad(producto: Producto): string[] {
  return producto.imagenes.filter((url) => url.startsWith("https://"));
}
