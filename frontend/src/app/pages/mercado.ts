import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { Api } from '../core/api.service';
import { Auth, mensajeError } from '../core/auth.service';
import { CATEGORIAS } from '../core/categorias';
import { iconoProducto } from '../core/iconos';
import { Noticia, Pedido, Promocion } from '../core/models';
import { ESTADO, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 1 · Inicio del mercado: categorías de presentación, promociones y, con sesión, pedidos y noticias. */
@Component({
  selector: 'app-mercado',
  imports: [RouterLink, Icono, SolesPipe],
  template: `
    <div class="contenedor pagina">
      <header class="encabezado">
        <p class="suave">Mercado del Altiplano · Arequipa</p>
        <h1>El mercado de hoy</h1>
      </header>

      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
        <button class="btn sec" (click)="cargar()">Reintentar</button>
      } @else if (cargando()) {
        <p class="cargando" role="status">Cargando el mercado…</p>
      } @else {
        <div class="seccion-t"><h2>Lo que encuentras</h2></div>
        <div class="grid g4">
          @for (c of categorias; track c.nombre) {
            <div class="tarjeta sector">
              <span class="ic"><app-icono [nombre]="c.icono" [tam]="30" /></span>
              <strong>{{ c.nombre }}</strong>
              <span class="suave">{{ c.detalle }}</span>
            </div>
          }
        </div>

        <div class="seccion-t"><h2>Promociones de la semana</h2></div>
        <div class="grid g2">
          @for (p of promos(); track p.comercianteId + p.producto) {
            <a class="tarjeta promo" [routerLink]="['/puesto', p.comercianteId]">
              <span class="etq nar">-{{ p.descuento }}%</span>
              <strong><app-icono [nombre]="icoProd(p.producto)" [tam]="18" /> {{ p.producto }}</strong>
              <span class="suave">{{ p.comerciante }} · Puesto {{ p.nroPuesto }}</span>
              <span><span class="precio">{{ p.precioFinal | soles }}</span> <s class="suave">{{ p.precioOriginal | soles }}</s> por {{ p.unidad }}</span>
            </a>
          } @empty { <p class="vacio">Pronto habrá promociones.</p> }
        </div>

        @if (auth.logueado()) {
          <div class="seccion-t"><h2>Tus pedidos</h2><a routerLink="/pedidos">Ver todos <app-icono nombre="arrow-right" [tam]="16" /></a></div>
          @for (p of pedidos().slice(0, 2); track p.id) {
            <div class="tarjeta fila entre" style="margin-bottom:10px">
              <span><strong>Pedido #{{ p.id }}</strong> · {{ p.comerciante }}<br><span class="etq">{{ estado[p.estado] || p.estado }}</span></span>
              <span class="precio">{{ p.total | soles }}</span>
            </div>
          } @empty { <p class="suave">Aún no tienes pedidos. Cotiza con tu casero favorito.</p> }

          <div class="seccion-t"><h2>Noticias y actividades</h2></div>
          <div class="grid g2">
            @for (n of noticias(); track n.titulo) {
              <div class="tarjeta fila"><span class="avatar"><app-icono nombre="megaphone" [tam]="22" /></span><div><strong>{{ n.titulo }}</strong><p class="suave">{{ n.detalle }}</p></div></div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: `
    .encabezado h1 { margin: 4px 0 0; }
    .g4 { grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 900px) { .g4 { grid-template-columns: repeat(2, 1fr); } }
    .sector { text-align: center; display: grid; gap: 8px; justify-items: center; padding: 26px 14px; cursor: default; }
    .sector strong { font: 600 1.15rem var(--font-titulo); }
    .sector .suave { font-size: .88rem; }
    .ic { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 18px; background: var(--verde-cl); color: var(--verde-osc); }
    .promo { display: grid; gap: 8px; text-decoration: none; color: var(--texto); }
    .promo:hover { border-color: var(--verde); }
    .promo strong { display: inline-flex; gap: 6px; align-items: center; }
  `
})
export class Mercado {
  private api = inject(Api);
  protected auth = inject(Auth);
  protected estado = ESTADO;
  protected icoProd = iconoProducto;
  protected categorias = CATEGORIAS;

  protected promos = signal<Promocion[]>([]);
  protected noticias = signal<Noticia[]>([]);
  protected pedidos = signal<Pedido[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() { this.cargar(); }

  protected cargar() {
    this.cargando.set(true); this.error.set('');
    forkJoin({
      promos: this.api.promociones(), noticias: this.api.noticias(),
      pedidos: this.auth.logueado() ? this.api.pedidos().pipe(catchError(() => of([]))) : of([])
    }).subscribe({
      next: r => { this.promos.set(r.promos); this.noticias.set(r.noticias); this.pedidos.set(r.pedidos); this.cargando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
