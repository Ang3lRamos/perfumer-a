import { describe, expect, it } from "vitest";
import { alternarValor, leerFiltros } from "./parametros";

describe("leerFiltros", () => {
  it("convierte la URL en filtros e ignora valores inválidos", () => {
    const { filtros, orden } = leerFiltros(
      { q: " khamrah ", familias: "oriental,gourmand", ml: "100,abc", precio: "130000-180000", orden: "raro" },
      ["familias", "genero"],
    );
    expect(filtros).toMatchObject({
      texto: "khamrah",
      tamanosMl: [100],
      precioMin: 130000,
      precioMax: 180000,
      atributos: { familias: ["oriental", "gourmand"] },
    });
    expect(orden).toBe("relevancia");
  });

  it("acepta rangos abiertos por arriba y desde cero", () => {
    expect(leerFiltros({ precio: "250000-" }, []).filtros).toMatchObject({ precioMin: 250000, precioMax: undefined });
    expect(leerFiltros({ precio: "0-130000" }, []).filtros).toMatchObject({ precioMin: undefined, precioMax: 130000 });
  });
});

describe("alternarValor", () => {
  it("agrega y quita valores sin tocar otros parámetros", () => {
    const inicial = new URLSearchParams("familias=oriental&q=yara");
    const conGourmand = alternarValor(inicial, "familias", "gourmand");
    expect(conGourmand.toString()).toBe("familias=oriental%2Cgourmand&q=yara");
    expect(alternarValor(alternarValor(conGourmand, "familias", "oriental"), "familias", "gourmand").toString()).toBe("q=yara");
  });
});
