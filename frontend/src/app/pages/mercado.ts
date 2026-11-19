import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Api } from '../core/api.service';
import { Auth, mensajeError } from '../core/auth.service';
import { NOMBRES_CATEGORIA } from '../core/categorias';
import { iconoProducto, iconoSector } from '../core/iconos';
import { Comerciante, Noticia, Pedido, Promocion, Sector } from '../core/models';
import { deTemporada, esFruta } from '../core/temporada';
import { ESTADO, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';
import { PuestoCard } from '../shared/puesto-card';

/**
 * Mercado: es el buscador de la app (con y sin sesión). Portada con búsqueda, filtros por categoría,
 * resultados de caseros, promociones y, solo con sesión, tus pedidos y las noticias.
 */
@Component({
  selector: 'app-mercado',
  imports: [FormsModule, RouterLink, Icono, PuestoCard, SolesPipe],
  template: `
    <div class="contenedor pagina">
      <section class="portada">
        <p class="claro">Mercado del Altiplano · Arequipa</p>
        <h1>Haz tu mercado hoy</h1>
        <form class="busca" (ngSubmit)="aplicar({ q: texto || null })" role="search">
          <app-icono nombre="search" [tam]="20" />
          <label for="q" class="solo-lectores">Buscar</label>
          <input id="q" name="q" [(ngModel)]="texto" placeholder="Buscar productos, comerciantes o puestos…">
          <button class="btn naranja">Explorar</button>
        </form>
        <div class="datos">
          <span><app-icono nombre="store" [tam]="16" /> +30 puestos</span>
          <span><app-icono nombre="layers" [tam]="16" /> Frutas, verduras, carnes y abarrotes</span>
          <span><app-icono nombre="soup" [tam]="16" /> Comida tradicional</span>
        </div>
      </section>

      <div class="cuerpo">
        <aside class="tarjeta filtros">
          <strong>Categoría</strong>
          <div class="chips">
            <button type="button" class="chip" [class.on]="!sector()" (click)="aplicar({ sector: null })">Todos</button>
            @for (s of sectores(); track s.id) {
              <button type="button" class="chip" [class.on]="sector() === s.nombre" (click)="aplicar({ sector: s.nombre })">
                <app-icono [nombre]="ico(s.nombre)" [tam]="16" />{{ s.nombre }}
              </button>
            }
          </div>
          @if (sector() === 'Frutas') {
            <button type="button" class="temporada" [class.on]="soloTemporada()" [attr.aria-pressed]="soloTemporada()" (click)="soloTemporada.set(!soloTemporada())">
              <app-icono nombre="sun" [tam]="22" />
              <span><strong>Fruta de temporada</strong><small>{{ nombresTemporada }}</small></span>
            </button>
          }
          <label for="orden">Ordenar por</label>
          <select id="orden" [ngModel]="orden() || 'precio_asc'" (ngModelChange)="aplicar({ orden: $event })">
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="calificacion">Mejor calificación</option>
            <option value="cotizado">Más cotizado</option>
          </select>
          <a class="btn sec block" routerLink="/mercado" style="margin-top:16px"><app-icono nombre="x" [tam]="16" /> Restablecer</a>
        </aside>

        <section>
          @if (error()) {
            <div class="msg error" role="alert">{{ error() }}</div>
          } @else if (cargando()) {
            <p class="cargando" role="status">Buscando…</p>
          } @else {
            <p class="suave" style="margin-bottom:12px">{{ sector() || 'Todas las categorías' }} · {{ visibles().length }} resultado(s)</p>
            @if (visibles().length) {
              <div class="grid g2">
                @for (c of visibles(); track c.id; let i = $index) {
                  <app-puesto-card [c]="c" [etiqueta]="i === 0 && (orden() || 'precio_asc') === 'precio_asc' ? 'Más económico' : ''" />
                }
              </div>
            } @else {
              <div class="vacio">No encontramos puestos con esa búsqueda.<br><a routerLink="/mercado">Ver todos los puestos</a></div>
            }
          }
        </section>
      </div>

      @if (promos().length) {
        <div class="seccion-t"><h2>Promociones de la semana</h2></div>
        <div class="grid g2">
          @for (p of promos(); track p.comercianteId + p.producto) {
            <a class="tarjeta promo" [routerLink]="['/puesto', p.comercianteId]">
              <span class="etq nar">-{{ p.descuento }}%</span>
              <strong><app-icono [nombre]="icoProd(p.producto)" [tam]="18" /> {{ p.producto }}</strong>
              <span class="suave">{{ p.comerciante }} · Puesto {{ p.nroPuesto }}</span>
              <span><span class="precio">{{ p.precioFinal | soles }}</span> <s class="suave">{{ p.precioOriginal | soles }}</s> por {{ p.unidad }}</span>
            </a>
          }
        </div>
      }

      @if (auth.logueado()) {
        <div class="seccion-t"><h2>Tus pedidos</h2><a routerLink="/pedidos">Ver todos <app-icono nombre="arrow-right" [tam]="16" /></a></div>
        @for (p of pedidos().slice(0, 2); track p.id) {
          <div class="tarjeta fila entre" style="margin-bottom:10px">
            <span><strong>Pedido #{{ p.id }}</strong> · {{ p.comerciante }}<br><span class="etq">{{ estado[p.estado] || p.estado }}</span></span>
            <span class="precio">{{ p.total | soles }}</span>
          </div>
        } @empty { <p class="suave">Aún no tienes pedidos. Cotiza con tu casero favorito.</p> }

        @if (noticias().length) {
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
    .portada { background: linear-gradient(160deg, var(--verde-prof), var(--verde-osc)); color: #fff; border-radius: 24px; padding: 36px; }
    .portada h1 { margin: 6px 0 22px; max-width: 640px; }
    .claro { color: #9fd3a3; }
    .datos { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 20px; font-size: .9rem; color: #d3e6d3; }
    .datos span { display: inline-flex; align-items: center; gap: 6px; }
    @media (max-width: 600px) { .portada { padding: 24px 18px; } }
    .busca { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 999px; padding: 6px 6px 6px 18px; color: #5b665b; max-width: 640px; }
    .busca input { border: 0; background: transparent; min-height: 44px; padding: 0; color: #1b251b; }
    .busca input:focus { outline: none; }
    .temporada { display: flex; align-items: center; gap: 12px; text-align: left; padding: 14px 16px; border-radius: 16px; cursor: pointer;
      background: var(--naranja-cl, #fdf0de); border: 1.5px solid var(--naranja); color: var(--texto); font: inherit; }
    .temporada span { display: grid; gap: 2px; }
    .temporada small { color: var(--suave); }
    .temporada.on { background: var(--naranja); color: #1a1100; }
    .temporada.on small { color: #3a2a08; }
    .cuerpo { display: grid; grid-template-columns: 260px 1fr; gap: 24px; margin-top: 22px; align-items: start; }
    .filtros { position: sticky; top: calc(var(--alto-header) + 16px); display: grid; gap: 12px; }
    @media (max-width: 860px) { .cuerpo { grid-template-columns: 1fr; } .filtros { position: static; } }
    .promo { display: grid; gap: 8px; text-decoration: none; color: var(--texto); }
    .promo:hover { border-color: var(--verde); }
    .promo strong { display: inline-flex; gap: 6px; align-items: center; }
  `
})
export class Mercado {
  private api = inject(Api);
  private router = inject(Router);
  protected auth = inject(Auth);
  protected ico = iconoSector;
  protected icoProd = iconoProducto;
  protected estado = ESTADO;

  // Parámetros de la URL (?q=&sector=&orden=), enlazados con withComponentInputBinding.
  // Si el parámetro no viene en la URL, Angular entrega undefined (no el valor por defecto).
  readonly q = input<string | undefined>('');
  readonly sector = input<string | undefined>('');
  readonly orden = input<string | undefined>('');

  protected soloTemporada = signal(false);
  private frutasTemporada = deTemporada().filter(esFruta);
  protected nombresTemporada = this.frutasTemporada.join(', ');
  /** Con el botón de temporada, solo los puestos que venden alguna fruta de temporada. */
  protected visibles = computed(() => this.soloTemporada() && this.sector() === 'Frutas'
    ? this.lista().filter(c => c.productos.some(p => this.frutasTemporada.some(f => p.toLowerCase().includes(f.toLowerCase()))))
    : this.lista());

  protected texto = '';
  protected sectores = signal<Sector[]>([]);
  protected lista = signal<Comerciante[]>([]);
  protected promos = signal<Promocion[]>([]);
  protected noticias = signal<Noticia[]>([]);
  protected pedidos = signal<Pedido[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() {
    this.api.sectores().subscribe(s => this.sectores.set(s.filter(x => NOMBRES_CATEGORIA.includes(x.nombre))));
    this.api.promociones().pipe(catchError(() => of([]))).subscribe(p => this.promos.set(p));
    if (this.auth.logueado()) {
      this.api.noticias().pipe(catchError(() => of([]))).subscribe(n => this.noticias.set(n));
      this.api.pedidos().pipe(catchError(() => of([]))).subscribe(p => this.pedidos.set(p));
    }
    effect(() => {
      const [q, sector, orden] = [this.q() ?? '', this.sector() ?? '', this.orden() || 'precio_asc'];
      this.texto = q;
      this.cargando.set(true); this.error.set('');
      this.api.buscar(q, sector, orden).subscribe({
        next: l => { this.lista.set(l); this.cargando.set(false); },
        error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
      });
    });
  }

  protected aplicar(cambio: Record<string, string | null>) {
    this.router.navigate(['/mercado'], { queryParams: cambio, queryParamsHandling: 'merge' });
  }
}
