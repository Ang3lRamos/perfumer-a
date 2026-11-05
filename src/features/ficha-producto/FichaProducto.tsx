import Link from "next/link";
import { envPublico } from "@/config/env";
import { negocio, type Atributos } from "@/config/negocio";
import { fotosDeCalidad } from "@/core/catalogo/imagenes";
import type { Producto } from "@/core/catalogo/tipos";
import { EtiquetaProducto } from "@/ui/EtiquetaProducto";
import { GaleriaProducto } from "./GaleriaProducto";
import { PiramideOlfativa } from "./PiramideOlfativa";
import { SelectorCompra } from "./SelectorCompra";

const etiquetaDe = (clave: string, valor: string) =>
  negocio.filtros.find((f) => f.clave === clave)?.opciones.find((o) => o.valor === valor)?.etiqueta ?? valor;

const enumerar = (valores: string[]) =>
  valores.length > 1 ? `${valores.slice(0, -1).join(", ")} y ${valores.at(-1)}` : (valores[0] ?? "");

const TIPOS: Record<Producto["tipo"], string> = {
  original: "Original",
  inspirado: "Fragancia inspirada",
  marca_propia: "Marca propia",
};

const CONCENTRACIONES: Record<string, string> = {
  EDP: "Eau de Parfum",
  Parfum: "Parfum",
  "Extrait de Parfum": "Extrait de Parfum",
};

/** Sin descripción de la marca, se arma una frase solo con datos de la ficha: nada inventado. */
function descripcionBase(producto: Producto<Atributos>): string | null {
  const familias = producto.atributos.familias.map((f) => etiquetaDe("familias", f).toLowerCase());
  if (!familias.length) return null;
  const para = producto.atributos.genero ? `, ${etiquetaDe("genero", producto.atributos.genero).toLowerCase()}` : "";
  return `Una fragancia ${enumerar(familias)}${para}, de la casa ${producto.marca}.`;
}

function Rasgos({ producto }: { producto: Producto<Atributos> }) {
  const { atributos } = producto;
  const rasgos = [
    atributos.genero && ["Para", etiquetaDe("genero", atributos.genero)],
    atributos.familias.length && ["Familia", atributos.familias.map((f) => etiquetaDe("familias", f)).join(" · ")],
    atributos.ocasiones.length && ["Ideal para", atributos.ocasiones.map((o) => etiquetaDe("ocasiones", o)).join(" · ")],
    producto.presentacion && ["Concentración", CONCENTRACIONES[producto.presentacion] ?? producto.presentacion],
    ["Tamaño", producto.variantes.map((v) => `${v.tamanoMl} ml`).join(" / ")],
    atributos.duracion && ["Duración", atributos.duracion.replace("_", " ")],
    atributos.estela && ["Estela", atributos.estela],
  ].filter((rasgo): rasgo is [string, string] => Array.isArray(rasgo));

  return (
    <dl className="grid grid-cols-2 gap-px border border-linea bg-linea">
      {rasgos.map(([nombre, valor]) => (
        <div key={nombre} className="bg-papel p-4">
          <dt className="text-micro uppercase tracking-[0.14em] text-tinta-suave">{nombre}</dt>
          <dd className="mt-1 first-letter:uppercase">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FichaProducto({ producto }: { producto: Producto<Atributos> }) {
  const fotos = fotosDeCalidad(producto);
  const descripcion = producto.descripcion ?? descripcionBase(producto);

  return (
    <>
      <nav className="pt-2" aria-label="Ruta">
        <Link href="/" className="inline-block py-2 font-mono text-micro uppercase tracking-wider text-tinta-suave hover:text-tinta">
          ← Volver al catálogo
        </Link>
      </nav>
      <article className="grid gap-8 pt-2 lg:grid-cols-2 lg:gap-16 lg:pt-6">
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
        <div className="space-y-10">
          <header className="space-y-4">
            <div>
              <Link
                href={`/?marca=${encodeURIComponent(producto.marca)}`}
                className="text-xs uppercase tracking-[0.14em] text-tinta-suave hover:text-tinta"
              >
                {producto.marca}
              </Link>
              <h1 className="mt-1 font-display text-5xl leading-none tracking-tight sm:text-6xl">{producto.nombre}</h1>
              <p className="mt-3 font-mono text-xs uppercase tracking-wider text-tinta-suave">
                Ref. {producto.codigo} · {TIPOS[producto.tipo]}
              </p>
            </div>
            {descripcion && <p className="max-w-prose text-lg leading-relaxed">{descripcion}</p>}
            {producto.tipo === "inspirado" && producto.inspiracionNota && (
              <p className="text-sm text-tinta-suave">{producto.inspiracionNota}</p>
            )}
          </header>
          <SelectorCompra producto={producto} whatsapp={envPublico.NEXT_PUBLIC_WHATSAPP_NUMERO} envio={negocio.cobertura.envio} />
          <PiramideOlfativa atributos={producto.atributos} />
          <Rasgos producto={producto} />
        </div>
      </article>
    </>
  );
}
