import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { Cotizacion, Pedido } from '../core/models';
import { ESTADO, FechaPipe, MODALIDAD, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 8 · Mis pedidos: cotizaciones por confirmar e historial. */
@Component({
  selector: 'app-pedidos',
  imports: [RouterLink, Icono, SolesPipe, FechaPipe],
  template: `
    <div class="contenedor pagina">
      <h1>Mis pedidos</h1>
      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (cargando()) {
        <p class="cargando" role="status">Cargando tus pedidos…</p>
      } @else {
        @if (pendientes().length) {
          <div class="seccion-t"><h2>Cotizaciones por confirmar</h2></div>
          @for (c of pendientes(); track c.id) {
            <div class="tarjeta fila entre envolver" style="margin-bottom:10px">
              <span><strong>Cotización #{{ c.id }}</strong> · {{ c.comerciante }}<br><span class="suave">{{ c.fecha | fecha }} · {{ c.items.length }} producto(s)</span></span>
              <span class="fila"><span class="precio">{{ c.total | soles }}</span><a class="btn" [routerLink]="['/pedido', c.id]">Elegir entrega</a></span>
            </div>
          }
        }

        <div class="seccion-t"><h2>Historial de pedidos</h2></div>
        @for (p of pedidos(); track p.id) {
          <div class="tarjeta" style="margin-bottom:10px">
            <div class="fila entre">
              <span><strong>Pedido #{{ p.id }}</strong> · {{ p.comerciante }}<br><span class="suave">{{ p.fecha | fecha }} · {{ modalidades[p.modalidad] }}</span></span>
              <span class="precio">{{ p.total | soles }}</span>
            </div>
            <div class="fila envolver" style="margin-top:10px">
              <span class="etq"><app-icono nombre="clock" [tam]="14" /> {{ estados[p.estado] || p.estado }}</span>
              @if (p.codigoEntrega) { <span class="suave">Código de entrega: <strong>{{ p.codigoEntrega }}</strong> ({{ p.terceroNombre }})</span> }
            </div>
          </div>
        } @empty {
          <div class="vacio">Todavía no hiciste pedidos.<br><a routerLink="/buscar">Buscar puestos</a></div>
        }
      }
    </div>
  `
})
export class Pedidos {
  private api = inject(Api);
  protected estados = ESTADO;
  protected modalidades = MODALIDAD;

  protected pedidos = signal<Pedido[]>([]);
  protected pendientes = signal<Cotizacion[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() {
    forkJoin({ p: this.api.pedidos(), c: this.api.cotizaciones() }).subscribe({
      next: r => { this.pedidos.set(r.p); this.pendientes.set(r.c.filter(c => !c.tienePedido)); this.cargando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
