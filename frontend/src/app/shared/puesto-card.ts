import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Comerciante } from '../core/models';
import { Icono } from './icono';
import { SolesPipe } from './formatos';

/** Tarjeta resumen de un puesto (se usa en Buscar y en otros listados). */
@Component({
  selector: 'app-puesto-card',
  imports: [RouterLink, Icono, SolesPipe],
  template: `
    <article class="tarjeta">
      <div class="fila">
        <div class="avatar" aria-hidden="true">{{ c().iniciales }}</div>
        <div>
          <strong>{{ c().nombre }}</strong>
          <p class="suave"><app-icono nombre="star" [tam]="14" /> {{ c().calificacion.toFixed(1) }} ({{ c().numCalificaciones }})</p>
        </div>
        @if (etiqueta()) { <span class="etq" style="margin-left:auto"><app-icono nombre="badge-check" [tam]="14" />{{ etiqueta() }}</span> }
      </div>
      <p class="suave linea"><app-icono nombre="map-pin" [tam]="14" /> Pasillo {{ c().pasillo }} · Puesto {{ c().nroPuesto }} · {{ c().seccion }}</p>
      <div class="fila entre">
        <span class="suave">{{ c().precioMedio != null ? 'Precio medio' : 'Sin precios' }}</span>
        @if (c().precioMedio != null) { <span class="precio">{{ c().precioMedio | soles }}</span> }
      </div>
      <a class="btn sec block" [routerLink]="['/puesto', c().id]">Ver puesto <app-icono nombre="arrow-right" [tam]="18" /></a>
    </article>
  `,
  styles: `
    .linea { display: flex; gap: 6px; align-items: center; margin: 12px 0; }
    p.suave { display: flex; gap: 4px; align-items: center; }
    .btn { margin-top: 14px; }
  `
})
export class PuestoCard {
  readonly c = input.required<Comerciante>();
  readonly etiqueta = input('');
}
