import type { NextRequest } from "next/server";
import { renovarSesion } from "@/infra/supabase/sesion-proxy";

export function proxy(peticion: NextRequest) {
  return renovarSesion(peticion);
}

// Solo el panel usa sesión: la tienda sigue sin pasar por aquí.
export const config = { matcher: "/admin/:path*" };
