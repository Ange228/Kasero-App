import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoSector } from '../core/iconos';
import { Comerciante } from '../core/models';
import { Icono } from '../shared/icono';

interface Pasillo { numero: number; puestos: Comerciante[]; }

/** Mapa del mercado: elige un pasillo y mira sus puestos (Mercado → Pasillo → Puesto). */
@Component({
  selector: 'app-mapa',
  imports: [RouterLink, Icono],
  template: `
    <div class="contenedor pagina">
      <h1>Mapa del mercado</h1>
      <p class="suave sub"><app-icono nombre="map-pin" [tam]="14" /> Mercado del Altiplano · Av. Progreso, Arequipa</p>

      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (cargando()) {
        <p class="cargando" role="status">Cargando el plano…</p>
      } @else {
        <h2 class="paso">1 · Selecciona un pasillo</h2>
        <div class="chips">
          <button type="button" class="chip" [class.on]="!elegido()" (click)="elegido.set(null)">Todos</button>
          @for (p of pasillos(); track p.numero) {
            <button type="button" class="chip" [class.on]="elegido() === p.numero" (click)="elegido.set(p.numero)">
              Pasillo {{ p.numero }} <span class="cuenta">{{ p.puestos.length }}</span>
            </button>
          }
        </div>

        <div class="leyenda" aria-label="Leyenda de sectores">
          @for (s of sectores(); track s) { <span><i [attr.data-sector]="s"></i>{{ s }}</span> }
        </div>

        <h2 class="paso">2 · Elige un puesto</h2>
        <div class="plano">
          @for (p of visibles(); track p.numero) {
            <section class="pasillo" [attr.aria-label]="'Pasillo ' + p.numero">
              <h3>Pasillo {{ p.numero }}</h3>
              @for (c of p.puestos; track c.id) {
                <a class="puesto" [routerLink]="['/puesto', c.id]" [attr.data-sector]="c.sector"
                   [attr.aria-label]="'Puesto ' + c.nroPuesto + ', ' + c.nombre + ', ' + c.seccion">
                  <span class="nro">{{ c.nroPuesto }}</span>
                  <span class="dato"><strong>{{ c.nombre }}</strong><span>{{ c.seccion }}</span></span>
                  <app-icono [nombre]="ico(c.sector)" [tam]="18" />
                </a>
              }
            </section>
          } @empty { <p class="vacio">No hay puestos para mostrar.</p> }
        </div>
      }
    </div>
  `,
  styles: `
    .sub { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
    .paso { font-size: 1.05rem; margin: 26px 0 12px; color: var(--suave); font-family: var(--font-texto); letter-spacing: -0.01em; font-weight: 600; }
    .cuenta { background: var(--verde-cl); color: var(--verde-osc); border-radius: 999px; padding: 0 8px; font-size: .75rem; }
    .chip.on .cuenta { background: #ffffff30; color: #fff; }
    .leyenda { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 14px; font-size: .85rem; color: var(--suave); }
    .leyenda span { display: inline-flex; align-items: center; gap: 6px; }
    .leyenda i { width: 12px; height: 12px; border-radius: 4px; background: var(--c); }
    [data-sector="Verduras"] { --c: #2f7d32; } [data-sector="Frutas"] { --c: #c2410c; }
    [data-sector="Carnes"] { --c: #b3261e; } [data-sector="Pescados"] { --c: #0e7490; }
    [data-sector="Abarrotes"] { --c: #a16207; } [data-sector="Comida"] { --c: #7c3aed; } [data-sector="Otros"] { --c: #64748b; }
    .plano { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .pasillo { background: var(--superficie); border: 1px dashed var(--borde); border-radius: 18px; padding: 14px; display: grid; gap: 8px; align-content: start; }
    .pasillo h3 { font-size: 1rem; margin-bottom: 4px; }
    .puesto { display: flex; align-items: center; gap: 10px; background: var(--tarjeta); border: 1px solid var(--borde); border-left: 5px solid var(--c, var(--verde)); border-radius: 12px; padding: 10px 12px; text-decoration: none; color: var(--texto); }
    .puesto:hover { box-shadow: var(--sombra); transform: translateY(-1px); }
    .puesto app-icono { color: var(--c, var(--verde)); margin-left: auto; }
    .nro { font: 600 1.15rem var(--font-titulo); min-width: 2ch; text-align: center; color: var(--c, var(--verde)); }
    .dato { display: grid; line-height: 1.25; font-size: .85rem; }
    .dato span { color: var(--suave); font-size: .78rem; }
  `
})
export class Mapa {
  private api = inject(Api);
  protected ico = iconoSector;

  protected puestos = signal<Comerciante[]>([]);
  protected elegido = signal<number | null>(null);
  protected cargando = signal(true);
  protected error = signal('');

  /** Puestos agrupados por pasillo, en orden numérico. */
  protected pasillos = computed<Pasillo[]>(() => {
    const mapa = new Map<number, Comerciante[]>();
    for (const c of this.puestos()) mapa.set(c.pasillo, [...(mapa.get(c.pasillo) ?? []), c]);
    return [...mapa.entries()].sort((a, b) => a[0] - b[0])
      .map(([numero, lista]) => ({ numero, puestos: lista.sort((x, y) => x.nroPuesto - y.nroPuesto) }));
  });
  protected visibles = computed(() => this.pasillos().filter(p => this.elegido() === null || p.numero === this.elegido()));
  protected sectores = computed(() => [...new Set(this.puestos().map(c => c.sector))]);

  constructor() {
    this.api.buscar('', '', 'precio_asc').subscribe({
      next: l => { this.puestos.set(l); this.cargando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
