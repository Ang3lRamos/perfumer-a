"use client";

import { useMemo, useState } from "react";
import { formatearCop } from "@/core/catalogo/precio";
import { FORMATO_MARGEN, leerEnteroCop, margenSobreCosto, type FilaPrecio } from "@/core/panel/gestion";
import { guardarPrecio } from "./acciones";
import { Aviso, CLASE_BOTON_SECUNDARIO, CLASE_CAMPO, useFormularioAccion } from "./comunes";
import { Miniatura } from "./Miniatura";

const POR_PAGINA = 40;

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function Fila({ fila }: { fila: FilaPrecio }) {
  const [precio, setPrecio] = useState(fila.precioCop === null ? "" : String(fila.precioCop));
  const [disponible, setDisponible] = useState(fila.disponible);
  const { estado, enviando, enviar } = useFormularioAccion(guardarPrecio);

  const valor = leerEnteroCop(precio);
  const cambiado = valor !== (fila.precioCop ?? undefined) || disponible !== fila.disponible;
  const margen = valor !== undefined && fila.costoCop !== null ? margenSobreCosto(valor, fila.costoCop) : null;

  return (
    <li className="border-b border-linea py-3 last:border-0">
      <form onSubmit={enviar} className="grid grid-cols-2 items-center gap-x-4 gap-y-2 lg:grid-cols-[1fr_8rem_9rem_6rem_7rem_6rem]">
        <input type="hidden" name="varianteId" value={fila.varianteId} />
        {fila.costoCop !== null && <input type="hidden" name="costo" value={fila.costoCop} />}
        <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
          <Miniatura src={fila.imagen} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {fila.marca} {fila.nombre}
            </p>
            <p className="font-mono text-micro text-tinta-suave">
              {fila.codigo} · {fila.tamanoMl} ml
              {fila.precioManual && " · precio manual"}
              {!fila.productoActivo && " · producto inactivo"}
            </p>
          </div>
        </div>
        <p className="text-xs text-tinta-suave lg:text-right">
          Costo <span className="tabular-nums">{fila.costoCop === null ? "—" : formatearCop(fila.costoCop)}</span>
        </p>
        <label className="block">
          <span className="sr-only">
            Precio de {fila.nombre} {fila.tamanoMl} ml
          </span>
          <input
            name="precio"
            inputMode="numeric"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className={`${CLASE_CAMPO} text-right tabular-nums`}
          />
        </label>
        <p className="text-xs lg:text-right">
          {margen === null ? (
            <span className="text-tinta-suave">—</span>
          ) : margen < 0 ? (
            <strong>Bajo costo</strong>
          ) : (
            <span className="tabular-nums text-tinta-suave">{FORMATO_MARGEN.format(margen)} margen</span>
          )}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="disponible"
            checked={disponible}
            onChange={(e) => setDisponible(e.target.checked)}
            className="h-4 w-4 accent-tinta"
          />
          Disponible
        </label>
        <button type="submit" disabled={!cambiado || enviando} className={`${CLASE_BOTON_SECUNDARIO} col-span-2 lg:col-span-1`}>
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </form>
      {estado && (
        <div className="mt-2 lg:text-right">
          <Aviso estado={estado} />
        </div>
      )}
    </li>
  );
}

export function EditorPrecios({ filas }: { filas: FilaPrecio[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const encontradas = useMemo(() => {
    const palabras = normalizar(busqueda.trim()).split(/\s+/);
    return filas.filter((fila) => {
      const contenido = normalizar(`${fila.marca} ${fila.nombre} ${fila.codigo}`);
      return palabras.every((palabra) => contenido.includes(palabra));
    });
  }, [filas, busqueda]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="w-full max-w-sm">
          <span className="sr-only">Buscar producto</span>
          <input
            type="search"
            placeholder="Buscar por casa, nombre o código"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setVisibles(POR_PAGINA);
            }}
            className={CLASE_CAMPO}
          />
        </label>
        <p className="font-mono text-xs text-tinta-suave" aria-live="polite">
          {encontradas.length} tamaños
        </p>
      </div>
      <ul className="border-t border-linea">
        {encontradas.slice(0, visibles).map((fila) => (
          <Fila key={fila.varianteId} fila={fila} />
        ))}
      </ul>
      {encontradas.length > visibles && (
        <button type="button" onClick={() => setVisibles((n) => n + POR_PAGINA)} className={`${CLASE_BOTON_SECUNDARIO} mt-6`}>
          Ver más ({encontradas.length - visibles})
        </button>
      )}
    </>
  );
}
