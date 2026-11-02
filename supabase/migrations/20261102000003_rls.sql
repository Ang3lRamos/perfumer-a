-- El admin se marca con app_metadata.rol = 'admin' (solo editable con la secret key,
-- el usuario no puede auto-asignárselo). El servidor del agente usa la secret key y no pasa por RLS.
create function es_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'rol', '') = 'admin';
$$;

alter table productos            enable row level security;
alter table variantes            enable row level security;
alter table costos_variante      enable row level security;
alter table clientes             enable row level security;
alter table conversaciones       enable row level security;
alter table mensajes             enable row level security;
alter table pedidos              enable row level security;
alter table pedido_items         enable row level security;
alter table pedido_transiciones  enable row level security;
alter table eventos              enable row level security;

create policy catalogo_publico on productos for select
  to anon, authenticated using (activo);
create policy catalogo_publico on variantes for select
  to anon, authenticated using (
    exists (select 1 from productos p where p.id = producto_id and p.activo)
  );

create policy admin_todo on productos            for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on variantes            for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on costos_variante      for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on clientes             for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on conversaciones       for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on mensajes             for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on pedidos              for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_todo on pedido_items         for all to authenticated using (es_admin()) with check (es_admin());
create policy admin_lectura on pedido_transiciones for select to authenticated using (es_admin());
create policy admin_lectura on eventos             for select to authenticated using (es_admin());
