import Link from "next/link";
import { envPublico } from "@/config/env";
import { negocio, type Atributos } from "@/config/negocio";
import { fotosDeCalidad } from "@/core/catalogo/imagenes";
import type { Producto } from "@/core/catalogo/tipos";
import { EtiquetaProducto } from "@/ui/EtiquetaProducto";
import { GaleriaProducto } from "./GaleriaProducto";
import { SelectorCompra } from "./SelectorCompra";

const etiquetaDe = (clave: string, valor: string) =>
  negocio.filtros.find((f) => f.clave === clave)?.opciones.find((o) => o.valor === valor)?.etiqueta ?? valor;

const TIPOS: Record<Producto["tipo"], string> = {
  original: "Original",
  inspirado: "Fragancia inspirada",
  marca_propia: "Marca propia",
};

function Piramide({ notas }: { notas: NonNullable<Atributos["notas"]> }) {
  const niveles = [
    ["Salida", notas.salida],
    ["Corazón", notas.corazon],
    ["Fondo", notas.fondo],
  ] as const;
  return (
    <dl className="divide-y divide-linea border-y border-linea">
      {niveles
        .filter(([, lista]) => lista.length)
        .map(([nivel, lista]) => (
          <div key={nivel} className="grid grid-cols-[6rem_1fr] gap-4 py-3">
            <dt className="font-mono text-xs uppercase tracking-wider text-tinta-suave">{nivel}</dt>
            <dd>{lista.join(", ")}</dd>
          </div>
        ))}
    </dl>
  );
}

function Rasgos({ atributos }: { atributos: Atributos }) {
  const rasgos = [
    atributos.genero && ["Para", etiquetaDe("genero", atributos.genero)],
    atributos.familias.length && ["Familia", atributos.familias.map((f) => etiquetaDe("familias", f)).join(" · ")],
    atributos.ocasiones.length && ["Ocasión", atributos.ocasiones.map((o) => etiquetaDe("ocasiones", o)).join(" · ")],
    atributos.duracion && ["Duración", atributos.duracion.replace("_", " ")],
    atributos.estela && ["Estela", atributos.estela],
  ].filter((rasgo): rasgo is [string, string] => Array.isArray(rasgo));

  if (!rasgos.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
      {rasgos.map(([nombre, valor]) => (
        <div key={nombre}>
          <dt className="text-xs uppercase tracking-[0.14em] text-tinta-suave">{nombre}</dt>
          <dd className="mt-0.5 first-letter:uppercase">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FichaProducto({ producto }: { producto: Producto<Atributos> }) {
  const { atributos } = producto;
  const fotos = fotosDeCalidad(producto);
  return (
    <article className="grid gap-8 pt-6 lg:grid-cols-2 lg:gap-16 lg:pt-12">
      <div className="-mx-4 sm:mx-0 lg:sticky lg:top-6 lg:self-start">
        {fotos.length ? (
          <GaleriaProducto imagenes={fotos} alt={`${producto.marca} ${producto.nombre}`} />
        ) : (
          <div className="relative aspect-square">
            <EtiquetaProducto
              grande
              marca={producto.marca}
              nombre={producto.nombre}
              detalle={`${producto.variantes.map((v) => v.tamanoMl).join(" / ")} ml · ${producto.presentacion ?? ""}`}
            />
          </div>
        )}
      </div>
      <div className="space-y-8">
        <header>
          <Link href={`/?marca=${encodeURIComponent(producto.marca)}`} className="text-xs uppercase tracking-[0.14em] text-tinta-suave hover:text-tinta">
            {producto.marca}
          </Link>
          <h1 className="mt-1 font-display text-5xl leading-none sm:text-6xl">{producto.nombre}</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-tinta-suave">
            Ref. {producto.codigo} · {producto.presentacion ?? "Perfume"} · {TIPOS[producto.tipo]}
          </p>
          {producto.tipo === "inspirado" && producto.inspiracionNota && (
            <p className="mt-3 text-sm text-tinta-suave">{producto.inspiracionNota}</p>
          )}
        </header>
        <SelectorCompra
          producto={producto}
          whatsapp={envPublico.NEXT_PUBLIC_WHATSAPP_NUMERO}
          envio={negocio.cobertura.envio}
        />
        {producto.descripcion && <p className="leading-relaxed">{producto.descripcion}</p>}
        <Rasgos atributos={atributos} />
        {atributos.notas && <Piramide notas={atributos.notas} />}
      </div>
    </article>
  );
}
