/**
 * Reemplazo diseñado para productos sin foto de calidad: mejor una etiqueta sobria que una foto borrosa.
 * El frasco es un trazo genérico, no representa el envase real.
 */
export function EtiquetaProducto({
  marca,
  nombre,
  detalle,
  grande = false,
}: {
  marca: string;
  nombre: string;
  detalle: string;
  grande?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between bg-vitrina p-[8%] text-center">
      <p className="font-mono text-micro uppercase tracking-[0.2em] text-tinta-suave">{marca}</p>
      <svg
        aria-hidden
        viewBox="0 0 60 90"
        className={`${grande ? "w-[28%]" : "w-[34%]"} text-acento`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <rect x="23" y="2" width="14" height="12" rx="1" />
        <path d="M26 14v6h8v-6" />
        <rect x="6" y="20" width="48" height="66" rx="5" />
        <rect x="16" y="40" width="28" height="22" rx="1" strokeWidth="0.6" />
      </svg>
      <div className="space-y-1">
        <p className={`font-display leading-none ${grande ? "text-4xl sm:text-5xl" : "text-2xl"}`}>{nombre}</p>
        <p className="font-mono text-micro uppercase tracking-wider text-tinta-suave">{detalle}</p>
      </div>
    </div>
  );
}
