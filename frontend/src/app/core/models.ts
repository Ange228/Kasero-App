/** Tipos que devuelve la API de Spring Boot. */
export interface Sector { id: number; nombre: string; icono: string; }
export interface Producto { id: number; nombre: string; unidad: string; icono: string; sector: string; }
export interface PrecioItem { productoId: number; nombre: string; icono: string; unidad: string; precio: number; actualizado: string; }

export interface Comerciante {
  id: number; nombre: string; iniciales: string; nroPuesto: number; pasillo: number; seccion: string;
  sector: string; metodosPago: string[]; tieneCaseros: string; calificacion: number;
  numCalificaciones: number; cotizaciones: number; precioMedio: number | null; productos: string[]; horario: string | null;
}
export interface ComercianteDetalle { comerciante: Comerciante; precios: PrecioItem[]; modalidades: string[]; }

export interface Promocion {
  comercianteId: number; comerciante: string; nroPuesto: number; pasillo: number; producto: string;
  icono: string; unidad: string; precioOriginal: number; precioFinal: number; descuento: number;
}
export interface Noticia { titulo: string; detalle: string; }

export interface ItemCanasta { productoId: number; cantidad: number; }
export interface ItemLocal extends ItemCanasta { nombre: string; unidad: string; icono: string; }
export interface FilaComparacion { comerciante: Comerciante; total: number; diferencia: number; masEconomico: boolean; }
export interface FilaIncompleta { comerciante: Comerciante; faltantes: string[]; }
export interface ComparacionResponse { completos: FilaComparacion[]; incompletos: FilaIncompleta[]; }

export interface ItemCotizacion { producto: string; icono: string; unidad: string; cantidad: number; precioUnit: number; subtotal: number; }
export interface Cotizacion {
  id: number; comercianteId: number; comerciante: string; nroPuesto: number; pasillo: number;
  estado: string; total: number; fecha: string; items: ItemCotizacion[]; tienePedido: boolean;
}
export type Modalidad = 'ENVIO' | 'RECOJO' | 'TERCERO';
export interface Pedido {
  id: number; cotizacionId: number; comercianteId: number; comerciante: string; nroPuesto: number;
  total: number; modalidad: Modalidad; estado: string; codigoEntrega: string | null;
  direccion: string | null; terceroNombre: string | null; fecha: string;
}

export interface PrecioPromedio { producto: string; icono: string; unidad: string; promedio: number; minimo: number; maximo: number; puestos: number; }
export interface ProductoConteo { producto: string; icono: string; cantidad: number; }
export interface ResumenPrecios { promedios: PrecioPromedio[]; masCotizados: ProductoConteo[]; masComprados: ProductoConteo[]; }

export interface Resena { id: number; usuario: string; puntaje: number; comentario: string | null; fecha: string; }
export interface ResenaResultado { calificacion: number; numCalificaciones: number; resena: Resena; }

export interface AdminPuesto {
  id: number; nombre: string; nroPuesto: number; pasillo: number; seccion: string; sectorId: number; sector: string;
  metodosPago: string; tieneCaseros: string; activo: boolean; cuenta: string | null;
}
export interface PuestoForm { nombre: string; nroPuesto: number; pasillo: number; seccion: string; sectorId: number; metodosPago: string; tieneCaseros: string; }
export interface AdminProducto { id: number; nombre: string; unidad: string; sectorId: number; sector: string; }
export interface AdminNoticia { id: number; titulo: string; detalle: string; }
export interface AdminPromo { id: number; comerciante: string; producto: string; descuento: number; }

export interface SeriePrecio { producto: string; icono: string; unidad: string; valores: (number | null)[]; variacion: number | null; }
export interface EvolucionPrecios { semanas: string[]; series: SeriePrecio[]; variacionGeneral: number | null; }

export interface ChatResumen { id: number; comercianteId: number; contraparte: string; ultimoMensaje: string | null; fecha: string; }
export interface Mensaje { id: number; autor: 'CLIENTE' | 'COMERCIANTE'; texto: string; fecha: string; mio: boolean; }

export interface PedidoPuesto {
  id: number; cliente: string; modalidad: Modalidad; estado: string; total: number; fecha: string;
  direccion: string | null; terceroNombre: string | null; codigoEntrega: string | null; items: ItemCotizacion[];
}

export interface LoginResponse { exitoso: boolean; mensaje: string; usuarioId: number; nombre: string; token: string; rol: string; }
