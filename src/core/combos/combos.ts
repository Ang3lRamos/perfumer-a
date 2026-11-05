import { z } from "zod";
import type { LineaCarrito } from "../carrito/carrito";
import { fotosDeCalidad } from "../catalogo/imagenes";
import type { Producto } from "../catalogo/tipos";
import { estadoVigencia, type Vigencia } from "../promociones/promociones";

export interface ItemCombo {
  varianteId: string;
  cantidad: number;
}

export interface Combo extends Vigencia {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioCop: number;
  activo: boolean;
  items: ItemCombo[];
}

export interface PiezaCombo extends ItemCombo {
  codigo: string;
  marca: string;
  nombre: string;
  slug: string;
  tamanoMl: number;
  precioCop: number;
  imagen: string | null;
}

export interface ComboResuelto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioCop: number;
  /** Lo que costarían hoy sus productos por separado, con promociones incluidas. */
  precioSueltoCop: number;
  piezas: PiezaCombo[];
}

function resolverPiezas(combo: Combo, catalogo: Producto<unknown>[]): PiezaCombo[] | null {
  const piezas: PiezaCombo[] = [];
  for (const item of combo.items) {
    const producto = catalogo.find((p) => p.variantes.some((v) => v.id === item.varianteId));
    const variante = producto?.variantes.find((v) => v.id === item.varianteId);
    if (!producto || !variante?.disponible || variante.precioCop === null) return null;
    piezas.push({
      ...item,
      codigo: producto.codigo,
      marca: producto.marca,
      nombre: producto.nombre,
      slug: producto.slug,
      tamanoMl: variante.tamanoMl,
      precioCop: variante.precioCop,
      imagen: fotosDeCalidad(producto)[0] ?? null,
    });
  }
  return piezas;
}

/** Un combo se vende completo: si falta o se agota cualquiera de sus productos, deja de ofrecerse. */
export function resolverCombos(combos: Combo[], catalogo: Producto<unknown>[], ahora: Date): ComboResuelto[] {
  return combos.flatMap((combo) => {
    if (!combo.activo || estadoVigencia(combo, ahora) !== "vigente" || !combo.items.length) return [];
    const piezas = resolverPiezas(combo, catalogo);
    if (!piezas) return [];
    return [
      {
        id: combo.id,
        codigo: combo.codigo,
        nombre: combo.nombre,
        descripcion: combo.descripcion,
        precioCop: combo.precioCop,
        precioSueltoCop: piezas.reduce((suma, p) => suma + p.precioCop * p.cantidad, 0),
        piezas,
      },
    ];
  });
}

export const describirPieza = (pieza: Pick<PiezaCombo, "cantidad" | "marca" | "nombre" | "tamanoMl">) =>
  `${pieza.cantidad > 1 ? `${pieza.cantidad} × ` : ""}${pieza.marca} ${pieza.nombre} ${pieza.tamanoMl} ml`;

export function lineaDeCombo(combo: ComboResuelto): LineaCarrito {
  return {
    varianteId: `combo:${combo.id}`,
    codigo: combo.codigo,
    marca: "Combo",
    nombre: combo.nombre,
    slug: null,
    tamanoMl: null,
    precioCop: combo.precioCop,
    imagen: combo.piezas.find((p) => p.imagen)?.imagen ?? null,
    cantidad: 1,
    detalle: combo.piezas.map(describirPieza).join(" + "),
  };
}

export interface UnidadCombo {
  pieza: PiezaCombo;
  precioUnitarioCop: number;
}

/**
 * Reparte el precio del combo entre sus unidades según lo que vale cada una por separado.
 * Va una fila por unidad porque no todo precio se divide exacto entre varias unidades iguales:
 * la última absorbe el redondeo y la suma siempre da el precio del combo.
 */
export function repartirCombo(combo: ComboResuelto): UnidadCombo[] {
  const unidades = combo.piezas.flatMap((pieza) => Array.from({ length: pieza.cantidad }, () => pieza));
  let restante = combo.precioCop;
  return unidades.map((pieza, i) => {
    const parte =
      i === unidades.length - 1 ? restante : Math.floor((pieza.precioCop * combo.precioCop) / combo.precioSueltoCop);
    restante -= parte;
    return { pieza, precioUnitarioCop: parte };
  });
}

export const PRECIO_MINIMO_COMBO = 1000;

export const esquemaCombo = z.object({
  nombre: z.string().trim().min(3, "Ponle un nombre de al menos 3 letras.").max(60, "El nombre admite hasta 60 caracteres."),
  descripcion: z.string().trim().max(300, "La descripción admite hasta 300 caracteres.").nullable(),
  precioCop: z
    .number({ error: "Escribe el precio del combo." })
    .int()
    .min(PRECIO_MINIMO_COMBO, `El precio mínimo es $${PRECIO_MINIMO_COMBO}.`),
  items: z
    .array(z.object({ varianteId: z.uuid(), cantidad: z.number().int().min(1).max(10) }))
    .refine((items) => items.reduce((suma, i) => suma + i.cantidad, 0) >= 2, { error: "Un combo necesita al menos 2 unidades." })
    .refine((items) => new Set(items.map((i) => i.varianteId)).size === items.length, { error: "Hay un producto repetido." }),
});
