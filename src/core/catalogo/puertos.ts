import type { ComboResuelto } from "../combos/combos";
import type { Producto } from "./tipos";

/** Los precios ya vienen con las promociones vigentes: quien lee el catálogo no tiene que calcular nada. */
export interface CatalogoRepositorio<A = Record<string, unknown>> {
  listarActivos(): Promise<Producto<A>[]>;
  obtenerPorCodigo(codigo: string): Promise<Producto<A> | null>;
  listarCombos(): Promise<ComboResuelto[]>;
}
