import { z } from "zod";
import { agenteDesarrollo, reiniciarAgenteDesarrollo } from "@/features/chat-desarrollo/agente-desarrollo";

const peticion = z.object({
  telefono: z.string().regex(/^\d{10,15}$/),
  texto: z.string().min(1).max(2000),
});

const soloDesarrollo = () => process.env.NODE_ENV !== "development";

export async function POST(request: Request) {
  if (soloDesarrollo()) return new Response(null, { status: 404 });
  const datos = peticion.safeParse(await request.json());
  if (!datos.success) return Response.json({ error: z.prettifyError(datos.error) }, { status: 400 });

  const agente = agenteDesarrollo();
  const resultado = await agente.atender({
    canal: "desarrollo",
    telefono: datos.data.telefono,
    canalMensajeId: crypto.randomUUID(),
    texto: datos.data.texto,
  });
  const cliente = await agente.conversaciones.clientePorTelefono(datos.data.telefono);
  const conversacion = await agente.conversaciones.conversacion(cliente.id, "desarrollo");
  return Response.json({
    resultado,
    modo: conversacion.modo,
    avisos: agente.notificador.avisos,
    pedidos: agente.pedidos.pedidos,
  });
}

export async function DELETE() {
  if (soloDesarrollo()) return new Response(null, { status: 404 });
  reiniciarAgenteDesarrollo();
  return new Response(null, { status: 204 });
}
