import Image from "next/image";
import Link from "next/link";
import { formatearCop } from "@/core/catalogo/precio";
import type { ComboResuelto } from "@/core/combos/combos";
import { obtenerCombos } from "@/features/catalogo/datos";
import { AgregarCombo } from "./AgregarCombo";

function TarjetaCombo({ combo }: { combo: ComboResuelto }) {
  const ahorro = combo.precioSueltoCop - combo.precioCop;
  const fotos = combo.piezas.filter((p) => p.imagen).slice(0, 3);

  return (
    <article className="flex h-full flex-col border border-linea p-4">
      {fotos.length > 0 && (
        <div className="mb-4 grid auto-cols-fr grid-flow-col gap-px bg-linea">
          {fotos.map((pieza) => (
            <div key={pieza.varianteId} className="relative aspect-square bg-vitrina">
              <Image
                src={pieza.imagen as string}
                alt=""
                fill
                sizes="(min-width: 1024px) 10vw, 30vw"
                className="object-contain p-2 mix-blend-multiply"
              />
            </div>
          ))}
        </div>
      )}
      <p className="font-mono text-micro uppercase tracking-wider text-tinta-suave">{combo.codigo}</p>
      <h3 className="mt-1 font-display text-2xl leading-tight">{combo.nombre}</h3>
      {combo.descripcion && <p className="mt-1 text-sm text-tinta-suave">{combo.descripcion}</p>}
      <ul className="mt-3 flex-1 space-y-1 text-sm">
        {combo.piezas.map((pieza) => (
          <li key={pieza.varianteId}>
            {pieza.cantidad > 1 && <span className="font-mono">{pieza.cantidad} × </span>}
            <Link href={`/p/${pieza.slug}`} className="underline-offset-4 hover:underline">
              {pieza.marca} {pieza.nombre}
            </Link>{" "}
            <span className="text-tinta-suave">{pieza.tamanoMl} ml</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-2xl font-medium tabular-nums">
        {formatearCop(combo.precioCop)}
        {ahorro > 0 && (
          <s className="text-sm font-normal text-tinta-suave">
            <span className="sr-only">Por separado </span>
            {formatearCop(combo.precioSueltoCop)}
          </s>
        )}
      </p>
      {ahorro > 0 && <p className="mb-1 text-xs text-tinta-suave">Ahorras {formatearCop(ahorro)}</p>}
      <div className="mt-3">
        <AgregarCombo combo={combo} />
      </div>
    </article>
  );
}

export async function SeccionCombos() {
  const combos = await obtenerCombos();
  if (!combos.length) return null;

  return (
    <section aria-labelledby="titulo-combos" className="mb-12">
      <h2 id="titulo-combos" className="mb-4 font-display text-3xl tracking-tight">
        Combos
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {combos.map((combo) => (
          <li key={combo.id}>
            <TarjetaCombo combo={combo} />
          </li>
        ))}
      </ul>
    </section>
  );
}
