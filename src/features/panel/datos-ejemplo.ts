import type { Combo } from "@/core/combos/combos";
import type { FilaPrecio } from "@/core/panel/gestion";
import type { Promocion } from "@/core/promociones/promociones";
import type { PedidoPanel, ProductoPanel } from "@/core/panel/metricas";
import { ESTADOS_PEDIDO } from "@/core/pedidos/estados";

/** Solo para /dev/panel: permite ver el tablero lleno sin sesión de admin ni pedidos reales. */
export const AHORA_EJEMPLO = new Date("2026-11-05T17:00:00Z");

const DIAS_CON_PEDIDOS = [0, 1, 1, 3, 4, 4, 4, 6, 8, 9, 11, 11, 13, 14, 16, 18, 18, 18, 18, 21, 23, 24, 26, 28];

export const PEDIDOS_EJEMPLO: PedidoPanel[] = DIAS_CON_PEDIDOS.map((dias, i) => ({
  numero: 1001 + i,
  estado: dias > 10 ? (i % 7 === 0 ? "rechazado_en_puerta" : "entregado") : ESTADOS_PEDIDO[i % 4]!,
  creadoAt: new Date(AHORA_EJEMPLO.getTime() - dias * 86_400_000),
  items: [{ cantidad: (i % 2) + 1, precioUnitarioCop: 169_900 + i * 10_000, costoUnitarioCop: i % 9 === 0 ? null : 120_000 + i * 7_000 }],
}));

export const PRODUCTOS_EJEMPLO: ProductoPanel[] = [
  ...["Casa Larga De Ejemplo Con Nombre Extenso", "Casa B", "Casa C", "Casa D", "Casa E", "Casa F", "Casa G", "Casa H", "Casa I", "Casa J"].flatMap(
    (marca, i) =>
      Array.from({ length: 12 - i }, (_, j) => ({
        marca,
        activo: j !== 5,
        fichaVerificada: j % 3 !== 0,
        imagenes: j % 4 === 0 ? [] : ["https://cdn.shopify.com/ejemplo.webp"],
        variantes: [{ precioCop: 169_900, costoCop: 130_000, disponible: j % 6 !== 1 }],
      })),
  ),
];

const FOTO_EJEMPLO = "/productos/afnan-9pm-dive.webp";

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const fila = (n: number, marca: string, nombre: string, tamanoMl: number, precioCop: number | null, costoCop: number | null): FilaPrecio => ({
  varianteId: uuid(n),
  productoId: uuid(n + 100),
  codigo: `${marca.slice(0, 3).toUpperCase()}-${String(n).padStart(3, "0")}`,
  marca,
  nombre,
  tamanoMl,
  precioCop,
  costoCop,
  disponible: precioCop !== null,
  precioManual: n === 2,
  productoActivo: true,
  imagen: n % 4 === 0 ? null : FOTO_EJEMPLO,
});

export const FILAS_EJEMPLO: FilaPrecio[] = [
  fila(1, "Lattafa", "Khamrah", 100, 169900, 130000),
  fila(2, "Lattafa", "Yara", 100, 139900, 119000),
  fila(3, "Al Haramain", "Amber Oud Gold Edition con un nombre bastante largo", 120, 312900, 240000),
  fila(4, "Afnan", "9PM Night Out", 100, null, null),
];

export const PROMOCIONES_EJEMPLO: Promocion[] = [
  { id: uuid(201), nombre: "Lattafa de noviembre", tipo: "porcentaje", valor: 15, alcance: "marca", marca: "Lattafa", productoIds: [], activa: true, iniciaAt: null, terminaAt: "2026-11-30T23:59:00-05:00" },
  { id: uuid(202), nombre: "Navidad", tipo: "monto", valor: 20000, alcance: "todo", marca: null, productoIds: [], activa: true, iniciaAt: "2026-12-15T00:00:00-05:00", terminaAt: null },
  { id: uuid(203), nombre: "Liquidación", tipo: "porcentaje", valor: 40, alcance: "productos", marca: null, productoIds: [uuid(101)], activa: false, iniciaAt: null, terminaAt: null },
];

export const COMBOS_EJEMPLO: Combo[] = [
  { id: uuid(301), codigo: "CMB-001", nombre: "Dúo Lattafa", descripcion: "Para regalar.", precioCop: 279900, activo: true, iniciaAt: null, terminaAt: null, items: [{ varianteId: uuid(1), cantidad: 1 }, { varianteId: uuid(2), cantidad: 1 }] },
  { id: uuid(302), codigo: "CMB-002", nombre: "Noche", descripcion: null, precioCop: 450000, activo: true, iniciaAt: null, terminaAt: null, items: [{ varianteId: uuid(3), cantidad: 1 }, { varianteId: uuid(4), cantidad: 1 }] },
];
