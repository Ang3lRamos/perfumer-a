import { configAgente } from "@/config/agente";
import { crearHerramientas } from "@/core/conversacion/herramientas";
import { crearAgente } from "@/core/conversacion/orquestador";
import type { Dependencias, Llm } from "@/core/conversacion/puertos";
import type { RespuestaModelo, Turno } from "@/core/conversacion/tipos";
import type { Producto, Variante } from "@/core/catalogo/tipos";
import { crearConversacionesEnMemoria } from "@/infra/memoria/conversaciones";
import { crearEventosEnMemoria, crearNotificadorEnMemoria } from "@/infra/memoria/eventos";
import { crearPedidosEnMemoria } from "@/infra/memoria/pedidos";

const variante = (id: string, tamanoMl: number, precioCop: number | null): Variante => ({
  id,
  tamanoMl,
  precioCop,
  disponible: precioCop !== null,
});

function producto(codigo: string, marca: string, nombre: string, variantes: Variante[], atributos = {}): Producto {
  return {
    id: codigo,
    codigo,
    slug: codigo.toLowerCase(),
    marca,
    nombre,
    tipo: "original",
    inspiracionNota: null,
    presentacion: "EDP",
    descripcion: null,
    atributos: { familias: [], ocasiones: [], ...atributos },
    fichaVerificada: false,
    imagenes: [],
    variantes,
  };
}

export const CATALOGO: Producto[] = [
  producto("LAT-051", "Lattafa", "Khamrah", [variante("v-khamrah", 100, 169900)], { genero: "unisex", familias: ["oriental", "gourmand"] }),
  producto("LAT-017", "Lattafa", "Yara", [variante("v-yara", 100, 155900)], { genero: "femenino", familias: ["gourmand", "floral"] }),
  producto("ALH-002", "Al Haramain", "Amber Oud Gold Edition", [variante("v-gold-100", 100, 273900), variante("v-gold-120", 120, 312900)]),
  producto("AFN-003", "Afnan", "9PM Night Out", [variante("v-9pm", 100, null)]),
];

export const texto = (t: string) => ({ type: "text", text: t });
export const llamada = (id: string, name: string, input: unknown) => ({ type: "tool_use", id, name, input });

/** Modelo guionizado: devuelve las respuestas en orden y guarda lo que recibió en cada llamada. */
export function modeloFalso(guion: unknown[][]) {
  const recibidos: Turno[][] = [];
  const llm: Llm = {
    async generar({ turnos }) {
      recibidos.push(structuredClone(turnos));
      const bloques = guion.shift();
      if (!bloques) throw new Error("El guion del modelo se agotó");
      const llamadas = bloques
        .filter((b): b is ReturnType<typeof llamada> => (b as { type: string }).type === "tool_use")
        .map((b) => ({ id: b.id, nombre: b.name, entrada: b.input }));
      const textoFinal = bloques
        .filter((b): b is ReturnType<typeof texto> => (b as { type: string }).type === "text")
        .map((b) => b.text)
        .join("\n");
      const respuesta: RespuestaModelo = { bloques, texto: textoFinal, llamadas, motivo: llamadas.length ? "herramientas" : "fin" };
      return respuesta;
    },
  };
  return { llm, recibidos };
}

export function montarAgente(guion: unknown[][], catalogo = CATALOGO) {
  const modelo = modeloFalso(guion);
  const conversaciones = crearConversacionesEnMemoria();
  const pedidos = crearPedidosEnMemoria();
  const eventos = crearEventosEnMemoria();
  const notificador = crearNotificadorEnMemoria();
  let reloj = new Date("2026-11-02T15:00:00Z").getTime();

  const deps: Dependencias = {
    llm: modelo.llm,
    catalogo: {
      listarActivos: async () => catalogo,
      obtenerPorCodigo: async (codigo) => catalogo.find((p) => p.codigo === codigo.toUpperCase()) ?? null,
    },
    conversaciones,
    pedidos,
    notificador,
    eventos,
    ahora: () => new Date((reloj += 1000)),
  };

  let contador = 0;
  const atender = crearAgente(deps, configAgente, crearHerramientas(configAgente));
  const escribir = (mensaje: string, id = `wamid-${++contador}`) =>
    atender({ canal: "whatsapp", telefono: "573001112233", canalMensajeId: id, texto: mensaje });

  return { escribir, modelo, conversaciones, pedidos, eventos, notificador, deps, avanzarReloj: (ms: number) => (reloj += ms) };
}
