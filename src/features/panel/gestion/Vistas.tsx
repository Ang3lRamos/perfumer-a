import type { ReactNode } from "react";
import { negocio } from "@/config/negocio";
import type { Combo } from "@/core/combos/combos";
import type { FilaPrecio } from "@/core/panel/gestion";
import type { Promocion } from "@/core/promociones/promociones";
import { EditorPrecios } from "./EditorPrecios";
import { FormularioCombo } from "./FormularioCombo";
import { FormularioPromocion } from "./FormularioPromocion";
import { ListaCombos, ListaPromociones } from "./Listas";

function Encabezado({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-display text-5xl tracking-tight">{titulo}</h1>
      <p className="mt-2 max-w-prose text-sm text-tinta-suave">{detalle}</p>
    </header>
  );
}

function Nuevo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <details className="mb-8 border border-linea p-4">
      <summary className="presion cursor-pointer font-medium">{etiqueta}</summary>
      <div className="mt-4 max-w-xl">{children}</div>
    </details>
  );
}

export function VistaPrecios({ filas }: { filas: FilaPrecio[] }) {
  return (
    <>
      <Encabezado
        titulo="Precios"
        detalle="Precio base de cada tamaño. Se publica al guardar. Si lo dejas igual a la regla del negocio, vuelve a actualizarse con la lista del proveedor; si no, se conserva al reimportarla."
      />
      <EditorPrecios filas={filas} />
    </>
  );
}

export function VistaPromociones({ promociones, filas, ahora }: { promociones: Promocion[]; filas: FilaPrecio[]; ahora: Date }) {
  const zona = negocio.zonaHoraria;
  return (
    <>
      <Encabezado
        titulo="Promociones"
        detalle="Descuentos sobre el precio base. Si varias cubren un mismo tamaño, gana la de menor precio final: no se acumulan. No se aplican a los combos, que tienen precio propio."
      />
      <Nuevo etiqueta="Nueva promoción">
        <FormularioPromocion filas={filas} zona={zona} />
      </Nuevo>
      <ListaPromociones promociones={promociones} filas={filas} zona={zona} ahora={ahora} />
    </>
  );
}

export function VistaCombos({ combos, filas, ahora }: { combos: Combo[]; filas: FilaPrecio[]; ahora: Date }) {
  const zona = negocio.zonaHoraria;
  return (
    <>
      <Encabezado
        titulo="Combos"
        detalle="Varios productos por un precio fijo. Aparecen al inicio de la tienda y se ocultan solos si alguno de sus productos se agota."
      />
      <Nuevo etiqueta="Nuevo combo">
        <FormularioCombo filas={filas} zona={zona} />
      </Nuevo>
      <ListaCombos combos={combos} filas={filas} zona={zona} ahora={ahora} />
    </>
  );
}
