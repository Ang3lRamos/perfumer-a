import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { negocio } from "@/config/negocio";
import { salir } from "./acciones";
import { NavPanel } from "./NavPanel";

export function MarcoPanel({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-linea">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <p className="flex items-baseline gap-3">
            <span className="font-display text-2xl leading-none tracking-tight">{negocio.nombreTienda}</span>
            <span className="font-mono text-micro uppercase tracking-wider text-tinta-suave">Panel</span>
          </p>
          <nav className="flex items-center gap-4 text-sm" aria-label="Panel">
            <Link href="/" className="py-2 text-tinta-suave hover:text-tinta">
              Ver tienda
            </Link>
            <form action={salir}>
              <button type="submit" className="presion rounded-etiqueta border border-tinta px-3 py-2 hover:bg-tinta hover:text-papel">
                Salir
              </button>
            </form>
          </nav>
        </div>
      </header>
      <Suspense fallback={<div className="h-[45px] border-b border-linea" />}>
        <NavPanel />
      </Suspense>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8">{children}</main>
    </>
  );
}
