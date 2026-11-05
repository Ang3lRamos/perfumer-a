import type { EstadoPedido } from "./estados";

export interface DatosEnvio {
  nombre: string;
  telefono: string;
  direccion: string;
  barrio: string;
  ciudad: string;
}

export interface ItemSolicitado {
  codigo: string;
  tamanoMl: number;
  cantidad: number;
}

export interface ComboSolicitado {
  codigo: string;
  cantidad: number;
}

export interface ItemPedido {
  varianteId: string;
  codigo: string;
  descripcion: string;
  tamanoMl: number;
  cantidad: number;
  precioUnitarioCop: number;
  /** Código del combo del que viene esta unidad; su precio es la parte que le toca del combo. */
  comboCodigo?: string;
}

export interface Pedido {
  id: string;
  numero: number;
  clienteId: string;
  conversacionId: string | null;
  estado: EstadoPedido;
  envio: DatosEnvio;
  items: ItemPedido[];
  totalCop: number;
  notas: string | null;
  creadoAt: Date;
}

export type NuevoPedido = Omit<Pedido, "id" | "numero" | "estado" | "creadoAt">;

export interface PedidosRepositorio {
  crear(pedido: NuevoPedido): Promise<Pedido>;
  /** Solo pedidos del cliente indicado: un cliente nunca puede consultar pedidos ajenos. */
  obtenerDelCliente(numero: number, clienteId: string): Promise<Pedido | null>;
}
