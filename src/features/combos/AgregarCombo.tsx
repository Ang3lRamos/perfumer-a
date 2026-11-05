"use client";

import { lineaDeCombo, type ComboResuelto } from "@/core/combos/combos";
import { accionesCarrito } from "@/features/carrito/almacen";
import { abrirCarrito } from "@/features/carrito/estado-cajon";

export function AgregarCombo({ combo }: { combo: ComboResuelto }) {
  return (
    <button
      type="button"
      onClick={() => {
        accionesCarrito.agregar(lineaDeCombo(combo));
        abrirCarrito();
      }}
      className="presion w-full rounded-etiqueta bg-acento px-6 py-3.5 font-medium text-sobre-acento hover:bg-acento-hover"
    >
      Agregar combo
    </button>
  );
}
