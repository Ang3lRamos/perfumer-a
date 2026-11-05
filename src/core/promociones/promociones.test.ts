import { describe, expect, it } from "vitest";
import type { Producto } from "../catalogo/tipos";
import {
  aplicarPromociones,
  esquemaPromocion,
  estadoVigencia,
  impactoPromocion,
  instanteALocal,
  localAInstante,
  precioConDescuento,
  segundosHastaProximoCambio,
  type Promocion,
} from "./promociones";

const AHORA = new Date("2026-11-05T15:00:00Z");

const producto = (id: string, marca: string, precioCop: number | null): Producto => ({
  id,
  codigo: "LAT-001",
  slug: id,
  marca,
  nombre: id,
  tipo: "original",
  inspiracionNota: null,
  presentacion: null,
  descripcion: null,
  atributos: {},
  fichaVerificada: false,
  imagenes: [],
  variantes: [{ id: `v-${id}`, tamanoMl: 100, precioCop, disponible: precioCop !== null }],
});

const promo = (cambios: Partial<Promocion>): Promocion => ({
  id: "p",
  nombre: "Promo",
  tipo: "porcentaje",
  valor: 10,
  alcance: "todo",
  marca: null,
  productoIds: [],
  activa: true,
  iniciaAt: null,
  terminaAt: null,
  ...cambios,
});

describe("precioConDescuento", () => {
  it("baja los porcentajes a la centena, sin dar menos de lo anunciado", () => {
    expect(precioConDescuento(169900, { tipo: "porcentaje", valor: 15 })).toBe(144400);
  });
  it("resta los montos exactos", () => {
    expect(precioConDescuento(169900, { tipo: "monto", valor: 20000 })).toBe(149900);
  });
  it("no deja un producto gratis ni en negativo", () => {
    expect(precioConDescuento(10000, { tipo: "monto", valor: 10000 })).toBeNull();
    expect(precioConDescuento(10000, { tipo: "monto", valor: 50000 })).toBeNull();
  });
});

describe("estadoVigencia", () => {
  it("distingue programada, vigente y terminada", () => {
    expect(estadoVigencia({ iniciaAt: "2026-11-06T00:00:00Z", terminaAt: null }, AHORA)).toBe("programada");
    expect(estadoVigencia({ iniciaAt: "2026-11-01T00:00:00Z", terminaAt: null }, AHORA)).toBe("vigente");
    expect(estadoVigencia({ iniciaAt: null, terminaAt: "2026-11-05T15:00:00Z" }, AHORA)).toBe("terminada");
  });
});

describe("aplicarPromociones", () => {
  const catalogo = [producto("a", "Lattafa", 100000), producto("b", "Afnan", 200000), producto("c", "Afnan", null)];

  it("guarda el precio anterior y el nombre de la promoción", () => {
    const [a] = aplicarPromociones(catalogo, [promo({ nombre: "Navidad", alcance: "marca", marca: "Lattafa" })], AHORA);
    expect(a.variantes[0]).toMatchObject({ precioCop: 90000, precioAnteriorCop: 100000, promocion: "Navidad" });
  });
  it("solo toca lo que cubre el alcance", () => {
    const [a, b] = aplicarPromociones(catalogo, [promo({ alcance: "productos", productoIds: ["b"] })], AHORA);
    expect(a.variantes[0].precioCop).toBe(100000);
    expect(b.variantes[0].precioCop).toBe(180000);
  });
  it("no acumula: gana la de menor precio final", () => {
    const [, b] = aplicarPromociones(
      catalogo,
      [promo({ nombre: "Diez", valor: 10 }), promo({ nombre: "Monto", tipo: "monto", valor: 50000 })],
      AHORA,
    );
    expect(b.variantes[0]).toMatchObject({ precioCop: 150000, promocion: "Monto" });
  });
  it("ignora pausadas, programadas y terminadas", () => {
    const fuera = [
      promo({ activa: false }),
      promo({ iniciaAt: "2026-11-06T00:00:00Z" }),
      promo({ terminaAt: "2026-11-01T00:00:00Z" }),
    ];
    expect(aplicarPromociones(catalogo, fuera, AHORA)[0].variantes[0].precioCop).toBe(100000);
  });
  it("deja intactos los tamaños sin precio", () => {
    expect(aplicarPromociones(catalogo, [promo({})], AHORA)[2].variantes[0].precioCop).toBeNull();
  });
});

describe("segundosHastaProximoCambio", () => {
  it("usa una hora si no hay cambios cercanos", () => {
    expect(segundosHastaProximoCambio([{ iniciaAt: null, terminaAt: null }], AHORA)).toBe(3600);
  });
  it("se acerca al próximo inicio o fin", () => {
    expect(segundosHastaProximoCambio([{ iniciaAt: null, terminaAt: "2026-11-05T15:20:00Z" }], AHORA)).toBe(1200);
  });
  it("no baja de 5 minutos ni cuenta fechas pasadas", () => {
    expect(segundosHastaProximoCambio([{ iniciaAt: "2026-11-05T15:01:00Z", terminaAt: null }], AHORA)).toBe(300);
    expect(segundosHastaProximoCambio([{ iniciaAt: "2026-11-01T00:00:00Z", terminaAt: null }], AHORA)).toBe(3600);
  });
});

describe("impactoPromocion", () => {
  it("cuenta los tamaños que quedarían por debajo del costo", () => {
    const filas = [
      { productoId: "a", marca: "L", precioCop: 100000, costoCop: 85000 },
      { productoId: "b", marca: "L", precioCop: 100000, costoCop: 95000 },
      { productoId: "c", marca: "L", precioCop: 100000, costoCop: null },
      { productoId: "d", marca: "L", precioCop: null, costoCop: 1000 },
    ];
    expect(impactoPromocion(promo({}), filas)).toEqual({ tamanos: 3, bajoCosto: 1 });
  });
});

describe("hora del negocio", () => {
  it("convierte la hora de Bogotá al instante correcto y de vuelta", () => {
    expect(localAInstante("2026-12-01T08:00", "America/Bogota")).toBe("2026-12-01T13:00:00.000Z");
    expect(instanteALocal("2026-12-01T13:00:00.000Z", "America/Bogota")).toBe("2026-12-01T08:00");
  });
});

describe("esquemaPromocion", () => {
  const base = { nombre: "Navidad", tipo: "porcentaje", valor: 10, alcance: "todo", marca: null, productoIds: [] };

  it("limpia los campos que no corresponden al alcance", () => {
    const datos = esquemaPromocion.parse({ ...base, marca: "Lattafa" });
    expect(datos.marca).toBeNull();
  });
  it("rechaza porcentajes exagerados y alcances incompletos", () => {
    expect(esquemaPromocion.safeParse({ ...base, valor: 95 }).success).toBe(false);
    expect(esquemaPromocion.safeParse({ ...base, alcance: "marca" }).success).toBe(false);
    expect(esquemaPromocion.safeParse({ ...base, alcance: "productos" }).success).toBe(false);
  });
});
