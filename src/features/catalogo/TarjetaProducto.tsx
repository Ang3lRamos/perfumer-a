import Image from "next/image";
import Link from "next/link";
import { estaDisponible, precioDesde } from "@/core/catalogo/filtrar";
import { formatearCop } from "@/core/catalogo/precio";
import type { Producto } from "@/core/catalogo/tipos";

export function TarjetaProducto({ producto, prioridad }: { producto: Producto; prioridad: boolean }) {
  const disponible = estaDisponible(producto);
  const precio = precioDesde(producto);
  const tamanos = producto.variantes.map((v) => v.tamanoMl).join(" / ");
  const variasVariantes = producto.variantes.filter((v) => v.disponible).length > 1;

  return (
    <Link href={`/p/${producto.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-vitrina">
        {producto.imagenUrl && (
          <Image
            src={producto.imagenUrl}
            alt={`${producto.marca} ${producto.nombre}`}
            fill
            priority={prioridad}
            sizes="(min-width: 1024px) 22vw, 48vw"
            // El fondo blanco de las fotos del distribuidor se funde con la vitrina.
            className="object-contain p-5 mix-blend-multiply transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03] data-[agotado=true]:opacity-40"
            data-agotado={!disponible}
          />
        )}
        {!disponible && (
          <span className="absolute left-2 top-2 bg-superficie px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-tinta-suave">
            Agotado
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-tinta-suave">
          {producto.codigo} · {tamanos} ml
        </p>
        <p className="text-xs uppercase tracking-[0.14em] text-tinta-suave">{producto.marca}</p>
        <h3 className="font-display text-xl leading-tight group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
          {producto.nombre}
        </h3>
        <p className="text-sm font-medium">
          {precio === null ? (
            <span className="text-agotado">Sin precio por ahora</span>
          ) : (
            <>
              {variasVariantes && <span className="font-normal text-tinta-suave">desde </span>}
              {formatearCop(precio)}
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
