export type TipoProducto = "original" | "inspirado" | "marca_propia";

export interface Variante {
  id: string;
  tamanoMl: number;
  precioCop: number | null;
  disponible: boolean;
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
  imagenUrl: string | null;
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
