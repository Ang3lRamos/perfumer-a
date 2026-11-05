-- Gestión comercial desde el panel: precios manuales, promociones y combos.

-- Un precio editado a mano no debe pisarse al reimportar la lista del proveedor (ver generar-seed.ts).
alter table variantes add column precio_manual boolean not null default false;

create type tipo_descuento as enum ('porcentaje', 'monto');
create type alcance_promocion as enum ('todo', 'marca', 'productos');

create table promociones (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null check (char_length(trim(nombre)) between 3 and 60),
  tipo           tipo_descuento not null,
  valor          integer not null check (valor > 0),
  alcance        alcance_promocion not null,
  marca          text,
  producto_ids   uuid[] not null default '{}',
  activa         boolean not null default true,
  inicia_at      timestamptz,
  termina_at     timestamptz,
  creado_at      timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  check (tipo <> 'porcentaje' or valor < 100),
  check (inicia_at is null or termina_at is null or termina_at > inicia_at),
  check ((alcance = 'marca') = (marca is not null)),
  check (alcance <> 'productos' or cardinality(producto_ids) > 0)
);

create sequence combos_codigo_seq;

create table combos (
  id             uuid primary key default gen_random_uuid(),
  -- Va en el mensaje de WhatsApp como "ref. CMB-001", igual que el código de un producto.
  codigo         text not null unique
                 default 'CMB-' || lpad(nextval('combos_codigo_seq')::text, 3, '0')
                 check (codigo ~ '^CMB-[0-9]{3}$'),
  nombre         text not null check (char_length(trim(nombre)) between 3 and 60),
  descripcion    text,
  precio_cop     integer not null check (precio_cop > 0),
  activo         boolean not null default true,
  inicia_at      timestamptz,
  termina_at     timestamptz,
  creado_at      timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),
  check (inicia_at is null or termina_at is null or termina_at > inicia_at)
);

-- restrict: borrar una variante en silencio dejaría un combo con menos producto al mismo precio.
create table combo_items (
  combo_id    uuid not null references combos (id) on delete cascade,
  variante_id uuid not null references variantes (id) on delete restrict,
  cantidad    integer not null check (cantidad between 1 and 10),
  primary key (combo_id, variante_id)
);

create trigger promociones_actualizado before update on promociones
  for each row execute function tocar_actualizado_at();
create trigger combos_actualizado before update on combos
  for each row execute function tocar_actualizado_at();

-- Un combo se pide como una fila por unidad, cada una con su parte del precio, para que el total cuadre
-- exacto. Por eso la misma variante puede repetirse en un pedido y la llave deja de ser (pedido, variante).
alter table pedido_items drop constraint pedido_items_pkey;
alter table pedido_items add column id bigint generated always as identity primary key;
alter table pedido_items add column combo_id uuid references combos (id) on delete set null;
create index pedido_items_pedido_idx on pedido_items (pedido_id);

-- Atómico: un fallo a medias no puede dejar un combo publicado sin parte de sus productos.
-- security invoker (por defecto): RLS sigue decidiendo quién puede escribir.
create function guardar_combo(
  p_id uuid,
  p_nombre text,
  p_descripcion text,
  p_precio_cop integer,
  p_inicia_at timestamptz,
  p_termina_at timestamptz,
  p_items jsonb
) returns uuid
language plpgsql as $$
declare
  v_id uuid := p_id;
begin
  if v_id is null then
    insert into combos (nombre, descripcion, precio_cop, inicia_at, termina_at)
    values (p_nombre, p_descripcion, p_precio_cop, p_inicia_at, p_termina_at)
    returning id into v_id;
  else
    update combos
    set nombre = p_nombre, descripcion = p_descripcion, precio_cop = p_precio_cop,
        inicia_at = p_inicia_at, termina_at = p_termina_at
    where id = v_id;
    if not found then
      raise exception 'Combo % no encontrado', v_id;
    end if;
    delete from combo_items where combo_id = v_id;
  end if;

  insert into combo_items (combo_id, variante_id, cantidad)
  select v_id, (item ->> 'varianteId')::uuid, (item ->> 'cantidad')::integer
  from jsonb_array_elements(p_items) as item;

  return v_id;
end;
$$;

alter table promociones enable row level security;
alter table combos      enable row level security;
alter table combo_items enable row level security;

-- Las programadas también son públicas: la tienda necesita saber cuándo empiezan para renovar su caché
-- a tiempo. Lo que no se publica es lo pausado o lo ya terminado.
create policy promociones_publicas on promociones for select to anon, authenticated
  using (activa and (termina_at is null or termina_at > now()));
create policy combos_publicos on combos for select to anon, authenticated
  using (activo and (termina_at is null or termina_at > now()));
-- La subconsulta pasa por el RLS de combos: los ítems de un combo oculto quedan ocultos.
create policy combo_items_publicos on combo_items for select to anon, authenticated
  using (exists (select 1 from combos c where c.id = combo_id));

create policy admin_todo on promociones for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on combos      for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on combo_items for all to authenticated using (es_admin()) with check (es_admin());

grant select on promociones, combos, combo_items to anon, authenticated;
grant insert, update, delete on promociones, combos, combo_items to authenticated;
grant update on variantes to authenticated;
grant usage on sequence combos_codigo_seq to authenticated;
grant execute on function guardar_combo(uuid, text, text, integer, timestamptz, timestamptz, jsonb) to authenticated;
revoke execute on function guardar_combo(uuid, text, text, integer, timestamptz, timestamptz, jsonb) from public, anon;
