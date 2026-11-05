"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { negocio } from "@/config/negocio";
import { precioVenta } from "@/core/catalogo/precio";
import { esquemaCombo } from "@/core/combos/combos";
import { leerEnteroCop } from "@/core/panel/gestion";
import { esquemaPromocion, esquemaVigencia, localAInstante } from "@/core/promociones/promociones";
import { ETIQUETA_CACHE_CATALOGO } from "@/features/catalogo/datos";
import { crearGestionRepositorio } from "@/infra/supabase/gestion-repositorio";
import { exigirAdmin } from "../autorizacion";

export type EstadoAccion = { ok: true; mensaje: string } | { ok: false; error: string } | null;

const id = z.uuid();

const texto = (valor: FormDataEntryValue | null) => (typeof valor === "string" && valor.trim() ? valor.trim() : null);

const primerError = (error: z.ZodError) => error.issues[0]?.message ?? "Revisa los datos del formulario.";

const instante = (local: string | null) => (local ? localAInstante(local, negocio.zonaHoraria) : null);

/** Toda acción pasa por aquí: valida la sesión antes de tocar nada y refresca la tienda y el panel al terminar. */
async function ejecutar(ruta: string, mensaje: string, accion: (repositorio: ReturnType<typeof crearGestionRepositorio>) => Promise<void>): Promise<EstadoAccion> {
  const repositorio = crearGestionRepositorio(await exigirAdmin());
  try {
    await accion(repositorio);
  } catch (error) {
    console.error(error);
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo; si sigue fallando, revisa la conexión con la base de datos." };
  }
  updateTag(ETIQUETA_CACHE_CATALOGO);
  revalidatePath(ruta);
  return { ok: true, mensaje };
}

const esquemaPrecio = z.object({
  varianteId: id,
  precioCop: z.number({ error: "Escribe el precio." }).int().min(1000, "El precio mínimo es $1.000."),
  disponible: z.boolean(),
});

export async function guardarPrecio(_previo: EstadoAccion, formulario: FormData): Promise<EstadoAccion> {
  const datos = esquemaPrecio.safeParse({
    varianteId: formulario.get("varianteId"),
    precioCop: leerEnteroCop(formulario.get("precio")),
    disponible: formulario.get("disponible") === "on",
  });
  if (!datos.success) return { ok: false, error: primerError(datos.error) };

  const costo = leerEnteroCop(formulario.get("costo"));
  // Si coincide con la regla deja de ser manual: así se vuelve al precio automático sin un control aparte.
  const manual = costo === undefined || datos.data.precioCop !== precioVenta(costo, negocio.reglaPrecio);
  return ejecutar("/admin/precios", "Guardado.", (r) =>
    r.guardarPrecio(datos.data.varianteId, { precioCop: datos.data.precioCop, disponible: datos.data.disponible, manual }),
  );
}

export async function guardarPromocion(_previo: EstadoAccion, formulario: FormData): Promise<EstadoAccion> {
  const datos = esquemaPromocion.safeParse({
    nombre: formulario.get("nombre"),
    tipo: formulario.get("tipo"),
    valor: leerEnteroCop(formulario.get("valor")),
    alcance: formulario.get("alcance"),
    marca: texto(formulario.get("marca")),
    productoIds: formulario.getAll("productoIds"),
  });
  if (!datos.success) return { ok: false, error: primerError(datos.error) };
  const vigencia = esquemaVigencia.safeParse({ inicia: texto(formulario.get("inicia")), termina: texto(formulario.get("termina")) });
  if (!vigencia.success) return { ok: false, error: primerError(vigencia.error) };
  const promocionId = id.nullable().safeParse(texto(formulario.get("id")));
  if (!promocionId.success) return { ok: false, error: "Promoción no válida." };

  return ejecutar("/admin/promociones", "Promoción guardada.", (r) =>
    r.guardarPromocion(promocionId.data, {
      ...datos.data,
      iniciaAt: instante(vigencia.data.inicia),
      terminaAt: instante(vigencia.data.termina),
    }),
  );
}

export async function guardarCombo(_previo: EstadoAccion, formulario: FormData): Promise<EstadoAccion> {
  let items: unknown;
  try {
    items = JSON.parse(String(formulario.get("items") ?? "[]"));
  } catch {
    return { ok: false, error: "Revisa los productos del combo." };
  }
  const datos = esquemaCombo.safeParse({
    nombre: formulario.get("nombre"),
    descripcion: texto(formulario.get("descripcion")),
    precioCop: leerEnteroCop(formulario.get("precio")),
    items,
  });
  if (!datos.success) return { ok: false, error: primerError(datos.error) };
  const vigencia = esquemaVigencia.safeParse({ inicia: texto(formulario.get("inicia")), termina: texto(formulario.get("termina")) });
  if (!vigencia.success) return { ok: false, error: primerError(vigencia.error) };
  const comboId = id.nullable().safeParse(texto(formulario.get("id")));
  if (!comboId.success) return { ok: false, error: "Combo no válido." };

  return ejecutar("/admin/combos", "Combo guardado.", (r) =>
    r.guardarCombo(comboId.data, { ...datos.data, iniciaAt: instante(vigencia.data.inicia), terminaAt: instante(vigencia.data.termina) }),
  );
}

export async function activarPromocion(promocionId: string, activa: boolean): Promise<EstadoAccion> {
  const valido = id.parse(promocionId);
  return ejecutar("/admin/promociones", activa ? "Promoción activada." : "Promoción pausada.", (r) => r.activarPromocion(valido, activa));
}

export async function eliminarPromocion(promocionId: string): Promise<EstadoAccion> {
  const valido = id.parse(promocionId);
  return ejecutar("/admin/promociones", "Promoción eliminada.", (r) => r.eliminarPromocion(valido));
}

export async function activarCombo(comboId: string, activo: boolean): Promise<EstadoAccion> {
  const valido = id.parse(comboId);
  return ejecutar("/admin/combos", activo ? "Combo activado." : "Combo pausado.", (r) => r.activarCombo(valido, activo));
}

export async function eliminarCombo(comboId: string): Promise<EstadoAccion> {
  const valido = id.parse(comboId);
  return ejecutar("/admin/combos", "Combo eliminado.", (r) => r.eliminarCombo(valido));
}
