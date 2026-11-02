import { z } from "zod";
import type { ConfiguracionNegocio, Opcion } from "./tipos";

const GENEROS: Opcion[] = [
  { valor: "masculino", etiqueta: "Masculino" },
  { valor: "femenino", etiqueta: "Femenino" },
  { valor: "unisex", etiqueta: "Unisex" },
];

const FAMILIAS: Opcion[] = [
  { valor: "amaderado", etiqueta: "Amaderado" },
  { valor: "oriental", etiqueta: "Oriental" },
  { valor: "gourmand", etiqueta: "Gourmand" },
  { valor: "floral", etiqueta: "Floral" },
  { valor: "frutal", etiqueta: "Frutal" },
  { valor: "citrico", etiqueta: "Cítrico" },
  { valor: "aromatico", etiqueta: "Aromático" },
  { valor: "acuatico", etiqueta: "Acuático" },
];

const OCASIONES: Opcion[] = [
  { valor: "dia", etiqueta: "Día a día" },
  { valor: "oficina", etiqueta: "Oficina" },
  { valor: "noche", etiqueta: "Noche" },
  { valor: "citas", etiqueta: "Citas" },
  { valor: "eventos", etiqueta: "Eventos" },
];

const valores = (opciones: Opcion[]) => opciones.map((o) => o.valor) as [string, ...string[]];

const atributosPerfume = z.object({
  genero: z.enum(valores(GENEROS)).optional(),
  familias: z.array(z.enum(valores(FAMILIAS))).max(3).default([]),
  ocasiones: z.array(z.enum(valores(OCASIONES))).default([]),
  notas: z
    .object({
      salida: z.array(z.string()).default([]),
      corazon: z.array(z.string()).default([]),
      fondo: z.array(z.string()).default([]),
    })
    .optional(),
  duracion: z.enum(["moderada", "larga", "muy_larga"]).optional(),
  estela: z.enum(["suave", "moderada", "intensa"]).optional(),
});

export type AtributosPerfume = z.infer<typeof atributosPerfume>;

export const perfumes = {
  nombreTienda: "Oud & Ámbar",
  descripcionTienda: "Perfumería árabe y de nicho original. Pago contraentrega en Bogotá.",
  moneda: "COP",
  nombreProducto: { singular: "perfume", plural: "perfumes" },
  atributos: atributosPerfume,
  filtros: [
    { clave: "genero", etiqueta: "Para", opciones: GENEROS, unico: true },
    { clave: "familias", etiqueta: "Familia olfativa", opciones: FAMILIAS },
    { clave: "ocasiones", etiqueta: "Ocasión", opciones: OCASIONES },
  ],
  rangosPrecio: [
    { valor: "0-170000", etiqueta: "Hasta $170.000" },
    { valor: "170000-230000", etiqueta: "$170.000 – $230.000" },
    { valor: "230000-300000", etiqueta: "$230.000 – $300.000" },
    { valor: "300000-", etiqueta: "Más de $300.000" },
  ],
  cobertura: {
    ciudadesContraentrega: ["Bogotá"],
    metodosPago: ["contraentrega"],
    envio: "El envío se cobra aparte y te confirmamos el valor por WhatsApp.",
  },
  reglaPrecio: { margenSobreCosto: 0.3, terminacion: "900" },
  agente: {
    persona:
      "Hablas como una persona del equipo: cercana, amable y en español colombiano neutro (tuteas, sin regionalismos " +
      "fuertes ni exceso de emojis). Conoces de perfumería y recomiendas con criterio: preguntas para quién es, qué " +
      "aromas le gustan y para qué ocasión antes de sugerir. Todos los perfumes son originales.",
  },
} satisfies ConfiguracionNegocio<typeof atributosPerfume>;
