// Palabras de los títulos de las tiendas que no identifican al perfume (presentación, marca).
// "extrait" sí se conserva: distingue el extracto de la versión EDP del mismo nombre.
const RUIDO = /\b(eau de parfum|parfum|edp|\d+ ?ml|unisex|for|long lasting.*|perfume.*)\b/g;
const OTROS_FORMATOS =
  /\b(duo|combo|set|gift|bundle|sample|tester|miniature|stick|deodorant|mist|lotion|shower|oil)\b|&/;
const GENEROS: Record<string, "m" | "f"> = {
  men: "m", man: "m", him: "m", homme: "m", male: "m",
  women: "f", woman: "f", her: "f", femme: "f", female: "f",
};

interface Nombre {
  palabras: string[];
  generos: Set<"m" | "f">;
}

export function analizar(texto: string, marca: string): Nombre {
  const palabras = texto
    .toLowerCase()
    .replace(new RegExp(`\\b${marca.toLowerCase()}( prestige)?\\b`, "g"), " ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/extrait de parfum/g, "extrait")
    .replace(/[|–\-()]/g, " ")
    .replace(RUIDO, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  return {
    palabras: palabras.filter((p) => !GENEROS[p]),
    generos: new Set(palabras.filter((p) => GENEROS[p]).map((p) => GENEROS[p])),
  };
}

function distancia(a: string, b: string): number {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const arriba = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = arriba;
    }
  }
  return fila[b.length];
}

// Tolera una letra de diferencia en palabras largas ("dhahab" / "dahab"), no en cortas ("ice" / "ace").
const mismaPalabra = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 5 && distancia(a, b) <= 1);

const contenidas = (a: string[], b: string[]) => a.every((x) => b.some((y) => mismaPalabra(x, y)));

/**
 * Coincide si cada palabra de un nombre está en el otro y viceversa, sin importar el orden.
 * El género solo descarta cuando ambos lo declaran y es distinto ("Qimmah for Women" ≠ "Qimmah for Men").
 */
export function mismoPerfume(nombreCatalogo: string, tituloTienda: string, marca: string): boolean {
  if (OTROS_FORMATOS.test(tituloTienda.toLowerCase())) return false;
  const nuestro = analizar(nombreCatalogo, marca);
  const suyo = analizar(tituloTienda, marca);
  const generosChocan =
    nuestro.generos.size > 0 && suyo.generos.size > 0 && ![...nuestro.generos].some((g) => suyo.generos.has(g));
  if (generosChocan || !nuestro.palabras.length || nuestro.palabras.length !== suyo.palabras.length) return false;
  return contenidas(nuestro.palabras, suyo.palabras) && contenidas(suyo.palabras, nuestro.palabras);
}
