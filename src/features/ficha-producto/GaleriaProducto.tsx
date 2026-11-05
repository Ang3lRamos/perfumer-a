"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/** Carrusel deslizable con el dedo (scroll-snap nativo) y miniaturas para saltar a cada foto. */
export function GaleriaProducto({ imagenes, alt }: { imagenes: string[]; alt: string }) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);

  function irA(indice: number) {
    const elemento = pista.current;
    if (!elemento) return;
    const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
    elemento.scrollTo({ left: indice * elemento.clientWidth, behavior: sinMovimiento ? "auto" : "smooth" });
  }

  function alDesplazar() {
    const elemento = pista.current;
    if (elemento) setActual(Math.round(elemento.scrollLeft / elemento.clientWidth));
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={pista}
          onScroll={alDesplazar}
          className="flex snap-x snap-mandatory overflow-x-auto bg-vitrina [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="carrusel"
        >
          {imagenes.map((src, i) => (
            <div key={src} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={src}
                alt={`${alt}, foto ${i + 1} de ${imagenes.length}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-4 mix-blend-multiply"
              />
            </div>
          ))}
        </div>
        {imagenes.length > 1 && (
          <span className="absolute bottom-3 right-3 bg-superficie px-2 py-0.5 font-mono text-xs" aria-live="polite">
            {actual + 1} / {imagenes.length}
          </span>
        )}
      </div>
      {imagenes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {imagenes.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === actual}
              className="presion relative aspect-square w-16 shrink-0 border border-transparent bg-vitrina hover:border-linea aria-[current=true]:border-tinta"
            >
              <Image src={src} alt="" fill sizes="64px" className="object-contain p-1 mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
