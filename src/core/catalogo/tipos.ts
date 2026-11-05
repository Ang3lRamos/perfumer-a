export type TipoProducto = "original" | "inspirado" | "marca_propia";

export interface Variante {
  id: string;
  tamanoMl: number;
  /** Precio que paga el cliente hoy, con la promoción ya aplicada. */
  precioCop: number | null;
  disponible: boolean;
  precioAnteriorCop?: number;
  promocion?: string;
}

export interface Producto<A = Record<string, unknown>> {
  id: string;
  codigo: string;
  slug: string;
  marca: string;
  nombre: string;
  tipo: TipoProducto;
  inspiracionNota: string | null;
  presentacion: string | null;
  descripcion: string | null;
  atributos: A;
  fichaVerificada: boolean;
  /** La primera es la principal. */
  imagenes: string[];
  variantes: Variante[];
}

export interface FiltrosCatalogo {
  texto?: string;
  marcas?: string[];
  precioMin?: number;
  precioMax?: number;
  tamanosMl?: number[];
  soloDisponibles?: boolean;
  /** Clave de atributo → valores aceptados (OR dentro de la clave, AND entre claves). */
  atributos?: Record<string, string[]>;
}

export type Orden = "relevancia" | "precio_asc" | "precio_desc" | "nombre";
