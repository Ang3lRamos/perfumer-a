import { negocio } from "@/config/negocio";
import { resumirCatalogo, resumirPedidos } from "@/core/panel/metricas";
import { crearPanelRepositorio } from "@/infra/supabase/panel-repositorio";
import { exigirAdmin } from "./autorizacion";
import { VistaPanel } from "./VistaPanel";

const DIAS_PANEL = 30;

// Sin caché a propósito: el dueño espera ver el pedido que acaba de entrar, y estos datos no deben quedar en un caché compartido.
export async function PanelConDatos() {
  const repositorio = crearPanelRepositorio(await exigirAdmin());
  const [pedidos, productos] = await Promise.all([repositorio.pedidos(), repositorio.productos()]);

  return (
    <VistaPanel
      pedidos={resumirPedidos(pedidos, { ahora: new Date(), dias: DIAS_PANEL, zonaHoraria: negocio.zonaHoraria })}
      catalogo={resumirCatalogo(productos)}
      dias={DIAS_PANEL}
      zonaHoraria={negocio.zonaHoraria}
    />
  );
}
