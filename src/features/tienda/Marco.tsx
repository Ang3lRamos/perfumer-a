import Link from "next/link";
import type { ReactNode } from "react";
import { envPublico } from "@/config/env";
import { negocio } from "@/config/negocio";
import { BotonCarrito } from "@/features/carrito/BotonCarrito";
import { CajonCarrito } from "@/features/carrito/CajonCarrito";

function Encabezado() {
  return (
    <header className="border-b border-linea">
      <p className="bg-tinta px-4 py-1.5 text-center font-mono text-micro uppercase tracking-wider text-papel">
        Pagas al recibir · Contraentrega en {negocio.cobertura.ciudadesContraentrega.join(", ")}
      </p>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-3xl leading-none">
          {negocio.nombreTienda}
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden font-mono text-micro uppercase tracking-wider text-tinta-suave sm:inline">
            Perfumería original
          </span>
          <BotonCarrito />
        </div>
      </div>
    </header>
  );
}

function Pie() {
  return (
    <footer className="mt-24 border-t border-linea">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-tinta-suave sm:grid-cols-3">
        <p className="font-display text-2xl text-tinta">{negocio.nombreTienda}</p>
        <p>
          Todos los productos son originales de cada casa. Los precios y la disponibilidad se confirman por
          WhatsApp antes de despachar.
        </p>
        <p>
          Envíos con pago contraentrega en {negocio.cobertura.ciudadesContraentrega.join(", ")}.{" "}
          {negocio.cobertura.envio}
        </p>
      </div>
    </footer>
  );
}

export function MarcoTienda({ children }: { children: ReactNode }) {
  return (
    <>
      <Encabezado />
      <main className="mx-auto max-w-7xl px-4">{children}</main>
      <Pie />
      <CajonCarrito
        whatsapp={envPublico.NEXT_PUBLIC_WHATSAPP_NUMERO}
        ciudades={negocio.cobertura.ciudadesContraentrega.join(", ")}
        envio={negocio.cobertura.envio}
      />
    </>
  );
}
