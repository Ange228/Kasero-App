import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoProducto } from '../core/iconos';
import { ComercianteDetalle, PedidoPuesto, PrecioItem, Producto } from '../core/models';
import { ESTADO, FechaPipe, MODALIDAD, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Panel del comerciante: pedidos recibidos y precios del puesto. */
@Component({
  selector: 'app-mi-puesto',
  imports: [FormsModule, Icono, SolesPipe, FechaPipe],
  template: `
    <div class="contenedor pagina">
      @if (error() && !d()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (!d()) {
        <p class="cargando" role="status">Cargando tu puesto…</p>
      } @else {
        <div class="fila entre envolver">
          <div>
            <h1>Mi puesto</h1>
            <p class="suave">{{ d()!.comerciante.nombre }} · Pasillo {{ d()!.comerciante.pasillo }} · Puesto {{ d()!.comerciante.nroPuesto }} · {{ d()!.comerciante.seccion }}</p>
          </div>
          <div class="fila"><span class="etq"><app-icono nombre="star" [tam]="14" /> {{ d()!.comerciante.calificacion.toFixed(1) }} ({{ d()!.comerciante.numCalificaciones }})</span></div>
        </div>

        <div class="tabs" role="tablist">
          <button type="button" role="tab" [class.on]="tab() === 'pedidos'" (click)="tab.set('pedidos')">Pedidos ({{ pendientes() }} activos)</button>
          <button type="button" role="tab" [class.on]="tab() === 'precios'" (click)="tab.set('precios')">Mis precios</button>
        </div>

        @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }
        @if (aviso()) { <div class="msg ok" role="status">{{ aviso() }}</div> }

        @if (tab() === 'pedidos') {
          @for (p of pedidos(); track p.id) {
            <article class="tarjeta pedido">
              <div class="fila entre envolver">
                <span><strong>Pedido #{{ p.id }}</strong> · {{ p.cliente }}<br><span class="suave">{{ p.fecha | fecha }} · {{ modalidades[p.modalidad] }}</span></span>
                <span class="precio">{{ p.total | soles }}</span>
              </div>
              <ul class="items">@for (i of p.items; track i.producto) { <li>{{ i.cantidad }} {{ i.unidad }} de {{ i.producto }} <span class="suave">({{ i.subtotal | soles }})</span></li> }</ul>
              @if (p.direccion) { <p class="suave"><app-icono nombre="map-pin" [tam]="14" /> Enviar a: {{ p.direccion }}</p> }
              @if (p.terceroNombre) { <p class="suave"><app-icono nombre="user-check" [tam]="14" /> Lo recoge {{ p.terceroNombre }} · código <strong>{{ p.codigoEntrega }}</strong></p> }
              <div class="fila entre envolver">
                <span class="etq"><app-icono nombre="clock" [tam]="14" /> {{ estados[p.estado] || p.estado }}</span>
                @if (siguiente[p.estado]; as sig) {
                  <button type="button" class="btn" (click)="avanzar(p, sig.estado)"><app-icono nombre="check" [tam]="16" /> {{ sig.texto }}</button>
                }
              </div>
            </article>
          } @empty {
            <div class="vacio">Todavía no recibiste pedidos.</div>
          }
        } @else {
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Producto</th><th>Precio (S/)</th><th>Actualizado</th><th></th></tr></thead>
              <tbody>
                @for (p of d()!.precios; track p.productoId) {
                  <tr>
                    <td><span class="prod"><app-icono [nombre]="ico(p.nombre)" [tam]="18" /> {{ p.nombre }} <span class="suave">/ {{ p.unidad }}</span></span></td>
                    <td>
                      <label class="solo-lectores" [for]="'p' + p.productoId">Precio de {{ p.nombre }}</label>
                      <input class="cant" [id]="'p' + p.productoId" type="number" min="0.1" step="0.1" [ngModel]="p.precio" (ngModelChange)="editados[p.productoId] = +$event">
                    </td>
                    <td class="suave">{{ p.actualizado | fecha }}</td>
                    <td class="fila">
                      <button type="button" class="btn sec" (click)="guardar(p)">Guardar</button>
                      <button type="button" class="btn fantasma" (click)="quitar(p)" [attr.aria-label]="'Quitar ' + p.nombre"><app-icono nombre="trash-2" [tam]="16" /></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="tarjeta agregar">
            <strong>Agregar un producto a tu catálogo</strong>
            <div class="fila envolver">
              <label class="solo-lectores" for="nuevoProd">Producto</label>
              <select id="nuevoProd" [(ngModel)]="nuevoProducto" style="max-width:280px">
                <option [ngValue]="0">Elige un producto…</option>
                @for (p of disponibles(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }} ({{ p.unidad }})</option> }
              </select>
              <label class="solo-lectores" for="nuevoPrecio">Precio</label>
              <input id="nuevoPrecio" class="cant" type="number" min="0.1" step="0.1" [(ngModel)]="nuevoPrecio" placeholder="S/">
              <button type="button" class="btn" (click)="agregar()"><app-icono nombre="plus" [tam]="16" /> Agregar</button>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .pedido { margin-bottom: 12px; display: grid; gap: 10px; }
    .items { margin: 0; padding-left: 18px; }
    .prod { display: inline-flex; gap: 8px; align-items: center; }
    .agregar { margin-top: 20px; display: grid; gap: 10px; }
    p.suave { display: flex; gap: 6px; align-items: center; }
  `
})
export class MiPuesto {
  private api = inject(Api);
  protected ico = iconoProducto;
  protected estados = ESTADO;
  protected modalidades = MODALIDAD;
  protected siguiente: Record<string, { estado: string; texto: string }> = {
    EN_PREPARACION: { estado: 'LISTO', texto: 'Marcar listo' },
    LISTO: { estado: 'ENTREGADO', texto: 'Marcar entregado' }
  };

  protected d = signal<ComercianteDetalle | null>(null);
  protected pedidos = signal<PedidoPuesto[]>([]);
  protected productos = signal<Producto[]>([]);
  protected tab = signal<'pedidos' | 'precios'>('pedidos');
  protected error = signal('');
  protected aviso = signal('');
  protected editados: Record<number, number> = {};
  protected nuevoProducto = 0;
  protected nuevoPrecio: number | null = null;

  protected pendientes = computed(() => this.pedidos().filter(p => p.estado !== 'ENTREGADO').length);
  protected disponibles = computed(() => {
    const tiene = new Set(this.d()?.precios.map(p => p.productoId));
    return this.productos().filter(p => !tiene.has(p.id));
  });

  constructor() { this.cargar(); }

  private cargar() {
    forkJoin({ d: this.api.miPuesto(), p: this.api.pedidosPuesto(), prod: this.api.productos() }).subscribe({
      next: r => { this.d.set(r.d); this.pedidos.set(r.p); this.productos.set(r.prod); },
      error: e => this.error.set(mensajeError(e))
    });
  }

  private ok(texto: string) { this.error.set(''); this.aviso.set(texto); this.cargar(); }
  private fallo(e: unknown) { this.aviso.set(''); this.error.set(mensajeError(e)); }

  protected avanzar(p: PedidoPuesto, estado: string) {
    this.api.cambiarEstado(p.id, estado).subscribe({ next: () => this.ok(`Pedido #${p.id} actualizado`), error: e => this.fallo(e) });
  }

  protected guardar(p: PrecioItem) {
    const precio = this.editados[p.productoId] ?? p.precio;
    this.api.fijarPrecio(p.productoId, precio).subscribe({ next: () => { delete this.editados[p.productoId]; this.ok(`Precio de ${p.nombre} guardado`); }, error: e => this.fallo(e) });
  }

  protected quitar(p: PrecioItem) {
    this.api.quitarPrecio(p.productoId).subscribe({ next: () => this.ok(`${p.nombre} salió de tu catálogo`), error: e => this.fallo(e) });
  }

  protected agregar() {
    if (!this.nuevoProducto || !this.nuevoPrecio) { this.fallo(new Error('x')); this.error.set('Elige un producto y escribe su precio'); return; }
    this.api.fijarPrecio(this.nuevoProducto, this.nuevoPrecio).subscribe({
      next: () => { this.nuevoProducto = 0; this.nuevoPrecio = null; this.ok('Producto agregado a tu catálogo'); },
      error: e => this.fallo(e)
    });
  }
}
