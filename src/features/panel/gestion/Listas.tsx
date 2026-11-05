"use client";

import { formatearCop } from "@/core/catalogo/precio";
import { describirPieza, type Combo } from "@/core/combos/combos";
import type { FilaPrecio } from "@/core/panel/gestion";
import { estadoVigencia, impactoPromocion, type Promocion, type Vigencia } from "@/core/promociones/promociones";
import { activarCombo, activarPromocion, eliminarCombo, eliminarPromocion } from "./acciones";
import { AccionesFila } from "./comunes";
import { FormularioCombo } from "./FormularioCombo";
import { FormularioPromocion } from "./FormularioPromocion";

const ETIQUETA_VIGENCIA = { programada: "Programada", vigente: "Activa", terminada: "Terminada" } as const;

function Estado({ activo, vigencia, ahora }: { activo: boolean; vigencia: Vigencia; ahora: Date }) {
  const estado = activo ? ETIQUETA_VIGENCIA[estadoVigencia(vigencia, ahora)] : "Pausada";
  const destacado = estado === "Activa";
  return (
    <span className={`px-1.5 py-0.5 font-mono text-micro uppercase tracking-wider ${destacado ? "bg-tinta text-papel" : "border border-linea text-tinta-suave"}`}>
      {estado}
    </span>
  );
}

function Fechas({ vigencia, zona }: { vigencia: Vigencia; zona: string }) {
  const formato = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: zona });
  const { iniciaAt, terminaAt } = vigencia;
  if (!iniciaAt && !terminaAt) return <>Sin fecha de fin</>;
  return (
    <>
      {iniciaAt && `Desde ${formato.format(new Date(iniciaAt))}`}
      {iniciaAt && terminaAt && " · "}
      {terminaAt && `Hasta ${formato.format(new Date(terminaAt))}`}
    </>
  );
}

function Edicion({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="presion inline-block cursor-pointer py-2 text-sm underline underline-offset-4">{etiqueta}</summary>
      <div className="mt-3 max-w-xl border-l border-linea pl-4">{children}</div>
    </details>
  );
}

const describirDescuento = (p: Promocion) => (p.tipo === "porcentaje" ? `${p.valor} %` : formatearCop(p.valor));

function describirAlcance(p: Promocion) {
  if (p.alcance === "todo") return "todo el catálogo";
  if (p.alcance === "marca") return p.marca ?? "una casa";
  return `${p.productoIds.length} ${p.productoIds.length === 1 ? "producto" : "productos"}`;
}

export function ListaPromociones({ promociones, filas, zona, ahora }: { promociones: Promocion[]; filas: FilaPrecio[]; zona: string; ahora: Date }) {
  if (!promociones.length) return <p className="py-8 text-sm text-tinta-suave">Aún no hay promociones.</p>;
  return (
    <ul className="divide-y divide-linea border-y border-linea">
      {promociones.map((p) => {
        const { tamanos, bajoCosto } = impactoPromocion(p, filas);
        return (
          <li key={p.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl leading-tight">{p.nombre}</h3>
              <Estado activo={p.activa} vigencia={p} ahora={ahora} />
            </div>
            <p className="text-sm">
              {describirDescuento(p)} en {describirAlcance(p)} · {tamanos} {tamanos === 1 ? "tamaño" : "tamaños"}
            </p>
            <p className="text-xs text-tinta-suave">
              <Fechas vigencia={p} zona={zona} />
            </p>
            {bajoCosto > 0 && <p className="text-sm font-medium">{bajoCosto} {bajoCosto === 1 ? "tamaño queda" : "tamaños quedan"} por debajo del costo.</p>}
            <AccionesFila activo={p.activa} alCambiar={(activa) => activarPromocion(p.id, activa)} alEliminar={() => eliminarPromocion(p.id)} />
            <Edicion etiqueta="Editar">
              <FormularioPromocion promocion={p} filas={filas} zona={zona} />
            </Edicion>
          </li>
        );
      })}
    </ul>
  );
}

export function ListaCombos({ combos, filas, zona, ahora }: { combos: Combo[]; filas: FilaPrecio[]; zona: string; ahora: Date }) {
  if (!combos.length) return <p className="py-8 text-sm text-tinta-suave">Aún no hay combos.</p>;
  const porVariante = new Map(filas.map((f) => [f.varianteId, f]));
  return (
    <ul className="divide-y divide-linea border-y border-linea">
      {combos.map((combo) => {
        const piezas = combo.items.flatMap((item) => {
          const fila = porVariante.get(item.varianteId);
          return fila ? [{ ...fila, cantidad: item.cantidad }] : [];
        });
        const noVendible = piezas.some((p) => !p.disponible || !p.productoActivo || p.precioCop === null);
        return (
          <li key={combo.id} className="space-y-2 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl leading-tight">{combo.nombre}</h3>
              <span className="font-mono text-micro text-tinta-suave">{combo.codigo}</span>
              <Estado activo={combo.activo} vigencia={combo} ahora={ahora} />
            </div>
            <p className="text-sm">
              <span className="font-medium tabular-nums">{formatearCop(combo.precioCop)}</span> · {piezas.map(describirPieza).join(" + ")}
            </p>
            <p className="text-xs text-tinta-suave">
              <Fechas vigencia={combo} zona={zona} />
            </p>
            {noVendible && <p className="text-sm font-medium">Oculto en la tienda: uno de sus productos no está disponible.</p>}
            <AccionesFila activo={combo.activo} alCambiar={(activo) => activarCombo(combo.id, activo)} alEliminar={() => eliminarCombo(combo.id)} />
            <Edicion etiqueta="Editar">
              <FormularioCombo combo={combo} filas={filas} zona={zona} />
            </Edicion>
          </li>
        );
      })}
    </ul>
  );
}
