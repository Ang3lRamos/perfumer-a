import { describe, expect, it } from "vitest";
import { extraerCodigos } from "../catalogo/referencia";
import { agregar, cambiarCantidad, mensajePedido, quitar, totalCop, totalUnidades, type LineaCarrito } from "./carrito";

const khamrah: LineaCarrito = {
  varianteId: "v-khamrah",
  codigo: "LAT-051",
  marca: "Lattafa",
  nombre: "Khamrah",
  slug: "lattafa-khamrah",
  tamanoMl: 100,
  precioCop: 130000,
  imagen: null,
  cantidad: 1,
};
const goldEdition: LineaCarrito = {
  ...khamrah,
  varianteId: "v-gold-120",
  codigo: "ALH-002",
  marca: "Al Haramain",
  nombre: "Amber Oud Gold Edition",
  tamanoMl: 120,
  precioCop: 240000,
};

describe("carrito", () => {
  it("suma cantidades de la misma variante y respeta el tope", () => {
    const dos = agregar(agregar([], khamrah), khamrah);
    expect(dos).toHaveLength(1);
    expect(dos[0].cantidad).toBe(2);
    expect(agregar(dos, { ...khamrah, cantidad: 50 })[0].cantidad).toBe(10);
  });

  it("actualiza el precio al volver a agregar", () => {
    const conPrecioNuevo = agregar([khamrah], { ...khamrah, precioCop: 135000 });
    expect(conPrecioNuevo[0]).toMatchObject({ cantidad: 2, precioCop: 135000 });
  });

  it("cambia cantidades, quita y totaliza", () => {
    const lineas = cambiarCantidad([khamrah, goldEdition], "v-khamrah", 3);
    expect(totalUnidades(lineas)).toBe(4);
    expect(totalCop(lineas)).toBe(3 * 130000 + 240000);
    expect(quitar(lineas, "v-khamrah")).toEqual([goldEdition]);
    expect(cambiarCantidad(lineas, "v-khamrah", 0)[0].cantidad).toBe(1);
  });

  it("arma un mensaje con todo el pedido y códigos que el agente puede leer", () => {
    const mensaje = mensajePedido([{ ...khamrah, cantidad: 2 }, goldEdition]);
    expect(mensaje).toContain("2 × Lattafa Khamrah 100 ml (ref. LAT-051) — $260.000");
    expect(mensaje).toContain("Total sin envío: $500.000");
    expect(extraerCodigos(mensaje)).toEqual(["LAT-051", "ALH-002"]);
  });
});
