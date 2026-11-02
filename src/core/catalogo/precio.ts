const FORMATO_COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** "$130.000": el mismo formato lo usan la tienda y el agente, y la guarda de precios lo reconoce. */
export function formatearCop(valor: number): string {
  return FORMATO_COP.format(valor).replace(/\s/g, "");
}

export interface ReglaPrecio {
  /** Ganancia sobre el costo del proveedor: 0.3 = 30 %. */
  margenSobreCosto: number;
  /** "900" deja precios como $169.900; "000" redondea al siguiente mil; null no redondea. */
  terminacion: "900" | "000" | null;
}

/** Precio de venta a partir del costo del proveedor. Nunca queda por debajo del costo más el margen. */
export function precioVenta(costo: number, regla: ReglaPrecio): number {
  const base = Math.ceil(costo * (1 + regla.margenSobreCosto));
  if (regla.terminacion === "000") return Math.ceil(base / 1000) * 1000;
  if (regla.terminacion === "900") return Math.ceil((base + 100) / 1000) * 1000 - 100;
  return base;
}
