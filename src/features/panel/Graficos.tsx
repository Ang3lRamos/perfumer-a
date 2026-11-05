export const etiquetaDia = (dia: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${dia}T12:00:00Z`));

const unidadPedidos = (cantidad: number) => `${cantidad} ${cantidad === 1 ? "pedido" : "pedidos"}`;

function alineacionAyuda(indice: number, total: number) {
  if (indice < total / 3) return "left-0";
  if (indice > (total * 2) / 3) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

/** Una sola serie: el título ya dice qué se mide, así que no lleva leyenda. La tabla da acceso sin depender del cursor. */
export function ColumnasPorDia({ datos }: { datos: { dia: string; pedidos: number }[] }) {
  const maximo = Math.max(...datos.map((d) => d.pedidos), 1);
  const total = datos.reduce((suma, d) => suma + d.pedidos, 0);
  const primero = datos[0];
  const ultimo = datos.at(-1);

  return (
    <figure>
      <div
        role="img"
        aria-label={`${unidadPedidos(total)} en ${datos.length} días. Máximo diario: ${maximo}.`}
        className="relative flex h-44 items-end gap-0.5 border-b border-linea pt-6"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 border-t border-linea pt-1 text-right font-mono text-micro tabular-nums text-tinta-suave">
          {maximo}
        </span>
        {datos.map(({ dia, pedidos }, i) => (
          <div key={dia} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
            {pedidos > 0 && (
              <div
                className="w-full max-w-6 rounded-t-etiqueta bg-tinta transition-opacity duration-[var(--dur-fast)] group-hover:opacity-70"
                style={{ height: `${(pedidos / maximo) * 100}%` }}
              />
            )}
            <span
              aria-hidden
              className={`pointer-events-none absolute -top-1 z-10 whitespace-nowrap bg-tinta px-2 py-1 text-xs text-papel opacity-0 transition-opacity duration-[var(--dur-fast)] group-hover:opacity-100 ${alineacionAyuda(i, datos.length)}`}
            >
              {etiquetaDia(dia)}: {unidadPedidos(pedidos)}
            </span>
          </div>
        ))}
      </div>
      {primero && ultimo && (
        <div aria-hidden className="mt-1.5 flex justify-between font-mono text-micro text-tinta-suave">
          <span>{etiquetaDia(primero.dia)}</span>
          <span>{etiquetaDia(ultimo.dia)}</span>
        </div>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer py-1 text-tinta-suave hover:text-tinta">Ver como tabla</summary>
        <div className="mt-2 max-h-64 overflow-y-auto border border-linea">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-linea text-tinta-suave">
                <th scope="col" className="px-3 py-2 font-normal">Día</th>
                <th scope="col" className="px-3 py-2 text-right font-normal">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {datos.map(({ dia, pedidos }) => (
                <tr key={dia} className="border-b border-linea last:border-0">
                  <td className="px-3 py-1.5">{etiquetaDia(dia)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{pedidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/** El valor va impreso en cada fila, así que la lista ya es su propia versión en tabla. */
export function BarrasHorizontales({ filas }: { filas: { etiqueta: string; valor: number }[] }) {
  const maximo = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <dl className="space-y-2.5">
      {filas.map(({ etiqueta, valor }) => (
        <div key={etiqueta} className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-3 text-sm">
          <dt className="truncate" title={etiqueta}>
            {etiqueta}
          </dt>
          <dd className="flex items-center gap-2">
            {valor > 0 && <span aria-hidden className="h-2 rounded-r-etiqueta bg-tinta" style={{ width: `calc((100% - 2.5rem) * ${valor / maximo})` }} />}
            <span className="tabular-nums text-tinta-suave">{valor}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
