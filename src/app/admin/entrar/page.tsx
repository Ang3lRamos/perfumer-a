import type { Metadata } from "next";
import { negocio } from "@/config/negocio";
import { FormularioEntrada } from "@/features/panel/FormularioEntrada";

export const metadata: Metadata = { title: "Entrar al panel", robots: { index: false, follow: false } };

export default function PaginaEntrar() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 py-10">
      <p className="font-display text-3xl tracking-tight">{negocio.nombreTienda}</p>
      <h1 className="mb-8 mt-1 text-sm text-tinta-suave">Entra al panel de administración</h1>
      <FormularioEntrada />
    </main>
  );
}
