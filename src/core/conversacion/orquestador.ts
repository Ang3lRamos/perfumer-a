import { ejecutarLlamadas, type PasoTraza } from "./ejecutar-herramientas";
import { montosSinRespaldo, pideHumanoExplicitamente } from "./guardas";
import { definiciones } from "./herramientas";
import { pasarAHumano, type MotivoEscalamiento } from "./herramientas/escalar";
import type { ConfigAgente, ContextoHerramienta, Herramienta } from "./herramientas/tipos";
import { promptSistema } from "./prompt";
import type { Dependencias } from "./puertos";
import { mensajesRecientesDelCliente, montosRespaldados, sesionActual, turnosDe } from "./sesion";
import type { MensajeGuardado, Turno } from "./tipos";

export interface LimitesAgente {
  inactividadSesionMs: number;
  mensajesMaximosPorSesion: number;
  mensajesPorMinuto: number;
  iteracionesPorTurno: number;
}

export const LIMITES_POR_DEFECTO: LimitesAgente = {
  inactividadSesionMs: 12 * 60 * 60 * 1000,
  mensajesMaximosPorSesion: 60,
  mensajesPorMinuto: 8,
  iteracionesPorTurno: 6,
};

const VENTANA_HISTORIAL_MS = 7 * 24 * 60 * 60 * 1000;
const RESPUESTA_AL_ESCALAR = "Dame un momento, ya te atiende alguien del equipo por este mismo chat.";

export interface MensajeEntrante {
  canal: string;
  telefono: string;
  canalMensajeId: string;
  texto: string;
}

export type ResultadoTurno =
  | { tipo: "duplicado" }
  | { tipo: "en_manos_humanas" }
  | { tipo: "limite_de_mensajes" }
  | { tipo: "respuesta"; texto: string; escalado: boolean; traza: PasoTraza[] };

interface Agente {
  deps: Dependencias;
  config: ConfigAgente;
  herramientas: Herramienta[];
  limites: LimitesAgente;
}

interface ResultadoBucle {
  texto: string;
  turnos: Turno[];
  montos: number[];
  traza: PasoTraza[];
  escalar: { motivo: MotivoEscalamiento; detalle: string } | null;
  yaEscalado: boolean;
}

const notaMontos = (montos: number[]) =>
  `Tu respuesta anterior citaba montos que no devolvió ninguna herramienta (${montos.join(", ")}). ` +
  "Escríbela de nuevo sin esos montos, o consúltalos primero con una herramienta.";

/** Bucle de tool use con las reglas duras aplicadas entre cada paso. No toca la base: devuelve qué guardar. */
async function bucleAgente(agente: Agente, contexto: ContextoHerramienta, historial: Turno[], montosPrevios: number[]): Promise<ResultadoBucle> {
  const { deps, config, herramientas, limites } = agente;
  const nuevos: Turno[] = [];
  const montos = [...montosPrevios];
  const traza: PasoTraza[] = [];
  let yaEscalado = false;
  let reintentoMontos = false;

  for (let iteracion = 0; iteracion < limites.iteracionesPorTurno; iteracion++) {
    const respuesta = await deps.llm.generar({
      sistema: promptSistema(config),
      turnos: [...historial, ...nuevos],
      herramientas: definiciones(herramientas),
    });
    const fin = { turnos: nuevos, montos: montos.slice(montosPrevios.length), traza, yaEscalado };

    if (respuesta.motivo === "rechazo") return { ...fin, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "duda_del_agente", detalle: "el modelo declinó responder" } };

    if (respuesta.llamadas.length) {
      const lote = await ejecutarLlamadas(respuesta.llamadas, herramientas, contexto);
      nuevos.push({ rol: "asistente", bloques: respuesta.bloques }, { rol: "resultados", resultados: lote.resultados });
      montos.push(...lote.montos);
      traza.push(...lote.traza);
      yaEscalado ||= lote.escalo;
      if (lote.fallaTecnica) {
        return { ...fin, montos: montos.slice(montosPrevios.length), yaEscalado, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "error_tecnico", detalle: "falló una herramienta" } };
      }
      continue;
    }

    const sinRespaldo = montosSinRespaldo(respuesta.texto, montos);
    if (sinRespaldo.length && !reintentoMontos) {
      // La respuesta inválida no se guarda; se agrega una nota de sistema tras el último turno del usuario/herramientas.
      reintentoMontos = true;
      await deps.eventos.registrar({ tipo: "guarda_bloqueo", conversacionId: contexto.conversacion.id, datos: { montos: sinRespaldo, reintento: true } });
      nuevos.push({ rol: "sistema", texto: notaMontos(sinRespaldo) });
      continue;
    }
    if (sinRespaldo.length) {
      await deps.eventos.registrar({ tipo: "guarda_bloqueo", conversacionId: contexto.conversacion.id, datos: { montos: sinRespaldo, reintento: false } });
      return { ...fin, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "duda_del_agente", detalle: "insistió en un monto sin respaldo" } };
    }

    nuevos.push({ rol: "asistente", bloques: respuesta.bloques });
    return { ...fin, texto: respuesta.texto, escalar: null };
  }

  return { turnos: nuevos, montos: montos.slice(montosPrevios.length), traza, yaEscalado, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "error_tecnico", detalle: "demasiadas iteraciones" } };
}

