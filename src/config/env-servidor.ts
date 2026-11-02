import "server-only";
import { z } from "zod";

// La API key de Anthropic no se valida aquí: el SDK la toma de ANTHROPIC_API_KEY o de un perfil de `ant auth login`.
const esquema = z.object({
  ANTHROPIC_MODEL: z.string().default("claude-opus-5-5"),
  ANTHROPIC_EFFORT: z.enum(["low", "medium", "high", "xhigh", "max"]).default("low"),
});

export const envServidor = esquema.parse({
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || undefined,
  ANTHROPIC_EFFORT: process.env.ANTHROPIC_EFFORT || undefined,
});
