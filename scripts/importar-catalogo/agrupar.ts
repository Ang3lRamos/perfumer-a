import type { Concentracion, ReferenciaNormalizada } from "./normalizar";

export interface ProductoImportado {
  codigo: string;
  slug: string;
  marca: string;
  nombre: string;
  concentracion: Concentracion | null;
  indiceImagen: number;
  variantes: { tamanoMl: number; costoCop: number | null }[];
}

const PREFIJOS_CODIGO: Record<string, string> = {
  Armaf: "ARM",
  "Al Haramain": "ALH",
  Arabiyat: "ARB",
  Bharara: "BHR",
  Afnan: "AFN",
  Dumont: "DUM",
  "French Avenue": "FAV",
  Rasasi: "RAS",
  "Jo Milano": "JOM",
  Lattafa: "LAT",
  "Maison Alhambra": "MAL",
  Orientica: "ORI",
  Rayhaan: "RAY",
};

export function aSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "y")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugDe(referencia: ReferenciaNormalizada): string {
  const sufijo = referencia.concentracion && referencia.concentracion !== "EDP" ? referencia.concentracion : "";
  return aSlug(`${referencia.marca} ${referencia.nombre} ${sufijo}`);
}

/**
 * Une las referencias que solo cambian de tamaño en un producto con varias variantes
 * y asigna códigos cortos (ej. LAT-014) pensados para escribirse en WhatsApp.
 */
export function agruparEnProductos(referencias: ReferenciaNormalizada[]): ProductoImportado[] {
  const porSlug = new Map<string, ProductoImportado>();
  const consecutivoPorMarca = new Map<string, number>();

  for (const referencia of referencias) {
    const slug = slugDe(referencia);
    const variante = { tamanoMl: referencia.tamanoMl, costoCop: referencia.costoCop };
    const existente = porSlug.get(slug);
    if (existente) {
      existente.variantes.push(variante);
      continue;
    }
    const prefijo = PREFIJOS_CODIGO[referencia.marca];
    if (!prefijo) throw new Error(`Sin prefijo de código para la marca ${referencia.marca}`);
    const consecutivo = (consecutivoPorMarca.get(prefijo) ?? 0) + 1;
    consecutivoPorMarca.set(prefijo, consecutivo);
    porSlug.set(slug, {
      codigo: `${prefijo}-${String(consecutivo).padStart(3, "0")}`,
      slug,
      marca: referencia.marca,
      nombre: referencia.nombre,
      concentracion: referencia.concentracion,
      indiceImagen: referencia.indiceOrigen,
      variantes: [variante],
    });
  }
  return [...porSlug.values()];
}
