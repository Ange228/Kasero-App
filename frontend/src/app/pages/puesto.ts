import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { Canasta } from '../core/canasta.service';
import { iconoProducto } from '../core/iconos';
import { ComercianteDetalle, Resena } from '../core/models';
import { Estrellas } from '../shared/estrellas';
import { FechaPipe, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 3 · Perfil del comerciante con su catálogo de productos. */
@Component({
  selector: 'app-puesto',
  imports: [RouterLink, Icono, Estrellas, SolesPipe, FechaPipe],
  template: `
    <div class="contenedor pagina">
      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
        <a routerLink="/buscar" class="btn sec">Volver a buscar</a>
      } @else if (!d()) {
        <p class="cargando" role="status">Cargando puesto…</p>
      } @else {
        <section class="tarjeta ficha">
          <div class="fila">
            <div class="avatar grande" aria-hidden="true">{{ d()!.comerciante.iniciales }}</div>
            <div>
              <h1>{{ d()!.comerciante.nombre }} <span class="etq"><app-icono nombre="badge-check" [tam]="14" /> Verificado</span></h1>
              <p class="suave dato"><app-icono nombre="star" [tam]="14" /> {{ d()!.comerciante.calificacion.toFixed(1) }} ({{ d()!.comerciante.numCalificaciones }} calificaciones)
                · <app-icono nombre="map-pin" [tam]="14" /> Pasillo {{ d()!.comerciante.pasillo }} · Puesto {{ d()!.comerciante.nroPuesto }} · {{ d()!.comerciante.seccion }}</p>
            </div>
          </div>
          <div class="bloques">
            <div><strong>Métodos de pago</strong>
              <div class="chips">@for (m of d()!.comerciante.metodosPago; track m) { <span class="etq"><app-icono nombre="smartphone" [tam]="14" />{{ m }}</span> }</div></div>
            <div><strong>Modalidades de entrega</strong>
              <div class="chips">@for (m of d()!.modalidades; track m) { <span class="etq"><app-icono nombre="truck" [tam]="14" />{{ m }}</span> }</div></div>
          </div>
        </section>

        <div class="tabs" role="tablist">
          <button type="button" role="tab" [class.on]="tab() === 'prod'" (click)="tab.set('prod')">Productos</button>
          <button type="button" role="tab" [class.on]="tab() === 'sobre'" (click)="tab.set('sobre')">Sobre nosotros</button>
          <button type="button" role="tab" [class.on]="tab() === 'opiniones'" (click)="tab.set('opiniones')">Opiniones ({{ opiniones().length }})</button>
        </div>

        @if (tab() === 'prod') {
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Producto</th><th class="num">Precio</th><th>Actualizado</th><th>Cantidad</th><th></th></tr></thead>
              <tbody>
                @for (p of d()!.precios; track p.productoId) {
                  <tr>
                    <td><span class="prod"><app-icono [nombre]="ico(p.nombre)" [tam]="18" /> {{ p.nombre }}</span></td>
                    <td class="num precio">{{ p.precio | soles }} / {{ p.unidad }}</td>
                    <td class="suave">{{ p.actualizado | fecha }}</td>
                    <td>
                      <label class="solo-lectores" [for]="'c' + p.productoId">Cantidad de {{ p.nombre }}</label>
                      <input class="cant" [id]="'c' + p.productoId" type="number" min="0.5" step="0.5" [value]="cantidades[p.productoId] ?? 1"
                             (input)="cantidades[p.productoId] = +$any($event.target).value">
                    </td>
                    <td><button type="button" class="btn sec" (click)="agregar(p.productoId)"><app-icono nombre="plus" [tam]="16" /> Agregar</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="fila envolver" style="margin-top:20px">
            <a class="btn" [routerLink]="['/cotizar', d()!.comerciante.id]"><app-icono nombre="receipt" [tam]="18" /> Cotizar / Reservar</a>
            <a class="btn sec" routerLink="/comparar"><app-icono nombre="scale" [tam]="18" /> Comparar canasta</a>
            <span class="suave">En tu canasta: {{ canasta.cantidad() }} producto(s)</span>
          </div>
        } @else if (tab() === 'opiniones') {
          <div class="tarjeta resumen fila">
            <span class="promedio">{{ d()!.comerciante.calificacion.toFixed(1) }}</span>
            <div><app-estrellas [valor]="d()!.comerciante.calificacion" [tam]="22" /><p class="suave">{{ d()!.comerciante.numCalificaciones }} calificaciones</p></div>
          </div>
          @for (o of opiniones(); track o.id) {
            <article class="tarjeta op">
              <div class="fila entre"><strong>{{ o.usuario }}</strong><span class="suave">{{ o.fecha | fecha }}</span></div>
              <app-estrellas [valor]="o.puntaje" />
              @if (o.comentario) { <p>{{ o.comentario }}</p> }
            </article>
          } @empty {
            <p class="vacio">Todavía no hay opiniones escritas. Si ya compraste aquí, califica desde <a routerLink="/pedidos">Mis pedidos</a>.</p>
          }
        } @else {
          <div class="tarjeta">
            <p>{{ d()!.comerciante.nombre }} atiende en el pasillo {{ d()!.comerciante.pasillo }}, puesto {{ d()!.comerciante.nroPuesto }}, sección {{ d()!.comerciante.seccion }}.</p>
            <p style="margin-top:10px">¿Tiene caseros fijos? <strong>{{ d()!.comerciante.tieneCaseros }}</strong></p>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .ficha { display: grid; gap: 20px; }
    .grande { width: 64px; height: 64px; font-size: 1.3rem; }
    h1 { font-size: 1.9rem; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 0; }
    .dato { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 6px; }
    .bloques { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
    .bloques .chips { margin-top: 8px; }
    .prod { display: inline-flex; gap: 8px; align-items: center; }
    .resumen { gap: 18px; margin-bottom: 14px; }
    .promedio { font: 600 3rem var(--font-titulo); letter-spacing: -0.05em; }
    .op { margin-bottom: 10px; display: grid; gap: 6px; }
  `
})
export class Puesto {
  private api = inject(Api);
  protected canasta = inject(Canasta);
  protected ico = iconoProducto;

  readonly id = input.required<string>();
  protected d = signal<ComercianteDetalle | null>(null);
  protected error = signal('');
  protected tab = signal<'prod' | 'sobre' | 'opiniones'>('prod');
  protected opiniones = signal<Resena[]>([]);
  protected cantidades: Record<number, number> = {};

  constructor() {
    effect(() => {
      this.d.set(null); this.error.set('');
      this.api.puesto(+this.id()).subscribe({ next: d => this.d.set(d), error: e => this.error.set(mensajeError(e)) });
      this.api.resenas(+this.id()).subscribe({ next: r => this.opiniones.set(r), error: () => this.opiniones.set([]) });
    });
  }

  protected agregar(productoId: number) {
    const p = this.d()!.precios.find(x => x.productoId === productoId)!;
    this.canasta.agregar({ productoId, nombre: p.nombre, unidad: p.unidad, icono: p.icono, cantidad: this.cantidades[productoId] || 1 });
  }
}
