import Image from "next/image";
import Link from "next/link";
import { estaDisponible, precioDesde } from "@/core/catalogo/filtrar";
import { formatearCop } from "@/core/catalogo/precio";
import type { Producto } from "@/core/catalogo/tipos";

const CLASE_IMAGEN =
  "object-contain p-4 mix-blend-multiply transition-[opacity,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]";

export function TarjetaProducto({ producto, prioridad }: { producto: Producto; prioridad: boolean }) {
  const disponible = estaDisponible(producto);
  const precio = precioDesde(producto);
  const tamanos = producto.variantes.map((v) => v.tamanoMl).join(" / ");
  const variasVariantes = producto.variantes.filter((v) => v.disponible).length > 1;
  const [principal, segunda] = producto.imagenes;
  const alt = `${producto.marca} ${producto.nombre}`;

  return (
    <Link href={`/p/${producto.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-vitrina data-[agotado=true]:opacity-50" data-agotado={!disponible}>
        {principal && (
          <Image
            src={principal}
            alt={alt}
            fill
            priority={prioridad}
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw"
            className={`${CLASE_IMAGEN} ${segunda ? "group-hover:opacity-0" : "group-hover:scale-[1.03]"}`}
          />
        )}
        {/* En escritorio, pasar el cursor muestra la segunda foto de la galería. */}
        {segunda && (
          <Image
            src={segunda}
            alt=""
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 23vw, 31vw"
            className={`${CLASE_IMAGEN} opacity-0 group-hover:opacity-100`}
          />
        )}
        {!disponible && (
          <span className="absolute left-2 top-2 bg-superficie px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-tinta-suave">
            Agotado
          </span>
        )}
        {producto.imagenes.length > 1 && (
          <span className="absolute bottom-2 right-2 font-mono text-[10px] text-tinta-suave">
            {producto.imagenes.length} fotos
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
