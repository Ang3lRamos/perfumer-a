-- Catálogo: genérico para cualquier vertical. Lo específico del negocio (familia olfativa,
-- notas, etc.) vive en `atributos`, validado contra el esquema de config/negocio.

create type tipo_producto as enum ('original', 'inspirado', 'marca_propia');

create table productos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique check (codigo ~ '^[A-Z]{3}-[0-9]{3}$'),
  slug              text not null unique,
  marca             text not null,
  nombre            text not null,
  tipo              tipo_producto not null default 'original',
  -- Solo para productos 'inspirado': texto descriptivo, nunca se presenta como la marca original.
  inspiracion_nota  text check (tipo = 'inspirado' or inspiracion_nota is null),
  presentacion      text,
  descripcion       text,
  atributos         jsonb not null default '{}'::jsonb,
  ficha_verificada  boolean not null default false,
  imagen_url        text,
  activo            boolean not null default true,
  creado_at         timestamptz not null default now(),
  actualizado_at    timestamptz not null default now()
);

create index productos_atributos_idx on productos using gin (atributos jsonb_path_ops);
create index productos_marca_idx on productos (marca) where activo;

-- Dropshipping: no hay stock propio. `disponible` refleja la última lista del distribuidor
-- y todo pedido se confirma a mano antes de despacharse.
create table variantes (
  id           uuid primary key default gen_random_uuid(),
  producto_id  uuid not null references productos (id) on delete cascade,
  tamano_ml    integer not null check (tamano_ml > 0),
  precio_cop   integer check (precio_cop > 0),
  disponible   boolean not null default true,
  creado_at    timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  unique (producto_id, tamano_ml),
  check (precio_cop is not null or not disponible)
);

-- Tabla aparte (y no una columna con permisos revocados) porque el admin y el público
-- comparten el rol `authenticated`: así RLS decide quién ve el costo.
create table costos_variante (
  variante_id     uuid primary key references variantes (id) on delete cascade,
  costo_cop       integer not null check (costo_cop > 0),
  actualizado_at  timestamptz not null default now()
);

create function tocar_actualizado_at() returns trigger
language plpgsql as $$
begin
  new.actualizado_at := now();
  return new;
end;
$$;

create trigger productos_actualizado before update on productos
  for each row execute function tocar_actualizado_at();
create trigger variantes_actualizado before update on variantes
  for each row execute function tocar_actualizado_at();
