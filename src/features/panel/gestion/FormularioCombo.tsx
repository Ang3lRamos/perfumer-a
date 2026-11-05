"use client";

import { useMemo, useRef, useState } from "react";
import { formatearCop } from "@/core/catalogo/precio";
import type { Combo, ItemCombo } from "@/core/combos/combos";
import { FORMATO_MARGEN, leerEnteroCop, margenSobreCosto, type FilaPrecio } from "@/core/panel/gestion";
import { instanteALocal } from "@/core/promociones/promociones";
import { guardarCombo } from "./acciones";
import { Miniatura } from "./Miniatura";
import { Aviso, Campo, CamposVigencia, CLASE_BOTON_PRINCIPAL, CLASE_CAMPO, noEnviarConEnter, useFormularioAccion } from "./comunes";

const MAX_RESULTADOS = 20;

function Totales({ precio, suelto, costo, faltanCostos }: { precio: number | undefined; suelto: number; costo: number; faltanCostos: boolean }) {
  const margen = precio !== undefined && costo > 0 ? margenSobreCosto(precio, costo) : null;
  const bajoCosto = margen !== null && margen < 0;
  return (
    <dl className="grid grid-cols-3 gap-px border border-linea bg-linea text-sm">
      <div className="bg-papel p-3">
        <dt className="text-xs text-tinta-suave">Por separado</dt>
        <dd className="tabular-nums">{formatearCop(suelto)}</dd>
      </div>
      <div className="bg-papel p-3">
        <dt className="text-xs text-tinta-suave">{faltanCostos ? "Costo (incompleto)" : "Costo"}</dt>
        <dd className="tabular-nums">{formatearCop(costo)}</dd>
      </div>
      <div className="bg-papel p-3">
        <dt className="text-xs text-tinta-suave">Margen</dt>
        <dd className={bajoCosto ? "font-medium" : "tabular-nums"}>{margen === null ? "—" : bajoCosto ? "Bajo costo" : FORMATO_MARGEN.format(margen)}</dd>
      </div>
    </dl>
  );
}

export function FormularioCombo({ combo, filas, zona }: { combo?: Combo; filas: FilaPrecio[]; zona: string }) {
  const [items, setItems] = useState<ItemCombo[]>(combo?.items ?? []);
  const [precio, setPrecio] = useState(combo ? String(combo.precioCop) : "");
  const [busqueda, setBusqueda] = useState("");
  const formulario = useRef<HTMLFormElement>(null);

  const limpiar = () => {
    if (combo) return;
    formulario.current?.reset();
    setItems([]);
    setPrecio("");
    setBusqueda("");
  };
  const { estado, enviando, enviar } = useFormularioAccion(guardarCombo, limpiar);

  const porVariante = useMemo(() => new Map(filas.map((f) => [f.varianteId, f])), [filas]);
  const resultados = useMemo(() => {
    const buscado = busqueda.trim().toLowerCase();
    if (!buscado) return [];
    return filas
      .filter((f) => f.disponible && f.productoActivo && !items.some((i) => i.varianteId === f.varianteId))
      .filter((f) => `${f.marca} ${f.nombre} ${f.codigo}`.toLowerCase().includes(buscado))
      .slice(0, MAX_RESULTADOS);
  }, [filas, items, busqueda]);

  const elegidas = items.flatMap((item) => {
    const fila = porVariante.get(item.varianteId);
    return fila ? [{ item, fila }] : [];
  });
  const suelto = elegidas.reduce((suma, { item, fila }) => suma + (fila.precioCop ?? 0) * item.cantidad, 0);
  const costo = elegidas.reduce((suma, { item, fila }) => suma + (fila.costoCop ?? 0) * item.cantidad, 0);

  return (
    <form ref={formulario} onSubmit={enviar} className="space-y-4">
      {combo && <input type="hidden" name="id" value={combo.id} />}
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <Campo etiqueta="Nombre">
        <input name="nombre" required maxLength={60} defaultValue={combo?.nombre} className={CLASE_CAMPO} />
      </Campo>
      <Campo etiqueta="Descripción (opcional)">
        <textarea name="descripcion" rows={2} maxLength={300} defaultValue={combo?.descripcion ?? ""} className={CLASE_CAMPO} />
      </Campo>
      <div className="space-y-2">
        <Campo etiqueta="Agregar productos">
          <input type="search" placeholder="Busca por casa, nombre o código" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} onKeyDown={noEnviarConEnter} className={CLASE_CAMPO} />
        </Campo>
        <ul className="max-h-56 divide-y divide-linea overflow-y-auto overscroll-contain border border-linea empty:hidden">
          {resultados.map((fila) => (
            <li key={fila.varianteId}>
              <button
                type="button"
                onClick={() => {
                  setItems((actual) => [...actual, { varianteId: fila.varianteId, cantidad: 1 }]);
                  setBusqueda("");
                }}
                className="presion flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-vitrina"
              >
                <Miniatura src={fila.imagen} />
                <span className="min-w-0 flex-1 truncate">
                  {fila.marca} {fila.nombre} {fila.tamanoMl} ml
                </span>
                <span className="tabular-nums text-tinta-suave">{fila.precioCop === null ? "—" : formatearCop(fila.precioCop)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {elegidas.length > 0 && (
        <ul className="divide-y divide-linea border border-linea">
          {elegidas.map(({ item, fila }) => (
            <li key={item.varianteId} className="flex items-center gap-3 px-3 py-2 text-sm">
              <Miniatura src={fila.imagen} />
              <span className="min-w-0 flex-1 truncate">
                {fila.marca} {fila.nombre} {fila.tamanoMl} ml
              </span>
              <label className="flex items-center gap-1.5">
                <span className="sr-only">Cantidad de {fila.nombre}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={item.cantidad}
                  onChange={(e) => {
                    const cantidad = Math.min(10, Math.max(1, Math.trunc(Number(e.target.value)) || 1));
                    setItems((actual) => actual.map((i) => (i.varianteId === item.varianteId ? { ...i, cantidad } : i)));
                  }}
                  className="w-14 rounded-etiqueta border border-linea px-2 py-1.5 text-center tabular-nums"
                />
              </label>
              <button
                type="button"
                onClick={() => setItems((actual) => actual.filter((i) => i.varianteId !== item.varianteId))}
                className="presion py-2 text-xs text-tinta-suave underline underline-offset-4 hover:text-tinta"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      <Campo etiqueta="Precio del combo" ayuda="Los productos con promoción pueden salir más baratos por separado: revisa el ahorro en la tienda.">
        <input name="precio" inputMode="numeric" required value={precio} onChange={(e) => setPrecio(e.target.value)} className={CLASE_CAMPO} />
      </Campo>
      {elegidas.length > 0 && (
        <Totales precio={leerEnteroCop(precio)} suelto={suelto} costo={costo} faltanCostos={elegidas.some(({ fila }) => fila.costoCop === null)} />
      )}
      <CamposVigencia
        inicia={combo?.iniciaAt ? instanteALocal(combo.iniciaAt, zona) : ""}
        termina={combo?.terminaAt ? instanteALocal(combo.terminaAt, zona) : ""}
        zona={zona}
      />
      <Aviso estado={estado} />
      <button type="submit" disabled={enviando} className={CLASE_BOTON_PRINCIPAL}>
        {enviando ? "Guardando…" : combo ? "Guardar cambios" : "Crear combo"}
      </button>
    </form>
  );
}
