import { z } from "zod";
import { armarPedido } from "../../pedidos/armar-pedido";
import { ETIQUETAS_ESTADO } from "../../pedidos/estados";
import type { ConfigAgente, Herramienta } from "./tipos";

const MAX_UNIDADES = 10;

export function crearPedido(config: ConfigAgente) {
  const esquema = z.object({
    nombre: z.string().min(3).describe("Nombre completo de quien recibe"),
    direccion: z.string().min(5),
    barrio: z.string().min(2),
    ciudad: z.string().min(3),
    items: z
      .array(
        z.object({
          codigo: z.string(),
          tamano_ml: z.number().int().positive(),
          cantidad: z.number().int().min(1).max(MAX_UNIDADES),
        }),
      )
      .optional()
      .describe("Productos sueltos"),
    combos: z
      .array(z.object({ codigo: z.string().describe("Código del combo, ej. CMB-001"), cantidad: z.number().int().min(1).max(MAX_UNIDADES) }))
      .optional()
      .describe("Combos pedidos. Sus productos no se repiten en items."),
    notas: z.string().optional().describe("Indicaciones de entrega, ej. 'apto 302, dejar en portería'"),
  });

  return {
    nombre: "crear_pedido",
    descripcion:
      "Registra el pedido cuando el cliente ya confirmó productos y datos de envío. " +
      "Queda pendiente de confirmación por el equipo; nunca se confirma solo. Los precios los pone el sistema.",
    esquema,
    async ejecutar(entrada, { deps, conversacion, cliente }) {
      const envio = {
        nombre: entrada.nombre,
        telefono: cliente.telefono,
        direccion: entrada.direccion,
        barrio: entrada.barrio,
        ciudad: entrada.ciudad,
      };
      const armado = armarPedido(
        (entrada.items ?? []).map((i) => ({ codigo: i.codigo, tamanoMl: i.tamano_ml, cantidad: i.cantidad })),
        envio,
        await deps.catalogo.listarActivos(),
        config.ciudadesCobertura,
        { solicitados: entrada.combos ?? [], disponibles: entrada.combos?.length ? await deps.catalogo.listarCombos() : [] },
      );
      if (!armado.ok) return { ok: false, error: armado.motivo };

      const pedido = await deps.pedidos.crear({
        clienteId: cliente.id,
        conversacionId: conversacion.id,
        envio,
        items: armado.items,
        totalCop: armado.totalCop,
        notas: entrada.notas ?? null,
      });
      await deps.conversaciones.actualizarCliente(cliente.id, {
        nombre: envio.nombre,
        direccion: envio.direccion,
        barrio: envio.barrio,
        ciudad: envio.ciudad,
      });
      await deps.eventos.registrar({ tipo: "pedido_creado", conversacionId: conversacion.id, pedidoId: pedido.id });
      await deps.notificador.pedidoNuevo({ conversacionId: conversacion.id, numero: pedido.numero, totalCop: pedido.totalCop });

      return {
        ok: true,
        datos: {
          numero: pedido.numero,
          estado: ETIQUETAS_ESTADO[pedido.estado],
          items: pedido.items.map((i) => ({ descripcion: i.descripcion, ml: i.tamanoMl, cantidad: i.cantidad, precio_unitario: i.precioUnitarioCop })),
          total_sin_envio: pedido.totalCop,
          envio: config.textoEnvio,
        },
        montos: [pedido.totalCop, ...pedido.items.flatMap((i) => [i.precioUnitarioCop, i.precioUnitarioCop * i.cantidad])],
      };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}

export function consultarEstadoPedido() {
  const esquema = z.object({ numero: z.number().int().positive() });
  return {
    nombre: "consultar_estado_pedido",
    descripcion: "Estado de un pedido del cliente que escribe, por número. No da información de pedidos de otras personas.",
    esquema,
    async ejecutar({ numero }, { deps, cliente }) {
      const pedido = await deps.pedidos.obtenerDelCliente(numero, cliente.id);
      if (!pedido) return { ok: false, error: `No encontré el pedido #${numero} a nombre de este número.` };
      return {
        ok: true,
        datos: { numero: pedido.numero, estado: ETIQUETAS_ESTADO[pedido.estado], total_sin_envio: pedido.totalCop },
        montos: [pedido.totalCop],
      };
    },
  } satisfies Herramienta<z.infer<typeof esquema>>;
}
