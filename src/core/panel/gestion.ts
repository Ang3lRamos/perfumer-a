import type { Combo } from "../combos/combos";
import type { Promocion } from "../promociones/promociones";

/** Un tamaño tal como lo ve el dueño: con el precio base (sin promociones) y el costo del proveedor. */
export interface FilaPrecio {
  varianteId: string;
  productoId: string;
  codigo: string;
  marca: string;
  nombre: string;
  tamanoMl: number;
  precioCop: number | null;
  costoCop: number | null;
  disponible: boolean;
  precioManual: boolean;
  productoActivo: boolean;
}

export type NuevaPromocion = Omit<Promocion, "id" | "activa">;
export type NuevoCombo = Omit<Combo, "id" | "codigo" | "activo">;

export interface GestionRepositorio {
  filasPrecio(): Promise<FilaPrecio[]>;
  guardarPrecio(varianteId: string, datos: { precioCop: number; disponible: boolean; manual: boolean }): Promise<void>;
  promociones(): Promise<Promocion[]>;
  guardarPromocion(id: string | null, datos: NuevaPromocion): Promise<void>;
  activarPromocion(id: string, activa: boolean): Promise<void>;
  eliminarPromocion(id: string): Promise<void>;
  combos(): Promise<Combo[]>;
  guardarCombo(id: string | null, datos: NuevoCombo): Promise<void>;
  activarCombo(id: string, activo: boolean): Promise<void>;
  eliminarCombo(id: string): Promise<void>;
}

/** "169.900", "$169900" o "169 900" → 169900. Vacío o sin dígitos → undefined, para que la validación lo rechace. */
export function leerEnteroCop(valor: unknown): number | undefined {
  if (typeof valor !== "string") return undefined;
  const digitos = valor.replace(/\D/g, "");
  return digitos ? Number(digitos) : undefined;
}

/** Ganancia sobre el costo, la misma medida de negocio.reglaPrecio. */
export const margenSobreCosto = (precio: number, costo: number) => (precio - costo) / costo;

export const FORMATO_MARGEN = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 0 });
