/**
 * Turnos tal como se reenvían al modelo. Los bloques del asistente son opacos para el núcleo
 * (incluyen razonamiento firmado) y se guardan y reenvían sin tocarlos: editar el historial
 * invalida el razonamiento previo en los modelos actuales.
 */
export type Turno =
  | { rol: "cliente"; texto: string }
  | { rol: "asistente"; bloques: unknown[] }
  /** Texto que el sistema envió en nombre del agente (ej. al escalar): el modelo debe saber que se dijo. */
  | { rol: "asistente_texto"; texto: string }
  | { rol: "resultados"; resultados: ResultadoLlamada[] }
  | { rol: "sistema"; texto: string };

export interface LlamadaHerramienta {
  id: string;
  nombre: string;
  entrada: unknown;
}

export interface ResultadoLlamada {
  idLlamada: string;
  contenido: string;
  esError: boolean;
}

export type MotivoParada = "fin" | "herramientas" | "rechazo" | "limite" | "otro";

export interface RespuestaModelo {
  bloques: unknown[];
  texto: string;
  llamadas: LlamadaHerramienta[];
  motivo: MotivoParada;
}

export interface DefinicionHerramienta {
  nombre: string;
  descripcion: string;
  esquemaEntrada: Record<string, unknown>;
}

export type ModoConversacion = "agente" | "humano";

export interface Conversacion {
  id: string;
  clienteId: string;
  canal: string;
  modo: ModoConversacion;
}

export interface Cliente {
  id: string;
  telefono: string;
  nombre: string | null;
  direccion: string | null;
  barrio: string | null;
  ciudad: string | null;
}

/** Un mensaje guardado. Un turno del agente guarda todos sus turnos internos (herramientas incluidas). */
export interface MensajeGuardado {
  autor: "cliente" | "agente" | "humano";
  texto: string | null;
  turnos: Turno[];
  /** Montos que devolvieron las herramientas en este turno: lo único que el agente puede citar después. */
  montos?: number[];
  creadoAt: Date;
}

export type TipoEvento =
  | "mensaje_recibido"
  | "mensaje_duplicado"
  | "respuesta_enviada"
  | "tool_llamada"
  | "tool_error"
  | "guarda_bloqueo"
  | "escalado"
  | "pedido_creado"
  | "limite_mensajes";

/** Sin datos personales: solo ids y metadatos. */
export interface Evento {
  tipo: TipoEvento;
  conversacionId: string;
  pedidoId?: string;
  datos?: Record<string, unknown>;
}
