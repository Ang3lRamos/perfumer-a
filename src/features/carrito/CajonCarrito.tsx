"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CANTIDAD_MAXIMA, mensajePedido, totalCop, totalUnidades, type LineaCarrito } from "@/core/carrito/carrito";
import { formatearCop } from "@/core/catalogo/precio";
import { accionesCarrito, useCarrito } from "./almacen";
import { useEstadoCajon } from "./estado-cajon";

function Linea({ linea }: { linea: LineaCarrito }) {
  return (
    <li className="grid grid-cols-[4.5rem_1fr_auto] gap-3 py-4">
      <div className="relative aspect-square bg-vitrina">
        {linea.imagen && (
          <Image src={linea.imagen} alt="" fill sizes="72px" className="object-contain p-1.5 mix-blend-multiply" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.14em] text-tinta-suave">{linea.marca}</p>
        <Link href={`/p/${linea.slug}`} className="block truncate font-display text-lg leading-tight hover:underline">
          {linea.nombre}
        </Link>
        <p className="font-mono text-[11px] text-tinta-suave">
          {linea.codigo} · {linea.tamanoMl} ml
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center border border-linea">
            <button
              type="button"
              aria-label="Quitar una unidad"
              disabled={linea.cantidad <= 1}
              onClick={() => accionesCarrito.cambiarCantidad(linea.varianteId, linea.cantidad - 1)}
              className="h-8 w-8 disabled:opacity-30"
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-sm tabular-nums" aria-label="Cantidad">
              {linea.cantidad}
            </span>
            <button
              type="button"
              aria-label="Agregar una unidad"
              disabled={linea.cantidad >= CANTIDAD_MAXIMA}
              onClick={() => accionesCarrito.cambiarCantidad(linea.varianteId, linea.cantidad + 1)}
              className="h-8 w-8 disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => accionesCarrito.quitar(linea.varianteId)}
            className="text-xs text-tinta-suave underline underline-offset-4 hover:text-tinta"
          >
            Quitar
          </button>
        </div>
      </div>
      <p className="text-sm font-medium tabular-nums">{formatearCop(linea.precioCop * linea.cantidad)}</p>
    </li>
  );
}

export function CajonCarrito({ whatsapp, ciudades, envio }: { whatsapp: string; ciudades: string; envio: string }) {
  const lineas = useCarrito();
  const { abierto, cerrar } = useEstadoCajon();
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (abierto && !elemento.open) elemento.showModal();
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);

  const enlace = `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajePedido(lineas))}`;

  return (
    <dialog
      ref={dialogo}
      aria-label="Carrito"
      onClose={cerrar}
      onClick={(evento) => evento.target === dialogo.current && cerrar()}
      className="ml-auto mr-0 h-dvh max-h-none w-full max-w-md bg-superficie p-0 text-tinta backdrop:bg-tinta/40 open:animate-[deslizar_var(--dur-slow)_var(--ease-out)]"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-linea px-5 py-4">
          <h2 className="font-display text-3xl">
            Tu pedido <span className="font-mono text-sm text-tinta-suave">({totalUnidades(lineas)})</span>
          </h2>
          <button type="button" onClick={cerrar} aria-label="Cerrar carrito" className="text-2xl leading-none">
            ×
          </button>
        </header>

        {lineas.length ? (
          <ul className="flex-1 divide-y divide-linea overflow-y-auto px-5">
            {lineas.map((linea) => (
              <Linea key={linea.varianteId} linea={linea} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="font-display text-2xl">Aún no has elegido nada.</p>
            <button type="button" onClick={cerrar} className="text-sm underline underline-offset-4">
              Seguir viendo perfumes
            </button>
          </div>
        )}

        {lineas.length > 0 && (
          <footer className="space-y-3 border-t border-linea px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-tinta-suave">Total sin envío</span>
              <span className="text-2xl font-medium tabular-nums">{formatearCop(totalCop(lineas))}</span>
            </div>
            <a
              href={enlace}
              target="_blank"
              rel="noopener"
              className="flex w-full items-center justify-center rounded-etiqueta bg-acento px-6 py-4 font-medium text-sobre-acento transition-colors duration-[var(--dur-fast)] hover:bg-acento-hover"
            >
              Enviar pedido por WhatsApp
            </a>
            <p className="text-center text-xs text-tinta-suave">
              Pagas al recibir en {ciudades}. {envio}
            </p>
          </footer>
        )}
      </div>
    </dialog>
  );
}
