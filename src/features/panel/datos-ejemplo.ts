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
