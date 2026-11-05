import { describe, expect, it } from "vitest";
import type { Producto } from "../catalogo/tipos";
import { esquemaCombo, lineaDeCombo, repartirCombo, resolverCombos, type Combo } from "./combos";

const AHORA = new Date("2026-11-05T15:00:00Z");

const producto = (id: string, precioCop: number | null, disponible = true): Producto => ({
  id,
  codigo: `LAT-00${id}`,
  slug: id,
  marca: "Lattafa",
  nombre: id,
  tipo: "original",
  inspiracionNota: null,
  presentacion: null,
  descripcion: null,
  atributos: {},
  fichaVerificada: false,
  imagenes: [],
  variantes: [{ id: `v${id}`, tamanoMl: 100, precioCop, disponible }],
});

const combo = (cambios: Partial<Combo> = {}): Combo => ({
  id: "c1",
  codigo: "CMB-001",
  nombre: "Dúo",
  descripcion: null,
  precioCop: 250000,
  activo: true,
  iniciaAt: null,
  terminaAt: null,
  items: [
    { varianteId: "v1", cantidad: 1 },
    { varianteId: "v2", cantidad: 1 },
  ],
  ...cambios,
});

const catalogo = [producto("1", 100000), producto("2", 200000), producto("3", 50000, false)];

describe("resolverCombos", () => {
  it("calcula lo que costaría por separado", () => {
    const [resuelto] = resolverCombos([combo()], catalogo, AHORA);
    expect(resuelto.precioSueltoCop).toBe(300000);
    expect(resuelto.piezas.map((p) => p.codigo)).toEqual(["LAT-001", "LAT-002"]);
  });
  it("oculta el combo si un producto se agotó o ya no existe", () => {
    expect(resolverCombos([combo({ items: [{ varianteId: "v3", cantidad: 2 }] })], catalogo, AHORA)).toEqual([]);
    expect(resolverCombos([combo({ items: [{ varianteId: "nada", cantidad: 2 }] })], catalogo, AHORA)).toEqual([]);
  });
  it("oculta los pausados y fuera de fechas", () => {
    expect(resolverCombos([combo({ activo: false })], catalogo, AHORA)).toEqual([]);
    expect(resolverCombos([combo({ iniciaAt: "2026-12-01T00:00:00Z" })], catalogo, AHORA)).toEqual([]);
  });
});

describe("repartirCombo", () => {
  const suma = (filas: { precioUnitarioCop: number }[]) => filas.reduce((t, f) => t + f.precioUnitarioCop, 0);

  it("reparte en proporción al precio de cada producto", () => {
    const filas = repartirCombo(resolverCombos([combo({ precioCop: 150000 })], catalogo, AHORA)[0]);
    expect(filas.map((f) => f.precioUnitarioCop)).toEqual([50000, 100000]);
  });
  it("cuadra exacto aunque el precio no se divida entre las unidades", () => {
    const filas = repartirCombo(
      resolverCombos([combo({ precioCop: 299999, items: [{ varianteId: "v1", cantidad: 3 }] })], catalogo, AHORA)[0],
    );
    expect(filas).toHaveLength(3);
    expect(suma(filas)).toBe(299999);
    expect(filas.every((f) => f.precioUnitarioCop > 0)).toBe(true);
  });
});

describe("lineaDeCombo", () => {
  it("usa el código del combo y describe lo que incluye", () => {
    const linea = lineaDeCombo(resolverCombos([combo()], catalogo, AHORA)[0]);
    expect(linea).toMatchObject({ codigo: "CMB-001", precioCop: 250000, tamanoMl: null, slug: null });
    expect(linea.detalle).toBe("Lattafa 1 100 ml + Lattafa 2 100 ml");
  });
});

describe("esquemaCombo", () => {
  const id = "3f9c1c9e-6a7b-4c1d-9e2f-1a2b3c4d5e6f";
  const base = { nombre: "Dúo", descripcion: null, precioCop: 100000 };

  it("exige al menos 2 unidades, que pueden ser del mismo producto", () => {
    expect(esquemaCombo.safeParse({ ...base, items: [{ varianteId: id, cantidad: 1 }] }).success).toBe(false);
    expect(esquemaCombo.safeParse({ ...base, items: [{ varianteId: id, cantidad: 2 }] }).success).toBe(true);
  });
  it("no acepta productos repetidos", () => {
    const repetidos = [
      { varianteId: id, cantidad: 1 },
      { varianteId: id, cantidad: 1 },
    ];
    expect(esquemaCombo.safeParse({ ...base, items: repetidos }).success).toBe(false);
  });
});
