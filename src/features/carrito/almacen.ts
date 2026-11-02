"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { agregar, cambiarCantidad, quitar, type LineaCarrito } from "@/core/carrito/carrito";

// El carrito es por dispositivo, como en cualquier tienda sin cuenta: vive en localStorage.
// Si el navegador no lo permite (modo privado, almacenamiento bloqueado) funciona igual, solo que no persiste.
const CLAVE = "carrito:v1";
const VACIO: LineaCarrito[] = [];

const esquema = z.array(
  z.object({
    varianteId: z.string(),
    codigo: z.string(),
    marca: z.string(),
    nombre: z.string(),
    slug: z.string(),
    tamanoMl: z.number(),
    precioCop: z.number(),
    imagen: z.string().nullable(),
    cantidad: z.number(),
  }),
);

let lineas: LineaCarrito[] | null = null;
const oyentes = new Set<() => void>();

function leer(): LineaCarrito[] {
  try {
    const guardado = esquema.safeParse(JSON.parse(localStorage.getItem(CLAVE) ?? "[]"));
    return guardado.success ? guardado.data : VACIO;
  } catch {
    return VACIO;
  }
}

function guardar(siguientes: LineaCarrito[]) {
  lineas = siguientes;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(siguientes));
  } catch {
    // Sin almacenamiento disponible el carrito sigue funcionando en memoria.
  }
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  // Mantiene sincronizadas varias pestañas abiertas de la tienda.
  const alCambiarOtraPestana = (evento: StorageEvent) => {
    if (evento.key !== CLAVE) return;
    lineas = leer();
    avisar();
  };
  window.addEventListener("storage", alCambiarOtraPestana);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiarOtraPestana);
  };
}

const obtener = () => (lineas ??= leer());

export const accionesCarrito = {
  agregar: (linea: LineaCarrito) => guardar(agregar(obtener(), linea)),
  cambiarCantidad: (varianteId: string, cantidad: number) => guardar(cambiarCantidad(obtener(), varianteId, cantidad)),
  quitar: (varianteId: string) => guardar(quitar(obtener(), varianteId)),
  vaciar: () => guardar(VACIO),
};

export function useCarrito(): LineaCarrito[] {
  return useSyncExternalStore(suscribir, obtener, () => VACIO);
}
