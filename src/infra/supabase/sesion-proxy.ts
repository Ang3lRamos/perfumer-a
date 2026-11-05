import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envPublico } from "@/config/env";

/** Renueva el token vencido antes de renderizar. Solo eso: quién puede ver qué se decide junto a los datos. */
export async function renovarSesion(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const cliente = createServerClient(envPublico.NEXT_PUBLIC_SUPABASE_URL, envPublico.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => peticion.cookies.getAll(),
      setAll(lista, encabezados) {
        lista.forEach(({ name, value }) => peticion.cookies.set(name, value));
        respuesta = NextResponse.next({ request: peticion });
        lista.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
        Object.entries(encabezados).forEach(([clave, valor]) => respuesta.headers.set(clave, valor));
      },
    },
  });

  await cliente.auth.getUser();
  return respuesta;
}
