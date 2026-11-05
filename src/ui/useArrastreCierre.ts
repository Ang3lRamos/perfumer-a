"use client";

import { useRef, type PointerEvent } from "react";
import { debeCerrar, gomaElastica, velocidadAlSoltar, type Muestra } from "./fisica-gesto";

// Holgura antes de capturar el puntero, para no robarle el toque a un clic.
const UMBRAL_PX = 10;

interface Arrastre {
  inicio: number;
  activo: boolean;
  desplazamiento: number;
  muestras: Muestra[];
}

/** Arrastrar una zona de la hoja la mueve 1:1; al soltar, la inercia decide si se cierra. El resto lo anima `.hoja`. */
export function useArrastreCierre(eje: "x" | "y", cerrar: () => void) {
  const arrastre = useRef<Arrastre | null>(null);
  const posicion = (evento: PointerEvent) => (eje === "x" ? evento.clientX : evento.clientY);

  function terminar(evento: PointerEvent<HTMLElement>, puedeCerrar: boolean) {
    const actual = arrastre.current;
    const hoja = evento.currentTarget.closest("dialog");
    arrastre.current = null;
    if (!actual?.activo || !hoja) return;

    delete hoja.dataset.arrastrando;
    hoja.style.removeProperty("transform");
    hoja.style.removeProperty("--hoja-velo");

    const dimension = eje === "x" ? hoja.offsetWidth : hoja.offsetHeight;
    const velocidad = velocidadAlSoltar(actual.muestras, evento.timeStamp);
    if (puedeCerrar && debeCerrar(actual.desplazamiento, velocidad, dimension)) cerrar();
  }

  return {
    onPointerDown(evento: PointerEvent<HTMLElement>) {
      if ((evento.target as Element).closest("button, a")) return;
      arrastre.current = { inicio: posicion(evento), activo: false, desplazamiento: 0, muestras: [] };
    },
    onPointerMove(evento: PointerEvent<HTMLElement>) {
      const actual = arrastre.current;
      const hoja = evento.currentTarget.closest("dialog");
      if (!actual || !hoja) return;

      if (!actual.activo) {
        if (Math.abs(posicion(evento) - actual.inicio) < UMBRAL_PX) return;
        actual.activo = true;
        actual.inicio = posicion(evento);
        evento.currentTarget.setPointerCapture(evento.pointerId);
        hoja.dataset.arrastrando = "";
      }

      const dimension = eje === "x" ? hoja.offsetWidth : hoja.offsetHeight;
      const delta = posicion(evento) - actual.inicio;
      actual.desplazamiento = delta >= 0 ? delta : -gomaElastica(-delta, dimension);
      actual.muestras.push({ posicion: posicion(evento), tiempo: evento.timeStamp });

      const traslacion = eje === "x" ? "translateX" : "translateY";
      hoja.style.transform = `${traslacion}(${actual.desplazamiento}px)`;
      hoja.style.setProperty("--hoja-velo", String(1 - Math.max(actual.desplazamiento, 0) / dimension));
    },
    onPointerUp: (evento: PointerEvent<HTMLElement>) => terminar(evento, true),
    onPointerCancel: (evento: PointerEvent<HTMLElement>) => terminar(evento, false),
  };
}
