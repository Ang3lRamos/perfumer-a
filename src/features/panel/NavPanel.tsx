"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { ruta: "/admin", etiqueta: "Tablero" },
  { ruta: "/admin/precios", etiqueta: "Precios" },
  { ruta: "/admin/promociones", etiqueta: "Promociones" },
  { ruta: "/admin/combos", etiqueta: "Combos" },
];

export function NavPanel() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones del panel" className="border-b border-linea">
      <ul className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 text-sm">
        {SECCIONES.map((seccion) => (
          <li key={seccion.ruta} className="shrink-0">
            <Link
              href={seccion.ruta}
              aria-current={ruta === seccion.ruta ? "page" : undefined}
              className="block border-b-2 border-transparent py-3 text-tinta-suave hover:text-tinta aria-[current=page]:border-tinta aria-[current=page]:text-tinta"
            >
              {seccion.etiqueta}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
