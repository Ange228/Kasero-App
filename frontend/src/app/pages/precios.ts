import { Component, computed, inject, signal } from '@angular/core';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoProducto } from '../core/iconos';
import { EvolucionPrecios, ResumenPrecios } from '../core/models';
import { SolesPipe } from '../shared/formatos';
import { GraficoLineas } from '../shared/grafico-lineas';
import { Icono } from '../shared/icono';

/** Pantalla 7 · Información de precios: promedios y productos con más movimiento. */
@Component({
  selector: 'app-precios',
  imports: [Icono, GraficoLineas, SolesPipe],
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

        @if (evolucion(); as ev) {
          @if (grafica().length) {
            <div class="seccion-t"><h2>Evolución semanal de precios</h2></div>
            <section class="tarjeta">
              @if (ev.variacionGeneral !== null) {
                <p class="fila variacion" [class.baja]="ev.variacionGeneral < 0" [class.sube]="ev.variacionGeneral > 0">
                  <app-icono [nombre]="ev.variacionGeneral < 0 ? 'trending-down' : 'trending-up'" [tam]="22" />
                  <strong>{{ ev.variacionGeneral > 0 ? '+' : '' }}{{ ev.variacionGeneral }}%</strong>
                  <span class="suave">la canasta promedio frente a la semana anterior</span>
                </p>
              }
              <app-grafico-lineas [semanas]="ev.semanas" [series]="grafica()" />
              <div style="overflow-x:auto">
                <table>
                  <thead><tr><th>Producto</th><th class="num">Variación semanal</th></tr></thead>
                  <tbody>
                    @for (s of ev.series; track s.producto) {
                      <tr>
                        <td><app-icono [nombre]="ico(s.producto)" [tam]="16" /> {{ s.producto }}</td>
                        <td class="num">
                          @if (s.variacion === null) { <span class="suave">—</span> } @else {
                            <span class="var" [class.baja]="s.variacion < 0" [class.sube]="s.variacion > 0">{{ s.variacion > 0 ? '+' : '' }}{{ s.variacion }}%</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <p class="suave nota"><app-icono nombre="info" [tam]="14" /> Las semanas anteriores son datos de ejemplo; la semana actual usa los precios vigentes de cada puesto.</p>
            </section>
          }
        }

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
    .variacion { font-size: 1.1rem; margin-bottom: 12px; }
    .variacion.baja, .var.baja { color: #15803d; }
    .variacion.sube, .var.sube { color: #b45309; }
    .var { font-weight: 600; }
    .nota { display: flex; gap: 6px; align-items: center; margin-top: 12px; }
    td app-icono { vertical-align: middle; margin-right: 4px; }
    .prod { margin: 16px 0; display: grid; gap: 6px; }
    .prod .fila span:first-child { display: inline-flex; gap: 8px; align-items: center; }
  `
})
export class Precios {
  private api = inject(Api);
  protected ico = iconoProducto;
  protected r = signal<ResumenPrecios | null>(null);
  protected evolucion = signal<EvolucionPrecios | null>(null);
  protected error = signal('');

  /** Solo se grafican los productos con al menos dos semanas de datos (máximo 6 líneas). */
  protected grafica = computed(() => (this.evolucion()?.series ?? [])
    .filter(s => s.valores.filter(v => v !== null).length >= 2).slice(0, 6));

  constructor() {
    this.api.resumenPrecios().subscribe({ next: r => this.r.set(r), error: e => this.error.set(mensajeError(e)) });
    this.api.evolucionPrecios().subscribe({ next: e => this.evolucion.set(e), error: () => this.evolucion.set(null) });
  }

  protected maximo = () => Math.max(...(this.r()?.promedios.map(p => p.maximo) ?? [1]), 1);
}
