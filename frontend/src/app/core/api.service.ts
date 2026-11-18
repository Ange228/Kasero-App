import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  ComercianteDetalle, Comerciante, ComparacionResponse, Cotizacion, ItemCanasta, Noticia, Pedido,
  Producto, Promocion, ResumenPrecios, Sector, Modalidad, Resena, ResenaResultado, ChatResumen, Mensaje, PedidoPuesto, EvolucionPrecios
} from './models';

/** Cliente de la API REST de Kasero (Spring Boot + Supabase). */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  sectores() { return this.http.get<Sector[]>('/api/sectores'); }
  productos() { return this.http.get<Producto[]>('/api/productos'); }
  promociones() { return this.http.get<Promocion[]>('/api/promociones'); }
  noticias() { return this.http.get<Noticia[]>('/api/noticias'); }
  resumenPrecios() { return this.http.get<ResumenPrecios>('/api/precios/resumen'); }
  evolucionPrecios() { return this.http.get<EvolucionPrecios>('/api/precios/evolucion'); }

  buscar(q: string, sector: string, orden: string) {
    const params = new HttpParams().set('q', q).set('sector', sector).set('orden', orden);
    return this.http.get<Comerciante[]>('/api/comerciantes', { params });
  }
  puesto(id: number) { return this.http.get<ComercianteDetalle>(`/api/comerciantes/${id}`); }
  comparar(items: ItemCanasta[]) { return this.http.post<ComparacionResponse>('/api/comparaciones', { items }); }

  crearCotizacion(comercianteId: number, claveSolicitud: string, items: ItemCanasta[]) {
    return this.http.post<Cotizacion>('/api/cotizaciones', { comercianteId, claveSolicitud, items });
  }
  cotizaciones() { return this.http.get<Cotizacion[]>('/api/cotizaciones'); }

  crearPedido(cotizacionId: number, modalidad: Modalidad, direccion?: string, terceroNombre?: string) {
    return this.http.post<Pedido>('/api/pedidos', { cotizacionId, modalidad, direccion, terceroNombre });
  }
  pedidos() { return this.http.get<Pedido[]>('/api/pedidos'); }

  favoritos() { return this.http.get<Comerciante[]>('/api/favoritos'); }
  agregarFavorito(id: number) { return this.http.put(`/api/favoritos/${id}`, {}); }
  quitarFavorito(id: number) { return this.http.delete(`/api/favoritos/${id}`); }

  miPuesto() { return this.http.get<ComercianteDetalle>('/api/mi-puesto'); }
  fijarPrecio(productoId: number, precio: number) { return this.http.put(`/api/mi-puesto/precios/${productoId}`, { precio }); }
  quitarPrecio(productoId: number) { return this.http.delete(`/api/mi-puesto/precios/${productoId}`); }
  pedidosPuesto() { return this.http.get<PedidoPuesto[]>('/api/mi-puesto/pedidos'); }
  cambiarEstado(pedidoId: number, estado: string) { return this.http.put(`/api/mi-puesto/pedidos/${pedidoId}/estado`, { estado }); }

  chats() { return this.http.get<ChatResumen[]>('/api/chats'); }
  abrirChat(comercianteId: number) { return this.http.post<ChatResumen>('/api/chats', { comercianteId }); }
  mensajes(chatId: number, despues: number) {
    return this.http.get<Mensaje[]>(`/api/chats/${chatId}/mensajes`, { params: new HttpParams().set('despues', despues) });
  }
  enviarMensaje(chatId: number, texto: string) { return this.http.post<Mensaje>(`/api/chats/${chatId}/mensajes`, { texto }); }

  resenas(comercianteId: number) { return this.http.get<Resena[]>(`/api/comerciantes/${comercianteId}/resenas`); }
  calificar(comercianteId: number, puntaje: number, comentario: string) {
    return this.http.post<ResenaResultado>(`/api/comerciantes/${comercianteId}/resenas`, { puntaje, comentario });
  }
}
