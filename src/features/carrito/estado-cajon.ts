"use client";

import { useSyncExternalStore } from "react";

// Abierto/cerrado compartido entre el botón del encabezado, la ficha (al agregar) y el propio cajón.
let abierto = false;
const oyentes = new Set<() => void>();

function fijar(valor: boolean) {
  abierto = valor;
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  return () => oyentes.delete(avisar);
}

export const abrirCarrito = () => fijar(true);

export function useEstadoCajon() {
  return {
    abierto: useSyncExternalStore(suscribir, () => abierto, () => false),
    cerrar: () => fijar(false),
  };
}
