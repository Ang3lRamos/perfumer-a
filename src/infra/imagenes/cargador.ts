"use client";

/**
 * Las fotos oficiales vienen del CDN de Shopify, que ya redimensiona y sirve WebP/AVIF: se le pide el ancho
 * exacto en vez de pasar por el optimizador de Vercel. Las locales (PDF del distribuidor) ya están en WebP
 * de alta calidad y se sirven tal cual para no recomprimirlas.
 */
export default function cargarImagen({ src, width }: { src: string; width: number }): string {
  if (src.startsWith("https://cdn.shopify.com/")) {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    return url.toString();
  }
  return `${src}?w=${width}`;
}
