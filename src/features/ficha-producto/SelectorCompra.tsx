"use client";

import { useState } from "react";
import { formatearCop } from "@/core/catalogo/precio";
import { mensajeDeInteres } from "@/core/catalogo/referencia";
import type { Producto } from "@/core/catalogo/tipos";
import { accionesCarrito } from "@/features/carrito/almacen";
import { abrirCarrito } from "@/features/carrito/estado-cajon";

const enlaceWhatsapp = (numero: string, texto: string) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

export function SelectorCompra({ producto, whatsapp, envio }: { producto: Producto; whatsapp: string; envio: string }) {
  const disponibles = producto.variantes.filter((v) => v.disponible && v.precioCop !== null);
  const [elegidaId, setElegidaId] = useState(disponibles[0]?.id);
  const elegida = disponibles.find((v) => v.id === elegidaId);

  if (!elegida || elegida.precioCop === null) {
    return (
      <div className="border border-linea p-4">
        <p className="font-medium">Agotado por ahora</p>
        <a
          href={enlaceWhatsapp(whatsapp, `Hola, ¿cuándo vuelve el ${producto.marca} ${producto.nombre}? (ref. ${producto.codigo})`)}
          className="mt-2 inline-block text-sm underline underline-offset-4 hover:text-acento"
        >
          Pregúntanos cuándo llega
        </a>
      </div>
    );
  }

  const linea = {
    varianteId: elegida.id,
    codigo: producto.codigo,
    marca: producto.marca,
    nombre: producto.nombre,
    slug: producto.slug,
    tamanoMl: elegida.tamanoMl,
    precioCop: elegida.precioCop,
    imagen: producto.imagenes[0] ?? null,
    cantidad: 1,
  };

  function agregarAlCarrito() {
    accionesCarrito.agregar(linea);
    abrirCarrito();
  }

  return (
    <div className="space-y-5">
      {disponibles.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-xs uppercase tracking-[0.14em] text-tinta-suave">Tamaño</legend>
          <div className="flex gap-2">
            {disponibles.map((variante) => (
              <button
                key={variante.id}
                type="button"
                aria-pressed={variante.id === elegidaId}
                onClick={() => setElegidaId(variante.id)}
                className="presion rounded-etiqueta border border-linea px-4 py-2 font-mono text-sm hover:border-tinta aria-pressed:border-tinta aria-pressed:bg-tinta aria-pressed:text-papel"
              >
                {variante.tamanoMl} ml
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <p className="text-3xl font-medium tabular-nums">{formatearCop(elegida.precioCop)}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={agregarAlCarrito}
          className="presion flex-1 rounded-etiqueta bg-acento px-6 py-4 font-medium text-sobre-acento hover:bg-acento-hover"
        >
          Agregar al carrito
        </button>
        <a
          href={enlaceWhatsapp(whatsapp, mensajeDeInteres(producto, elegida))}
          target="_blank"
          rel="noopener"
          className="presion flex flex-1 items-center justify-center rounded-etiqueta border border-tinta px-6 py-4 font-medium hover:bg-tinta hover:text-papel"
        >
          Preguntar por WhatsApp
        </a>
      </div>
      <p className="text-sm text-tinta-suave">
        Arma tu pedido y envíalo completo por WhatsApp. Pagas cuando lo recibes. {envio}
      </p>
    </div>
  );
}
