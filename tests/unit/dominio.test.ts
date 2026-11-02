import { describe, expect, it } from "vitest";
import { montosCitados, montosSinRespaldo, pideHumanoExplicitamente } from "@/core/conversacion/guardas";
import { sesionActual } from "@/core/conversacion/sesion";
import type { MensajeGuardado } from "@/core/conversacion/tipos";
import { ciudadCubierta } from "@/core/pedidos/armar-pedido";
import { puedeTransicionar } from "@/core/pedidos/estados";
import { mensajeParaProveedor } from "@/core/pedidos/mensaje-proveedor";
import type { Pedido } from "@/core/pedidos/tipos";

describe("guarda de montos", () => {
  it("reconoce montos en pesos y no confunde mililitros ni números de pedido", () => {
    expect(montosCitados("Queda en $169.900, el de 100 ml. Pedido #1023. Total 312.900 pesos")).toEqual([169900, 312900]);
    expect(montosCitados("$ 1.250.000 o 99000 COP")).toEqual([1250000, 99000]);
  });

  it("solo deja pasar montos respaldados", () => {
    expect(montosSinRespaldo("Son $169.900", [169900])).toEqual([]);
    expect(montosSinRespaldo("Te lo dejo en $150.000", [169900])).toEqual([150000]);
  });
});

describe("pedir una persona", () => {
  it("detecta pedidos explícitos y no se activa con menciones casuales", () => {
    expect(pideHumanoExplicitamente("Quiero hablar con una persona")).toBe(true);
    expect(pideHumanoExplicitamente("necesito un asesor")).toBe(true);
    expect(pideHumanoExplicitamente("es para una persona especial")).toBe(false);
  });
});

describe("sesión", () => {
  const mensaje = (minuto: number): MensajeGuardado => ({ autor: "cliente", texto: `m${minuto}`, turnos: [], creadoAt: new Date(minuto * 60_000) });

  it("empieza después del último silencio más largo que el umbral", () => {
    const sesion = sesionActual([mensaje(0), mensaje(5), mensaje(500), mensaje(510)], 60 * 60_000);
    expect(sesion.map((m) => m.texto)).toEqual(["m500", "m510"]);
  });
});

describe("pedidos", () => {
  it("solo permite las transiciones del flujo", () => {
    expect(puedeTransicionar("pendiente_confirmacion", "confirmado")).toBe(true);
    expect(puedeTransicionar("pendiente_confirmacion", "despachado")).toBe(false);
    expect(puedeTransicionar("entregado", "cancelado")).toBe(false);
    expect(puedeTransicionar("despachado", "rechazado_en_puerta")).toBe(true);
  });

  it("reconoce la ciudad aunque la escriban distinto", () => {
    expect(ciudadCubierta("bogota d.c.", ["Bogotá"])).toBe(true);
    expect(ciudadCubierta("Soacha", ["Bogotá"])).toBe(false);
  });

  it("el mensaje al proveedor trae productos y envío pero no precios", () => {
    const pedido = {
      numero: 1001,
      envio: { nombre: "Ana", telefono: "573001112233", direccion: "Calle 85 # 12-30", barrio: "Chicó", ciudad: "Bogotá" },
      items: [{ descripcion: "Lattafa Khamrah", tamanoMl: 100, cantidad: 2, precioUnitarioCop: 169900 }],
      notas: null,
    } as unknown as Pedido;
    const mensaje = mensajeParaProveedor(pedido);
    expect(mensaje).toContain("2 × Lattafa Khamrah 100 ml");
    expect(mensaje).toContain("Calle 85 # 12-30, Chicó, Bogotá");
    expect(mensaje).not.toMatch(/\$|169/);
  });
});
