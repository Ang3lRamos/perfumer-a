import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Llm } from "@/core/conversacion/puertos";
import type { MotivoParada, Turno } from "@/core/conversacion/tipos";

type Esfuerzo = "low" | "medium" | "high" | "xhigh" | "max";

// Respuestas de chat cortas; el razonamiento adaptativo también consume de este tope.
const MAX_TOKENS = 8000;

function aMensaje(turno: Turno): Anthropic.Beta.BetaMessageParam {
  switch (turno.rol) {
    case "cliente":
      return { role: "user", content: turno.texto };
    case "asistente":
      // Bloques tal cual los devolvió la API (razonamiento firmado incluido): se reenvían sin tocar.
      return { role: "assistant", content: turno.bloques as Anthropic.Beta.BetaContentBlockParam[] };
    case "asistente_texto":
      return { role: "assistant", content: [{ type: "text", text: turno.texto }] };
    case "resultados":
      return {
        role: "user",
        content: turno.resultados.map((r) => ({
          type: "tool_result" as const,
          tool_use_id: r.idLlamada,
          content: r.contenido,
          is_error: r.esError,
        })),
      };
    case "sistema":
      return { role: "system", content: turno.texto };
  }
}

const MOTIVOS: Record<string, MotivoParada> = {
  end_turn: "fin",
  tool_use: "herramientas",
  refusal: "rechazo",
  max_tokens: "limite",
};

export function crearLlmAnthropic(opciones: { modelo: string; esfuerzo: Esfuerzo }): Llm {
  const cliente = new Anthropic();

  return {
    async generar({ sistema, turnos, herramientas }) {
      const respuesta = await cliente.beta.messages.create({
        model: opciones.modelo,
        max_tokens: MAX_TOKENS,
        // Si el modelo declina por política, la API reintenta en el modelo de respaldo por defecto.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: opciones.esfuerzo },
        // Prompt y herramientas son estables: se cachean y solo se paga completo el primer mensaje.
        system: [{ type: "text", text: sistema, cache_control: { type: "ephemeral" } }],
        tools: herramientas.map((h) => ({
          name: h.nombre,
          description: h.descripcion,
          input_schema: h.esquemaEntrada as Anthropic.Beta.BetaTool.InputSchema,
        })),
        messages: turnos.map(aMensaje),
      });

      const texto = respuesta.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      const llamadas = respuesta.content
        .filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use")
        .map((b) => ({ id: b.id, nombre: b.name, entrada: b.input }));

      return {
        bloques: respuesta.content,
        texto,
        llamadas,
        motivo: llamadas.length ? "herramientas" : (MOTIVOS[respuesta.stop_reason ?? ""] ?? "otro"),
      };
    },
  };
}
