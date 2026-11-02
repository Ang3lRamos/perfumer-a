import type { ConversacionesRepositorio } from "@/core/conversacion/puertos";
import type { Cliente, Conversacion, MensajeGuardado } from "@/core/conversacion/tipos";

/** Implementación en memoria: tests y chat de desarrollo. La de Supabase cumple el mismo contrato. */
export function crearConversacionesEnMemoria(): ConversacionesRepositorio & {
  conversaciones: Map<string, Conversacion>;
  mensajes: Map<string, MensajeGuardado[]>;
} {
  const clientes = new Map<string, Cliente>();
  const conversaciones = new Map<string, Conversacion>();
  const mensajes = new Map<string, MensajeGuardado[]>();
  const idsCanal = new Set<string>();

  const agregar = (conversacionId: string, mensaje: MensajeGuardado) =>
    mensajes.set(conversacionId, [...(mensajes.get(conversacionId) ?? []), mensaje]);

  return {
    conversaciones,
    mensajes,
    async clientePorTelefono(telefono) {
      const existente = [...clientes.values()].find((c) => c.telefono === telefono);
      if (existente) return existente;
      const nuevo: Cliente = { id: crypto.randomUUID(), telefono, nombre: null, direccion: null, barrio: null, ciudad: null };
      clientes.set(nuevo.id, nuevo);
      return nuevo;
    },
    async actualizarCliente(id, datos) {
      const cliente = clientes.get(id);
      if (cliente) clientes.set(id, { ...cliente, ...datos });
    },
    async conversacion(clienteId, canal) {
      const existente = [...conversaciones.values()].find((c) => c.clienteId === clienteId && c.canal === canal);
      if (existente) return existente;
      const nueva: Conversacion = { id: crypto.randomUUID(), clienteId, canal, modo: "agente" };
      conversaciones.set(nueva.id, nueva);
      return nueva;
    },
    async registrarEntrante(conversacionId, canalMensajeId, texto, en) {
      if (idsCanal.has(canalMensajeId)) return false;
      idsCanal.add(canalMensajeId);
      agregar(conversacionId, { autor: "cliente", texto, turnos: [], creadoAt: en });
      return true;
    },
    async registrarSaliente(conversacionId, mensaje, en) {
      agregar(conversacionId, { ...mensaje, creadoAt: en });
    },
    async mensajesDesde(conversacionId, desde) {
      return (mensajes.get(conversacionId) ?? []).filter((m) => m.creadoAt >= desde);
    },
    async pasarAHumano(conversacionId) {
      const conversacion = conversaciones.get(conversacionId);
      if (conversacion) conversaciones.set(conversacionId, { ...conversacion, modo: "humano" });
    },
  };
}
