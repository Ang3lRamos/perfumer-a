import type { ConfigAgente } from "@/core/conversacion/herramientas/tipos";
import { negocio } from "./negocio";

export const configAgente: ConfigAgente = {
  nombreTienda: negocio.nombreTienda,
  nombreProducto: negocio.nombreProducto,
  ciudadesCobertura: negocio.cobertura.ciudadesContraentrega,
  textoEnvio: negocio.cobertura.envio,
  atributosFiltrables: negocio.filtros,
  persona: negocio.agente.persona,
};
