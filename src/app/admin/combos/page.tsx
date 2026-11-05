import type { Metadata } from "next";
import { Suspense } from "react";
import { CombosConDatos } from "@/features/panel/gestion/ConDatos";
import { MarcoPanel } from "@/features/panel/MarcoPanel";

export const metadata: Metadata = { title: "Combos", robots: { index: false, follow: false } };

export default function PaginaCombos() {
  return (
    <MarcoPanel>
      <Suspense fallback={<p className="py-16 text-center text-sm text-tinta-suave">Cargando…</p>}>
        <CombosConDatos />
      </Suspense>
    </MarcoPanel>
  );
}
