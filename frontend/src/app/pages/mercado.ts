import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { Api } from '../core/api.service';
import { Auth, mensajeError } from '../core/auth.service';
import { iconoProducto, iconoSector } from '../core/iconos';
import { Noticia, Pedido, Promocion, Sector } from '../core/models';
import { ESTADO, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 1 · Inicio del mercado: categorías, promociones, pedidos y noticias. */
@Component({
  selector: 'app-mercado',
  imports: [FormsModule, RouterLink, Icono, SolesPipe],
  template: `
    <div class="contenedor pagina">
      <section class="portada">
        <p class="suave claro">Mercado del Altiplano · Arequipa</p>
        <h1>Tradición del mercado a tu canasta</h1>
        <form class="busca" (ngSubmit)="buscar()" role="search">
          <label for="q" class="solo-lectores">Buscar</label>
          <app-icono nombre="search" [tam]="20" />
          <input id="q" name="q" [(ngModel)]="q" placeholder="Buscar productos, comerciantes o puestos…">
          <button class="btn naranja">Explorar</button>
        </form>
        <div class="datos"><span><app-icono nombre="store" [tam]="16" /> +200 puestos</span><span><app-icono nombre="layers" [tam]="16" /> Diversos sectores</span><span><app-icono nombre="soup" [tam]="16" /> Comida tradicional</span></div>
      </section>

      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
        <button class="btn sec" (click)="cargar()">Reintentar</button>
      } @else if (cargando()) {
        <p class="cargando" role="status">Cargando el mercado…</p>
      } @else {
        <div class="seccion-t"><h2>Categorías</h2><a routerLink="/buscar">Ver todo <app-icono nombre="arrow-right" [tam]="16" /></a></div>
        <div class="grid g3">
          @for (s of sectores(); track s.id) {
            <a class="tarjeta sector" routerLink="/buscar" [queryParams]="{ sector: s.nombre }">
              <span class="ic"><app-icono [nombre]="icoSector(s.nombre)" [tam]="28" /></span>{{ s.nombre }}
            </a>
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
          } @empty { <p class="suave">Aún no tienes pedidos. ¡Arma tu primera cotización!</p> }
        }

        <div class="seccion-t"><h2>Noticias y actividades</h2></div>
        <div class="grid g2">
          @for (n of noticias(); track n.titulo) {
            <div class="tarjeta fila"><span class="avatar"><app-icono nombre="megaphone" [tam]="22" /></span><div><strong>{{ n.titulo }}</strong><p class="suave">{{ n.detalle }}</p></div></div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .portada { background: linear-gradient(160deg, var(--verde-prof), var(--verde-osc)); color: #fff; border-radius: 24px; padding: 36px; }
    .portada h1 { margin: 6px 0 22px; max-width: 640px; }
    .claro { color: #9fd3a3; }
    .busca { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 999px; padding: 6px 6px 6px 18px; color: #5b665b; max-width: 640px; }
    .busca input { border: 0; background: transparent; min-height: 44px; color: #1b251b; padding: 0; }
    .busca input:focus { outline: none; }
    .datos { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 20px; font-size: .9rem; color: #d3e6d3; }
    .datos span { display: inline-flex; align-items: center; gap: 6px; }
    .sector { text-align: center; color: var(--texto); text-decoration: none; display: grid; gap: 10px; justify-items: center; padding: 22px 10px; font-weight: 500; }
    .sector:hover { border-color: var(--verde); }
    .ic { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; background: var(--verde-cl); color: var(--verde-osc); }
    .promo { display: grid; gap: 8px; text-decoration: none; color: var(--texto); }
    .promo:hover { border-color: var(--verde); }
    .promo strong { display: inline-flex; gap: 6px; align-items: center; }
    @media (max-width: 600px) { .portada { padding: 24px 18px; } }
  `
})
export class Mercado {
  private api = inject(Api);
  private router = inject(Router);
  protected auth = inject(Auth);
  protected estado = ESTADO;
  protected icoSector = iconoSector;
  protected icoProd = iconoProducto;

  protected q = '';
  protected sectores = signal<Sector[]>([]);
  protected promos = signal<Promocion[]>([]);
  protected noticias = signal<Noticia[]>([]);
  protected pedidos = signal<Pedido[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() { this.cargar(); }

  protected cargar() {
    this.cargando.set(true); this.error.set('');
    forkJoin({
      sectores: this.api.sectores(), promos: this.api.promociones(), noticias: this.api.noticias(),
      pedidos: this.auth.logueado() ? this.api.pedidos().pipe(catchError(() => of([]))) : of([])
    }).subscribe({
      next: r => { this.sectores.set(r.sectores); this.promos.set(r.promos); this.noticias.set(r.noticias); this.pedidos.set(r.pedidos); this.cargando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }

  protected buscar() { this.router.navigate(['/buscar'], { queryParams: { q: this.q || null } }); }
}
