"use client";

import { useMemo, useRef, useState } from "react";
import { leerEnteroCop, type FilaPrecio } from "@/core/panel/gestion";
import { impactoPromocion, instanteALocal, type AlcancePromocion, type Promocion, type TipoDescuento } from "@/core/promociones/promociones";
import { guardarPromocion } from "./acciones";
import { Aviso, Campo, CamposVigencia, CLASE_BOTON_PRINCIPAL, CLASE_CAMPO, noEnviarConEnter, useFormularioAccion } from "./comunes";

const MAX_RESULTADOS = 30;

export function FormularioPromocion({ promocion, filas, zona }: { promocion?: Promocion; filas: FilaPrecio[]; zona: string }) {
  const [tipo, setTipo] = useState<TipoDescuento>(promocion?.tipo ?? "porcentaje");
  const [valor, setValor] = useState(promocion ? String(promocion.valor) : "");
  const [alcance, setAlcance] = useState<AlcancePromocion>(promocion?.alcance ?? "todo");
  const [marca, setMarca] = useState(promocion?.marca ?? "");
  const [elegidos, setElegidos] = useState(promocion?.productoIds ?? []);
  const [busqueda, setBusqueda] = useState("");
  const formulario = useRef<HTMLFormElement>(null);

  const limpiar = () => {
    if (promocion) return;
    formulario.current?.reset();
    setValor("");
    setElegidos([]);
    setBusqueda("");
  };
  const { estado, enviando, enviar } = useFormularioAccion(guardarPromocion, limpiar);

  const marcas = useMemo(() => [...new Set(filas.map((f) => f.marca))].sort(), [filas]);
  const productos = useMemo(() => {
    const unicos = new Map(filas.map((f) => [f.productoId, f]));
    return [...unicos.values()];
  }, [filas]);
  const resultados = useMemo(() => {
    const buscado = busqueda.trim().toLowerCase();
    if (!buscado) return [];
    return productos.filter((p) => `${p.marca} ${p.nombre} ${p.codigo}`.toLowerCase().includes(buscado)).slice(0, MAX_RESULTADOS);
  }, [productos, busqueda]);

  const numero = leerEnteroCop(valor);
  const impacto = numero
    ? impactoPromocion({ tipo, valor: numero, alcance, marca: marca || null, productoIds: elegidos }, filas)
    : null;

  return (
    <form ref={formulario} onSubmit={enviar} className="space-y-4">
      {promocion && <input type="hidden" name="id" value={promocion.id} />}
      <Campo etiqueta="Nombre" ayuda="El cliente lo ve en la ficha del producto.">
        <input name="nombre" required maxLength={60} defaultValue={promocion?.nombre} className={CLASE_CAMPO} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Descuento">
          <select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoDescuento)} className={CLASE_CAMPO}>
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="monto">Monto fijo ($)</option>
          </select>
        </Campo>
        <Campo etiqueta={tipo === "porcentaje" ? "Porcentaje" : "Monto por unidad"}>
          <input name="valor" inputMode="numeric" required value={valor} onChange={(e) => setValor(e.target.value)} className={CLASE_CAMPO} />
        </Campo>
      </div>
      <Campo etiqueta="Aplica a">
        <select name="alcance" value={alcance} onChange={(e) => setAlcance(e.target.value as AlcancePromocion)} className={CLASE_CAMPO}>
          <option value="todo">Todo el catálogo</option>
          <option value="marca">Una casa</option>
          <option value="productos">Productos específicos</option>
        </select>
      </Campo>
      {alcance === "marca" && (
        <Campo etiqueta="Casa">
          <select name="marca" value={marca} onChange={(e) => setMarca(e.target.value)} className={CLASE_CAMPO}>
            <option value="">Elige una casa</option>
            {marcas.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Campo>
      )}
      {alcance === "productos" && (
        <div className="space-y-2">
          <Campo etiqueta={`Productos (${elegidos.length} elegidos)`}>
            <input
              type="search"
              placeholder="Busca por casa, nombre o código"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={noEnviarConEnter}
              className={CLASE_CAMPO}
            />
          </Campo>
          {elegidos.map((productoId) => (
            <input key={productoId} type="hidden" name="productoIds" value={productoId} />
          ))}
          <ul className="max-h-64 divide-y divide-linea overflow-y-auto overscroll-contain border border-linea empty:hidden">
            {[...productos.filter((p) => elegidos.includes(p.productoId)), ...resultados.filter((p) => !elegidos.includes(p.productoId))].map((p) => (
              <li key={p.productoId}>
                <label className="flex items-center gap-3 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={elegidos.includes(p.productoId)}
                    onChange={(e) =>
                      setElegidos((actual) => (e.target.checked ? [...actual, p.productoId] : actual.filter((x) => x !== p.productoId)))
                    }
                    className="h-4 w-4 accent-tinta"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {p.marca} {p.nombre}
                  </span>
                  <span className="font-mono text-micro text-tinta-suave">{p.codigo}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      <CamposVigencia
        inicia={promocion?.iniciaAt ? instanteALocal(promocion.iniciaAt, zona) : ""}
        termina={promocion?.terminaAt ? instanteALocal(promocion.terminaAt, zona) : ""}
        zona={zona}
      />
      {impacto && (
        <p className={impacto.bajoCosto ? "border border-tinta px-3 py-2 text-sm font-medium" : "text-sm text-tinta-suave"}>
          Cubre {impacto.tamanos} {impacto.tamanos === 1 ? "tamaño" : "tamaños"}.
          {impacto.bajoCosto > 0 && ` ${impacto.bajoCosto} quedarían por debajo del costo del proveedor.`}
        </p>
      )}
      <Aviso estado={estado} />
      <button type="submit" disabled={enviando} className={CLASE_BOTON_PRINCIPAL}>
        {enviando ? "Guardando…" : promocion ? "Guardar cambios" : "Crear promoción"}
      </button>
    </form>
  );
}
