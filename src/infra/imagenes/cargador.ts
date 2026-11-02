"use client";

/**
 * Las fotos oficiales vienen del CDN de Shopify, que ya redimensiona y sirve WebP/AVIF: se le pide el ancho
 * exacto en vez de pasar por el optimizador de Vercel. Las demás (PDF del distribuidor, URLs puestas a mano)
 * se sirven tal cual para no recomprimirlas; el ancho solo se agrega porque next/image exige usarlo.
 */
export default function cargarImagen({ src, width }: { src: string; width: number }): string {
  if (!src.startsWith("http")) return `${src}?w=${width}`;
  const url = new URL(src);
  url.searchParams.set(url.hostname === "cdn.shopify.com" ? "width" : "w", String(width));
  return url.toString();
}
