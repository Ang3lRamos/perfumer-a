import type { Atributos } from "@/config/negocio";

const NIVELES = [
  { clave: "salida", nombre: "Salida", ayuda: "Lo primero que sientes" },
  { clave: "corazon", nombre: "Corazón", ayuda: "Cuando se asienta en la piel" },
  { clave: "fondo", nombre: "Fondo", ayuda: "Lo que permanece" },
] as const;

function Notas({ notas }: { notas: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {notas.map((nota) => (
        <li key={nota} className="rounded-etiqueta border border-linea px-2.5 py-1 text-sm">
          {nota}
        </li>
      ))}
    </ul>
  );
}

/** Notas por nivel si la marca las da así; si solo menciona notas sueltas, se muestran sin inventar el nivel. */
export function PiramideOlfativa({ atributos }: { atributos: Atributos }) {
  const { notas, notasClave } = atributos;
  const niveles = NIVELES.filter((n) => notas?.[n.clave].length);

  if (niveles.length) {
    return (
      <section aria-labelledby="titulo-notas">
        <h2 id="titulo-notas" className="mb-4 font-display text-3xl">
          Pirámide olfativa
        </h2>
        <ol className="divide-y divide-linea border-y border-linea">
          {niveles.map((nivel, i) => (
            <li key={nivel.clave} className="grid gap-3 py-4 sm:grid-cols-[9rem_1fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider">
                  0{i + 1} · {nivel.nombre}
                </p>
                <p className="mt-0.5 text-xs text-tinta-suave">{nivel.ayuda}</p>
              </div>
              <Notas notas={notas![nivel.clave]} />
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (!notasClave.length) return null;
  return (
    <section aria-labelledby="titulo-notas">
      <h2 id="titulo-notas" className="mb-4 font-display text-3xl">
        Notas principales
      </h2>
      <Notas notas={notasClave} />
    </section>
  );
}

/** Tres notas para la tarjeta del catálogo: primero las de salida, luego corazón y fondo. */
export function notasDestacadas(atributos: Atributos, cantidad = 3): string[] {
  const { notas, notasClave } = atributos;
  const todas = notas ? [...notas.salida, ...notas.corazon, ...notas.fondo] : notasClave;
  return todas.slice(0, cantidad);
}
