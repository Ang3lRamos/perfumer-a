import Link from "next/link";
import { MarcoTienda } from "@/features/tienda/Marco";

export default function NoEncontrado() {
  return (
    <MarcoTienda>
      <section className="py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-tinta-suave">404</p>
        <h1 className="mt-3 font-display text-5xl">Esta fragancia no está en la vitrina.</h1>
        <p className="mt-4 text-tinta-suave">Puede que ya no la tengamos o que el enlace esté incompleto.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-etiqueta bg-tinta px-6 py-3 text-sm font-medium text-papel hover:bg-acento"
        >
          Ver el catálogo
        </Link>
      </section>
    </MarcoTienda>
  );
}
