"use client";

import { useRef } from "react";
import type { OpcionConConteo } from "@/core/catalogo/facetas";
import { useNavegacionCatalogo } from "./navegacion";
import { alternarValor, lista } from "./parametros";

export interface GrupoFiltro {
  clave: string;
  etiqueta: string;
  opciones: OpcionConConteo[];
  /** Selección única (ej. rango de precio) o múltiple. */
  unico?: boolean;
}

function GrupoOpciones({ grupo }: { grupo: GrupoFiltro }) {
  const { parametros, navegar } = useNavegacionCatalogo();
  const elegidos = lista(parametros.get(grupo.clave) ?? undefined);

  function alternar(valor: string) {
    if (!grupo.unico) return navegar(alternarValor(parametros, grupo.clave, valor));
    const siguientes = new URLSearchParams(parametros);
    if (elegidos.includes(valor)) siguientes.delete(grupo.clave);
    else siguientes.set(grupo.clave, valor);
    navegar(siguientes);
  }

  return (
    <fieldset className="border-t border-linea py-4">
      <legend className="float-left mb-3 w-full text-xs uppercase tracking-[0.14em] text-tinta-suave">
        {grupo.etiqueta}
      </legend>
      <div className="clear-both flex flex-wrap gap-1.5">
        {grupo.opciones.map((opcion) => {
          const activo = elegidos.includes(opcion.valor);
          return (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => alternar(opcion.valor)}
              className="rounded-etiqueta border border-linea px-2.5 py-1.5 text-sm transition-colors duration-[var(--dur-fast)] hover:border-tinta aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-papel"
            >
              {opcion.etiqueta}
              <span className="ml-1.5 font-mono text-[10px] opacity-60">{opcion.conteo}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function contarActivos(parametros: URLSearchParams, grupos: GrupoFiltro[]): number {
  return grupos.reduce((total, grupo) => total + lista(parametros.get(grupo.clave) ?? undefined).length, 0);
}

function Limpiar({ grupos }: { grupos: GrupoFiltro[] }) {
  const { parametros, navegar } = useNavegacionCatalogo();
  if (!contarActivos(parametros, grupos)) return null;
  function limpiar() {
    const siguientes = new URLSearchParams(parametros);
    grupos.forEach((grupo) => siguientes.delete(grupo.clave));
    navegar(siguientes);
  }
  return (
    <button type="button" onClick={limpiar} className="text-sm underline underline-offset-4 hover:text-ambar">
      Limpiar filtros
    </button>
  );
}

export function FiltrosLaterales({ grupos }: { grupos: GrupoFiltro[] }) {
  return (
    <div className="hidden lg:block">
      <div className="mb-2 flex h-6 items-center justify-between">
        <h2 className="text-sm font-medium">Filtrar</h2>
        <Limpiar grupos={grupos} />
      </div>
      {grupos.map((grupo) => (
        <GrupoOpciones key={grupo.clave} grupo={grupo} />
      ))}
    </div>
  );
}

export function FiltrosMovil({ grupos, total }: { grupos: GrupoFiltro[]; total: number }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const { parametros } = useNavegacionCatalogo();
  const activos = contarActivos(parametros, grupos);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
        className="rounded-etiqueta border border-tinta px-3 py-2 text-sm"
      >
        Filtrar{activos > 0 && <span className="ml-1 font-mono text-xs">({activos})</span>}
      </button>
      <dialog
        ref={dialogo}
        aria-label="Filtros"
        onClick={(evento) => evento.target === dialogo.current && dialogo.current.close()}
        className="mt-auto mb-0 max-h-[85dvh] w-full max-w-none bg-superficie p-0 text-tinta backdrop:bg-tinta/40 open:animate-[aparecer_var(--dur-slow)_var(--ease-out)]"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-linea bg-superficie px-4 py-3">
          <h2 className="font-display text-2xl">Filtrar</h2>
          <Limpiar grupos={grupos} />
        </div>
        <div className="px-4 pb-24">
          {grupos.map((grupo) => (
            <GrupoOpciones key={grupo.clave} grupo={grupo} />
          ))}
        </div>
        <div className="fixed inset-x-0 bottom-0 border-t border-linea bg-superficie p-4">
          <button
            type="button"
            onClick={() => dialogo.current?.close()}
            className="w-full rounded-etiqueta bg-tinta py-3 text-sm font-medium text-papel"
          >
            Ver {total} {total === 1 ? "resultado" : "resultados"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
