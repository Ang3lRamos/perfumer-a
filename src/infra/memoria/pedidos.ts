import type { Pedido, PedidosRepositorio } from "@/core/pedidos/tipos";

const PRIMER_NUMERO = 1001;

export function crearPedidosEnMemoria(): PedidosRepositorio & { pedidos: Pedido[] } {
  const pedidos: Pedido[] = [];
  return {
    pedidos,
    async crear(nuevo) {
      const pedido: Pedido = {
        ...nuevo,
        id: crypto.randomUUID(),
        numero: PRIMER_NUMERO + pedidos.length,
        estado: "pendiente_confirmacion",
        creadoAt: new Date(),
      };
      pedidos.push(pedido);
      return pedido;
    },
    async obtenerDelCliente(numero, clienteId) {
      return pedidos.find((p) => p.numero === numero && p.clienteId === clienteId) ?? null;
    },
  };
}
