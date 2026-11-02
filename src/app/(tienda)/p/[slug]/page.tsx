import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { precioDesde } from "@/core/catalogo/filtrar";
import { fotosDeCalidad } from "@/core/catalogo/imagenes";
import { formatearCop } from "@/core/catalogo/precio";
import { obtenerCatalogo, obtenerProducto } from "@/features/catalogo/datos";
import { FichaProducto } from "@/features/ficha-producto/FichaProducto";

export async function generateStaticParams() {
  const catalogo = await obtenerCatalogo();
  return catalogo.map((producto) => ({ slug: producto.slug }));
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const producto = await obtenerProducto((await params).slug);
  if (!producto) return {};
  const titulo = `${producto.marca} ${producto.nombre}`;
  const precio = precioDesde(producto);
  const descripcion = [
    `${titulo} ${producto.presentacion ?? ""}`.trim(),
    precio ? `desde ${formatearCop(precio)}` : null,
    "Pago contraentrega.",
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/p/${producto.slug}` },
    openGraph: { title: titulo, description: descripcion, images: fotosDeCalidad(producto).slice(0, 1) },
  };
}

export default async function PaginaProducto({ params }: PageProps<"/p/[slug]">) {
  const producto = await obtenerProducto((await params).slug);
  if (!producto) notFound();
  return <FichaProducto producto={producto} />;
}
