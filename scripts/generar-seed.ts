import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { negocio } from "../src/config/negocio";
import { FICHAS_BORRADOR } from "../supabase/datos/fichas-borrador";
import type { ProductoImportado } from "./importar-catalogo/agrupar";

type ProductoCatalogo = Omit<ProductoImportado, "indiceImagen"> & { imagen: string };

const RAIZ = path.resolve(import.meta.dirname, "..");
const ENTRADA = path.join(RAIZ, "supabase/datos/catalogo-distribuidor.json");
const SALIDA = path.join(RAIZ, "supabase/seed.sql");

const GENEROS: Record<string, string> = { M: "masculino", F: "femenino", U: "unisex" };

const sql = (valor: string | number | null): string =>
  valor === null ? "null" : typeof valor === "number" ? String(valor) : `'${valor.replace(/'/g, "''")}'`;

function atributosDe(slug: string): Record<string, unknown> {
  const ficha = FICHAS_BORRADOR[slug];
  if (!ficha) return negocio.atributos.parse({});
  const [genero, familias = ""] = ficha.split(":");
  return negocio.atributos.parse({
    genero: GENEROS[genero],
    familias: familias.split(",").filter(Boolean),
  });
}

function filaProducto(producto: ProductoCatalogo): string {
  const atributos = JSON.stringify(atributosDe(producto.slug));
  return `(${[
    sql(producto.codigo),
    sql(producto.slug),
    sql(producto.marca),
    sql(producto.nombre),
    sql(producto.concentracion),
    `${sql(atributos)}::jsonb`,
    sql(producto.imagen),
  ].join(", ")})`;
}

function filasVariantes(producto: ProductoCatalogo): string[] {
  return producto.variantes.map(
    (v) => `(${sql(producto.slug)}, ${v.tamanoMl}, ${sql(v.precioCop)}, ${v.precioCop !== null})`,
  );
}

async function main(): Promise<void> {
  const productos: ProductoCatalogo[] = JSON.parse(await readFile(ENTRADA, "utf8"));
  const sinFicha = productos.filter((p) => !FICHAS_BORRADOR[p.slug]).map((p) => p.slug);
  const fichasHuerfanas = Object.keys(FICHAS_BORRADOR).filter((slug) => !productos.some((p) => p.slug === slug));
  if (fichasHuerfanas.length) throw new Error(`Fichas sin producto: ${fichasHuerfanas.join(", ")}`);

  // Se cruza por slug para que reimportar una lista nueva actualice precios sin cambiar códigos.
  const contenido = `-- Generado por scripts/generar-seed.ts desde supabase/datos/. No editar a mano.
insert into productos (codigo, slug, marca, nombre, presentacion, atributos, imagen_url) values
${productos.map(filaProducto).join(",\n")}
on conflict (slug) do nothing;

insert into variantes (producto_id, tamano_ml, precio_cop, disponible)
select p.id, v.tamano_ml, v.precio_cop, v.disponible
from (values
${productos.flatMap(filasVariantes).join(",\n")}
) as v (slug, tamano_ml, precio_cop, disponible)
join productos p on p.slug = v.slug
on conflict (producto_id, tamano_ml) do update
  set precio_cop = excluded.precio_cop, disponible = excluded.disponible;
`;
  await writeFile(SALIDA, contenido);
  console.log(`seed.sql: ${productos.length} productos, ${productos.length - sinFicha.length} con ficha borrador`);
}

await main();
