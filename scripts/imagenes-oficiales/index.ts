import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { mismoPerfume } from "./coincidir";

// Tiendas oficiales con catálogo Shopify público. Si una responde con límite de peticiones se omite: no se reintenta.
const TIENDAS: Record<string, string> = {
  "French Avenue": "https://frenchavenue.com",
  Arabiyat: "https://arabiyatprestige.com",
  Rayhaan: "https://rayhaanperfumes.com",
  Lattafa: "https://lattafa-usa.com",
  Armaf: "https://armaf.com",
  Afnan: "https://afnan.com",
};
const MAX_IMAGENES = 5;
const PAUSA_ENTRE_PAGINAS_MS = 2000;

const RAIZ = path.resolve(import.meta.dirname, "../..");
const CATALOGO = path.join(RAIZ, "supabase/datos/catalogo-distribuidor.json");
const SALIDA = path.join(RAIZ, "supabase/datos/imagenes-oficiales.json");
// Texto oficial de cada producto: insumo de `npm run catalogo:fichas`, que extrae notas y descripción.
const TEXTOS = path.join(RAIZ, "supabase/datos/textos-oficiales.json");

const feed = z.object({
  products: z.array(
    z.object({
      title: z.string(),
      handle: z.string(),
      body_html: z.string().nullable(),
      images: z.array(z.object({ src: z.url() })),
    }),
  ),
});
type ProductoTienda = z.infer<typeof feed>["products"][number];

const aTexto = (html: string | null) =>
  (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function leerTienda(base: string): Promise<ProductoTienda[] | null> {
  const productos: ProductoTienda[] = [];
  for (let pagina = 1; ; pagina++) {
    const respuesta = await fetch(`${base}/products.json?limit=250&page=${pagina}`);
    if (!respuesta.ok) {
      console.warn(`${base}: HTTP ${respuesta.status} en la página ${pagina}, se usa lo obtenido`);
      return pagina === 1 ? null : productos;
    }
    const { products } = feed.parse(await respuesta.json());
    if (!products.length) return productos;
    productos.push(...products);
    await new Promise((r) => setTimeout(r, PAUSA_ENTRE_PAGINAS_MS));
  }
}

async function leerJson<T>(ruta: string): Promise<T> {
  return JSON.parse(await readFile(ruta, "utf8").catch(() => "{}"));
}

async function main(): Promise<void> {
  const catalogo: { slug: string; marca: string; nombre: string; concentracion: string | null }[] = await leerJson(CATALOGO);
  // Se acumula sobre lo ya obtenido: una tienda que hoy responde a medias no borra coincidencias anteriores.
  const imagenes = await leerJson<Record<string, { fuente: string; titulo: string; urls: string[] }>>(SALIDA);
  const textos = await leerJson<Record<string, string>>(TEXTOS);

  for (const [marca, base] of Object.entries(TIENDAS)) {
    const delCatalogo = catalogo.filter((p) => p.marca === marca);
    const tienda = await leerTienda(base);
    if (!tienda) continue;
    for (const producto of delCatalogo) {
      const nombre = producto.concentracion === "Extrait de Parfum" ? `${producto.nombre} Extrait` : producto.nombre;
      const coincidencias = tienda.filter((t) => t.images.length && mismoPerfume(nombre, t.title, marca));
      if (coincidencias.length !== 1) continue;
      const [elegido] = coincidencias;
      imagenes[producto.slug] = {
        fuente: `${base}/products/${elegido.handle}`,
        titulo: elegido.title,
        urls: elegido.images.slice(0, MAX_IMAGENES).map((i) => i.src),
      };
      const texto = aTexto(elegido.body_html);
      if (texto) textos[producto.slug] = texto;
    }
    console.log(`${marca}: ${delCatalogo.filter((p) => imagenes[p.slug]).length}/${delCatalogo.length} con imágenes oficiales`);
  }

  await writeFile(SALIDA, JSON.stringify(imagenes, null, 2) + "\n");
  await writeFile(TEXTOS, JSON.stringify(textos, null, 2) + "\n");
}

await main();
