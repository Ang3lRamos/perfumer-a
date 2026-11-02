import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { agruparEnProductos } from "./agrupar";
import { leerCatalogoPdf, type ImagenCruda } from "./extraer-pdf";
import { normalizarLinea } from "./normalizar";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const CARPETA_IMAGENES = path.join(RAIZ, "public/productos");
const SALIDA_JSON = path.join(RAIZ, "supabase/datos/catalogo-distribuidor.json");

// Las fotos del PDF miden ~300 px y traen mucho margen blanco: se recorta el margen y se amplía con
// lanczos + enfoque suave. No inventa detalle, pero evita el pixelado al mostrarlas en pantallas densas.
const FACTOR_AMPLIACION = 2.5;

async function guardarImagen(imagen: ImagenCruda, destino: string): Promise<void> {
  const recortada = await sharp(Buffer.from(imagen.datos), {
    raw: { width: imagen.ancho, height: imagen.alto, channels: imagen.canales },
  })
    .flatten({ background: "#ffffff" })
    .trim({ background: "#ffffff", threshold: 12 })
    .png()
    .toBuffer({ resolveWithObject: true });
  await sharp(recortada.data)
    .resize(Math.round(recortada.info.width * FACTOR_AMPLIACION), null, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 1.5 })
    .webp({ quality: 90 })
    .toFile(destino);
}

async function main(rutaPdf: string): Promise<void> {
  const paginas = await leerCatalogoPdf(rutaPdf);
  const lineas = paginas.flatMap((pagina) => pagina.lineas);
  const imagenes = paginas.flatMap((pagina) => pagina.imagenes);
  const productos = agruparEnProductos(lineas.map(normalizarLinea));

  await mkdir(CARPETA_IMAGENES, { recursive: true });
  await Promise.all(
    productos.map((producto) =>
      guardarImagen(imagenes[producto.indiceImagen], path.join(CARPETA_IMAGENES, `${producto.slug}.webp`)),
    ),
  );

  const salida = productos.map(({ indiceImagen: _, ...producto }) => ({
    ...producto,
    imagen: `/productos/${producto.slug}.webp`,
  }));
  await mkdir(path.dirname(SALIDA_JSON), { recursive: true });
  await writeFile(SALIDA_JSON, JSON.stringify(salida, null, 2) + "\n");

  const sinCosto = salida.filter((p) => p.variantes.every((v) => v.costoCop === null)).length;
  console.log(`${lineas.length} referencias → ${salida.length} productos (${sinCosto} sin precio del proveedor)`);
}

const rutaPdf = process.argv[2];
if (!rutaPdf) {
  console.error("Uso: npm run catalogo:importar -- <ruta-al-pdf-del-distribuidor>");
  process.exit(1);
}
await main(rutaPdf);
