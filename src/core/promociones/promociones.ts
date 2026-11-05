import { z } from "zod";
import type { Producto } from "../catalogo/tipos";

export const TIPOS_DESCUENTO = ["porcentaje", "monto"] as const;
export const ALCANCES_PROMOCION = ["todo", "marca", "productos"] as const;

export type TipoDescuento = (typeof TIPOS_DESCUENTO)[number];
export type AlcancePromocion = (typeof ALCANCES_PROMOCION)[number];

/** Fechas ISO y no Date: estos datos viajan por la caché y hasta componentes de cliente. */
export interface Vigencia {
  iniciaAt: string | null;
  terminaAt: string | null;
}

export interface Promocion extends Vigencia {
  id: string;
  nombre: string;
  tipo: TipoDescuento;
  valor: number;
  alcance: AlcancePromocion;
  marca: string | null;
  productoIds: string[];
  activa: boolean;
}

export type EstadoVigencia = "programada" | "vigente" | "terminada";

export function estadoVigencia({ iniciaAt, terminaAt }: Vigencia, ahora: Date): EstadoVigencia {
  if (terminaAt && new Date(terminaAt) <= ahora) return "terminada";
  if (iniciaAt && new Date(iniciaAt) > ahora) return "programada";
  return "vigente";
}

/**
 * Precio con el descuento, o null si no aplica (dejaría el producto gratis o no lo baja).
 * Los porcentajes bajan a la centena para no publicar $144.415: el cliente siempre recibe al menos lo anunciado.
 */
export function precioConDescuento(precio: number, { tipo, valor }: Pick<Promocion, "tipo" | "valor">): number | null {
  const final = tipo === "porcentaje" ? Math.floor((precio * (100 - valor)) / 100 / 100) * 100 : precio - valor;
  return final > 0 && final < precio ? final : null;
}

export function promocionCubre(promocion: Pick<Promocion, "alcance" | "marca" | "productoIds">, producto: Pick<Producto, "id" | "marca">): boolean {
  if (promocion.alcance === "todo") return true;
  if (promocion.alcance === "marca") return promocion.marca === producto.marca;
  return promocion.productoIds.includes(producto.id);
}

/** Si varias promociones cubren un tamaño gana la de menor precio final: no se acumulan. */
export function aplicarPromociones<P extends Producto<unknown>>(catalogo: P[], promociones: Promocion[], ahora: Date): P[] {
  const vigentes = promociones.filter((p) => p.activa && estadoVigencia(p, ahora) === "vigente");
  if (!vigentes.length) return catalogo;

  return catalogo.map((producto) => {
    const aplicables = vigentes.filter((p) => promocionCubre(p, producto));
    if (!aplicables.length) return producto;
    return {
      ...producto,
      variantes: producto.variantes.map((variante) => {
        if (variante.precioCop === null) return variante;
        let mejor: { precio: number; nombre: string } | null = null;
        for (const promocion of aplicables) {
          const precio = precioConDescuento(variante.precioCop, promocion);
          if (precio !== null && (!mejor || precio < mejor.precio)) mejor = { precio, nombre: promocion.nombre };
        }
        return mejor
          ? { ...variante, precioCop: mejor.precio, precioAnteriorCop: variante.precioCop, promocion: mejor.nombre }
          : variante;
      }),
    };
  });
}

const SEGUNDOS_MINIMOS = 300;
const SEGUNDOS_MAXIMOS = 3600;

/**
 * Cuánto puede durar la caché de la tienda para que una promoción empiece y termine a tiempo.
 * Por debajo de 5 minutos Next saca el contenido del prerender, así que ese es el piso.
 */
export function segundosHastaProximoCambio(vigencias: Vigencia[], ahora: Date): number {
  const futuros = vigencias
    .flatMap((v) => [v.iniciaAt, v.terminaAt])
    .filter((fecha): fecha is string => fecha !== null)
    .map((fecha) => (new Date(fecha).getTime() - ahora.getTime()) / 1000)
    .filter((segundos) => segundos > 0);
  const proximo = Math.ceil(Math.min(SEGUNDOS_MAXIMOS, ...futuros));
  return Math.max(SEGUNDOS_MINIMOS, proximo);
}

export interface FilaImpacto {
  productoId: string;
  marca: string;
  precioCop: number | null;
  costoCop: number | null;
}

/** Para avisar antes de publicar: cuántos tamaños cubre la promoción y cuántos se venderían a pérdida. */
export function impactoPromocion(promocion: Pick<Promocion, "tipo" | "valor" | "alcance" | "marca" | "productoIds">, filas: FilaImpacto[]) {
  let tamanos = 0;
  let bajoCosto = 0;
  for (const fila of filas) {
    if (fila.precioCop === null || !promocionCubre(promocion, { id: fila.productoId, marca: fila.marca })) continue;
    const precio = precioConDescuento(fila.precioCop, promocion);
    if (precio === null) continue;
    tamanos += 1;
    if (fila.costoCop !== null && precio < fila.costoCop) bajoCosto += 1;
  }
  return { tamanos, bajoCosto };
}

function partesEnZona(instante: Date, zona: string) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instante);
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}T${parte("hour")}:${parte("minute")}`;
}

/** "2026-12-01T08:00" (lo que escribe el dueño, en hora del negocio) → instante ISO. */
export function localAInstante(local: string, zona: string): string {
  const comoUtc = new Date(`${local}:00Z`);
  const desfase = new Date(`${partesEnZona(comoUtc, zona)}:00Z`).getTime() - comoUtc.getTime();
  return new Date(comoUtc.getTime() - desfase).toISOString();
}

/** Instante ISO → valor para un input datetime-local en hora del negocio. */
export const instanteALocal = (instante: string, zona: string) => partesEnZona(new Date(instante), zona);

const fechaLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .nullable();

export const esquemaVigencia = z
  .object({ inicia: fechaLocal, termina: fechaLocal })
  .refine(({ inicia, termina }) => !inicia || !termina || termina > inicia, {
    error: "La fecha de fin debe ser posterior a la de inicio.",
  });

export const esquemaPromocion = z
  .object({
    nombre: z.string().trim().min(3, "Ponle un nombre de al menos 3 letras.").max(60, "El nombre admite hasta 60 caracteres."),
    tipo: z.enum(TIPOS_DESCUENTO),
    valor: z.number({ error: "Escribe el valor del descuento." }).int().positive("El descuento debe ser mayor que cero."),
    alcance: z.enum(ALCANCES_PROMOCION),
    marca: z.string().trim().nullable(),
    productoIds: z.array(z.uuid()),
  })
  .refine(({ tipo, valor }) => tipo !== "porcentaje" || valor <= 90, { error: "El porcentaje máximo es 90 %." })
  .refine(({ alcance, marca }) => alcance !== "marca" || !!marca, { error: "Elige la casa." })
  .refine(({ alcance, productoIds }) => alcance !== "productos" || productoIds.length > 0, { error: "Elige al menos un producto." })
  .transform((datos) => ({
    ...datos,
    marca: datos.alcance === "marca" ? datos.marca : null,
    productoIds: datos.alcance === "productos" ? datos.productoIds : [],
  }));
