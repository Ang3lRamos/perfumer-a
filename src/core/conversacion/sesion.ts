import type { MensajeGuardado, Turno } from "./tipos";

/**
 * La sesión es lo que va desde el último silencio largo. Se corta solo por inactividad y nunca se recorta
 * por el principio: el historial que ve el modelo crece sin editarse (append-only).
 */
export function sesionActual(mensajes: MensajeGuardado[], inactividadMs: number): MensajeGuardado[] {
  const ordenados = [...mensajes].sort((a, b) => a.creadoAt.getTime() - b.creadoAt.getTime());
  let inicio = 0;
  for (let i = 1; i < ordenados.length; i++) {
    if (ordenados[i].creadoAt.getTime() - ordenados[i - 1].creadoAt.getTime() > inactividadMs) inicio = i;
  }
  return ordenados.slice(inicio);
}

export function turnosDe(mensajes: MensajeGuardado[]): Turno[] {
  return mensajes.flatMap((m): Turno[] => (m.autor === "cliente" ? [{ rol: "cliente", texto: m.texto ?? "" }] : m.turnos));
}

export function montosRespaldados(mensajes: MensajeGuardado[]): number[] {
  return mensajes.flatMap((m) => m.montos ?? []);
}

export function mensajesRecientesDelCliente(mensajes: MensajeGuardado[], desde: Date): number {
  return mensajes.filter((m) => m.autor === "cliente" && m.creadoAt >= desde).length;
}
