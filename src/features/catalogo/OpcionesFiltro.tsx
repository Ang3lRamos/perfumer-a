"use client";

import type { OpcionConConteo } from "@/core/catalogo/facetas";
import { useNavegacionCatalogo } from "./navegacion";
import { alternarValor, lista } from "./parametros";

export interface GrupoFiltro {
  clave: string;
  etiqueta: string;
  opciones: OpcionConConteo[];
  /** Selección única (género, rango de precio) o múltiple. */
  unico?: boolean;
}

export function useSeleccion(grupo: GrupoFiltro) {
  const { parametros, navegar } = useNavegacionCatalogo();
  const elegidos = lista(parametros.get(grupo.clave) ?? undefined);

  function alternar(valor: string) {
    if (!grupo.unico) return navegar(alternarValor(parametros, grupo.clave, valor));
    const siguientes = new URLSearchParams(parametros);
    if (elegidos.includes(valor)) siguientes.delete(grupo.clave);
    else siguientes.set(grupo.clave, valor);
    navegar(siguientes);
  }

  return { elegidos, alternar };
}

export function OpcionesFiltro({ grupo }: { grupo: GrupoFiltro }) {
  const { elegidos, alternar } = useSeleccion(grupo);
  return (
    <div role={grupo.unico ? "radiogroup" : "group"} aria-label={grupo.etiqueta} className="flex flex-wrap gap-1.5">
      {grupo.opciones.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          role={grupo.unico ? "radio" : undefined}
          aria-checked={grupo.unico ? elegidos.includes(opcion.valor) : undefined}
          aria-pressed={grupo.unico ? undefined : elegidos.includes(opcion.valor)}
          data-elegido={elegidos.includes(opcion.valor)}
          onClick={() => alternar(opcion.valor)}
          className="rounded-etiqueta border border-linea px-2.5 py-1.5 text-sm transition-colors duration-[var(--dur-fast)] hover:border-tinta data-[elegido=true]:border-tinta data-[elegido=true]:bg-tinta data-[elegido=true]:text-papel"
        >
          {opcion.etiqueta}
          <span className="ml-1.5 font-mono text-[10px] opacity-60">{opcion.conteo}</span>
        </button>
      ))}
    </div>
  );
}

/** Lo elegido, visible siempre sobre los resultados y removible con un toque. */
export function FiltrosActivos({ grupos }: { grupos: GrupoFiltro[] }) {
  const { parametros, navegar } = useNavegacionCatalogo();
  const activos = grupos.flatMap((grupo) =>
    lista(parametros.get(grupo.clave) ?? undefined).map((valor) => ({
      grupo,
      valor,
      etiqueta: grupo.opciones.find((o) => o.valor === valor)?.etiqueta ?? valor,
    })),
  );
  if (!activos.length) return null;

  function limpiarTodo() {
    const siguientes = new URLSearchParams(parametros);
    grupos.forEach((grupo) => siguientes.delete(grupo.clave));
    navegar(siguientes);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activos.map(({ grupo, valor, etiqueta }) => (
        <button
          key={`${grupo.clave}-${valor}`}
          type="button"
          onClick={() => navegar(alternarValor(parametros, grupo.clave, valor))}
          aria-label={`Quitar ${etiqueta}`}
          className="flex items-center gap-1.5 rounded-etiqueta bg-vitrina px-2.5 py-1 text-sm hover:bg-linea"
        >
          {etiqueta}
          <span aria-hidden className="text-tinta-suave">×</span>
        </button>
      ))}
      <button type="button" onClick={limpiarTodo} className="ml-1 text-sm underline underline-offset-4 hover:text-ambar">
        Limpiar todo
      </button>
    </div>
  );
}
