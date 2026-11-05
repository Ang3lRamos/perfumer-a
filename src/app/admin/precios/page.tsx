import type { Metadata } from "next";
import { Suspense } from "react";
import { PreciosConDatos } from "@/features/panel/gestion/ConDatos";
import { MarcoPanel } from "@/features/panel/MarcoPanel";

export const metadata: Metadata = { title: "Precios", robots: { index: false, follow: false } };

export default function PaginaPrecios() {
  return (
    <MarcoPanel>
      <Suspense fallback={<p className="py-16 text-center text-sm text-tinta-suave">Cargando…</p>}>
        <PreciosConDatos />
      </Suspense>
    </MarcoPanel>
  );
}
