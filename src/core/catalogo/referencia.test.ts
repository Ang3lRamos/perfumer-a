import { describe, expect, it } from "vitest";
import { extraerCodigos, mensajeDeInteres } from "./referencia";
import type { Producto } from "./tipos";

describe("referencia de producto en el mensaje de WhatsApp", () => {
  it("el mensaje prellenado lleva un código que el agente sabe extraer", () => {
    const producto = { marca: "Lattafa", nombre: "Khamrah", codigo: "LAT-051" } as Producto;
    const mensaje = mensajeDeInteres(producto, { id: "v", tamanoMl: 100, precioCop: 130000, disponible: true });
    expect(mensaje).toContain("ref. LAT-051");
    expect(extraerCodigos(mensaje)).toEqual(["LAT-051"]);
  });

  it("extrae códigos escritos a mano, en minúscula y sin repetir", () => {
    expect(extraerCodigos("me interesan el lat-051 y el ARM-003, y otra vez LAT-051")).toEqual(["LAT-051", "ARM-003"]);
  });
});
