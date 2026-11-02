import type { CatalogoRepositorio } from "../catalogo/puertos";
import type { Producto } from "../catalogo/tipos";
import type { PedidosRepositorio } from "../pedidos/tipos";
import type {
  Cliente,
  Conversacion,
  DefinicionHerramienta,
  Evento,
  MensajeGuardado,
  RespuestaModelo,
  Turno,
} from "./tipos";

export interface Llm {
  generar(peticion: { sistema: string; turnos: Turno[]; herramientas: DefinicionHerramienta[] }): Promise<RespuestaModelo>;
}

export interface ConversacionesRepositorio {
  clientePorTelefono(telefono: string): Promise<Cliente>;
  actualizarCliente(id: string, datos: Partial<Omit<Cliente, "id" | "telefono">>): Promise<void>;
  conversacion(clienteId: string, canal: string): Promise<Conversacion>;
  /** Devuelve false si el canal ya había entregado ese mensaje (reintento): no se procesa dos veces. */
  registrarEntrante(conversacionId: string, canalMensajeId: string, texto: string, en: Date): Promise<boolean>;
  registrarSaliente(conversacionId: string, mensaje: Omit<MensajeGuardado, "creadoAt">, en: Date): Promise<void>;
  mensajesDesde(conversacionId: string, desde: Date): Promise<MensajeGuardado[]>;
  pasarAHumano(conversacionId: string, motivo: string, en: Date): Promise<void>;
}

export interface Notificador {
  escalamiento(datos: { conversacionId: string; motivo: string }): Promise<void>;
  pedidoNuevo(datos: { conversacionId: string; numero: number; totalCop: number }): Promise<void>;
}

export interface RegistroEventos {
  registrar(evento: Evento): Promise<void>;
}

export interface Dependencias {
  llm: Llm;
  catalogo: CatalogoRepositorio<Producto["atributos"]>;
  conversaciones: ConversacionesRepositorio;
  pedidos: PedidosRepositorio;
  notificador: Notificador;
  eventos: RegistroEventos;
  ahora: () => Date;
}
