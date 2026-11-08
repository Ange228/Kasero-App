/** Clasificación oficial de la app, por ahora: Frutas, Verduras, Carnes y Abarrotes. */
export interface Categoria { nombre: string; icono: string; detalle: string; }

export const CATEGORIAS: Categoria[] = [
  { nombre: 'Frutas', icono: 'apple', detalle: 'De temporada y del día' },
  { nombre: 'Verduras', icono: 'sprout', detalle: 'Frescas del campo' },
  { nombre: 'Carnes', icono: 'beef', detalle: 'Pollo, res y cerdo' },
  { nombre: 'Abarrotes', icono: 'wheat', detalle: 'Arroz, fideos y más' }
];
export const NOMBRES_CATEGORIA = CATEGORIAS.map(c => c.nombre);
