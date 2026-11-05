import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { negocio } from "@/config/negocio";
import { resumirCatalogo, resumirPedidos } from "@/core/panel/metricas";
import { AHORA_EJEMPLO, PEDIDOS_EJEMPLO, PRODUCTOS_EJEMPLO } from "@/features/panel/datos-ejemplo";
import { MarcoPanel } from "@/features/panel/MarcoPanel";
import { VistaPanel } from "@/features/panel/VistaPanel";

export const metadata: Metadata = { title: "Panel de ejemplo", robots: { index: false } };

export default function PaginaPanelEjemplo() {
  if (process.env.NODE_ENV !== "development") notFound();
  const zonaHoraria = negocio.zonaHoraria;
  return (
    <MarcoPanel>
      <p className="mb-8 border border-tinta px-3 py-2 font-mono text-micro uppercase tracking-wider">Datos de ejemplo</p>
      <VistaPanel
        pedidos={resumirPedidos(PEDIDOS_EJEMPLO, { ahora: AHORA_EJEMPLO, dias: 30, zonaHoraria })}
        catalogo={resumirCatalogo(PRODUCTOS_EJEMPLO)}
        dias={30}
        zonaHoraria={zonaHoraria}
      />
    </MarcoPanel>
  );
}
