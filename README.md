# Perfumería con agente de WhatsApp

Tienda online de perfumería original (dropshipping, pago contraentrega en Bogotá) donde la compra se cierra por
WhatsApp con un agente de IA que consulta el catálogo real y escala a un humano cuando hace falta.

> En construcción por fases. Fase 1: catálogo público con datos reales del distribuidor.

## Correr en local

```bash
npm install
cp .env.example .env.local   # completar valores
npm run dev
```

Base de datos: aplicar `supabase/migrations/*.sql` y luego `supabase/seed.sql` en el proyecto de Supabase
(`npx supabase db push --include-seed` con el proyecto enlazado, o desde el SQL Editor).

## Tests

```bash
npm test
npm run typecheck
```
