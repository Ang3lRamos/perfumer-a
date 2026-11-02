import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { negocio } from "../../src/config/negocio";

const RAIZ = path.resolve(import.meta.dirname, "../..");
const TEXTOS = path.join(RAIZ, "supabase/datos/textos-oficiales.json");
const IMAGENES = path.join(RAIZ, "supabase/datos/imagenes-oficiales.json");
const FICHAS = path.join(RAIZ, "supabase/datos/fichas-oficiales.json");

const OCASIONES = negocio.filtros.find((f) => f.clave === "ocasiones")?.opciones.map((o) => o.valor) ?? [];

const extraccion = z.object({
  descripcion: z.string().describe("1 o 2 frases en español, fieles al texto, sin superlativos nuevos"),
  notas: z
    .object({ salida: z.array(z.string()), corazon: z.array(z.string()), fondo: z.array(z.string()) })
    .nullable()
    .describe("Solo si el texto distingue salida/corazón/fondo"),
  notasClave: z.array(z.string()).describe("Notas mencionadas sin nivel; vacío si van en 'notas'"),
  ocasiones: z.array(z.enum(OCASIONES as [string, ...string[]])).describe("Solo si el texto lo dice"),
});

const INSTRUCCIONES = `Extraes la ficha de un perfume a partir de la descripción oficial de la marca (en inglés).
Reglas:
- Usa solo lo que dice el texto. Si no menciona notas concretas, deja notas en null y notasClave vacío.
- Traduce las notas al español de uso común en perfumería (Tonka Bean → Haba tonka, Orris → Iris, Ambergris → Ámbar gris).
- Ignora frases de marketing sin contenido olfativo.
- La descripción es para una tienda colombiana: tono sobrio, tuteo, sin inventar duración ni estela.`;

async function leerJson<T>(ruta: string): Promise<T> {
  return JSON.parse(await readFile(ruta, "utf8").catch(() => "{}"));
}

async function main(): Promise<void> {
  const cliente = new Anthropic();
  const textos = await leerJson<Record<string, string>>(TEXTOS);
  const imagenes = await leerJson<Record<string, { fuente: string }>>(IMAGENES);
  const fichas = await leerJson<Record<string, unknown>>(FICHAS);
  const pendientes = Object.keys(textos).filter((slug) => !fichas[slug]);
  console.log(`${pendientes.length} productos con texto oficial y sin ficha`);

  for (const slug of pendientes) {
    const respuesta = await cliente.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(extraccion) },
      system: INSTRUCCIONES,
      messages: [{ role: "user", content: textos[slug] }],
    });
    if (!respuesta.parsed_output) {
      console.warn(`${slug}: sin resultado (${respuesta.stop_reason}), se omite`);
      continue;
    }
    const { notas, ...resto } = respuesta.parsed_output;
    fichas[slug] = { fuente: imagenes[slug]?.fuente, ...resto, ...(notas ? { notas } : {}) };
    // Se guarda en cada paso: si se corta a mitad, lo hecho no se pierde.
    await writeFile(FICHAS, JSON.stringify(fichas, null, 2) + "\n");
    console.log(`✓ ${slug}`);
  }
}

await main();
