import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { envPublico } from "@/config/env";

/** Cliente con la sesión del usuario en cookies: las consultas pasan por RLS con su identidad. */
export async function crearClienteConSesion() {
  const almacen = await cookies();
  return createServerClient(envPublico.NEXT_PUBLIC_SUPABASE_URL, envPublico.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => almacen.set(name, value, options));
        } catch {
          // Un Server Component no puede escribir cookies; el proxy ya renovó la sesión antes de renderizar.
        }
      },
    },
  });
}
