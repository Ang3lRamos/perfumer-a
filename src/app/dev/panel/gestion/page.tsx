import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AHORA_EJEMPLO, COMBOS_EJEMPLO, FILAS_EJEMPLO, PROMOCIONES_EJEMPLO } from "@/features/panel/datos-ejemplo";
import { VistaCombos, VistaPrecios, VistaPromociones } from "@/features/panel/gestion/Vistas";
import { MarcoPanel } from "@/features/panel/MarcoPanel";

export const metadata: Metadata = { title: "Gestión de ejemplo", robots: { index: false } };

export default function PaginaGestionEjemplo() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <MarcoPanel>
      <p className="mb-8 border border-tinta px-3 py-2 font-mono text-micro uppercase tracking-wider">
        Datos de ejemplo: guardar aquí pide sesión de admin
      </p>
      <div className="space-y-20">
        <VistaPrecios filas={FILAS_EJEMPLO} />
        <VistaPromociones promociones={PROMOCIONES_EJEMPLO} filas={FILAS_EJEMPLO} ahora={AHORA_EJEMPLO} />
        <VistaCombos combos={COMBOS_EJEMPLO} filas={FILAS_EJEMPLO} ahora={AHORA_EJEMPLO} />
      </div>
    </MarcoPanel>
  );
}
