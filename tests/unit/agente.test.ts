import { describe, expect, it } from "vitest";
import { llamada, montarAgente, texto } from "./apoyo";

const modoDe = (agente: ReturnType<typeof montarAgente>) => [...agente.conversaciones.conversaciones.values()][0].modo;

describe("agente: datos solo desde herramientas", () => {
  it("consulta el producto del mensaje prellenado y responde con el precio real", async () => {
    const agente = montarAgente([
      [llamada("t1", "obtener_producto", { codigo: "LAT-051" })],
      [texto("¡Hola! El Khamrah de 100 ml está en $169.900 y lo tenemos disponible.")],
    ]);
    const resultado = await agente.escribir("Hola, me interesa el Lattafa Khamrah de 100 ml (ref. LAT-051)");
    expect(resultado).toMatchObject({ tipo: "respuesta", escalado: false });
    expect(resultado.tipo === "respuesta" && resultado.traza[0]).toMatchObject({ herramienta: "obtener_producto", ok: true });
  });

  it("bloquea un precio inventado, pide reescribir y envía la versión corregida", async () => {
    const agente = montarAgente([
      [texto("Te lo dejo en $150.000 por ser tú.")],
      [texto("El precio te lo confirmo consultando el catálogo, ¿qué perfume te interesa?")],
    ]);
    const resultado = await agente.escribir("¿me haces precio?");
    expect(resultado).toMatchObject({ tipo: "respuesta", texto: expect.not.stringContaining("150.000") });
    // El segundo intento lleva una nota de sistema y NO incluye la respuesta bloqueada.
    const segundoIntento = agente.modelo.recibidos[1];
    expect(segundoIntento.at(-1)).toMatchObject({ rol: "sistema" });
    expect(segundoIntento.some((t) => t.rol === "asistente")).toBe(false);
  });

  it("si insiste en el monto sin respaldo, no lo envía y escala", async () => {
    const agente = montarAgente([[texto("Son $150.000")], [texto("Son $150.000, de verdad")]]);
    const resultado = await agente.escribir("¿cuánto vale?");
    expect(resultado).toMatchObject({ tipo: "respuesta", escalado: true });
    expect(resultado.tipo === "respuesta" && resultado.texto).not.toContain("150.000");
    expect(modoDe(agente)).toBe("humano");
    expect(agente.eventos.eventos.filter((e) => e.tipo === "guarda_bloqueo")).toHaveLength(2);
  });
});

describe("agente: reglas duras del canal", () => {
  it("en modo humano no llama al modelo", async () => {
    const agente = montarAgente([[llamada("t1", "escalar_a_humano", { motivo: "reclamo" })], [texto("Ya te atiende alguien del equipo.")]]);
    await agente.escribir("El perfume me llegó roto");
    const llamadasAlModelo = agente.modelo.recibidos.length;
    expect(await agente.escribir("¿hola?")).toEqual({ tipo: "en_manos_humanas" });
    expect(agente.modelo.recibidos).toHaveLength(llamadasAlModelo);
  });

  it("no procesa dos veces el mismo mensaje reenviado por el canal", async () => {
    const agente = montarAgente([[texto("¡Hola! ¿En qué te ayudo?")]]);
    await agente.escribir("hola", "wamid-repetido");
    expect(await agente.escribir("hola", "wamid-repetido")).toEqual({ tipo: "duplicado" });
    expect(agente.modelo.recibidos).toHaveLength(1);
  });

  it("si el cliente pide una persona, escala sin consultar al modelo", async () => {
    const agente = montarAgente([]);
    const resultado = await agente.escribir("quiero hablar con un asesor por favor");
    expect(resultado).toMatchObject({ tipo: "respuesta", escalado: true });
    expect(agente.modelo.recibidos).toHaveLength(0);
    expect(agente.notificador.avisos[0]).toContain("pide_humano");
  });

  it("si una herramienta falla técnicamente, avisa y escala", async () => {
    const agente = montarAgente([[llamada("t1", "buscar_productos", { texto: "yara" })]]);
    agente.deps.catalogo.listarActivos = async () => {
      throw new Error("conexión rechazada");
    };
    const resultado = await agente.escribir("¿tienen Yara?");
    expect(resultado).toMatchObject({ tipo: "respuesta", escalado: true });
    expect(modoDe(agente)).toBe("humano");
  });

  it("si el modelo no responde, el cliente recibe un mensaje y pasa a humano", async () => {
    const agente = montarAgente([]);
    const resultado = await agente.escribir("hola");
    expect(resultado).toMatchObject({ tipo: "respuesta", escalado: true });
  });
});

describe("agente: historial", () => {
  it("reenvía el historial sin editarlo: cada turno extiende el anterior", async () => {
    const agente = montarAgente([
      [llamada("t1", "buscar_productos", { atributos: { familias: ["gourmand"] } })],
      [texto("Te recomiendo Khamrah o Yara.")],
      [texto("¡Con gusto!")],
    ]);
    await agente.escribir("busco algo dulce");
    await agente.escribir("gracias");
    const [, segundaLlamada, tercera] = agente.modelo.recibidos;
    expect(tercera.slice(0, segundaLlamada.length + 1)).toEqual([...segundaLlamada, { rol: "asistente", bloques: [texto("Te recomiendo Khamrah o Yara.")] }]);
    expect(tercera.at(-1)).toEqual({ rol: "cliente", texto: "gracias" });
  });

  it("tras un silencio largo empieza una sesión nueva", async () => {
    const agente = montarAgente([[texto("¡Hola!")], [texto("¡Hola de nuevo!")]]);
    await agente.escribir("hola");
    agente.avanzarReloj(13 * 60 * 60 * 1000);
    await agente.escribir("hola otra vez");
    expect(agente.modelo.recibidos[1]).toEqual([{ rol: "cliente", texto: "hola otra vez" }]);
  });
});
