"use client";

import { useState, type FormEvent } from "react";

interface Paso {
  herramienta: string;
  entrada: unknown;
  ok: boolean;
  resultado: unknown;
}

interface Burbuja {
  autor: "cliente" | "agente" | "sistema";
  texto: string;
  pasos?: Paso[];
}

interface RespuestaApi {
  resultado:
    | { tipo: "respuesta"; texto: string; escalado: boolean; traza: Paso[] }
    | { tipo: "duplicado" | "en_manos_humanas" | "limite_de_mensajes" };
  modo: "agente" | "humano";
  avisos: string[];
  pedidos: { numero: number; estado: string; totalCop: number }[];
}

const SIN_RESPUESTA: Record<string, string> = {
  en_manos_humanas: "Conversación en modo humano: el agente no responde.",
  duplicado: "Mensaje duplicado: no se procesó.",
  limite_de_mensajes: "Demasiados mensajes por minuto: se ignoró.",
};

function TrazaHerramientas({ pasos }: { pasos: Paso[] }) {
  return (
    <details className="mt-1 text-xs text-tinta-suave">
      <summary className="cursor-pointer font-mono">{pasos.map((p) => `${p.ok ? "✓" : "✗"} ${p.herramienta}`).join("  ")}</summary>
      <pre className="mt-1 max-h-64 overflow-auto bg-vitrina p-2 font-mono text-[11px] whitespace-pre-wrap">
        {JSON.stringify(pasos, null, 2)}
      </pre>
    </details>
  );
}

export function ChatDesarrollo() {
  const [telefono, setTelefono] = useState("573001112233");
  const [texto, setTexto] = useState("");
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [estado, setEstado] = useState<Omit<RespuestaApi, "resultado"> | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    setTexto("");
    setEnviando(true);
    setBurbujas((b) => [...b, { autor: "cliente", texto: mensaje }]);
    try {
      const respuesta = await fetch("/api/dev/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono, texto: mensaje }),
      });
      if (!respuesta.ok) throw new Error(await respuesta.text());
      const { resultado, ...resto }: RespuestaApi = await respuesta.json();
      setEstado(resto);
      setBurbujas((b) => [
        ...b,
        resultado.tipo === "respuesta"
          ? { autor: "agente", texto: resultado.texto, pasos: resultado.traza }
          : { autor: "sistema", texto: SIN_RESPUESTA[resultado.tipo] },
      ]);
    } catch (error) {
      setBurbujas((b) => [...b, { autor: "sistema", texto: `Error: ${error instanceof Error ? error.message : error}` }]);
    } finally {
      setEnviando(false);
    }
  }

  async function reiniciar() {
    await fetch("/api/dev/chat", { method: "DELETE" });
    setBurbujas([]);
    setEstado(null);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 lg:grid-cols-[1fr_18rem]">
      <section className="flex h-[85dvh] flex-col border border-linea">
        <header className="flex items-center gap-2 border-b border-linea p-3">
          <h1 className="font-display text-2xl">Chat de pruebas</h1>
          <span className="ml-auto font-mono text-xs text-tinta-suave">modo: {estado?.modo ?? "agente"}</span>
        </header>
        <ol className="flex-1 space-y-3 overflow-y-auto bg-vitrina p-4" aria-live="polite">
          {burbujas.map((b, i) => (
            <li key={i} className={b.autor === "cliente" ? "ml-auto max-w-[80%]" : "max-w-[80%]"}>
              <p
                className={`px-3 py-2 text-sm whitespace-pre-wrap ${
                  b.autor === "cliente" ? "bg-tinta text-papel" : b.autor === "agente" ? "bg-superficie" : "font-mono text-xs text-tinta-suave"
                }`}
              >
                {b.texto}
              </p>
              {b.pasos && b.pasos.length > 0 && <TrazaHerramientas pasos={b.pasos} />}
            </li>
          ))}
          {enviando && <li className="font-mono text-xs text-tinta-suave">escribiendo…</li>}
        </ol>
        <form onSubmit={enviar} className="flex gap-2 border-t border-linea p-3">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe como si fueras el cliente"
            aria-label="Mensaje"
            className="flex-1 border border-linea px-3 py-2 text-sm focus:border-tinta focus:outline-none"
          />
          <button type="submit" disabled={enviando} className="bg-tinta px-4 text-sm text-papel disabled:opacity-50">
            Enviar
          </button>
        </form>
      </section>

      <aside className="space-y-5 text-sm">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-tinta-suave">Teléfono del cliente</span>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
            className="mt-1 w-full border border-linea px-2 py-1.5 font-mono"
          />
        </label>
        <button type="button" onClick={reiniciar} className="w-full border border-tinta py-2">
          Reiniciar conversaciones
        </button>
        <section>
          <h2 className="text-xs uppercase tracking-[0.14em] text-tinta-suave">Avisos al dueño</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {(estado?.avisos ?? []).map((aviso, i) => (
              <li key={i}>{aviso}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xs uppercase tracking-[0.14em] text-tinta-suave">Pedidos creados</h2>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {(estado?.pedidos ?? []).map((p) => (
              <li key={p.numero}>
                #{p.numero} · {p.estado} · ${p.totalCop.toLocaleString("es-CO")}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
