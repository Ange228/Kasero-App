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

export const iconoSector = (nombre: string) => SECTOR[nombre] ?? 'shopping-basket';
export const iconoProducto = (nombre: string) => PRODUCTO[nombre] ?? 'shopping-basket';
