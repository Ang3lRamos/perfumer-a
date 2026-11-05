"use client";

import { totalUnidades } from "@/core/carrito/carrito";
import { useCarrito } from "./almacen";
import { abrirCarrito } from "./estado-cajon";

export function BotonCarrito() {
  const unidades = totalUnidades(useCarrito());
  return (
    <button
      type="button"
      onClick={abrirCarrito}
      aria-label={`Abrir carrito, ${unidades} ${unidades === 1 ? "producto" : "productos"}`}
      className="presion relative flex items-center gap-2 rounded-etiqueta border border-tinta px-3 py-2 text-sm hover:bg-tinta hover:text-papel"
    >
      <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6h12l-1 11H5L4 6z" />
        <path d="M7.5 8V5a2.5 2.5 0 015 0v3" />
      </svg>
      <span className="font-mono tabular-nums">{unidades}</span>
    </button>
  );
}
