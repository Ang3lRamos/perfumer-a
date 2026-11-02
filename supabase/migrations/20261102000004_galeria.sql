-- Galería: varias imágenes por producto, la primera es la principal.
alter table productos add column imagenes text[] not null default '{}';
update productos set imagenes = array[imagen_url] where imagen_url is not null;
alter table productos drop column imagen_url;
