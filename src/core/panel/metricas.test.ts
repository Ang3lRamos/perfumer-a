import { describe, expect, it } from "vitest";
import type { EstadoPedido } from "../pedidos/estados";
import { diaLocal, resumirCatalogo, resumirPedidos, type PedidoPanel, type ProductoPanel } from "./metricas";

const ZONA = "America/Bogota";
const AHORA = new Date("2026-11-05T17:00:00Z");

function pedido(estado: EstadoPedido, creado: string, costo: number | null = 60_000, numero = 1001): PedidoPanel {
  return {
    numero,
    estado,
    creadoAt: new Date(creado),
    items: [{ cantidad: 2, precioUnitarioCop: 100_000, costoUnitarioCop: costo }],
  };
}

const resumir = (pedidos: PedidoPanel[]) => resumirPedidos(pedidos, { ahora: AHORA, dias: 30, zonaHoraria: ZONA });

describe("diaLocal", () => {
  it("usa el día del negocio, no el de UTC", () => {
    expect(diaLocal(new Date("2026-11-05T01:00:00Z"), ZONA)).toBe("2026-11-04");
  });
});

describe("resumirPedidos", () => {
  it("sin pedidos da ceros y deja la tasa de rechazo sin definir", () => {
    const resumen = resumir([]);
    expect(resumen.ventasCop).toBe(0);
    expect(resumen.tasaRechazo).toBeNull();
    expect(resumen.porDia).toHaveLength(30);
    expect(resumen.porDia.at(-1)?.dia).toBe("2026-11-05");
  });

  it("solo cuenta como venta lo entregado: contraentrega se cobra al recibir", () => {
    const resumen = resumir([
      pedido("entregado", "2026-11-01T15:00:00Z"),
      pedido("despachado", "2026-11-02T15:00:00Z"),
      pedido("rechazado_en_puerta", "2026-11-03T15:00:00Z"),
    ]);
    expect(resumen.ventasCop).toBe(200_000);
    expect(resumen.gananciaCop).toBe(80_000);
    expect(resumen.tasaRechazo).toBe(0.5);
    expect(resumen.enCurso).toBe(1);
    expect(resumen.valorEnCursoCop).toBe(200_000);
  });

  it("avisa de los ítems sin costo en vez de contarlos como utilidad", () => {
    const resumen = resumir([pedido("entregado", "2026-11-01T15:00:00Z", null)]);
    expect(resumen.gananciaCop).toBe(0);
    expect(resumen.itemsSinCosto).toBe(1);
  });

  it("lo pendiente antiguo sigue visible aunque salga del periodo", () => {
    const resumen = resumir([pedido("pendiente_confirmacion", "2026-01-01T15:00:00Z")]);
    expect(resumen.porConfirmar).toBe(1);
    expect(resumen.pedidosDelPeriodo).toBe(0);
    expect(resumen.recientes).toHaveLength(1);
  });

  it("agrupa por día local y ordena los recientes del más nuevo al más viejo", () => {
    const resumen = resumir([
      pedido("confirmado", "2026-11-02T15:00:00Z", 60_000, 1001),
      pedido("confirmado", "2026-11-05T01:00:00Z", 60_000, 1002),
    ]);
    expect(resumen.porDia.find((d) => d.dia === "2026-11-04")?.pedidos).toBe(1);
    expect(resumen.recientes.map((r) => r.numero)).toEqual([1002, 1001]);
  });
});

describe("resumirCatalogo", () => {
  const producto = (datos: Partial<ProductoPanel>): ProductoPanel => ({
    marca: "Casa A",
    activo: true,
    fichaVerificada: true,
    imagenes: ["https://cdn.example.com/a.webp"],
    variantes: [{ precioCop: 130_000, costoCop: 100_000, disponible: true }],
    ...datos,
  });

  it("mide solo el catálogo activo", () => {
    const resumen = resumirCatalogo([
      producto({}),
      producto({ activo: false, fichaVerificada: false, imagenes: [] }),
      producto({ marca: "Casa B", fichaVerificada: false, imagenes: ["/productos/a.webp"] }),
    ]);
    expect(resumen.activos).toBe(2);
    expect(resumen.inactivos).toBe(1);
    expect(resumen.sinFoto).toBe(1);
    expect(resumen.sinVerificar).toBe(1);
    expect(resumen.margenPromedio).toBeCloseTo(0.3);
  });

  it("no inventa un margen si faltan costos", () => {
    const resumen = resumirCatalogo([producto({ variantes: [{ precioCop: 130_000, costoCop: null, disponible: true }] })]);
    expect(resumen.margenPromedio).toBeNull();
  });

  it("agrupa la cola de casas en vez de listarlas todas", () => {
    const productos = ["A", "A", "B", "C"].map((marca) => producto({ marca }));
    const resumen = resumirCatalogo(productos, 2);
    expect(resumen.casas).toEqual([
      { marca: "A", productos: 2 },
      { marca: "B", productos: 1 },
    ]);
    expect(resumen.otrasCasas).toEqual({ casas: 1, productos: 1 });
  });
});
