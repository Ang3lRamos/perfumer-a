import { describe, expect, it } from "vitest";
import { agruparEnProductos } from "./agrupar";
import { normalizarLinea } from "./normalizar";

const normalizar = (texto: string, precio: number | null = 100000) => normalizarLinea({ texto, precio }, 0);

describe("normalizarLinea", () => {
  it("repara palabras partidas por el PDF y separa marca, nombre, tamaño y concentración", () => {
    expect(normalizar("LATTA FA   KHAMRAH   DUKH AN   100ML   EDP")).toMatchObject({
      marca: "Lattafa",
      nombre: "Khamrah Dukhan",
      tamanoMl: 100,
      concentracion: "EDP",
    });
  });

  it("reconoce extractos y tamaños con espacios", () => {
    expect(normalizar("FRECH   AVENUE -   AETHER   10 0ML   EXTRAIT  DE PARFUM")).toMatchObject({
      marca: "French Avenue",
      nombre: "Aether",
      tamanoMl: 100,
      concentracion: "Extrait de Parfum",
    });
  });

  it("antepone la línea cuando la marca real es otra (Hawas es de Rasasi)", () => {
    expect(normalizar("HAWAS   ICE 100ML EDP")).toMatchObject({ marca: "Rasasi", nombre: "Hawas Ice" });
    expect(normalizar("JO   MILANO -   GOS   ROYALE   100ML   PARFUM")).toMatchObject({
      marca: "Jo Milano",
      nombre: "Game of Spades Royale",
      concentracion: "Parfum",
    });
  });

  it("separa el tamaño pegado al nombre y deja sin concentración si no viene", () => {
    expect(normalizar("MAISON   ALHAMBRA   LA   CHARMANTE  ECLATANT100ML EDP").nombre).toBe("La Charmante Eclatant");
    expect(normalizar("AL   HARAMAIN   AMBER   OUD   AQUA   DUBAI  100ML").concentracion).toBeNull();
  });

  it("falla con una marca desconocida en vez de inventarla", () => {
    expect(() => normalizar("MARCA NUEVA X 100ML EDP")).toThrow(/Marca no reconocida/);
  });
});

describe("agruparEnProductos", () => {
  it("une tamaños del mismo perfume y asigna códigos consecutivos por marca", () => {
    const productos = agruparEnProductos([
      normalizarLinea({ texto: "AL HARAMAIN AMBER OUD GOLD EDITION 100ML EDP", precio: 210000 }, 0),
      normalizarLinea({ texto: "AL HARAMAIN AMBER OUD GOLD EDITION 120 ML EDP", precio: 240000 }, 1),
      normalizarLinea({ texto: "AL HARAMAIN AMBER OUD DUBAI NIGHT 100ML EXTRAIT DE PARFUM", precio: null }, 2),
    ]);
    expect(productos.map((p) => p.codigo)).toEqual(["ALH-001", "ALH-002"]);
    expect(productos[0].variantes).toEqual([
      { tamanoMl: 100, precioCop: 210000 },
      { tamanoMl: 120, precioCop: 240000 },
    ]);
  });

  it("mantiene separados el mismo nombre en distinta concentración", () => {
    const productos = agruparEnProductos([
      normalizarLinea({ texto: "JO MILANO - GOS ESMERALD 100ML EXTRAIT DE PARFUM", precio: 320000 }, 0),
      normalizarLinea({ texto: "JO MILANO - GOS ESMERALD 100ML PARFUM", precio: 295000 }, 1),
    ]);
    expect(productos).toHaveLength(2);
  });
});
