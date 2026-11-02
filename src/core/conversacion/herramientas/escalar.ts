import { z } from "zod";
import type { Dependencias } from "../puertos";
import type { Herramienta } from "./tipos";

export const MOTIVOS_ESCALAMIENTO = [
  "pide_humano",
  "reclamo",
  "negociar_precio",
  "fuera_de_catalogo",
  "fuera_de_cobertura",
  "duda_del_agente",
  "error_tecnico",
] as const;

export type MotivoEscalamiento = (typeof MOTIVOS_ESCALAMIENTO)[number];

/** Punto único para pasar a humano: lo usan la herramienta y las guardas del orquestador. */
export async function pasarAHumano(deps: Dependencias, conversacionId: string, motivo: MotivoEscalamiento, detalle?: string) {
  const texto = detalle ? `${motivo}: ${detalle}` : motivo;
  await deps.conversaciones.pasarAHumano(conversacionId, texto, deps.ahora());
  await deps.eventos.registrar({ tipo: "escalado", conversacionId, datos: { motivo } });
  await deps.notificador.escalamiento({ conversacionId, motivo: texto });
}

export function escalarAHumano() {
  const esquema = z.object({
    motivo: z.enum(MOTIVOS_ESCALAMIENTO),
    detalle: z.string().max(300).optional().describe("Resumen breve para quien atienda, sin datos personales"),
  });
  return {
    nombre: "escalar_a_humano",
    descripcion:
      "Pasa la conversación a una persona del equipo. Úsala si el cliente lo pide, hay un reclamo, quiere negociar " +
      "precio, pregunta algo que no está en el catálogo, está fuera de cobertura o no estás seguro de la respuesta.",
    esquema,
    async ejecutar({ motivo, detalle }, { deps, conversacion }) {
      await pasarAHumano(deps, conversacion.id, motivo, detalle);
      return { ok: true, datos: { escalado: true }, escalo: true };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}
