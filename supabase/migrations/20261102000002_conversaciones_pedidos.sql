-- Datos personales: solo en `clientes`. Las demás tablas referencian por id.
create table clientes (
  id         uuid primary key default gen_random_uuid(),
  telefono   text not null unique check (telefono ~ '^[0-9]{10,15}$'),
  nombre     text,
  direccion  text,
  barrio     text,
  ciudad     text,
  creado_at  timestamptz not null default now()
);

create type modo_conversacion as enum ('agente', 'humano');

-- Un hilo por cliente y canal, como en WhatsApp. Las "sesiones" para métricas se
-- derivan en analytics a partir de los huecos de inactividad entre mensajes.
create table conversaciones (
  id                    uuid primary key default gen_random_uuid(),
  cliente_id            uuid not null references clientes (id),
  canal                 text not null,
  modo                  modo_conversacion not null default 'agente',
  motivo_escalamiento   text,
  escalada_at           timestamptz,
  ultimo_entrante_at    timestamptz,
  creada_at             timestamptz not null default now(),
  unique (cliente_id, canal),
  check ((modo = 'humano') = (escalada_at is not null))
);

create type direccion_mensaje as enum ('entrante', 'saliente');
create type autor_mensaje as enum ('cliente', 'agente', 'humano');

create table mensajes (
  id                uuid primary key default gen_random_uuid(),
  conversacion_id   uuid not null references conversaciones (id) on delete cascade,
  -- Id que asigna el canal (wamid en WhatsApp). UNIQUE = idempotencia frente a reenvíos.
  canal_mensaje_id  text unique,
  direccion         direccion_mensaje not null,
  autor             autor_mensaje not null,
  texto             text,
  -- Bloques completos del modelo (tool_use / tool_result) para reconstruir el contexto.
  contenido         jsonb,
  creado_at         timestamptz not null default now(),
  check ((direccion = 'entrante') = (autor = 'cliente'))
);

create index mensajes_conversacion_idx on mensajes (conversacion_id, creado_at desc);

create type estado_pedido as enum (
  'pendiente_confirmacion',
  'confirmado',
  'enviado_a_distribuidor',
  'despachado',
  'entregado',
  'rechazado_en_puerta',
  'cancelado'
);

create table pedidos (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity (start with 1001) unique,
  cliente_id       uuid not null references clientes (id),
  conversacion_id  uuid references conversaciones (id),
  estado           estado_pedido not null default 'pendiente_confirmacion',
  metodo_pago      text not null default 'contraentrega',
  -- Copia de la dirección al momento del pedido: si el cliente la cambia, el pedido no.
  envio            jsonb not null,
  notas            text,
  creado_at        timestamptz not null default now()
);

create table pedido_items (
  pedido_id           uuid not null references pedidos (id) on delete cascade,
  variante_id         uuid not null references variantes (id),
  cantidad            integer not null check (cantidad between 1 and 20),
  precio_unitario_cop integer not null check (precio_unitario_cop > 0),
  costo_unitario_cop  integer check (costo_unitario_cop > 0),
  primary key (pedido_id, variante_id)
);

create table pedido_transiciones (
  id         bigint generated always as identity primary key,
  pedido_id  uuid not null references pedidos (id) on delete cascade,
  desde      estado_pedido,
  hacia      estado_pedido not null,
  ocurrida_at timestamptz not null default now()
);

create index pedido_transiciones_pedido_idx on pedido_transiciones (pedido_id, ocurrida_at);

-- Última línea de defensa: el dominio ya valida esto, pero la base no acepta
-- un pedido que nazca confirmado ni saltos de estado inválidos venga de donde venga.
-- security definer: el historial solo admite lectura vía RLS, pero el trigger debe poder escribirlo.
create function validar_transicion_pedido() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  permitidas constant jsonb := '{
    "pendiente_confirmacion": ["confirmado", "cancelado"],
    "confirmado": ["enviado_a_distribuidor", "cancelado"],
    "enviado_a_distribuidor": ["despachado", "cancelado"],
    "despachado": ["entregado", "rechazado_en_puerta"]
  }';
begin
  if tg_op = 'INSERT' then
    if new.estado <> 'pendiente_confirmacion' then
      raise exception 'Un pedido nuevo debe nacer en pendiente_confirmacion, no en %', new.estado;
    end if;
    insert into pedido_transiciones (pedido_id, desde, hacia) values (new.id, null, new.estado);
    return new;
  end if;

  if new.estado = old.estado then
    return new;
  end if;
  if not coalesce(permitidas -> old.estado::text ? new.estado::text, false) then
    raise exception 'Transición de pedido inválida: % → %', old.estado, new.estado;
  end if;
  insert into pedido_transiciones (pedido_id, desde, hacia) values (new.id, old.estado, new.estado);
  return new;
end;
$$;

create trigger pedidos_transicion after insert or update of estado on pedidos
  for each row execute function validar_transicion_pedido();

-- Log de eventos append-only: fuente de embudos y métricas. Nunca guarda datos personales.
create table eventos (
  id               bigint generated always as identity primary key,
  tipo             text not null,
  conversacion_id  uuid references conversaciones (id) on delete set null,
  pedido_id        uuid references pedidos (id) on delete set null,
  datos            jsonb not null default '{}'::jsonb,
  ocurrido_at      timestamptz not null default now()
);

create index eventos_tipo_fecha_idx on eventos (tipo, ocurrido_at);
create index eventos_conversacion_idx on eventos (conversacion_id, ocurrido_at);
