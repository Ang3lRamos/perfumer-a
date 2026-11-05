"use client";

import { useActionState } from "react";
import { entrar } from "./acciones";

const CLASE_CAMPO =
  "w-full rounded-etiqueta border border-linea bg-superficie px-3 py-3 text-base focus:border-tinta focus:outline-none";

export function FormularioEntrada() {
  const [estado, accion, enviando] = useActionState(entrar, null);

  return (
    <form action={accion} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="correo" className="text-sm">
          Correo
        </label>
        <input
          id="correo"
          name="correo"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          className={CLASE_CAMPO}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="clave" className="text-sm">
          Contraseña
        </label>
        <input id="clave" name="clave" type="password" required autoComplete="current-password" className={CLASE_CAMPO} />
      </div>
      {estado && (
        <p role="alert" className="border border-tinta px-3 py-2 text-sm">
          {estado.error}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="presion w-full rounded-etiqueta bg-acento px-6 py-3.5 font-medium text-sobre-acento hover:bg-acento-hover disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
