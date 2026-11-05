import { crearGestionRepositorio } from "@/infra/supabase/gestion-repositorio";
import { exigirAdmin } from "../autorizacion";
import { VistaCombos, VistaPrecios, VistaPromociones } from "./Vistas";

// Sin caché, como el tablero: incluyen costos y el dueño debe ver de inmediato lo que acaba de guardar.
async function repositorio() {
  return crearGestionRepositorio(await exigirAdmin());
}

export async function PreciosConDatos() {
  const r = await repositorio();
  return <VistaPrecios filas={await r.filasPrecio()} />;
}

export async function PromocionesConDatos() {
  const r = await repositorio();
  const [promociones, filas] = await Promise.all([r.promociones(), r.filasPrecio()]);
  return <VistaPromociones promociones={promociones} filas={filas} ahora={new Date()} />;
}

export async function CombosConDatos() {
  const r = await repositorio();
  const [combos, filas] = await Promise.all([r.combos(), r.filasPrecio()]);
  return <VistaCombos combos={combos} filas={filas} ahora={new Date()} />;
}
