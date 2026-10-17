import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { Canasta } from '../core/canasta.service';
import { iconoProducto } from '../core/iconos';
import { ComparacionResponse, Producto } from '../core/models';
import { SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 5 · Comparar la misma canasta entre puestos. */
@Component({
  selector: 'app-comparar',
  imports: [FormsModule, RouterLink, Icono, SolesPipe],
  template: `
    <div class="contenedor pagina">
      <h1>Comparar precios</h1>
      <p class="suave" style="margin-bottom:18px">Canasta de referencia: la misma canasta cotizada en distintos puestos para decidir mejor.</p>

      <section class="tarjeta">
        <strong class="tit"><app-icono nombre="shopping-basket" [tam]="18" /> Tu canasta</strong>
        @if (canasta.items().length) {
          <table>
            <tbody>
              @for (i of canasta.items(); track i.productoId) {
                <tr>
                  <td><span class="prod"><app-icono [nombre]="ico(i.nombre)" [tam]="18" /> {{ i.nombre }}</span></td>
                  <td>
                    <label class="solo-lectores" [for]="'q' + i.productoId">Cantidad de {{ i.nombre }}</label>
                    <input class="cant" [id]="'q' + i.productoId" type="number" min="0.5" step="0.5" [value]="i.cantidad"
                           (change)="canasta.cambiarCantidad(i.productoId, +$any($event.target).value)"> {{ i.unidad }}
                  </td>
                  <td class="num"><button type="button" class="btn fantasma" (click)="canasta.quitar(i.productoId)" [attr.aria-label]="'Quitar ' + i.nombre"><app-icono nombre="trash-2" [tam]="16" /></button></td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="suave" style="margin:10px 0">Agrega productos para comparar el total entre puestos.</p>
        }
        <div class="fila envolver" style="margin-top:14px">
          <label class="solo-lectores" for="np">Agregar producto</label>
          <select id="np" [(ngModel)]="nuevo" style="max-width:320px">
            <option [ngValue]="0">Agregar producto…</option>
            @for (p of productos(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }} ({{ p.unidad }})</option> }
          </select>
          <button type="button" class="btn" (click)="agregar()"><app-icono nombre="plus" [tam]="16" /> Agregar</button>
          <button type="button" class="btn fantasma" (click)="canasta.vaciar()">Vaciar</button>
        </div>
      </section>

      @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }

      @if (res(); as r) {
        <div class="seccion-t"><h2>Resultado</h2></div>
        @if (r.completos.length) {
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Comerciante</th><th class="num">Precio total</th><th class="num">Diferencia</th><th></th></tr></thead>
              <tbody>
                @for (f of r.completos; track f.comerciante.id) {
                  <tr [class.mejor]="f.masEconomico">
                    <td>
                      <strong>{{ f.comerciante.nombre }}</strong>
                      @if (f.masEconomico) { <span class="etq"><app-icono nombre="badge-check" [tam]="14" /> Más económico</span> }
                      <br><span class="suave">★ {{ f.comerciante.calificacion.toFixed(1) }} · Pasillo {{ f.comerciante.pasillo }} · Puesto {{ f.comerciante.nroPuesto }}</span>
                    </td>
                    <td class="num precio">{{ f.total | soles }}</td>
                    <td class="num">{{ f.masEconomico ? '—' : '+ ' + (f.diferencia | soles) }}</td>
                    <td><a class="btn sec" [routerLink]="['/cotizar', f.comerciante.id]">Cotizar</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="vacio">Ningún puesto vende toda la canasta. Prueba quitando algún producto.</div>
        }
        @if (r.incompletos.length) {
          <div class="seccion-t"><h2>No venden toda la canasta</h2></div>
          @for (f of r.incompletos; track f.comerciante.id) {
            <div class="tarjeta" style="margin-bottom:8px">{{ f.comerciante.nombre }} — le falta: {{ f.faltantes.join(', ') }}</div>
          }
        }
        <p class="suave info"><app-icono nombre="info" [tam]="16" /> Solo se comparan puestos que venden todos los productos de la misma canasta.</p>
      }
    </div>
  `,
  styles: `
    .tit { display: inline-flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .prod { display: inline-flex; gap: 8px; align-items: center; }
    .mejor td { background: var(--verde-cl); }
    .info { display: flex; gap: 6px; align-items: center; margin-top: 14px; }
  `
})
export class Comparar {
  private api = inject(Api);
  protected canasta = inject(Canasta);
  protected ico = iconoProducto;

  protected productos = signal<Producto[]>([]);
  protected res = signal<ComparacionResponse | null>(null);
  protected error = signal('');
  protected nuevo = 0;

  constructor() {
    this.api.productos().subscribe(p => this.productos.set(p));
    // Recalcula la comparación cada vez que cambia la canasta
    effect(() => {
      const items = this.canasta.items().map(i => ({ productoId: i.productoId, cantidad: i.cantidad }));
      this.error.set('');
      if (!items.length) { this.res.set(null); return; }
      this.api.comparar(items).subscribe({ next: r => this.res.set(r), error: e => this.error.set(mensajeError(e)) });
    });
  }

  protected agregar() {
    const p = this.productos().find(x => x.id === this.nuevo);
    if (p) this.canasta.agregar({ productoId: p.id, nombre: p.nombre, unidad: p.unidad, icono: p.icono, cantidad: 1 });
    this.nuevo = 0;
  }
}
