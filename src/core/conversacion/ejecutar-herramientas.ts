import type { ContextoHerramienta, Herramienta } from "./herramientas/tipos";
import type { LlamadaHerramienta, ResultadoLlamada } from "./tipos";

export interface PasoTraza {
  herramienta: string;
  entrada: unknown;
  ok: boolean;
  resultado: unknown;
}

export interface ResultadoLote {
  resultados: ResultadoLlamada[];
  montos: number[];
  traza: PasoTraza[];
  escalo: boolean;
  /** Una herramienta lanzó una excepción (base caída, bug): el orquestador escala. */
  fallaTecnica: boolean;
}

async function ejecutarUna(
  llamada: LlamadaHerramienta,
  herramientas: Herramienta[],
  contexto: ContextoHerramienta,
): Promise<{ resultado: ResultadoLlamada; paso: PasoTraza; montos: number[]; escalo: boolean; fallaTecnica: boolean }> {
  const herramienta = herramientas.find((h) => h.nombre === llamada.nombre);
  const responder = (contenido: unknown, ok: boolean) => ({
    resultado: { idLlamada: llamada.id, contenido: JSON.stringify(contenido), esError: !ok },
    paso: { herramienta: llamada.nombre, entrada: llamada.entrada, ok, resultado: contenido },
  });

  if (!herramienta) return { ...responder({ error: "Herramienta desconocida" }, false), montos: [], escalo: false, fallaTecnica: false };

  // La entrada viene del modelo: se valida siempre antes de ejecutar.
  const entrada = herramienta.esquema.safeParse(llamada.entrada);
  if (!entrada.success) {
    const error = { error: "Entrada inválida", detalle: entrada.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
    return { ...responder(error, false), montos: [], escalo: false, fallaTecnica: false };
  }

  try {
    const salida = await herramienta.ejecutar(entrada.data, contexto);
    await contexto.deps.eventos.registrar({
      tipo: salida.ok ? "tool_llamada" : "tool_error",
      conversacionId: contexto.conversacion.id,
      datos: { herramienta: herramienta.nombre },
    });
    if (!salida.ok) return { ...responder({ error: salida.error }, false), montos: [], escalo: false, fallaTecnica: false };
    return { ...responder(salida.datos, true), montos: salida.montos ?? [], escalo: salida.escalo ?? false, fallaTecnica: false };
  } catch (error) {
    await contexto.deps.eventos.registrar({
      tipo: "tool_error",
      conversacionId: contexto.conversacion.id,
      datos: { herramienta: herramienta.nombre, tecnico: true },
    });
    // El detalle técnico no va al modelo (podría repetirlo al cliente); se deja en la traza para depurar.
    const falla = responder({ error: "Falla técnica consultando el sistema" }, false);
    falla.paso.resultado = { error: error instanceof Error ? error.message : String(error) };
    return { ...falla, montos: [], escalo: false, fallaTecnica: true };
  }
}

/** Ejecuta todas las llamadas de un turno; sus resultados vuelven juntos en un solo turno al modelo. */
export async function ejecutarLlamadas(
  llamadas: LlamadaHerramienta[],
  herramientas: Herramienta[],
  contexto: ContextoHerramienta,
): Promise<ResultadoLote> {
  const salidas = await Promise.all(llamadas.map((llamada) => ejecutarUna(llamada, herramientas, contexto)));
  return {
    resultados: salidas.map((s) => s.resultado),
    montos: salidas.flatMap((s) => s.montos),
    traza: salidas.map((s) => s.paso),
    escalo: salidas.some((s) => s.escalo),
    fallaTecnica: salidas.some((s) => s.fallaTecnica),
  };
}
