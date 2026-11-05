import type { Metadata } from "next";
import { Suspense } from "react";
import { MarcoPanel } from "@/features/panel/MarcoPanel";
import { PanelConDatos } from "@/features/panel/PanelConDatos";

export const metadata: Metadata = { title: "Panel", robots: { index: false, follow: false } };

export default function PaginaPanel() {
  return (
    <MarcoPanel>
      <Suspense fallback={<p className="py-16 text-center text-sm text-tinta-suave">Cargando el panel…</p>}>
        <PanelConDatos />
      </Suspense>
    </MarcoPanel>
  );
}
