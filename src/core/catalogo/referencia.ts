import type { Producto, Variante } from "./tipos";

// Contrato entre la tienda y el agente: el mensaje prellenado lleva "ref. XXX-000"
// para que el agente sepa desde el primer mensaje de qué producto viene hablando el cliente.
const PATRON_CODIGO = /\b([A-Z]{3}-\d{3})\b/gi;

export function mensajeDeInteres(producto: Producto, variante: Variante): string {
  return `Hola, me interesa el ${producto.marca} ${producto.nombre} de ${variante.tamanoMl} ml (ref. ${producto.codigo})`;
}

export function extraerCodigos(texto: string): string[] {
  return [...new Set([...texto.matchAll(PATRON_CODIGO)].map(([, codigo]) => codigo.toUpperCase()))];
}
