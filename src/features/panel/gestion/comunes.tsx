"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { EstadoAccion } from "./acciones";

export const CLASE_CAMPO =
  "w-full rounded-etiqueta border border-linea bg-superficie px-3 py-2.5 text-base focus:border-tinta focus:outline-none sm:text-sm";
export const CLASE_BOTON_PRINCIPAL =
  "presion rounded-etiqueta bg-acento px-5 py-2.5 text-sm font-medium text-sobre-acento hover:bg-acento-hover disabled:opacity-40";
export const CLASE_BOTON_SECUNDARIO =
  "presion rounded-etiqueta border border-tinta px-3 py-2 text-sm hover:bg-tinta hover:text-papel disabled:opacity-40";

/**
 * Se envía a mano y no con <form action>: React vaciaría los campos al terminar, y quien se equivocó
 * en un dato perdería todo lo escrito. `alGuardar` deja a cada formulario decidir qué hacer tras el éxito.
 */
export function useFormularioAccion(accion: (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>, alGuardar?: () => void) {
  const [estado, despachar, enviando] = useActionState(accion, null);
  const alGuardarVigente = useRef(alGuardar);
  useEffect(() => {
    alGuardarVigente.current = alGuardar;
  });
  useEffect(() => {
    if (estado?.ok) alGuardarVigente.current?.();
  }, [estado]);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => despachar(datos));
  }
  return { estado, enviando, enviar };
}

/** En un buscador dentro de un formulario, Enter filtra: no debe enviar el formulario a medio llenar. */
export function noEnviarConEnter(evento: KeyboardEvent<HTMLInputElement>) {
  if (evento.key === "Enter") evento.preventDefault();
}

export function Aviso({ estado }: { estado: EstadoAccion }) {
  if (!estado) return null;
  return estado.ok ? (
    <p role="status" className="text-sm text-tinta-suave">
      {estado.mensaje}
    </p>
  ) : (
    <p role="alert" className="border border-tinta px-3 py-2 text-sm">
      {estado.error}
    </p>
  );
}

export function Campo({ etiqueta, ayuda, children }: { etiqueta: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm">{etiqueta}</span>
      {children}
      {ayuda && <span className="block text-xs text-tinta-suave">{ayuda}</span>}
    </label>
  );
}

export function CamposVigencia({ inicia, termina, zona }: { inicia: string; termina: string; zona: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Empieza" ayuda={`Vacío: de inmediato. Hora de ${zona}.`}>
        <input name="inicia" type="datetime-local" defaultValue={inicia} className={CLASE_CAMPO} />
      </Campo>
      <Campo etiqueta="Termina" ayuda="Vacío: hasta que la pauses.">
        <input name="termina" type="datetime-local" defaultValue={termina} className={CLASE_CAMPO} />
      </Campo>
    </div>
  );
}

/** Pausar y eliminar compartidos por promociones y combos. Eliminar pide un segundo toque en vez de un diálogo del navegador. */
export function AccionesFila({
  activo,
  alCambiar,
  alEliminar,
}: {
  activo: boolean;
  alCambiar: (activo: boolean) => Promise<EstadoAccion>;
  alEliminar: () => Promise<EstadoAccion>;
}) {
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [estado, setEstado] = useState<EstadoAccion>(null);

  const correr = (accion: () => Promise<EstadoAccion>) =>
    iniciar(async () => {
      const resultado = await accion();
      setEstado(resultado?.ok ? null : resultado);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pendiente} onClick={() => correr(() => alCambiar(!activo))} className={CLASE_BOTON_SECUNDARIO}>
        {activo ? "Pausar" : "Activar"}
      </button>
      {confirmando ? (
        <>
          <button type="button" disabled={pendiente} onClick={() => correr(alEliminar)} className={CLASE_BOTON_PRINCIPAL}>
            Sí, eliminar
          </button>
          <button type="button" onClick={() => setConfirmando(false)} className="presion px-2 py-2 text-sm underline underline-offset-4">
            No
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmando(true)} className="presion px-2 py-2 text-sm text-tinta-suave underline underline-offset-4 hover:text-tinta">
          Eliminar
        </button>
      )}
      <Aviso estado={estado} />
    </div>
  );
}
