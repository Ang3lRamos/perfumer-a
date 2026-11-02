import type { z } from "zod";

export interface Opcion {
  valor: string;
  etiqueta: string;
}

/** Filtro sobre `atributos`: coincide si el valor (o alguno de la lista) está entre los elegidos. */
export interface FiltroAtributo {
  clave: string;
  etiqueta: string;
  opciones: Opcion[];
}

export interface Cobertura {
  ciudadesContraentrega: string[];
  metodosPago: string[];
}

export interface ConfiguracionNegocio<A extends z.ZodType = z.ZodType> {
  nombreTienda: string;
  descripcionTienda: string;
  moneda: "COP";
  /** Cómo se llama a un producto en la interfaz ("perfume", "zapato"...). */
  nombreProducto: { singular: string; plural: string };
  atributos: A;
  filtros: FiltroAtributo[];
  /** Rangos de precio ofrecidos como filtro; valor con formato "min-max" en pesos (max vacío = sin tope). */
  rangosPrecio: Opcion[];
  cobertura: Cobertura;
}
