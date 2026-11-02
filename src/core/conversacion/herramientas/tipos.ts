import type { z } from "zod";
import type { Dependencias } from "../puertos";
import type { Cliente, Conversacion } from "../tipos";

export interface Opcion {
  valor: string;
  etiqueta: string;
}

/** Lo que el agente necesita saber del negocio. Viene de config/negocio; el núcleo no lo conoce de antemano. */
export interface ConfigAgente {
  nombreTienda: string;
  nombreProducto: { singular: string; plural: string };
  ciudadesCobertura: string[];
  textoEnvio: string;
  atributosFiltrables: { clave: string; etiqueta: string; opciones: Opcion[] }[];
  persona: string;
}

export interface ContextoHerramienta {
  deps: Dependencias;
  config: ConfigAgente;
  conversacion: Conversacion;
  cliente: Cliente;
}

export type ResultadoHerramienta =
  | {
      ok: true;
      datos: unknown;
      /** Montos que la respuesta puede citar: la guarda de precios bloquea cualquier otro. */
      montos?: number[];
      /** La herramienta ya pasó la conversación a un humano: el agente debe despedirse y no seguir. */
      escalo?: boolean;
    }
  | { ok: false; error: string };

export interface Herramienta<E = unknown> {
  nombre: string;
  descripcion: string;
  esquema: z.ZodType<E>;
  ejecutar(entrada: E, contexto: ContextoHerramienta): Promise<ResultadoHerramienta>;
}