export function crearAgente(deps: Dependencias, config: ConfigAgente, herramientas: Herramienta[], limites = LIMITES_POR_DEFECTO) {
  const agente: Agente = { deps, config, herramientas, limites };

  return async function atender(entrante: MensajeEntrante): Promise<ResultadoTurno> {
    const recibidoEn = deps.ahora();
    const cliente = await deps.conversaciones.clientePorTelefono(entrante.telefono);
    const conversacion = await deps.conversaciones.conversacion(cliente.id, entrante.canal);

    const nuevo = await deps.conversaciones.registrarEntrante(conversacion.id, entrante.canalMensajeId, entrante.texto, recibidoEn);
    if (!nuevo) {
      await deps.eventos.registrar({ tipo: "mensaje_duplicado", conversacionId: conversacion.id });
      return { tipo: "duplicado" };
    }
    await deps.eventos.registrar({ tipo: "mensaje_recibido", conversacionId: conversacion.id });

    // Regla dura: en modo humano el agente no responde, ni siquiera se le consulta al modelo.
    if (conversacion.modo === "humano") return { tipo: "en_manos_humanas" };

    const recientes = await deps.conversaciones.mensajesDesde(conversacion.id, new Date(recibidoEn.getTime() - VENTANA_HISTORIAL_MS));
    const sesion = sesionActual(recientes, limites.inactividadSesionMs);
    if (mensajesRecientesDelCliente(sesion, new Date(recibidoEn.getTime() - 60_000)) > limites.mensajesPorMinuto) {
      await deps.eventos.registrar({ tipo: "limite_mensajes", conversacionId: conversacion.id });
      return { tipo: "limite_de_mensajes" };
    }

    const contexto: ContextoHerramienta = { deps, config, conversacion, cliente };
    const resultado = await resolverTurno(agente, contexto, entrante.texto, sesion);

    if (resultado.escalar && !resultado.yaEscalado) await pasarAHumano(deps, conversacion.id, resultado.escalar.motivo, resultado.escalar.detalle);
    const turnos: Turno[] = resultado.escalar ? [...resultado.turnos, { rol: "asistente_texto", texto: resultado.texto }] : resultado.turnos;
    const enviadoEn = deps.ahora();
    await deps.conversaciones.registrarSaliente(conversacion.id, { autor: "agente", texto: resultado.texto, turnos, montos: resultado.montos }, enviadoEn);
    await deps.eventos.registrar({ tipo: "respuesta_enviada", conversacionId: conversacion.id, datos: { ms: enviadoEn.getTime() - recibidoEn.getTime() } });

    return { tipo: "respuesta", texto: resultado.texto, escalado: Boolean(resultado.escalar) || resultado.yaEscalado, traza: resultado.traza };
  };
}

async function resolverTurno(agente: Agente, contexto: ContextoHerramienta, texto: string, sesion: MensajeGuardado[]): Promise<ResultadoBucle> {
  const vacio = { turnos: [], montos: [], traza: [], yaEscalado: false };
  if (pideHumanoExplicitamente(texto)) return { ...vacio, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "pide_humano", detalle: "lo pidió explícitamente" } };
  // El mensaje actual ya está guardado en la sesión, así que los turnos lo incluyen.
  if (sesion.length > agente.limites.mensajesMaximosPorSesion) {
    return { ...vacio, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "duda_del_agente", detalle: "conversación muy larga" } };
  }
  try {
    return await bucleAgente(agente, contexto, turnosDe(sesion), montosRespaldados(sesion));
  } catch (error) {
    // Modelo caído o error inesperado: el cliente no se queda sin respuesta y el caso pasa a una persona.
    const detalle = error instanceof Error ? error.message.slice(0, 200) : "error desconocido";
    return { ...vacio, texto: RESPUESTA_AL_ESCALAR, escalar: { motivo: "error_tecnico", detalle } };
  }
}
