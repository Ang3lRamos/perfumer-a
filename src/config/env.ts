import { z } from "zod";

// Next solo inyecta NEXT_PUBLIC_* en el cliente si se leen de forma literal, por eso no se itera process.env.
const esquemaPublico = z.object({
  NEXT_PUBLIC_SITIO_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
  NEXT_PUBLIC_WHATSAPP_NUMERO: z.string().regex(/^\d{10,15}$/, "formato internacional sin +, ej. 573001234567"),
});

// En Vercel el dominio de producción ya viene como variable de sistema; solo hace falta definirlo en local.
const urlVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

const resultado = esquemaPublico.safeParse({
  NEXT_PUBLIC_SITIO_URL: process.env.NEXT_PUBLIC_SITIO_URL ?? (urlVercel && `https://${urlVercel}`),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_WHATSAPP_NUMERO: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO,
});

if (!resultado.success) {
  const problemas = resultado.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Variables de entorno inválidas o faltantes (ver .env.example):\n${problemas.join("\n")}`);
}

export const envPublico = resultado.data;
