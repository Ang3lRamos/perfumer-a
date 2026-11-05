"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** Botón con panel flotante. Se cierra con Escape o al hacer clic fuera. */
export function Desplegable({ etiqueta, activo, children }: { etiqueta: ReactNode; activo: boolean; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alEscape = (evento: KeyboardEvent) => evento.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbierto((valor) => !valor)}
        data-activo={activo}
        className="presion flex items-center gap-1.5 rounded-etiqueta border border-linea px-3 py-2 text-sm hover:border-tinta aria-expanded:border-tinta data-[activo=true]:border-tinta data-[activo=true]:font-medium"
      >
        {etiqueta}
        <svg aria-hidden viewBox="0 0 10 6" className="h-1.5 w-2.5 transition-transform duration-[var(--dur-fast)] [[aria-expanded=true]>&]:rotate-180">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      <div
        id={idPanel}
        data-abierto={abierto}
        className="panel absolute left-0 top-full z-30 mt-1.5 max-h-[60vh] w-72 overflow-y-auto border border-tinta bg-superficie p-3"
      >
        {children}
      </div>
    </div>
  );
}
