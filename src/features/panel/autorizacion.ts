import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { crearClienteConSesion } from "@/infra/supabase/sesion";

export const RUTA_ENTRAR = "/admin/entrar";

// Misma regla que es_admin() en la base. app_metadata solo se edita con la secret key: el usuario no puede dársela.
export const esAdmin = (usuario: User | null) => usuario?.app_metadata?.rol === "admin";

/** getUser valida el token contra Supabase; una cookie alterada no pasa. Devuelve el cliente ya autorizado. */
export async function exigirAdmin() {
  const cliente = await crearClienteConSesion();
  const {
    data: { user },
  } = await cliente.auth.getUser();
  if (!esAdmin(user)) redirect(RUTA_ENTRAR);
  return cliente;
}
