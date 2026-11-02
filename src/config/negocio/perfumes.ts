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
    { clave: "genero", etiqueta: "Para", opciones: GENEROS },
    { clave: "familias", etiqueta: "Familia olfativa", opciones: FAMILIAS },
    { clave: "ocasiones", etiqueta: "Ocasión", opciones: OCASIONES },
  ],
  rangosPrecio: [
    { valor: "0-130000", etiqueta: "Hasta $130.000" },
    { valor: "130000-180000", etiqueta: "$130.000 – $180.000" },
    { valor: "180000-250000", etiqueta: "$180.000 – $250.000" },
    { valor: "250000-", etiqueta: "Más de $250.000" },
  ],
  cobertura: {
    ciudadesContraentrega: ["Bogotá"],
    metodosPago: ["contraentrega"],
  },
} satisfies ConfiguracionNegocio<typeof atributosPerfume>;
