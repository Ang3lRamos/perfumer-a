import type { Producto } from "./tipos";

export interface CatalogoRepositorio<A = Record<string, unknown>> {
  listarActivos(): Promise<Producto<A>[]>;
  obtenerPorCodigo(codigo: string): Promise<Producto<A> | null>;
}
