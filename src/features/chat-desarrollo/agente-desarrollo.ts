import "server-only";
import { configAgente } from "@/config/agente";
import { envServidor } from "@/config/env-servidor";
import { crearHerramientas } from "@/core/conversacion/herramientas";
import { crearAgente } from "@/core/conversacion/orquestador";
import { obtenerCatalogo } from "@/features/catalogo/datos";
import { crearLlmAnthropic } from "@/infra/anthropic/llm";
import { crearConversacionesEnMemoria } from "@/infra/memoria/conversaciones";
import { crearEventosEnMemoria, crearNotificadorEnMemoria } from "@/infra/memoria/eventos";
import { crearPedidosEnMemoria } from "@/infra/memoria/pedidos";

function montar() {
  const conversaciones = crearConversacionesEnMemoria();
  const pedidos = crearPedidosEnMemoria();
  const eventos = crearEventosEnMemoria();
  const notificador = crearNotificadorEnMemoria();
  const atender = crearAgente(
    {
      llm: crearLlmAnthropic({ modelo: envServidor.ANTHROPIC_MODEL, esfuerzo: envServidor.ANTHROPIC_EFFORT }),
      // Catálogo real (Supabase, público); conversaciones y pedidos en memoria hasta la fase 3.
      catalogo: {
        listarActivos: obtenerCatalogo,
        obtenerPorCodigo: async (codigo) => (await obtenerCatalogo()).find((p) => p.codigo === codigo.toUpperCase()) ?? null,
      },
      conversaciones,
      pedidos,
      eventos,
      notificador,
      ahora: () => new Date(),
    },
    configAgente,
    crearHerramientas(configAgente),
  );
  return { atender, conversaciones, pedidos, eventos, notificador };
}

// Sobrevive a las recargas en caliente de `next dev`, que reevalúan los módulos.
const global = globalThis as unknown as { agenteDesarrollo?: ReturnType<typeof montar> };

export function agenteDesarrollo() {
  return (global.agenteDesarrollo ??= montar());
}

export function reiniciarAgenteDesarrollo() {
  global.agenteDesarrollo = montar();
}
