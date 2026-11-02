import type { FiltrosCatalogo, Orden } from "@/core/catalogo/tipos";

export type ParametrosUrl = Record<string, string | string[] | undefined>;

export const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: "relevancia", etiqueta: "Destacados" },
  { valor: "precio_asc", etiqueta: "Menor precio" },
  { valor: "precio_desc", etiqueta: "Mayor precio" },
  { valor: "nombre", etiqueta: "Nombre" },
];

const primero = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

export const lista = (valor: string | string[] | undefined): string[] =>
  (primero(valor) ?? "").split(",").map((v) => v.trim()).filter(Boolean);

function leerRangoPrecio(valor: string | undefined): Pick<FiltrosCatalogo, "precioMin" | "precioMax"> {
  const coincidencia = valor?.match(/^(\d+)-(\d*)$/);
  if (!coincidencia) return {};
  const [, min, max] = coincidencia;
  return { precioMin: Number(min) || undefined, precioMax: max ? Number(max) : undefined };
}

/** Los filtros viven en la URL para que un enlace compartido por Instagram abra la misma vista. */
export function leerFiltros(params: ParametrosUrl, clavesAtributo: string[]): { filtros: FiltrosCatalogo; orden: Orden } {
  const atributos = Object.fromEntries(
    clavesAtributo.map((clave) => [clave, lista(params[clave])] as const).filter(([, valores]) => valores.length),
  );
  const orden = ORDENES.find((o) => o.valor === primero(params.orden))?.valor ?? "relevancia";
  return {
    filtros: {
      texto: primero(params.q)?.trim() || undefined,
      marcas: lista(params.marca),
      tamanosMl: lista(params.ml).map(Number).filter(Number.isFinite),
      ...leerRangoPrecio(primero(params.precio)),
      atributos,
    },
    orden,
  };
}

/** Agrega o quita un valor de una lista separada por comas sin tocar los demás parámetros. */
export function alternarValor(params: URLSearchParams, clave: string, valor: string): URLSearchParams {
  const siguiente = new URLSearchParams(params);
  const actuales = lista(params.get(clave) ?? undefined);
  const nuevos = actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor];
  if (nuevos.length) siguiente.set(clave, nuevos.join(","));
  else siguiente.delete(clave);
  return siguiente;
}
