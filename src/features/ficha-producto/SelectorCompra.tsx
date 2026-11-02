"use client";

import { useState } from "react";
import { formatearCop } from "@/core/catalogo/precio";
import { mensajeDeInteres } from "@/core/catalogo/referencia";
import type { Producto } from "@/core/catalogo/tipos";

export function SelectorCompra({ producto, whatsapp }: { producto: Producto; whatsapp: string }) {
  const disponibles = producto.variantes.filter((v) => v.disponible);
  const [elegidaId, setElegidaId] = useState(disponibles[0]?.id);
  const elegida = disponibles.find((v) => v.id === elegidaId);

  if (!elegida) {
    return (
      <div className="border border-linea p-4">
        <p className="font-medium">Agotado por ahora</p>
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, ¿cuándo vuelve el ${producto.marca} ${producto.nombre}? (ref. ${producto.codigo})`)}`}
          className="mt-2 inline-block text-sm underline underline-offset-4 hover:text-ambar"
        >
          Pregúntanos cuándo llega
        </a>
      </div>
    );
  }

  const enlace = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeDeInteres(producto, elegida))}`;

  return (
    <div className="space-y-5">
      {disponibles.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-xs uppercase tracking-[0.14em] text-tinta-suave">Tamaño</legend>
          <div className="flex gap-2">
            {disponibles.map((variante) => (
              <button
                key={variante.id}
                type="button"
                aria-pressed={variante.id === elegidaId}
                onClick={() => setElegidaId(variante.id)}
                className="rounded-etiqueta border border-linea px-4 py-2 font-mono text-sm transition-colors duration-[var(--dur-fast)] hover:border-tinta aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-papel"
              >
                {variante.tamanoMl} ml
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <p className="text-3xl font-medium tabular-nums">{formatearCop(elegida.precioCop as number)}</p>
      <a
        href={enlace}
        target="_blank"
        rel="noopener"
        className="flex w-full items-center justify-center gap-2 rounded-etiqueta bg-ambar px-6 py-4 font-medium text-sobre-ambar transition-colors duration-[var(--dur-fast)] hover:bg-ambar-hover sm:w-auto"
      >
        Comprar o preguntar por WhatsApp
      </a>
      <p className="text-sm text-tinta-suave">
        Te confirmamos disponibilidad y entrega por chat. Pagas cuando lo recibes.
      </p>
    </div>
  );
}
