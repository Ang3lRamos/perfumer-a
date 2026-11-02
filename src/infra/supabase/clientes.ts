import { createClient } from "@supabase/supabase-js";
import { envPublico } from "@/config/env";

/** Cliente anónimo sin sesión: solo ve lo que RLS permite al público (catálogo activo). */
export function crearClientePublico() {
  return createClient(envPublico.NEXT_PUBLIC_SUPABASE_URL, envPublico.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
}
