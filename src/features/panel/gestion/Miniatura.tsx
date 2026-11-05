import Image from "next/image";

/** Decorativa: el nombre del producto siempre va al lado. Sin foto de calidad queda el cuadro vacío, nunca la borrosa del PDF. */
export function Miniatura({ src }: { src: string | null }) {
  return (
    <span aria-hidden className="relative block h-10 w-10 shrink-0 bg-vitrina">
      {src && <Image src={src} alt="" fill sizes="40px" className="object-contain p-0.5 mix-blend-multiply" />}
    </span>
  );
}
