/** Nombre del icono Lucide para sectores y productos (la base guarda emojis; la interfaz usa iconos vectoriales). */
const SECTOR: Record<string, string> = {
  Verduras: 'sprout', Frutas: 'apple', Carnes: 'beef', Pescados: 'fish',
  Abarrotes: 'wheat', Comida: 'soup', Otros: 'shopping-basket'
};
const PRODUCTO: Record<string, string> = {
  'Papa': 'sprout', 'Cebolla': 'sprout', 'Tomate': 'cherry', 'Zanahoria': 'carrot',
  'Fresa': 'cherry', 'Plátano de seda': 'banana', 'Manzana': 'apple', 'Palta': 'leaf',
  'Pollo entero': 'drumstick', 'Carne de res': 'beef', 'Carne de cerdo': 'beef',
  'Arroz': 'wheat', 'Azúcar': 'candy', 'Fideos': 'wheat', 'Pan francés': 'cookie', 'Chocolate': 'candy',
  'Almuerzo del día': 'soup', 'Pollo a la brasa': 'drumstick', 'Jugo de naranja': 'citrus'
};
/** Para los productos peruanos específicos (Papa amarilla, Chocolate Sol del Cusco…), se elige el icono por palabra clave. */
const PALABRAS: [RegExp, string][] = [
  [/mango|maracuy|l[uú]cuma|chirimoya|granadilla|aguaymanto|pi[nñ]a|naranja|limon|mandarina/i, 'apple'],
  [/pescado|trucha|pejerrey|jurel|bonito|camar[oó]n/i, 'fish'],
  [/pollo|cuy|pavo/i, 'drumstick'],
  [/carne|costillar|cordero|h[ií]gado|cerdo|res\b/i, 'beef'],
  [/chocolate|az[uú]car|galleta|caramelo/i, 'candy'],
  [/pan\b|pan /i, 'cookie'],
  [/caf[eé]|leche|aceite|at[uú]n/i, 'package'],
  [/quinua|arroz|fideo|avena|harina|menestra/i, 'wheat'],
  [/ají|aji|rocoto|pimient/i, 'carrot'],
  [/papa|camote|olluco|yuca|choclo|cebolla|ajo|zanahoria|tomate/i, 'sprout']
];

export const iconoSector = (nombre: string) => SECTOR[nombre] ?? 'shopping-basket';
export const iconoProducto = (nombre: string) =>
  PRODUCTO[nombre] ?? PALABRAS.find(([re]) => re.test(nombre))?.[1] ?? 'shopping-basket';
