/**
 * Productos de temporada según el mes (referencial, para orientar al cliente).
 * Cada producto indica los meses (1 = enero) en que está en su mejor momento.
 * El nombre se compara por coincidencia parcial: "Papa" cubre a "Papa amarilla".
 */
const TODO_EL_ANIO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CALENDARIO: { producto: string; meses: number[] }[] = [
  { producto: 'Fresa', meses: [8, 9, 10, 11, 12, 1] },
  { producto: 'Palta', meses: [3, 4, 5, 6, 7, 8, 9] },
  { producto: 'Manzana', meses: [2, 3, 4, 5, 6] },
  { producto: 'Plátano de seda', meses: TODO_EL_ANIO },
  { producto: 'Mango', meses: [11, 12, 1, 2, 3, 4] },
  { producto: 'Maracuyá', meses: TODO_EL_ANIO },
  { producto: 'Lúcuma', meses: [12, 1, 2, 3, 4] },
  { producto: 'Chirimoya', meses: [3, 4, 5, 6] },
  { producto: 'Aguaymanto', meses: [6, 7, 8, 9, 10] },
  { producto: 'Piña', meses: TODO_EL_ANIO },
  { producto: 'Granadilla', meses: [8, 9, 10, 11, 12] },
  { producto: 'Tomate', meses: [11, 12, 1, 2, 3, 4] },
  { producto: 'Zanahoria', meses: [4, 5, 6, 7, 8, 9] },
  { producto: 'Papa', meses: [3, 4, 5, 6, 7] },
  { producto: 'Choclo', meses: [1, 2, 3, 4] },
  { producto: 'Ají amarillo', meses: [12, 1, 2, 3, 4] },
  { producto: 'Rocoto', meses: [10, 11, 12, 1, 2, 3, 4] },
  { producto: 'Olluco', meses: [5, 6, 7, 8] }
];

/** Nombres base de productos que están de temporada en el mes indicado (por defecto, el actual). */
export function deTemporada(mes = new Date().getMonth() + 1): string[] {
  return CALENDARIO.filter(c => c.meses.includes(mes)).map(c => c.producto);
}

/** ¿El producto concreto (p. ej. "Papa amarilla") está en la lista de temporada? */
export const enTemporada = (producto: string, lista = deTemporada()) =>
  lista.some(n => producto.toLowerCase().includes(n.toLowerCase()));

const FRUTAS = ['Fresa', 'Palta', 'Manzana', 'Plátano', 'Mango', 'Maracuyá', 'Lúcuma', 'Chirimoya', 'Aguaymanto', 'Piña', 'Granadilla'];
export const esFruta = (producto: string) => FRUTAS.some(f => producto.toLowerCase().includes(f.toLowerCase()));
