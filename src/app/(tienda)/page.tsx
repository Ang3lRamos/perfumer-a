import { Suspense } from "react";
import { VistaCatalogo } from "@/features/catalogo/VistaCatalogo";

function EsqueletoCatalogo() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:ml-[17.5rem] xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] animate-pulse bg-vitrina" />
          <div className="mt-3 h-3 w-1/2 bg-vitrina" />
          <div className="mt-2 h-5 w-3/4 bg-vitrina" />
        </li>
      ))}
    </ul>
  );
}

export default function PaginaCatalogo({ searchParams }: PageProps<"/">) {
  return (
    <>
      <section className="py-10 sm:py-16">
        <h1 className="max-w-3xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
          Perfumería árabe original, <em className="text-ambar">a tu puerta.</em>
        </h1>
        <p className="mt-5 max-w-md text-tinta-suave">
          Elige tu fragancia, escríbenos por WhatsApp y paga cuando la tengas en la mano.
        </p>
      </section>
      <Suspense fallback={<EsqueletoCatalogo />}>
        <VistaCatalogo parametros={searchParams} />
      </Suspense>
    </>
  );
}
