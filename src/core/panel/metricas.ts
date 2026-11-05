import { fotosDeCalidad } from "../catalogo/imagenes";
import { ESTADOS_PEDIDO, type EstadoPedido } from "../pedidos/estados";

export interface ItemPanel {
  cantidad: number;
  precioUnitarioCop: number;
  costoUnitarioCop: number | null;
}

export interface PedidoPanel {
  numero: number;
  estado: EstadoPedido;
  creadoAt: Date;
  items: ItemPanel[];
}

export interface VariantePanel {
  precioCop: number | null;
  costoCop: number | null;
  disponible: boolean;
}

export interface ProductoPanel {
  marca: string;
  activo: boolean;
  fichaVerificada: boolean;
  imagenes: string[];
  variantes: VariantePanel[];
}

export interface PanelRepositorio {
  pedidos(): Promise<PedidoPanel[]>;
  productos(): Promise<ProductoPanel[]>;
}

const EN_CURSO: EstadoPedido[] = ["confirmado", "enviado_a_distribuidor", "despachado"];
const MS_POR_DIA = 86_400_000;

const totalDe = (pedido: PedidoPanel) =>
  pedido.items.reduce((suma, item) => suma + item.precioUnitarioCop * item.cantidad, 0);

/** Clave AAAA-MM-DD del día local del negocio: un pedido de las 8 p. m. en Bogotá no cae en el día UTC siguiente. */
export function diaLocal(fecha: Date, zonaHoraria: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zonaHoraria }).format(fecha);
}

export function resumirPedidos(
  pedidos: PedidoPanel[],
  { ahora, dias, zonaHoraria }: { ahora: Date; dias: number; zonaHoraria: string },
) {
  const claves = Array.from({ length: dias }, (_, i) =>
    diaLocal(new Date(ahora.getTime() - (dias - 1 - i) * MS_POR_DIA), zonaHoraria),
  );
  const conteoPorDia = new Map(claves.map((dia) => [dia, 0]));
  const delPeriodo = pedidos.filter((pedido) => {
    const dia = diaLocal(pedido.creadoAt, zonaHoraria);
    if (!conteoPorDia.has(dia)) return false;
    conteoPorDia.set(dia, (conteoPorDia.get(dia) ?? 0) + 1);
    return true;
  });

  const entregados = delPeriodo.filter((p) => p.estado === "entregado");
  const rechazados = delPeriodo.filter((p) => p.estado === "rechazado_en_puerta").length;
  const itemsEntregados = entregados.flatMap((p) => p.items);
  const enCurso = pedidos.filter((p) => EN_CURSO.includes(p.estado));
  const cerrados = entregados.length + rechazados;

  return {
    // Lo pendiente no caduca con el periodo: un pedido viejo sin atender es justo el que hay que ver.
    porConfirmar: pedidos.filter((p) => p.estado === "pendiente_confirmacion").length,
    enCurso: enCurso.length,
    valorEnCursoCop: enCurso.reduce((suma, p) => suma + totalDe(p), 0),
    pedidosDelPeriodo: delPeriodo.length,
    entregados: entregados.length,
    rechazados,
    tasaRechazo: cerrados ? rechazados / cerrados : null,
    ventasCop: entregados.reduce((suma, p) => suma + totalDe(p), 0),
    gananciaCop: itemsEntregados.reduce(
      (suma, i) => suma + (i.costoUnitarioCop === null ? 0 : (i.precioUnitarioCop - i.costoUnitarioCop) * i.cantidad),
      0,
    ),
    // Sin costo no se puede saber la ganancia: se avisa en vez de contarla como si fuera todo utilidad.
    itemsSinCosto: itemsEntregados.filter((i) => i.costoUnitarioCop === null).length,
    porDia: claves.map((dia) => ({ dia, pedidos: conteoPorDia.get(dia) ?? 0 })),
    porEstado: ESTADOS_PEDIDO.map((estado) => ({
      estado,
      pedidos: delPeriodo.filter((p) => p.estado === estado).length,
    })),
    recientes: [...pedidos]
      .sort((a, b) => b.creadoAt.getTime() - a.creadoAt.getTime())
      .slice(0, 8)
      .map((p) => ({
        numero: p.numero,
        estado: p.estado,
        creadoAt: p.creadoAt,
        unidades: p.items.reduce((suma, i) => suma + i.cantidad, 0),
        totalCop: totalDe(p),
      })),
  };
}

export function resumirCatalogo(productos: ProductoPanel[], casasVisibles = 8) {
  const activos = productos.filter((p) => p.activo);
  const variantes = activos.flatMap((p) => p.variantes);
  const margenes = variantes.flatMap((v) =>
    v.precioCop !== null && v.costoCop !== null ? [v.precioCop / v.costoCop - 1] : [],
  );

  const conteoCasas = new Map<string, number>();
  for (const { marca } of activos) conteoCasas.set(marca, (conteoCasas.get(marca) ?? 0) + 1);
  const casas = [...conteoCasas.entries()]
    .map(([marca, cantidad]) => ({ marca, productos: cantidad }))
    .sort((a, b) => b.productos - a.productos || a.marca.localeCompare(b.marca));
  const otras = casas.slice(casasVisibles);

  return {
    activos: activos.length,
    inactivos: productos.length - activos.length,
    variantes: variantes.length,
    variantesDisponibles: variantes.filter((v) => v.disponible).length,
    sinFoto: activos.filter((p) => fotosDeCalidad(p).length === 0).length,
    sinVerificar: activos.filter((p) => !p.fichaVerificada).length,
    margenPromedio: margenes.length ? margenes.reduce((suma, m) => suma + m, 0) / margenes.length : null,
    casas: casas.slice(0, casasVisibles),
    otrasCasas: { casas: otras.length, productos: otras.reduce((suma, c) => suma + c.productos, 0) },
  };
}

export type ResumenPedidos = ReturnType<typeof resumirPedidos>;
export type ResumenCatalogo = ReturnType<typeof resumirCatalogo>;
