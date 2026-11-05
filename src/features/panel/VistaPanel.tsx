import type { ReactNode } from "react";
import { formatearCop } from "@/core/catalogo/precio";
import type { ResumenCatalogo, ResumenPedidos } from "@/core/panel/metricas";
import type { EstadoPedido } from "@/core/pedidos/estados";
import { BarrasHorizontales, ColumnasPorDia } from "./Graficos";

const FORMATO_PORCENTAJE = new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 1 });

// Distintas de ETIQUETAS_ESTADO, que le hablan al cliente: aquí el dueño necesita saber qué pasó de verdad.
const ESTADOS_PANEL: Record<EstadoPedido, string> = {
  pendiente_confirmacion: "Por confirmar",
  confirmado: "Confirmado",
  enviado_a_distribuidor: "Enviado al distribuidor",
  despachado: "Despachado",
  entregado: "Entregado",
  rechazado_en_puerta: "Rechazado en puerta",
  cancelado: "Cancelado",
};

function Dato({ etiqueta, valor, nota }: { etiqueta: string; valor: ReactNode; nota?: string }) {
  return (
    <div className="bg-papel p-4">
      <dt className="text-sm text-tinta-suave">{etiqueta}</dt>
      <dd className="mt-1 text-3xl font-medium tracking-tight">{valor}</dd>
      {nota && <dd className="mt-1 text-xs text-tinta-suave">{nota}</dd>}
    </div>
  );
}

function Seccion({ titulo, detalle, children }: { titulo: string; detalle?: string; children: ReactNode }) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="font-display text-3xl tracking-tight">{titulo}</h2>
        {detalle && <p className="mt-1 text-sm text-tinta-suave">{detalle}</p>}
      </header>
      {children}
    </section>
  );
}

function PedidosRecientes({ resumen, zonaHoraria }: { resumen: ResumenPedidos; zonaHoraria: string }) {
  const fecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: zonaHoraria });
  return (
    <div className="overflow-x-auto border border-linea">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-linea text-tinta-suave">
            <th scope="col" className="px-3 py-2 font-normal">Pedido</th>
            <th scope="col" className="px-3 py-2 font-normal">Fecha</th>
            <th scope="col" className="px-3 py-2 font-normal">Estado</th>
            <th scope="col" className="hidden px-3 py-2 text-right font-normal sm:table-cell">Unidades</th>
            <th scope="col" className="px-3 py-2 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {resumen.recientes.map((pedido) => (
            <tr key={pedido.numero} className="border-b border-linea last:border-0">
              <td className="px-3 py-2 font-mono">#{pedido.numero}</td>
              <td className="whitespace-nowrap px-3 py-2">{fecha.format(pedido.creadoAt)}</td>
              <td className="px-3 py-2">{ESTADOS_PANEL[pedido.estado]}</td>
              <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">{pedido.unidades}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatearCop(pedido.totalCop)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VistaPanel({
  pedidos,
  catalogo,
  dias,
  zonaHoraria,
}: {
  pedidos: ResumenPedidos;
  catalogo: ResumenCatalogo;
  dias: number;
  zonaHoraria: string;
}) {
  const sinPedidos = pedidos.recientes.length === 0;
  const filasCasas = catalogo.casas.map((c) => ({ etiqueta: c.marca, valor: c.productos }));
  if (catalogo.otrasCasas.casas > 0) {
    filasCasas.push({ etiqueta: `Otras ${catalogo.otrasCasas.casas} casas`, valor: catalogo.otrasCasas.productos });
  }

  return (
    <div className="space-y-14">
      <section>
        <h1 className="text-sm text-tinta-suave">Ventas entregadas, últimos {dias} días</h1>
        <p className="mt-1 text-6xl font-medium tracking-tight">{formatearCop(pedidos.ventasCop)}</p>
        <p className="mt-2 text-sm text-tinta-suave">
          {pedidos.entregados} entregados de {pedidos.pedidosDelPeriodo} creados. Contraentrega: solo cuenta lo que ya se cobró.
        </p>
        {sinPedidos && (
          <p className="mt-4 max-w-prose border border-linea p-3 text-sm">
            Todavía no hay pedidos en la base. El agente de pruebas los guarda en memoria; aparecerán aquí cuando se conecte
            a WhatsApp y Supabase.
          </p>
        )}
      </section>

      <dl className="grid grid-cols-2 gap-px border border-linea bg-linea lg:grid-cols-4">
        <Dato etiqueta="Por confirmar" valor={pedidos.porConfirmar} nota="Esperan tu revisión" />
        <Dato etiqueta="En curso" valor={pedidos.enCurso} nota={`${formatearCop(pedidos.valorEnCursoCop)} por cobrar`} />
        <Dato
          etiqueta="Ganancia"
          valor={formatearCop(pedidos.gananciaCop)}
          nota={
            pedidos.itemsSinCosto
              ? `Sin contar ${pedidos.itemsSinCosto} ${pedidos.itemsSinCosto === 1 ? "ítem" : "ítems"} sin costo`
              : `Sobre lo entregado en ${dias} días`
          }
        />
        <Dato
          etiqueta="Rechazo en puerta"
          valor={pedidos.tasaRechazo === null ? "—" : FORMATO_PORCENTAJE.format(pedidos.tasaRechazo)}
          nota={pedidos.tasaRechazo === null ? "Sin entregas cerradas aún" : `${pedidos.rechazados} sin recibir`}
        />
      </dl>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
        <Seccion titulo="Pedidos por día" detalle={`Creados en los últimos ${dias} días`}>
          <ColumnasPorDia datos={pedidos.porDia} />
        </Seccion>
        <Seccion titulo="Dónde están" detalle={`Estado actual de los pedidos de ${dias} días`}>
          <BarrasHorizontales filas={pedidos.porEstado.map((e) => ({ etiqueta: ESTADOS_PANEL[e.estado], valor: e.pedidos }))} />
        </Seccion>
      </div>

      {!sinPedidos && (
        <Seccion titulo="Últimos pedidos">
          <PedidosRecientes resumen={pedidos} zonaHoraria={zonaHoraria} />
        </Seccion>
      )}

      <Seccion titulo="Catálogo" detalle="Lo que está publicado en la tienda">
        <dl className="mb-8 grid grid-cols-2 gap-px border border-linea bg-linea lg:grid-cols-4">
          <Dato
            etiqueta="Productos activos"
            valor={catalogo.activos}
            nota={catalogo.inactivos ? `${catalogo.inactivos} inactivos` : undefined}
          />
          <Dato etiqueta="Tamaños disponibles" valor={catalogo.variantesDisponibles} nota={`de ${catalogo.variantes} publicados`} />
          <Dato
            etiqueta="Margen promedio"
            valor={catalogo.margenPromedio === null ? "—" : FORMATO_PORCENTAJE.format(catalogo.margenPromedio)}
            nota={catalogo.margenPromedio === null ? "Sin costos cargados" : "Sobre el costo del proveedor"}
          />
          <Dato etiqueta="Sin foto de calidad" valor={catalogo.sinFoto} nota={`${catalogo.sinVerificar} fichas sin verificar`} />
        </dl>
        <h3 className="mb-3 text-sm text-tinta-suave">Productos por casa</h3>
        <BarrasHorizontales filas={filasCasas} />
      </Seccion>
    </div>
  );
}
