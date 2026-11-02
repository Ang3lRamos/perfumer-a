import { describe, expect, it } from "vitest";
import { configAgente } from "@/config/agente";
import { crearHerramientas } from "@/core/conversacion/herramientas";
import type { ContextoHerramienta } from "@/core/conversacion/herramientas/tipos";
import { montarAgente } from "./apoyo";

async function contexto(): Promise<{ ctx: ContextoHerramienta; agente: ReturnType<typeof montarAgente> }> {
  const agente = montarAgente([]);
  const cliente = await agente.conversaciones.clientePorTelefono("573001112233");
  const conversacion = await agente.conversaciones.conversacion(cliente.id, "whatsapp");
  return { agente, ctx: { deps: agente.deps, config: configAgente, conversacion, cliente } };
}

function herramienta(nombre: string) {
  const encontrada = crearHerramientas(configAgente).find((h) => h.nombre === nombre);
  if (!encontrada) throw new Error(`No existe ${nombre}`);
  return encontrada;
}

const pedidoValido = {
  nombre: "Ana Gómez",
  direccion: "Calle 85 # 12-30",
  barrio: "Chicó",
  ciudad: "Bogotá D.C.",
  items: [
    { codigo: "lat-051", tamano_ml: 100, cantidad: 2 },
    { codigo: "ALH-002", tamano_ml: 120, cantidad: 1 },
  ],
};

describe("crear_pedido", () => {
  it("toma los precios del catálogo, nace pendiente de confirmación y avisa al dueño", async () => {
    const { ctx, agente } = await contexto();
    const resultado = await herramienta("crear_pedido").ejecutar(pedidoValido, ctx);
    expect(resultado).toMatchObject({ ok: true, datos: { numero: 1001, total_sin_envio: 2 * 169900 + 312900 } });
    expect(agente.pedidos.pedidos[0]).toMatchObject({ estado: "pendiente_confirmacion", envio: { telefono: "573001112233" } });
    expect(agente.notificador.avisos[0]).toContain("#1001");
  });

  it("rechaza ciudades fuera de cobertura, tamaños inexistentes y productos agotados", async () => {
    const { ctx } = await contexto();
    const crear = herramienta("crear_pedido");
    expect(await crear.ejecutar({ ...pedidoValido, ciudad: "Medellín" }, ctx)).toMatchObject({ ok: false, error: expect.stringContaining("Bogotá") });
    expect(await crear.ejecutar({ ...pedidoValido, items: [{ codigo: "LAT-051", tamano_ml: 50, cantidad: 1 }] }, ctx)).toMatchObject({ ok: false });
    expect(await crear.ejecutar({ ...pedidoValido, items: [{ codigo: "AFN-003", tamano_ml: 100, cantidad: 1 }] }, ctx)).toMatchObject({ ok: false, error: expect.stringContaining("agotado") });
  });

  it("el esquema no deja pedir más de 10 unidades", () => {
    expect(herramienta("crear_pedido").esquema.safeParse({ ...pedidoValido, items: [{ codigo: "LAT-051", tamano_ml: 100, cantidad: 50 }] }).success).toBe(false);
  });
});

describe("consultar_estado_pedido", () => {
  it("no muestra pedidos de otro cliente", async () => {
    const { ctx, agente } = await contexto();
    await herramienta("crear_pedido").ejecutar(pedidoValido, ctx);
    const otro = await agente.conversaciones.clientePorTelefono("573009998877");
    const resultado = await herramienta("consultar_estado_pedido").ejecutar({ numero: 1001 }, { ...ctx, cliente: otro });
    expect(resultado).toMatchObject({ ok: false });
  });
});

describe("buscar_productos y recomendar", () => {
  it("busca por marca sin importar mayúsculas y devuelve los montos que se pueden citar", async () => {
    const { ctx } = await contexto();
    const resultado = await herramienta("buscar_productos").ejecutar({ marca: "LATTAFA" }, ctx);
    expect(resultado).toMatchObject({ ok: true, montos: [169900, 155900] });
  });

  it("recomienda solo disponibles que coinciden con las preferencias", async () => {
    const { ctx } = await contexto();
    const resultado = await herramienta("recomendar").ejecutar({ atributos: { familias: ["gourmand"], genero: ["femenino"] } }, ctx);
    expect(resultado.ok && (resultado.datos as { recomendaciones: { codigo: string }[] }).recomendaciones.map((r) => r.codigo)).toEqual(["LAT-017", "LAT-051"]);
  });
});
