import { z } from "zod";
import type { DefinicionHerramienta } from "../tipos";
import { buscarProductos, obtenerProducto, recomendar, verCombos } from "./catalogo";
import { escalarAHumano } from "./escalar";
import { consultarEstadoPedido, crearPedido } from "./pedidos";
import type { ConfigAgente, Herramienta } from "./tipos";

export function crearHerramientas(config: ConfigAgente): Herramienta[] {
  return [
    buscarProductos(config),
    obtenerProducto(config),
    recomendar(config),
    verCombos(),
    crearPedido(config),
    consultarEstadoPedido(),
    escalarAHumano(),
  ] as Herramienta[];
}

export function definiciones(herramientas: Herramienta[]): DefinicionHerramienta[] {
  return herramientas.map((h) => ({
    nombre: h.nombre,
    descripcion: h.descripcion,
    esquemaEntrada: z.toJSONSchema(h.esquema) as Record<string, unknown>,
  }));
}
