export interface Muestra {
  posicion: number;
  tiempo: number;
}

const VENTANA_VELOCIDAD_MS = 100;
const DESACELERACION = 0.998;
const CONSTANTE_GOMA = 0.55;

/** Px/s medidos en la ventana previa a `ahora`: si el dedo se detuvo antes de soltar, la velocidad es 0. */
export function velocidadAlSoltar(muestras: Muestra[], ahora: number): number {
  const recientes = muestras.filter((m) => ahora - m.tiempo <= VENTANA_VELOCIDAD_MS);
  const primera = recientes[0];
  const ultima = recientes.at(-1);
  if (!primera || !ultima || ultima.tiempo === primera.tiempo) return 0;
  return ((ultima.posicion - primera.posicion) / (ultima.tiempo - primera.tiempo)) * 1000;
}

/** Distancia que recorrería el gesto por inercia; la misma curva exponencial del desplazamiento nativo. */
export function proyectarMomento(velocidad: number): number {
  return ((velocidad / 1000) * DESACELERACION) / (1 - DESACELERACION);
}

/** Más allá del límite el elemento sigue al dedo cada vez menos, en lugar de frenar en seco. */
export function gomaElastica(exceso: number, dimension: number): number {
  return (exceso * dimension * CONSTANTE_GOMA) / (dimension + CONSTANTE_GOMA * exceso);
}

/** Decide con el punto de reposo proyectado: un gesto rápido cierra aunque haya recorrido poco. */
export function debeCerrar(desplazamiento: number, velocidad: number, dimension: number): boolean {
  return desplazamiento + proyectarMomento(velocidad) > dimension / 2;
}
