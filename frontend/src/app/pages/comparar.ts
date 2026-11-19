import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoProducto } from '../core/iconos';
import { ComparacionResponse, PrecioPromedio, Producto, ResumenPrecios } from '../core/models';
import { SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Comparar un producto a la vez entre los puestos que lo venden, con el precio promedio como referencia. */
@Component({
  selector: 'app-comparar',
  imports: [RouterLink, Icono, SolesPipe],
  template: `
    <section id="comparar">
      <div class="seccion-t"><h2>Comparar precios</h2></div>
      <p class="suave" style="margin-bottom:18px">Elige un producto y mira quién lo tiene más barato hoy.</p>

      @if (sugeridos().length) {
        <section class="tarjeta">
          <strong>{{ resumen()?.masComprados?.length ? 'Los más comprados' : 'Productos' }}</strong>
          <div class="chips">
            @for (p of sugeridos(); track p.id) {
              <button type="button" class="chip" [class.on]="elegido() === p.id" (click)="elegir(p.id)">
                <app-icono [nombre]="ico(p.nombre)" [tam]="16" />{{ p.nombre }}
              </button>
            }
          </div>
          <label for="otro" class="otro">Otro producto</label>
          <select id="otro" (change)="elegir(+$any($event.target).value)" [value]="elegido()">
            <option value="0">Elegir producto…</option>
            @for (p of productos(); track p.id) { <option [value]="p.id" [selected]="elegido() === p.id">{{ p.nombre }} ({{ p.unidad }})</option> }
          </select>
        </section>
      }

      @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }

      @if (elegidoProducto(); as prod) {
        <div class="seccion-t"><h2>{{ prod.nombre }} por {{ prod.unidad }}</h2></div>

        @if (promedio(); as pm) {
          <section class="tarjeta promedio fila">
            <div><span class="suave">Precio promedio</span><strong class="precio grande">{{ pm.promedio | soles }}</strong></div>
            <div><span class="suave">Más bajo</span><strong>{{ pm.minimo | soles }}</strong></div>
            <div><span class="suave">Más alto</span><strong>{{ pm.maximo | soles }}</strong></div>
            <div><span class="suave">Puestos</span><strong>{{ pm.puestos }}</strong></div>
          </section>
        }

        @if (cargando()) {
          <p class="cargando" role="status">Comparando…</p>
        } @else if (res(); as r) {
          @if (r.completos.length) {
            <div style="overflow-x:auto">
              <table>
                <thead><tr><th>Casero</th><th class="num">Precio</th><th class="num">Frente al promedio</th><th></th></tr></thead>
                <tbody>
                  @for (f of r.completos; track f.comerciante.id) {
                    <tr [class.mejor]="f.masEconomico">
                      <td>
                        <strong>{{ f.comerciante.nombre }}</strong>
                        @if (f.masEconomico) { <span class="etq"><app-icono nombre="badge-check" [tam]="14" /> Más económico</span> }
                        <br><span class="suave">{{ f.comerciante.calificacion.toFixed(1) }} · Pasillo {{ f.comerciante.pasillo }} · Puesto {{ f.comerciante.nroPuesto }}</span>
                      </td>
                      <td class="num precio">{{ f.total | soles }}</td>
                      <td class="num">{{ frente(f.total) }}</td>
                      <td><a class="btn sec" [routerLink]="['/puesto', f.comerciante.id]">Pedir</a></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="vacio">Ningún casero vende este producto por ahora.</div>
          }
        }
      } @else {
        <div class="vacio" style="margin-top:20px">Elige un producto para ver la comparación.</div>
      }
    </section>
  `,
  styles: `
    .otro { display: block; margin: 16px 0 6px; font-size: .9rem; color: var(--suave); }
    select { max-width: 320px; }
    .promedio { gap: 36px; flex-wrap: wrap; margin-bottom: 18px; }
    .promedio div { display: grid; gap: 2px; }
    .grande { font-size: 1.8rem; }
    .mejor td { background: var(--verde-cl); }
  `
})
export class Comparar {
  private api = inject(Api);
  protected ico = iconoProducto;

  protected productos = signal<Producto[]>([]);
  protected resumen = signal<ResumenPrecios | null>(null);
  protected elegido = signal(0);
  protected res = signal<ComparacionResponse | null>(null);
  protected cargando = signal(false);
  protected error = signal('');

  /** Los productos que más se compran en general van primero. */
  protected sugeridos = computed(() => {
    const orden = this.resumen()?.masComprados.map(m => m.producto) ?? [];
    const todos = this.productos();
    const top = orden.map(n => todos.find(p => p.nombre === n)).filter((p): p is Producto => !!p);
    return (top.length ? top : todos).slice(0, 8);
  });
  protected elegidoProducto = computed(() => this.productos().find(p => p.id === this.elegido()) ?? null);
  protected promedio = computed<PrecioPromedio | null>(() =>
    this.resumen()?.promedios.find(p => p.producto === this.elegidoProducto()?.nombre) ?? null);

  constructor() {
    this.api.productos().subscribe({ next: p => this.productos.set(p), error: e => this.error.set(mensajeError(e)) });
    this.api.resumenPrecios().subscribe({ next: r => this.resumen.set(r), error: () => this.resumen.set(null) });
  }

  protected elegir(id: number) {
    this.elegido.set(id); this.res.set(null); this.error.set('');
    if (!id) return;
    this.cargando.set(true);
    this.api.comparar([{ productoId: id, cantidad: 1 }]).subscribe({
      next: r => { this.res.set(r); this.cargando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }

  protected frente(precio: number) {
    const pm = this.promedio();
    if (!pm || !pm.promedio) return '—';
    const d = ((precio - pm.promedio) / pm.promedio) * 100;
    return Math.abs(d) < 0.5 ? 'Igual al promedio' : (d > 0 ? '+' : '') + d.toFixed(0) + '%';
  }
}
