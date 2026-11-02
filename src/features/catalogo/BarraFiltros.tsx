"use client";

import { useRef } from "react";
import { Desplegable } from "@/ui/Desplegable";
import { useNavegacionCatalogo } from "./navegacion";
import { OpcionesFiltro, type GrupoFiltro } from "./OpcionesFiltro";
import { lista } from "./parametros";

function useConteoActivos() {
  const { parametros } = useNavegacionCatalogo();
  return (grupo: GrupoFiltro) => lista(parametros.get(grupo.clave) ?? undefined).length;
}

/** Escritorio y tablet: un desplegable por grupo, en una sola fila sobre los resultados. */
function FiltrosEnFila({ grupos }: { grupos: GrupoFiltro[] }) {
  const conteo = useConteoActivos();
  return (
    <div className="hidden flex-wrap gap-2 sm:flex">
      {grupos.map((grupo) => (
        <Desplegable
          key={grupo.clave}
          activo={conteo(grupo) > 0}
          etiqueta={
            <>
              {grupo.etiqueta}
              {conteo(grupo) > 0 && <span className="font-mono text-xs">({conteo(grupo)})</span>}
            </>
          }
        >
          <OpcionesFiltro grupo={grupo} />
        </Desplegable>
      ))}
    </div>
  );
}

/** Celular: una hoja desde abajo con todos los grupos. */
function FiltrosEnHoja({ grupos, total }: { grupos: GrupoFiltro[]; total: number }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const conteo = useConteoActivos();
  const activos = grupos.reduce((suma, grupo) => suma + conteo(grupo), 0);

  return (
    <div className="sm:hidden">
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
        <h2 className="sticky top-0 border-b border-linea bg-superficie px-4 py-3 font-display text-2xl">Filtrar</h2>
        <div className="divide-y divide-linea px-4 pb-24">
          {grupos.map((grupo) => (
            <section key={grupo.clave} className="py-4">
              <h3 className="mb-3 text-xs uppercase tracking-[0.14em] text-tinta-suave">{grupo.etiqueta}</h3>
              <OpcionesFiltro grupo={grupo} />
            </section>
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

export function BarraFiltros({ grupos, total }: { grupos: GrupoFiltro[]; total: number }) {
  return (
    <>
      <FiltrosEnFila grupos={grupos} />
      <FiltrosEnHoja grupos={grupos} total={total} />
    </>
  );
}
