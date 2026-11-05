import type { Metadata } from "next";
import { Suspense } from "react";
import { PromocionesConDatos } from "@/features/panel/gestion/ConDatos";
import { MarcoPanel } from "@/features/panel/MarcoPanel";

export const metadata: Metadata = { title: "Promociones", robots: { index: false, follow: false } };

export default function PaginaPromociones() {
  return (
    <MarcoPanel>
      <Suspense fallback={<p className="py-16 text-center text-sm text-tinta-suave">Cargando…</p>}>
        <PromocionesConDatos />
      </Suspense>
    </MarcoPanel>
  );
}
