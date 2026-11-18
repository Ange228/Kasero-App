import { Component, inject, signal } from '@angular/core';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoProducto } from '../core/iconos';
import { ResumenPrecios } from '../core/models';
import { SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 7 · Información de precios: promedios y productos con más movimiento. */
@Component({
  selector: 'app-precios',
  imports: [Icono, SolesPipe],
  template: `
    <div class="contenedor pagina">
      <h1>Precios del mercado</h1>
      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (!r()) {
        <p class="cargando" role="status">Cargando precios…</p>
      } @else {
        <div class="grid g2">
          <section class="tarjeta">
            <h3 class="tit"><app-icono nombre="trending-up" [tam]="20" /> Productos más cotizados</h3>
            @for (p of r()!.masCotizados; track p.producto; let i = $index) {
              <div class="fila entre linea"><span>{{ i + 1 }}. <app-icono [nombre]="ico(p.producto)" [tam]="16" /> {{ p.producto }}</span><span class="precio">{{ p.cantidad }}</span></div>
            } @empty { <p class="suave">Aún no hay cotizaciones registradas.</p> }
          </section>
          <section class="tarjeta">
            <h3 class="tit"><app-icono nombre="package" [tam]="20" /> Productos más comprados</h3>
            @for (p of r()!.masComprados; track p.producto; let i = $index) {
              <div class="fila entre linea"><span>{{ i + 1 }}. <app-icono [nombre]="ico(p.producto)" [tam]="16" /> {{ p.producto }}</span><span class="precio">{{ p.cantidad }}</span></div>
            } @empty { <p class="suave">Aún no hay pedidos registrados.</p> }
          </section>
        </div>

        <div class="seccion-t"><h2>Precio promedio por producto</h2></div>
        <section class="tarjeta">
          @for (p of r()!.promedios; track p.producto) {
            <div class="prod">
              <div class="fila entre">
                <span><app-icono [nombre]="ico(p.producto)" [tam]="18" /> {{ p.producto }} <span class="suave">({{ p.puestos }} puesto{{ p.puestos > 1 ? 's' : '' }})</span></span>
                <span class="precio">{{ p.promedio | soles }} / {{ p.unidad }}</span>
              </div>
              <div class="progreso" aria-hidden="true"><i [style.width.%]="(p.promedio / maximo()) * 100"></i></div>
              <span class="suave">Mín {{ p.minimo | soles }} · Máx {{ p.maximo | soles }}</span>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .tit { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; }
    .linea { padding: 8px 0; border-bottom: 1px solid var(--borde); }
    .linea span:first-child { display: inline-flex; gap: 6px; align-items: center; }
    .prod { margin: 16px 0; display: grid; gap: 6px; }
    .prod .fila span:first-child { display: inline-flex; gap: 8px; align-items: center; }
  `
})
export class Precios {
  private api = inject(Api);
  protected ico = iconoProducto;
  protected r = signal<ResumenPrecios | null>(null);
  protected error = signal('');

  constructor() {
    this.api.resumenPrecios().subscribe({ next: r => this.r.set(r), error: e => this.error.set(mensajeError(e)) });
  }

  protected maximo = () => Math.max(...(this.r()?.promedios.map(p => p.maximo) ?? [1]), 1);
}
