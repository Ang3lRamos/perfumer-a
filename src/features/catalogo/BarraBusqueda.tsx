"use client";

import { useEffect, useState } from "react";
import { useNavegacionCatalogo } from "./navegacion";
import { ORDENES } from "./parametros";

const ESPERA_BUSQUEDA_MS = 300;

export function BarraBusqueda() {
  const { parametros, navegar } = useNavegacionCatalogo();
  const consultaActual = parametros.get("q") ?? "";
  const [texto, setTexto] = useState(consultaActual);

  useEffect(() => {
    if (texto.trim() === consultaActual) return;
    const espera = setTimeout(() => {
      const siguientes = new URLSearchParams(parametros);
      if (texto.trim()) siguientes.set("q", texto.trim());
      else siguientes.delete("q");
      navegar(siguientes);
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto, consultaActual, parametros, navegar]);

  return (
    <input
      type="search"
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      placeholder="Buscar por nombre, casa o código"
      aria-label="Buscar perfumes"
      className="min-w-0 flex-1 rounded-etiqueta border border-linea bg-superficie px-3 py-2 text-sm placeholder:text-tinta-suave focus:border-tinta focus:outline-none"
    />
  );
}

export function SelectorOrden() {
  const { parametros, navegar } = useNavegacionCatalogo();
  return (
    <select
      aria-label="Ordenar"
      value={parametros.get("orden") ?? "relevancia"}
      onChange={(evento) => {
        const siguientes = new URLSearchParams(parametros);
        if (evento.target.value === "relevancia") siguientes.delete("orden");
        else siguientes.set("orden", evento.target.value);
        navegar(siguientes);
      }}
      className="rounded-etiqueta border border-linea bg-superficie px-2 py-2 text-sm"
    >
      {ORDENES.map((orden) => (
        <option key={orden.valor} value={orden.valor}>
          {orden.etiqueta}
        </option>
      ))}
    </select>
  );
}
