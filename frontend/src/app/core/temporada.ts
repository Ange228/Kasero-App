/**
 * Productos de temporada según el mes (referencial, para orientar al cliente).
 * Cada producto indica los meses (1 = enero) en que está en su mejor momento.
 */
const CALENDARIO: { producto: string; meses: number[] }[] = [
  { producto: 'Fresa', meses: [8, 9, 10, 11, 12, 1] },
  { producto: 'Palta', meses: [3, 4, 5, 6, 7, 8, 9] },
  { producto: 'Manzana', meses: [2, 3, 4, 5, 6] },
  { producto: 'Plátano de seda', meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { producto: 'Tomate', meses: [11, 12, 1, 2, 3, 4] },
  { producto: 'Zanahoria', meses: [4, 5, 6, 7, 8, 9] },
  { producto: 'Papa', meses: [3, 4, 5, 6, 7] }
];

/** Nombres de productos que están de temporada en el mes indicado (por defecto, el actual). */
export function deTemporada(mes = new Date().getMonth() + 1): string[] {
  return CALENDARIO.filter(c => c.meses.includes(mes)).map(c => c.producto);
}

const FRUTAS = ['Fresa', 'Palta', 'Manzana', 'Plátano de seda'];
export const esFruta = (producto: string) => FRUTAS.includes(producto);
