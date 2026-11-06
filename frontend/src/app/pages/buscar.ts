import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoSector } from '../core/iconos';
import { Comerciante, Sector } from '../core/models';
import { Icono } from '../shared/icono';
import { PuestoCard } from '../shared/puesto-card';

/** Pantalla 2 · Buscar y filtrar por sector, con orden por precio, calificación o cotizaciones. */
@Component({
  selector: 'app-buscar',
  imports: [FormsModule, RouterLink, Icono, PuestoCard],
  template: `
    <div class="contenedor pagina">
      <h1>Buscar</h1>
      <form class="busca" (ngSubmit)="aplicar({ q: texto || null })" role="search">
        <app-icono nombre="search" [tam]="20" />
        <label for="q" class="solo-lectores">Buscar</label>
        <input id="q" name="q" [(ngModel)]="texto" placeholder="Buscar productos, comerciantes o puestos…">
        <button class="btn">Buscar</button>
      </form>

      <div class="cuerpo">
        <aside class="tarjeta filtros">
          <strong>Sector</strong>
          <div class="chips">
            <button type="button" class="chip" [class.on]="!sector()" (click)="aplicar({ sector: null })">Todos</button>
            @for (s of sectores(); track s.id) {
              <button type="button" class="chip" [class.on]="sector() === s.nombre" (click)="aplicar({ sector: s.nombre })">
                <app-icono [nombre]="ico(s.nombre)" [tam]="16" />{{ s.nombre }}
              </button>
            }
          </div>
          <label for="orden">Ordenar por</label>
          <select id="orden" [ngModel]="orden() || 'precio_asc'" (ngModelChange)="aplicar({ orden: $event })">
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="calificacion">Mejor calificación</option>
            <option value="cotizado">Más cotizado</option>
          </select>
          <a class="btn sec block" routerLink="/buscar" style="margin-top:16px"><app-icono nombre="x" [tam]="16" /> Restablecer</a>
        </aside>

        <section>
          @if (error()) {
            <div class="msg error" role="alert">{{ error() }}</div>
          } @else if (cargando()) {
            <p class="cargando" role="status">Buscando…</p>
          } @else {
            <p class="suave" style="margin-bottom:12px">{{ sector() || 'Todos los sectores' }} · {{ lista().length }} resultado(s)</p>
            @if (lista().length) {
              <div class="grid g2">
                @for (c of lista(); track c.id; let i = $index) {
                  <app-puesto-card [c]="c" [etiqueta]="i === 0 && (orden() || 'precio_asc') === 'precio_asc' ? 'Más económico' : ''" />
                }
              </div>
            } @else {
              <div class="vacio">No encontramos puestos con esa búsqueda.<br><a routerLink="/buscar">Ver todos los puestos</a></div>
            }
          }
        </section>
      </div>
    </div>
  `,
  styles: `
    .busca { display: flex; align-items: center; gap: 10px; background: var(--tarjeta); border: 1.5px solid var(--borde); border-radius: 999px; padding: 6px 6px 6px 18px; color: var(--suave); }
    .busca input { border: 0; background: transparent; min-height: 44px; padding: 0; }
    .busca input:focus { outline: none; }
    .cuerpo { display: grid; grid-template-columns: 260px 1fr; gap: 24px; margin-top: 22px; align-items: start; }
    .filtros { position: sticky; top: calc(var(--alto-header) + 16px); display: grid; gap: 12px; }
    @media (max-width: 860px) { .cuerpo { grid-template-columns: 1fr; } .filtros { position: static; } }
  `
})
export class Buscar {
  private api = inject(Api);
  private router = inject(Router);
  protected ico = iconoSector;

  // Parámetros de la URL (?q=&sector=&orden=), enlazados con withComponentInputBinding
  // Si el parámetro no viene en la URL, Angular entrega undefined (no el valor por defecto)
  readonly q = input<string | undefined>('');
  readonly sector = input<string | undefined>('');
  readonly orden = input<string | undefined>('');

  protected texto = '';
  protected sectores = signal<Sector[]>([]);
  protected lista = signal<Comerciante[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() {
    this.api.sectores().subscribe(s => this.sectores.set(s));
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
    this.router.navigate(['/buscar'], { queryParams: cambio, queryParamsHandling: 'merge' });
  }
}
