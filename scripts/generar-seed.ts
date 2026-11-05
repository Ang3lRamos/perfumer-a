import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { negocio } from "../src/config/negocio";
import { precioVenta } from "../src/core/catalogo/precio";
import { FICHAS_BORRADOR } from "../supabase/datos/fichas-borrador";
import imagenesManuales from "../supabase/datos/imagenes-manuales.json";
import fichasOficiales from "../supabase/datos/fichas-oficiales.json";
import imagenesOficiales from "../supabase/datos/imagenes-oficiales.json";
import type { ProductoImportado } from "./importar-catalogo/agrupar";

type ProductoCatalogo = Omit<ProductoImportado, "indiceImagen"> & { imagen: string };

const RAIZ = path.resolve(import.meta.dirname, "..");
const ENTRADA = path.join(RAIZ, "supabase/datos/catalogo-distribuidor.json");
const SALIDA = path.join(RAIZ, "supabase/seed.sql");

const GENEROS: Record<string, string> = { M: "masculino", F: "femenino", U: "unisex" };

const sql = (valor: string | number | null): string =>
  valor === null ? "null" : typeof valor === "number" ? String(valor) : `'${valor.replace(/'/g, "''")}'`;

interface FichaOficial {
  fuente: string;
  descripcion: string;
  notas?: { salida: string[]; corazon: string[]; fondo: string[] };
  notasClave?: string[];
  ocasiones?: string[];
}

const oficial = (slug: string) => (fichasOficiales as Record<string, FichaOficial>)[slug];

// Género y familia del borrador; notas y ocasiones solo de la descripción oficial de la marca.
function atributosDe(slug: string): Record<string, unknown> {
  const [genero, familias = ""] = (FICHAS_BORRADOR[slug] ?? "").split(":");
  const { notas, notasClave, ocasiones } = oficial(slug) ?? {};
  return negocio.atributos.parse({
    genero: GENEROS[genero],
    familias: familias.split(",").filter(Boolean),
    notas,
    notasClave,
    ocasiones,
  });
}

// Prioridad: URLs puestas a mano (slug → [urls]) > fotos oficiales de la marca > foto del PDF del distribuidor.
function imagenesDe(producto: ProductoCatalogo): string[] {
  const manuales = (imagenesManuales as Record<string, string[]>)[producto.slug];
  const oficiales = (imagenesOficiales as Record<string, { urls: string[] }>)[producto.slug];
  return manuales?.length ? manuales : (oficiales?.urls ?? [producto.imagen]);
}

const arregloSql = (valores: string[]) => `array[${valores.map(sql).join(", ")}]::text[]`;

function filaProducto(producto: ProductoCatalogo): string {
  const atributos = JSON.stringify(atributosDe(producto.slug));
  return `(${[
    sql(producto.codigo),
    sql(producto.slug),
    sql(producto.marca),
    sql(producto.nombre),
    sql(producto.concentracion),
    sql(oficial(producto.slug)?.descripcion ?? null),
    `${sql(atributos)}::jsonb`,
    arregloSql(imagenesDe(producto)),
  ].join(", ")})`;
}

// Precio de venta = costo del proveedor + regla de la configuración. Sin costo no se vende.
function filasVariantes(producto: ProductoCatalogo): string[] {
  return producto.variantes.map((v) => {
    const precio = v.costoCop === null ? null : precioVenta(v.costoCop, negocio.reglaPrecio);
    return `(${sql(producto.slug)}, ${v.tamanoMl}, ${sql(precio)}, ${sql(v.costoCop)}, ${precio !== null})`;
  });
}

async function main(): Promise<void> {
  const productos: ProductoCatalogo[] = JSON.parse(await readFile(ENTRADA, "utf8"));
  const sinFicha = productos.filter((p) => !FICHAS_BORRADOR[p.slug]).map((p) => p.slug);
  const fichasHuerfanas = [...Object.keys(FICHAS_BORRADOR), ...Object.keys(fichasOficiales)].filter(
    (slug) => !productos.some((p) => p.slug === slug),
  );
  if (fichasHuerfanas.length) throw new Error(`Fichas sin producto: ${fichasHuerfanas.join(", ")}`);

  // La lista va repetida en cada instrucción (sin tabla temporal) porque el SQL Editor de Supabase
  // no garantiza que todas las instrucciones del archivo corran en la misma sesión.
  const listaProveedor = `(values
${productos.flatMap(filasVariantes).join(",\n")}
) as l (slug, tamano_ml, precio_cop, costo_cop, disponible)`;

  // Se cruza por slug para que reimportar una lista nueva actualice precios sin cambiar códigos.
  // Los precios editados en el panel (precio_manual) se respetan; la disponibilidad siempre manda el proveedor.
  const contenido = `-- Generado por scripts/generar-seed.ts desde supabase/datos/. No editar a mano.
insert into productos (codigo, slug, marca, nombre, presentacion, descripcion, atributos, imagenes) values
${productos.map(filaProducto).join(",\n")}
on conflict (slug) do update
  set imagenes = excluded.imagenes, descripcion = excluded.descripcion, atributos = excluded.atributos;

insert into variantes (producto_id, tamano_ml, precio_cop, disponible)
select p.id, l.tamano_ml, l.precio_cop, l.disponible
from ${listaProveedor}
join productos p on p.slug = l.slug
on conflict (producto_id, tamano_ml) do update
  set precio_cop = case when variantes.precio_manual then variantes.precio_cop else excluded.precio_cop end,
      disponible = excluded.disponible;

insert into costos_variante (variante_id, costo_cop)
select v.id, l.costo_cop
from ${listaProveedor}
join productos p on p.slug = l.slug
join variantes v on v.producto_id = p.id and v.tamano_ml = l.tamano_ml
where l.costo_cop is not null
on conflict (variante_id) do update set costo_cop = excluded.costo_cop, actualizado_at = now();
`;
  await writeFile(SALIDA, contenido);
  console.log(`seed.sql: ${productos.length} productos, ${productos.length - sinFicha.length} con ficha borrador`);
}

await main();
