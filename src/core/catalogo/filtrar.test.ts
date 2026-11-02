import { describe, expect, it } from "vitest";
import { filtrarCatalogo, ordenarCatalogo, precioDesde } from "./filtrar";
import type { Producto, Variante } from "./tipos";

function variante(tamanoMl: number, precioCop: number | null): Variante {
  return { id: `v${tamanoMl}`, tamanoMl, precioCop, disponible: precioCop !== null };
}

function producto(codigo: string, parcial: Partial<Producto>): Producto {
  return {
    id: codigo,
    codigo,
    slug: codigo.toLowerCase(),
    marca: "Lattafa",
    nombre: codigo,
    tipo: "original",
    inspiracionNota: null,
    presentacion: "EDP",
    descripcion: null,
    atributos: {},
    fichaVerificada: false,
    imagenUrl: null,
    variantes: [variante(100, 130000)],
    ...parcial,
  };
}

const khamrah = producto("LAT-051", {
  nombre: "Khamrah",
  atributos: { genero: "unisex", familias: ["oriental", "gourmand"] },
});
const yara = producto("LAT-017", { nombre: "Yara", atributos: { genero: "femenino", familias: ["gourmand", "floral"] } });
const goldEdition = producto("ALH-002", {
  marca: "Al Haramain",
  nombre: "Amber Oud Gold Edition",
  variantes: [variante(100, 210000), variante(120, 240000)],
});
const agotado = producto("AFN-003", { marca: "Afnan", nombre: "9PM Night Out", variantes: [variante(100, null)] });
const catalogo = [khamrah, yara, goldEdition, agotado];

describe("filtrarCatalogo", () => {
  it("busca por texto sin importar tildes, mayúsculas ni orden de palabras", () => {
    expect(filtrarCatalogo(catalogo, { texto: "gold AMBER" })).toEqual([goldEdition]);
    expect(filtrarCatalogo(catalogo, { texto: "lat-051" })).toEqual([khamrah]);
  });

  it("combina atributos con OR dentro de la clave y AND entre claves", () => {
    expect(filtrarCatalogo(catalogo, { atributos: { familias: ["oriental", "floral"] } })).toEqual([khamrah, yara]);
    expect(
      filtrarCatalogo(catalogo, { atributos: { familias: ["gourmand"], genero: ["femenino"] } }),
    ).toEqual([yara]);
  });

  it("aplica precio y tamaño sobre la misma variante", () => {
    expect(filtrarCatalogo(catalogo, { precioMin: 230000 })).toEqual([goldEdition]);
    expect(filtrarCatalogo(catalogo, { tamanosMl: [100], precioMin: 230000 })).toEqual([]);
  });

  it("excluye productos sin precio cuando hay rango de precio", () => {
    expect(filtrarCatalogo(catalogo, { precioMax: 500000 })).not.toContain(agotado);
  });
});

describe("ordenarCatalogo y precioDesde", () => {
  it("toma el menor precio disponible", () => {
    expect(precioDesde(goldEdition)).toBe(210000);
    expect(precioDesde(agotado)).toBeNull();
  });

  it("deja los agotados al final en relevancia y sin precio al final en precio ascendente", () => {
    expect(ordenarCatalogo([agotado, khamrah], "relevancia")).toEqual([khamrah, agotado]);
    expect(ordenarCatalogo([agotado, goldEdition, khamrah], "precio_asc")).toEqual([khamrah, goldEdition, agotado]);
  });
});
