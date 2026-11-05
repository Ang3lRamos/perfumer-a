"use client";

export default function ErrorPanel({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-3xl tracking-tight">No pudimos cargar el panel.</h1>
      <p className="mt-2 text-sm text-tinta-suave">Puede ser la conexión con la base de datos.</p>
      <button
        type="button"
        onClick={retry}
        className="presion mt-6 rounded-etiqueta bg-acento px-6 py-3 font-medium text-sobre-acento hover:bg-acento-hover"
      >
        Reintentar
      </button>
    </main>
  );
}
