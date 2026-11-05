"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CANTIDAD_MAXIMA, mensajePedido, totalCop, totalUnidades, type LineaCarrito } from "@/core/carrito/carrito";
import { formatearCop } from "@/core/catalogo/precio";
import { useArrastreCierre } from "@/ui/useArrastreCierre";
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
        <p className="text-micro uppercase tracking-[0.14em] text-tinta-suave">{linea.marca}</p>
        {linea.slug ? (
          <Link href={`/p/${linea.slug}`} className="block truncate font-display text-lg leading-tight hover:underline">
            {linea.nombre}
          </Link>
        ) : (
          <p className="truncate font-display text-lg leading-tight">{linea.nombre}</p>
        )}
        <p className="font-mono text-micro text-tinta-suave">
          {linea.codigo}
          {linea.tamanoMl && ` · ${linea.tamanoMl} ml`}
        </p>
        {linea.detalle && <p className="mt-1 text-xs text-tinta-suave">{linea.detalle}</p>}
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center border border-linea">
            <button
              type="button"
              aria-label="Quitar una unidad"
              disabled={linea.cantidad <= 1}
              onClick={() => accionesCarrito.cambiarCantidad(linea.varianteId, linea.cantidad - 1)}
              className="presion h-10 w-10 disabled:opacity-30"
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
              className="presion h-10 w-10 disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => accionesCarrito.quitar(linea.varianteId)}
            className="presion py-2 text-xs text-tinta-suave underline underline-offset-4 hover:text-tinta"
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
  const arrastre = useArrastreCierre("x", cerrar);

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
      className="hoja hoja-lado ml-auto mr-0 h-dvh max-h-none w-full max-w-md bg-superficie p-0 text-tinta backdrop:bg-tinta/40"
    >
      <div className="flex h-full flex-col">
        <header
          {...arrastre}
          className="flex touch-none select-none items-center justify-between border-b border-linea py-2 pl-5 pr-2"
        >
          <h2 className="font-display text-3xl tracking-tight">
            Tu pedido <span className="font-mono text-sm tracking-normal text-tinta-suave">({totalUnidades(lineas)})</span>
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar carrito"
            className="presion flex h-11 w-11 items-center justify-center text-2xl leading-none"
          >
            ×
          </button>
        </header>

        {lineas.length ? (
          <ul className="flex-1 divide-y divide-linea overflow-y-auto overscroll-contain px-5">
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
              className="presion flex w-full items-center justify-center rounded-etiqueta bg-acento px-6 py-4 font-medium text-sobre-acento hover:bg-acento-hover"
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
