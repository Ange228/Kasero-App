import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Comerciante } from '../core/models';
import { FavBoton } from './fav-boton';
import { Icono } from './icono';
import { SolesPipe } from './formatos';

/** Tarjeta resumen de un puesto (se usa en Buscar y en otros listados). */
@Component({
  selector: 'app-puesto-card',
  imports: [RouterLink, Icono, SolesPipe, FavBoton],
  template: `
    <article class="tarjeta">
      <div class="cabeza">
        <div class="avatar" aria-hidden="true">{{ c().iniciales }}</div>
        <div class="quien">
          <strong>{{ c().nombre }}</strong>
          <p class="suave dato"><app-icono nombre="star" [tam]="14" /> {{ c().calificacion.toFixed(1) }} · {{ c().numCalificaciones }} calificaciones</p>
        </div>
        <app-fav-boton [comercianteId]="c().id" [tam]="22" />
      </div>
      @if (etiqueta()) { <span class="etq destacada"><app-icono nombre="badge-check" [tam]="14" />{{ etiqueta() }}</span> }
      <p class="suave dato ubic"><app-icono nombre="map-pin" [tam]="14" /> Pasillo {{ c().pasillo }} · Puesto {{ c().nroPuesto }} · {{ c().seccion }}</p>
      <div class="fila entre precio-fila">
        <span class="suave">{{ c().precioMedio != null ? 'Precio medio' : 'Sin precios' }}</span>
        @if (c().precioMedio != null) { <span class="precio">{{ c().precioMedio | soles }}</span> }
      </div>
      <a class="btn sec block" [routerLink]="['/puesto', c().id]">Pedir <app-icono nombre="arrow-right" [tam]="18" /></a>
    </article>
  `,
  styles: `
    article { display: grid; gap: 14px; padding: 22px; }
    .cabeza { display: flex; align-items: center; gap: 14px; }
    .quien { flex: 1; min-width: 0; }
    .quien strong { font-size: 1.1rem; }
    .dato { display: flex; gap: 6px; align-items: center; }
    .destacada { justify-self: start; }
    .precio-fila { padding-top: 12px; border-top: 1px solid var(--borde); }
  `
})
export class PuestoCard {
  readonly c = input.required<Comerciante>();
  readonly etiqueta = input('');
}
