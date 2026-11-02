// "$169.900", "$ 169.900", "169.900 pesos", "169900 COP". No toma números sueltos como "100 ml" o "#1023".
const PATRON_MONTO = /\$\s?(\d{1,3}(?:[.,]\d{3})+|\d{4,})|(\d{1,3}(?:[.,]\d{3})+|\d{4,})\s?(?:pesos|cop)\b/gi;

export function montosCitados(texto: string): number[] {
  return [...texto.matchAll(PATRON_MONTO)].map(([, conSigno, conPalabra]) =>
    Number((conSigno ?? conPalabra).replace(/[.,]/g, "")),
  );
}

/**
 * Regla dura: el agente solo puede citar montos que devolvió una herramienta en esta conversación.
 * Devuelve los montos que no tienen respaldo (vacío = la respuesta se puede enviar).
 */
export function montosSinRespaldo(texto: string, permitidos: Iterable<number>): number[] {
  const conRespaldo = new Set(permitidos);
  return montosCitados(texto).filter((monto) => !conRespaldo.has(monto));
}

const PIDE_HUMANO =
  /\b(hablar|comunicarme|comunicar|pasame|p[aá]same|quiero|necesito)\b.{0,25}\b(con )?(una persona|un humano|alguien real|un asesor|una asesora|el due[nñ]o|la due[nñ]a|un agente humano)\b/i;

/** Respaldo determinista: si el cliente pide una persona con todas las letras, no se le deja al modelo. */
export function pideHumanoExplicitamente(texto: string): boolean {
  return PIDE_HUMANO.test(texto);
}
