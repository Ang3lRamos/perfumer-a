import { readFile } from "node:fs/promises";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";
import type { LineaDistribuidor } from "./normalizar";

export interface ImagenCruda {
  ancho: number;
  alto: number;
  canales: 1 | 3 | 4;
  datos: Uint8ClampedArray;
}

export interface PaginaCatalogo {
  lineas: LineaDistribuidor[];
  imagenes: ImagenCruda[];
}

type Matriz = [number, number, number, number, number, number];

// Las fotos del PDF tienen ancho > 40pt; lo menor son íconos o adornos.
const ANCHO_MINIMO_FOTO = 40;
const PRECIO = /(.+?)\$\s*((?:\d\s*)+[,.]\s*(?:\d\s*){3}|-)/g;

function multiplicar(a: Matriz, b: number[]): Matriz {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

async function extraerLineas(pagina: PDFPageProxy): Promise<LineaDistribuidor[]> {
  const contenido = await pagina.getTextContent();
  const texto = contenido.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/LISTA.*?CAMBIOS/s, " ");
  return [...texto.matchAll(PRECIO)].map(([, nombre, precio]) => ({
    texto: nombre,
    precio: precio === "-" ? null : Number(precio.replace(/\D/g, "")),
  }));
}

async function ubicarFotos(pagina: PDFPageProxy): Promise<string[]> {
  const operaciones = await pagina.getOperatorList();
  const pila: Matriz[] = [];
  let actual: Matriz = [1, 0, 0, 1, 0, 0];
  const fotos: { nombre: string; y: number }[] = [];

  operaciones.fnArray.forEach((operacion, i) => {
    const argumentos = operaciones.argsArray[i];
    if (operacion === OPS.save) pila.push(actual);
    else if (operacion === OPS.restore) actual = pila.pop() ?? [1, 0, 0, 1, 0, 0];
    else if (operacion === OPS.transform) actual = multiplicar(actual, argumentos);
    else if (operacion === OPS.paintImageXObject && actual[0] > ANCHO_MINIMO_FOTO) {
      fotos.push({ nombre: argumentos[0], y: actual[5] });
    }
  });

  // En PDF la y crece hacia arriba: ordenar descendente da el orden de lectura.
  return fotos.sort((a, b) => b.y - a.y).map((foto) => foto.nombre);
}

function leerImagen(pagina: PDFPageProxy, nombre: string): Promise<ImagenCruda> {
  const almacen = nombre.startsWith("g_") ? pagina.commonObjs : pagina.objs;
  return new Promise((resolver) =>
    almacen.get(nombre, (img: { width: number; height: number; kind: number; data: Uint8ClampedArray }) =>
      resolver({
        ancho: img.width,
        alto: img.height,
        canales: img.kind === 1 ? 1 : img.kind === 2 ? 3 : 4,
        datos: img.data,
      }),
    ),
  );
}

export async function leerCatalogoPdf(ruta: string): Promise<PaginaCatalogo[]> {
  const documento = await getDocument({ data: new Uint8Array(await readFile(ruta)) }).promise;
  const paginas: PaginaCatalogo[] = [];

  for (let numero = 1; numero <= documento.numPages; numero++) {
    const pagina = await documento.getPage(numero);
    const lineas = await extraerLineas(pagina);
    const nombresFotos = await ubicarFotos(pagina);
    if (nombresFotos.length !== lineas.length) {
      throw new Error(
        `Página ${numero}: ${lineas.length} referencias y ${nombresFotos.length} fotos; no se pueden emparejar`,
      );
    }
    const imagenes = await Promise.all(nombresFotos.map((nombre) => leerImagen(pagina, nombre)));
    paginas.push({ lineas, imagenes });
  }
  return paginas;
}
