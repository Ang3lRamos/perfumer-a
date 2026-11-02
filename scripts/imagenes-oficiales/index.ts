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

const feed = z.object({
  products: z.array(z.object({ title: z.string(), handle: z.string(), images: z.array(z.object({ src: z.url() })) })),
});
type ProductoTienda = z.infer<typeof feed>["products"][number];

async function leerTienda(base: string): Promise<ProductoTienda[] | null> {
  const productos: ProductoTienda[] = [];
  for (let pagina = 1; ; pagina++) {
    const respuesta = await fetch(`${base}/products.json?limit=250&page=${pagina}`);
    if (!respuesta.ok) {
      console.warn(`${base}: HTTP ${respuesta.status}, se omite`);
      return pagina === 1 ? null : productos;
    }
    const { products } = feed.parse(await respuesta.json());
    if (!products.length) return productos;
    productos.push(...products);
    await new Promise((r) => setTimeout(r, PAUSA_ENTRE_PAGINAS_MS));
  }
}

async function main(): Promise<void> {
  const catalogo: { slug: string; marca: string; nombre: string; concentracion: string | null }[] = JSON.parse(await readFile(CATALOGO, "utf8"));
  // Se parte de lo ya obtenido: una tienda que hoy no responde conserva sus resultados anteriores.
  const resultado: Record<string, { fuente: string; titulo: string; urls: string[] }> = JSON.parse(
    await readFile(SALIDA, "utf8").catch(() => "{}"),
  );

  for (const [marca, base] of Object.entries(TIENDAS)) {
    const delCatalogo = catalogo.filter((p) => p.marca === marca);
    const tienda = await leerTienda(base);
    if (!tienda) continue;
    for (const producto of delCatalogo) {
      delete resultado[producto.slug];
      const nombre = producto.concentracion === "Extrait de Parfum" ? `${producto.nombre} Extrait` : producto.nombre;
      const coincidencias = tienda.filter((t) => t.images.length && mismoPerfume(nombre, t.title, marca));
      if (coincidencias.length !== 1) continue;
      const [elegido] = coincidencias;
      resultado[producto.slug] = {
        fuente: `${base}/products/${elegido.handle}`,
        titulo: elegido.title,
        urls: elegido.images.slice(0, MAX_IMAGENES).map((i) => i.src),
      };
    }
    console.log(`${marca}: ${delCatalogo.filter((p) => resultado[p.slug]).length}/${delCatalogo.length} con imágenes oficiales`);
  }

  await writeFile(SALIDA, JSON.stringify(resultado, null, 2) + "\n");
}

await main();
