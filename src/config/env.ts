import { z } from "zod";

// Next solo inyecta NEXT_PUBLIC_* en el cliente si se leen de forma literal, por eso no se itera process.env.
const esquemaPublico = z.object({
  NEXT_PUBLIC_SITIO_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_"),
  NEXT_PUBLIC_WHATSAPP_NUMERO: z.string().regex(/^\d{10,15}$/, "Número en formato internacional sin +, ej. 573001234567"),
});

export const envPublico = esquemaPublico.parse({
  NEXT_PUBLIC_SITIO_URL: process.env.NEXT_PUBLIC_SITIO_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_WHATSAPP_NUMERO: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO,
});
