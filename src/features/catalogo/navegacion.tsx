"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useMemo, useTransition, type ReactNode } from "react";

interface NavegacionCatalogo {
  parametros: URLSearchParams;
  pendiente: boolean;
  navegar: (siguientes: URLSearchParams) => void;
}

const Contexto = createContext<NavegacionCatalogo | null>(null);

/** Comparte la URL actual y el estado "cargando" entre los filtros y la grilla mientras el servidor re-renderiza. */
export function ProveedorNavegacion({ consulta, children }: { consulta: string; children: ReactNode }) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();

  const valor = useMemo(
    () => ({
      parametros: new URLSearchParams(consulta),
      pendiente,
      navegar: (siguientes: URLSearchParams) => {
        const texto = siguientes.toString();
        iniciarTransicion(() => router.replace(texto ? `/?${texto}` : "/", { scroll: false }));
      },
    }),
    [consulta, pendiente, router],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}

export function useNavegacionCatalogo(): NavegacionCatalogo {
  const valor = use(Contexto);
  if (!valor) throw new Error("useNavegacionCatalogo debe usarse dentro de ProveedorNavegacion");
  return valor;
}

export function ZonaResultados({ children }: { children: ReactNode }) {
  const { pendiente } = useNavegacionCatalogo();
  return (
    <div
      aria-busy={pendiente}
      className="transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)] data-[pendiente=true]:opacity-50"
      data-pendiente={pendiente}
    >
      {children}
    </div>
  );
}
