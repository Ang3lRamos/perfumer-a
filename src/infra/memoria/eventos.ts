import type { Notificador, RegistroEventos } from "@/core/conversacion/puertos";
import type { Evento } from "@/core/conversacion/tipos";

export function crearEventosEnMemoria(): RegistroEventos & { eventos: Evento[] } {
  const eventos: Evento[] = [];
  return {
    eventos,
    async registrar(evento) {
      eventos.push(evento);
    },
  };
}

/** Notificaciones al dueño acumuladas en memoria; en desarrollo se muestran en el chat de pruebas. */
export function crearNotificadorEnMemoria(): Notificador & { avisos: string[] } {
  const avisos: string[] = [];
  return {
    avisos,
    async escalamiento({ motivo }) {
      avisos.push(`Escalada a humano: ${motivo}`);
    },
    async pedidoNuevo({ numero, totalCop }) {
      avisos.push(`Pedido nuevo #${numero} por ${totalCop}`);
    },
  };
}
