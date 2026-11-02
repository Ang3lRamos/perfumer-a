import type { Producto } from "./tipos";

export interface OpcionConConteo {
  valor: string;
  etiqueta: string;
  conteo: number;
}

export function valoresDeAtributo(producto: Producto, clave: string): string[] {
  const actual = producto.atributos[clave];
  if (actual === undefined) return [];
  return (Array.isArray(actual) ? actual : [actual]).map(String);
}

export function contarPor(productos: Producto[], obtener: (p: Producto) => (string | number)[]): Map<string, number> {
  const conteos = new Map<string, number>();
  for (const producto of productos) {
    for (const valor of new Set(obtener(producto).map(String))) conteos.set(valor, (conteos.get(valor) ?? 0) + 1);
  }
  return conteos;
}

/** Descarta opciones sin productos: no se ofrece un filtro que no devuelve nada. */
export function opcionesConConteo(
  opciones: { valor: string; etiqueta: string }[],
  conteos: Map<string, number>,
): OpcionConConteo[] {
  return opciones
    .map((opcion) => ({ ...opcion, conteo: conteos.get(opcion.valor) ?? 0 }))
    .filter((opcion) => opcion.conteo > 0);
}
