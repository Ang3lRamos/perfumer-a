"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { crearClienteConSesion } from "@/infra/supabase/sesion";
import { esAdmin, RUTA_ENTRAR } from "./autorizacion";

const credenciales = z.object({ correo: z.email(), clave: z.string().min(1) });

export type EstadoEntrada = { error: string } | null;

const CREDENCIALES_INVALIDAS = "Correo o contraseña incorrectos.";

export async function entrar(_previo: EstadoEntrada, formulario: FormData): Promise<EstadoEntrada> {
  const datos = credenciales.safeParse({ correo: formulario.get("correo"), clave: formulario.get("clave") });
  if (!datos.success) return { error: CREDENCIALES_INVALIDAS };

  const cliente = await crearClienteConSesion();
  const {
    data: { user },
    error,
  } = await cliente.auth.signInWithPassword({ email: datos.data.correo, password: datos.data.clave });
  if (error) {
    // Solo un rechazo de credenciales se atribuye a la clave; lo demás (red, límite de intentos) no debe confundirse.
    return { error: error.status === 400 ? CREDENCIALES_INVALIDAS : "No pudimos iniciar sesión. Intenta de nuevo en un momento." };
  }
  if (!esAdmin(user)) {
    await cliente.auth.signOut();
    return { error: "Esta cuenta no tiene acceso al panel." };
  }
  redirect("/admin");
}

export async function salir() {
  const cliente = await crearClienteConSesion();
  await cliente.auth.signOut();
  redirect(RUTA_ENTRAR);
}
