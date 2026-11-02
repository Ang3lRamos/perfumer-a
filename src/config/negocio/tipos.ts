import type { z } from "zod";
import type { ReglaPrecio } from "@/core/catalogo/precio";

export interface Opcion {
  valor: string;
  etiqueta: string;
}

/** Filtro sobre `atributos`: coincide si el valor (o alguno de la lista) está entre los elegidos. */
export interface FiltroAtributo {
  clave: string;
  etiqueta: string;
  opciones: Opcion[];
  /** Una sola opción a la vez (ej. género), en vez de combinar varias. */
  unico?: boolean;
}

export interface Cobertura {
  ciudadesContraentrega: string[];
  metodosPago: string[];
  /** Texto que se muestra al cliente sobre el envío (en el carrito y la ficha). */
  envio: string;
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
  /** Cómo se pasa del costo del proveedor al precio de venta al importar el catálogo. */
  reglaPrecio: ReglaPrecio;
  /** Personalidad y tono del agente de WhatsApp. Las reglas de negocio las pone el núcleo. */
  agente: { persona: string };
}
