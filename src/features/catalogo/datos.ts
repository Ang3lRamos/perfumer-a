import { cacheLife, cacheTag } from "next/cache";
import { crearCatalogoRepositorio } from "@/infra/supabase/catalogo-repositorio";
import { crearClientePublico } from "@/infra/supabase/clientes";

export const ETIQUETA_CACHE_CATALOGO = "catalogo";

// ~200 productos caben de sobra en memoria: se trae el catálogo completo una vez (cacheado)
// y se filtra en el servidor con funciones puras, en vez de una consulta por combinación de filtros.
export async function obtenerCatalogo() {
  "use cache";
  cacheTag(ETIQUETA_CACHE_CATALOGO);
  cacheLife("hours");
  return crearCatalogoRepositorio(crearClientePublico()).listarActivos();
}

export async function obtenerProducto(slug: string) {
  const catalogo = await obtenerCatalogo();
  return catalogo.find((producto) => producto.slug === slug) ?? null;
}
