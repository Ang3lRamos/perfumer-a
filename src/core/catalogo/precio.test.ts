import { describe, expect, it } from "vitest";
import { formatearCop, precioVenta } from "./precio";

describe("precioVenta", () => {
  const treinta = { margenSobreCosto: 0.3 } as const;

  it("aplica el margen y termina en 900 sin quedar por debajo", () => {
    expect(precioVenta(130000, { ...treinta, terminacion: "900" })).toBe(169900);
    expect(precioVenta(95000, { ...treinta, terminacion: "900" })).toBe(123900);
    // 169.900 exacto ya cumple: no sube a 170.900.
    expect(precioVenta(130692, { margenSobreCosto: 0.3, terminacion: "900" })).toBe(169900);
  });

  it("redondea al siguiente mil o deja el valor exacto", () => {
    expect(precioVenta(130000, { ...treinta, terminacion: "000" })).toBe(169000);
    expect(precioVenta(131000, { ...treinta, terminacion: "000" })).toBe(171000);
    expect(precioVenta(131000, { ...treinta, terminacion: null })).toBe(170300);
  });
});

describe("formatearCop", () => {
  it("usa el formato colombiano sin decimales ni espacios", () => {
    expect(formatearCop(169900)).toBe("$169.900");
  });
});
