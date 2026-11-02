import { valoresDeAtributo } from "./facetas";
import type { FiltrosCatalogo, Orden, Producto, Variante } from "./tipos";

export function precioDesde(producto: Producto): number | null {
  const precios = producto.variantes
    .filter((v) => v.disponible && v.precioCop !== null)
    .map((v) => v.precioCop as number);
  return precios.length ? Math.min(...precios) : null;
}

export function estaDisponible(producto: Producto): boolean {
  return producto.variantes.some((v) => v.disponible);
}

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function coincideTexto(producto: Producto, texto: string): boolean {
  const buscado = normalizar(texto.trim());
  const contenido = normalizar(`${producto.marca} ${producto.nombre} ${producto.codigo}`);
  return buscado.split(/\s+/).every((palabra) => contenido.includes(palabra));
}

function coincideAtributos(producto: Producto, elegidos: Record<string, string[]>): boolean {
  return Object.entries(elegidos).every(
    ([clave, valores]) => !valores.length || valoresDeAtributo(producto, clave).some((v) => valores.includes(v)),
  );
}

function varianteCumple(variante: Variante, filtros: FiltrosCatalogo): boolean {
  if (filtros.soloDisponibles && !variante.disponible) return false;
  if (filtros.tamanosMl?.length && !filtros.tamanosMl.includes(variante.tamanoMl)) return false;
  const conRangoDePrecio = filtros.precioMin !== undefined || filtros.precioMax !== undefined;
  if (conRangoDePrecio) {
    if (variante.precioCop === null) return false;
    if (filtros.precioMin !== undefined && variante.precioCop < filtros.precioMin) return false;
    if (filtros.precioMax !== undefined && variante.precioCop > filtros.precioMax) return false;
  }
  return true;
}

export function filtrarCatalogo<P extends Producto>(productos: P[], filtros: FiltrosCatalogo): P[] {
  return productos.filter(
    (producto) =>
      (!filtros.texto || coincideTexto(producto, filtros.texto)) &&
      (!filtros.marcas?.length || filtros.marcas.includes(producto.marca)) &&
      coincideAtributos(producto, filtros.atributos ?? {}) &&
      producto.variantes.some((variante) => varianteCumple(variante, filtros)),
  );
}

export function ordenarCatalogo<P extends Producto>(productos: P[], orden: Orden): P[] {
  const conPrecio = (p: P) => precioDesde(p) ?? Number.POSITIVE_INFINITY;
  const comparadores: Record<Orden, (a: P, b: P) => number> = {
    // Disponibles primero; dentro de cada grupo se respeta el orden de origen.
    relevancia: (a, b) => Number(estaDisponible(b)) - Number(estaDisponible(a)),
    precio_asc: (a, b) => conPrecio(a) - conPrecio(b),
    precio_desc: (a, b) => (precioDesde(b) ?? -1) - (precioDesde(a) ?? -1),
    nombre: (a, b) => `${a.marca} ${a.nombre}`.localeCompare(`${b.marca} ${b.nombre}`, "es"),
  };
  return [...productos].sort(comparadores[orden]);
}
