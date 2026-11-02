export type Concentracion = "EDP" | "Parfum" | "Extrait de Parfum";

export interface LineaDistribuidor {
  texto: string;
  precio: number | null;
}

export interface ReferenciaNormalizada {
  marca: string;
  nombre: string;
  concentracion: Concentracion | null;
  tamanoMl: number;
  precioCop: number | null;
  indiceOrigen: number;
}

// El texto del PDF parte palabras al azar y trae errores de digitación del distribuidor.
const CORRECCIONES: [RegExp, string][] = [
  [/MANDARI N/g, "MANDARIN"],
  [/OD YSSEY/g, "ODYSSEY"],
  [/\bB ?H ?AR ?ARA\b|\bBAHARA\b/g, "BHARARA"],
  [/\bL ?AT ?TA ?FA\b/g, "LATTAFA"],
  [/FAK HAR/g, "FAKHAR"],
  [/DUKH AN/g, "DUKHAN"],
  [/WO MEN/g, "WOMEN"],
  [/B ANOFFI/g, "BANOFFI"],
  [/VEL VET/g, "VELVET"],
  [/MOO N/g, "MOON"],
  [/BL ACK/g, "BLACK"],
  [/EXTRADO SE/g, "EXTRADOSE"],
  [/DE LILAH/g, "DELILAH"],
  [/P ARFUM/g, "PARFUM"],
  [/\bE ?DP\b|\bEPD\b/g, "EDP"],
  [/\b1 ?0 ?0 ?M ?L\b/g, "100ML"],
  [/(\d+) ML\b/g, "$1ML"],
  [/(\D)(\d+ML)/g, "$1 $2"],
  [/\bFRECH\b/g, "FRENCH"],
  [/\bATANTIS\b/g, "ATLANTIS"],
  [/\bMILLESTONE\b/g, "MILESTONE"],
  [/\bWILCARD\b/g, "WILDCARD"],
  [/\bHISS\b/g, "HIS"],
  [/\bQUIMMAH\b/g, "QIMMAH"],
  [/\bMUSSAMAN\b/g, "MUSAMAM"],
  [/\bTOQUIN GUIZA\b/g, "TONQUIN GIZA"],
  [/\s[-–]\s/g, " "],
];

const MARCAS: [RegExp, string, string?][] = [
  [/^ARMAF /, "Armaf"],
  [/^AL HARAMAIN /, "Al Haramain"],
  [/^ARABIYAT /, "Arabiyat"],
  [/^BHARARA /, "Bharara"],
  [/^AFNAN /, "Afnan"],
  [/^DUMONT /, "Dumont"],
  [/^FRENCH AVENUE /, "French Avenue"],
  [/^HAWAS /, "Rasasi", "HAWAS "],
  [/^JO MILANO GOS /, "Jo Milano", "GAME OF SPADES "],
  [/^(LATTAFA )?RAVE /, "Lattafa", "RAVE "],
  [/^LATTAFA /, "Lattafa"],
  [/^MAISON ALHAMBRA /, "Maison Alhambra"],
  [/^ORIENTICA /, "Orientica"],
  [/^RAYHAAN /, "Rayhaan"],
];

const CONCENTRACIONES: [RegExp, Concentracion][] = [
  [/\bEXTRAIT( DE)? PARFUM\b|\bEXTRACTO\b/, "Extrait de Parfum"],
  [/\bPARFUM\b/, "Parfum"],
  [/\bEDP\b/, "EDP"],
];

const PALABRAS_MENORES = new Set(["de", "of", "for", "pour", "on", "al", "la", "&"]);

export function corregirTexto(texto: string): string {
  const base = texto.replace(/\s+/g, " ").trim().toUpperCase();
  return CORRECCIONES.reduce((acc, [patron, reemplazo]) => acc.replace(patron, reemplazo), base)
    .replace(/\s+/g, " ")
    .trim();
}

function separarMarca(texto: string): { marca: string; resto: string } {
  for (const [patron, marca, prefijo = ""] of MARCAS) {
    if (patron.test(texto)) return { marca, resto: prefijo + texto.replace(patron, "") };
  }
  throw new Error(`Marca no reconocida en "${texto}"`);
}

function extraerConcentracion(texto: string): { concentracion: Concentracion | null; resto: string } {
  for (const [patron, concentracion] of CONCENTRACIONES) {
    if (patron.test(texto)) return { concentracion, resto: texto.replace(patron, " ") };
  }
  return { concentracion: null, resto: texto };
}

function extraerTamano(texto: string): { tamanoMl: number; resto: string } {
  const coincidencia = texto.match(/\b(\d{2,3})ML\b/);
  if (!coincidencia) throw new Error(`Tamaño no encontrado en "${texto}"`);
  return { tamanoMl: Number(coincidencia[1]), resto: texto.replace(coincidencia[0], " ") };
}

export function aTitulo(texto: string): string {
  return texto
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((palabra, i) =>
      i > 0 && PALABRAS_MENORES.has(palabra) ? palabra : palabra.charAt(0).toUpperCase() + palabra.slice(1),
    )
    .join(" ")
    .replace(/\b(\d+)pm\b/gi, "$1PM");
}

export function normalizarLinea(linea: LineaDistribuidor, indiceOrigen: number): ReferenciaNormalizada {
  const texto = corregirTexto(linea.texto);
  const { marca, resto: sinMarca } = separarMarca(texto);
  const { tamanoMl, resto: sinTamano } = extraerTamano(sinMarca);
  const { concentracion, resto } = extraerConcentracion(sinTamano);
  return {
    marca,
    nombre: aTitulo(resto),
    concentracion,
    tamanoMl,
    precioCop: linea.precio,
    indiceOrigen,
  };
}
