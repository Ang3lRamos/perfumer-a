import { describe, expect, it } from "vitest";
import { debeCerrar, gomaElastica, proyectarMomento, velocidadAlSoltar } from "./fisica-gesto";

describe("velocidadAlSoltar", () => {
  it("mide px/s con las muestras recientes", () => {
    const muestras = [
      { posicion: 0, tiempo: 0 },
      { posicion: 50, tiempo: 50 },
    ];
    expect(velocidadAlSoltar(muestras, 60)).toBe(1000);
  });

  it("es 0 si el dedo se detuvo antes de soltar", () => {
    const muestras = [
      { posicion: 0, tiempo: 0 },
      { posicion: 50, tiempo: 50 },
    ];
    expect(velocidadAlSoltar(muestras, 1000)).toBe(0);
  });
});

describe("gomaElastica", () => {
  it("cede menos que el dedo y nunca pasa de la dimensión", () => {
    expect(gomaElastica(100, 600)).toBeLessThan(100);
    expect(gomaElastica(100_000, 600)).toBeLessThan(600);
  });
});

describe("debeCerrar", () => {
  it("cierra con un gesto rápido aunque el recorrido sea corto", () => {
    expect(proyectarMomento(1000)).toBeCloseTo(499);
    expect(debeCerrar(40, 1000, 600)).toBe(true);
  });

  it("no cierra si el dedo regresa, aunque haya pasado la mitad", () => {
    expect(debeCerrar(350, -500, 600)).toBe(false);
  });

  it("cierra pasada la mitad sin velocidad y vuelve antes de ella", () => {
    expect(debeCerrar(301, 0, 600)).toBe(true);
    expect(debeCerrar(299, 0, 600)).toBe(false);
  });
});
