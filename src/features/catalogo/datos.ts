import { cacheLife, cacheTag } from "next/cache";
import { crearCatalogoRepositorio } from "@/infra/supabase/catalogo-repositorio";
import { crearClientePublico } from "@/infra/supabase/clientes";

export const ETIQUETA_CACHE_CATALOGO = "catalogo";

// ~200 productos caben de sobra en memoria: se trae el catálogo completo una vez (cacheado)
// y se filtra en el servidor con funciones puras, en vez de una consulta por combinación de filtros.
async function obtenerTienda() {
  "use cache";
  cacheTag(ETIQUETA_CACHE_CATALOGO);
  const { catalogo, combos, segundosVigentes } = await crearCatalogoRepositorio(crearClientePublico()).leerTienda();
  // Pasado este plazo, la primera visita aún recibe lo anterior mientras se renueva. Por eso los precios se
  // reconfirman por WhatsApp; desde el panel, en cambio, un cambio se ve de inmediato (updateTag).
  cacheLife({ revalidate: segundosVigentes, expire: 86_400 });
  return { catalogo, combos };
}

export const obtenerCatalogo = async () => (await obtenerTienda()).catalogo;

export const obtenerCombos = async () => (await obtenerTienda()).combos;

export async function obtenerProducto(slug: string) {
  const catalogo = await obtenerCatalogo();
  return catalogo.find((producto) => producto.slug === slug) ?? null;
}
