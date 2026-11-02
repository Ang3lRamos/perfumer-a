const FORMATO_COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** "$130.000": el mismo formato lo usan la tienda y el agente, y la guarda de precios lo reconoce. */
export function formatearCop(valor: number): string {
  return FORMATO_COP.format(valor).replace(/\s/g, "");
}
