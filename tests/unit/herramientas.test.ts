import { describe, expect, it } from "vitest";
import { configAgente } from "@/config/agente";
import { crearHerramientas } from "@/core/conversacion/herramientas";
import type { ContextoHerramienta } from "@/core/conversacion/herramientas/tipos";
import type { ComboResuelto } from "@/core/combos/combos";
import { CATALOGO, montarAgente } from "./apoyo";

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

describe("promociones y combos en el agente", () => {
  const combo: ComboResuelto = {
    id: "c1",
    codigo: "CMB-001",
    nombre: "Dúo",
    descripcion: null,
    precioCop: 299999,
    precioSueltoCop: 325800,
    piezas: [
      { varianteId: "v-khamrah", cantidad: 1, codigo: "LAT-051", marca: "Lattafa", nombre: "Khamrah", slug: "k", tamanoMl: 100, precioCop: 169900, imagen: null },
      { varianteId: "v-yara", cantidad: 1, codigo: "LAT-017", marca: "Lattafa", nombre: "Yara", slug: "y", tamanoMl: 100, precioCop: 155900, imagen: null },
    ],
  };

  async function contextoConCombo() {
    const agente = montarAgente([], CATALOGO, [combo]);
    const cliente = await agente.conversaciones.clientePorTelefono("573001112233");
    const conversacion = await agente.conversaciones.conversacion(cliente.id, "whatsapp");
    return { agente, ctx: { deps: agente.deps, config: configAgente, conversacion, cliente } as ContextoHerramienta };
  }

  it("ver_combos deja citar el precio, el valor por separado y el ahorro", async () => {
    const { ctx } = await contextoConCombo();
    expect(await herramienta("ver_combos").ejecutar({}, ctx)).toMatchObject({ ok: true, montos: [299999, 325800, 25801] });
  });

  it("crear_pedido con combo cobra exactamente el precio del combo, sumado a lo suelto", async () => {
    const { ctx, agente } = await contextoConCombo();
    const { items: _sueltos, ...base } = pedidoValido;
    const resultado = await herramienta("crear_pedido").ejecutar(
      { ...base, items: [{ codigo: "LAT-051", tamano_ml: 100, cantidad: 1 }], combos: [{ codigo: "cmb-001", cantidad: 2 }] },
      ctx,
    );
    expect(resultado).toMatchObject({ ok: true, datos: { total_sin_envio: 169900 + 2 * 299999 } });
    const items = agente.pedidos.pedidos[0]!.items;
    expect(items.filter((i) => i.comboCodigo === "CMB-001")).toHaveLength(4);
    expect(items.reduce((t, i) => t + i.precioUnitarioCop * i.cantidad, 0)).toBe(169900 + 2 * 299999);
  });

  it("rechaza un combo que ya no está disponible y un pedido vacío", async () => {
    const { ctx } = await contextoConCombo();
    const { items: _sueltos, ...base } = pedidoValido;
    expect(await herramienta("crear_pedido").ejecutar({ ...base, combos: [{ codigo: "CMB-999", cantidad: 1 }] }, ctx)).toMatchObject({ ok: false });
    expect(await herramienta("crear_pedido").ejecutar(base, ctx)).toMatchObject({ ok: false });
  });

  it("el pedido suelto usa el precio con promoción y el agente puede citar el anterior", async () => {
    const conPromo = CATALOGO.map((p) =>
      p.codigo === "LAT-051" ? { ...p, variantes: [{ ...p.variantes[0]!, precioCop: 144400, precioAnteriorCop: 169900, promocion: "Navidad" }] } : p,
    );
    const agente = montarAgente([], conPromo);
    const cliente = await agente.conversaciones.clientePorTelefono("573001112233");
    const conversacion = await agente.conversaciones.conversacion(cliente.id, "whatsapp");
    const ctx = { deps: agente.deps, config: configAgente, conversacion, cliente } as ContextoHerramienta;
    expect(await herramienta("obtener_producto").ejecutar({ codigo: "LAT-051" }, ctx)).toMatchObject({
      datos: { tamanos: [{ precio: 144400, precio_anterior: 169900, promocion: "Navidad" }] },
      montos: [144400, 169900],
    });
    const creado = await herramienta("crear_pedido").ejecutar({ ...pedidoValido, items: [{ codigo: "LAT-051", tamano_ml: 100, cantidad: 1 }] }, ctx);
    expect(creado).toMatchObject({ datos: { total_sin_envio: 144400 } });
  });
});
