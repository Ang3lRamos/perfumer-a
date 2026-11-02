import { negocio } from "@/config/negocio";
import { contarPor, opcionesConConteo, valoresDeAtributo } from "@/core/catalogo/facetas";
import { filtrarCatalogo, ordenarCatalogo } from "@/core/catalogo/filtrar";
import type { Producto } from "@/core/catalogo/tipos";
import { BarraBusqueda, SelectorOrden } from "./BarraBusqueda";
import { obtenerCatalogo } from "./datos";
import { ProveedorNavegacion, ZonaResultados } from "./navegacion";
import { FiltrosLaterales, FiltrosMovil, type GrupoFiltro } from "./PanelFiltros";
import { leerFiltros, type ParametrosUrl } from "./parametros";
import { TarjetaProducto } from "./TarjetaProducto";

const TARJETAS_PRIORITARIAS = 4;

function armarGrupos(catalogo: Producto[]): GrupoFiltro[] {
  const porAtributo = negocio.filtros.map((filtro) => ({
    clave: filtro.clave,
    etiqueta: filtro.etiqueta,
    opciones: opcionesConConteo(filtro.opciones, contarPor(catalogo, (p) => valoresDeAtributo(p, filtro.clave))),
  }));

  const conteoPrecios = new Map(
    negocio.rangosPrecio.map(({ valor }) => [valor, filtrarCatalogo(catalogo, leerFiltros({ precio: valor }, []).filtros).length]),
  );
  const marcas = [...contarPor(catalogo, (p) => [p.marca]).entries()].map(([marca, conteo]) => ({
    valor: marca,
    etiqueta: marca,
    conteo,
  }));
  const tamanos = [...contarPor(catalogo, (p) => p.variantes.map((v) => v.tamanoMl)).entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([ml, conteo]) => ({ valor: ml, etiqueta: `${ml} ml`, conteo }));

  return [
    ...porAtributo,
    { clave: "precio", etiqueta: "Precio", opciones: opcionesConConteo(negocio.rangosPrecio, conteoPrecios), unico: true },
    { clave: "marca", etiqueta: "Casa", opciones: marcas },
    { clave: "ml", etiqueta: "Tamaño", opciones: tamanos },
  ].filter((grupo) => grupo.opciones.length > 0);
}

function aConsulta(params: ParametrosUrl): string {
  const consulta = new URLSearchParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (typeof valor === "string") consulta.set(clave, valor);
  }
  return consulta.toString();
}

export async function VistaCatalogo({ parametros }: { parametros: Promise<ParametrosUrl> }) {
  const [catalogo, params] = await Promise.all([obtenerCatalogo(), parametros]);
  const { filtros, orden } = leerFiltros(params, negocio.filtros.map((f) => f.clave));
  const resultados = ordenarCatalogo(filtrarCatalogo(catalogo, filtros), orden);
  const grupos = armarGrupos(catalogo);

  return (
    <ProveedorNavegacion consulta={aConsulta(params)}>
      <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <FiltrosLaterales grupos={grupos} />
        </aside>
        <section aria-labelledby="titulo-resultados">
          <div className="mb-6 flex items-center gap-2">
            <BarraBusqueda />
            <FiltrosMovil grupos={grupos} total={resultados.length} />
            <SelectorOrden />
          </div>
          <p id="titulo-resultados" className="mb-4 font-mono text-xs text-tinta-suave" aria-live="polite">
            {resultados.length} de {catalogo.length} {negocio.nombreProducto.plural}
          </p>
          <ZonaResultados>
            {resultados.length ? (
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">
                {resultados.map((producto, i) => (
                  <li key={producto.id}>
                    <TarjetaProducto producto={producto} prioridad={i < TARJETAS_PRIORITARIAS} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-16 text-center font-display text-2xl text-tinta-suave">
                Nada por aquí con esos filtros.
              </p>
            )}
          </ZonaResultados>
        </section>
      </div>
    </ProveedorNavegacion>
  );
}
