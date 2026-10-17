import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { Auth, mensajeError } from '../core/auth.service';
import { Canasta } from '../core/canasta.service';
import { iconoProducto } from '../core/iconos';
import { ComercianteDetalle } from '../core/models';
import { SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 4 · Cotizar / Reservar: arma la canasta y envíala al casero. */
@Component({
  selector: 'app-cotizar',
  imports: [RouterLink, Icono, SolesPipe],
  template: `
    <div class="contenedor pagina angosto">
      <h1>Tu cotización</h1>
      <div class="pasos"><span>1 Selecciona productos</span><span class="on">2 Confirma</span><span>3 Envía</span></div>

      @if (error() && !d()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (!d()) {
        <p class="cargando" role="status">Cargando…</p>
      } @else {
        <p>Puesto de <strong>{{ d()!.comerciante.nombre }}</strong> · Pasillo {{ d()!.comerciante.pasillo }} · Puesto {{ d()!.comerciante.nroPuesto }}</p>

        @if (!canasta.items().length) {
          <div class="vacio">Tu canasta está vacía.<br><a [routerLink]="['/puesto', d()!.comerciante.id]">Agregar productos de este puesto</a></div>
        } @else {
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Subtotal</th><th></th></tr></thead>
              <tbody>
                @for (i of canasta.items(); track i.productoId) {
                  <tr>
                    <td><span class="prod"><app-icono [nombre]="ico(i.nombre)" [tam]="18" /> {{ i.nombre }}</span></td>
                    <td class="num">{{ i.cantidad }} {{ i.unidad }}</td>
                    <td class="num precio">
                      @if (precio(i.productoId); as p) { {{ p * i.cantidad | soles }} } @else { <span class="etq nar">No lo vende</span> }
                    </td>
                    <td><button type="button" class="btn fantasma" (click)="canasta.quitar(i.productoId)" [attr.aria-label]="'Quitar ' + i.nombre"><app-icono nombre="trash-2" [tam]="16" /></button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (faltantes().length) {
            <div class="msg error" role="alert">Este puesto no vende: {{ nombresFaltantes() }}. Quítalo de la canasta para enviar la cotización.</div>
          }
          <div class="pizarra" style="margin:20px 0"><div>Total (aprox.)</div><div class="monto">{{ total() | soles }}</div></div>
          @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }
          <button type="button" class="btn grande block" [disabled]="faltantes().length > 0 || enviando()" (click)="enviar()">
            <app-icono nombre="receipt" [tam]="20" /> {{ enviando() ? 'Enviando…' : 'Enviar cotización' }}
          </button>
          <p class="suave info"><app-icono nombre="info" [tam]="16" /> El comerciante confirmará el precio final disponible.</p>
        }
      }
    </div>
  `,
  styles: `
    .angosto { max-width: 820px; }
    .prod { display: inline-flex; gap: 8px; align-items: center; }
    .info { display: flex; gap: 6px; align-items: center; margin-top: 12px; }
  `
})
export class Cotizar {
  private api = inject(Api);
  private auth = inject(Auth);
  private router = inject(Router);
  protected canasta = inject(Canasta);
  protected ico = iconoProducto;

  readonly id = input.required<string>();
  protected d = signal<ComercianteDetalle | null>(null);
  protected error = signal('');
  protected enviando = signal(false);

  protected precio = (productoId: number) => this.d()?.precios.find(p => p.productoId === productoId)?.precio ?? null;
  protected faltantes = computed(() => this.canasta.items().filter(i => this.precio(i.productoId) == null));
  protected nombresFaltantes = computed(() => this.faltantes().map(f => f.nombre).join(', '));
  protected total = computed(() => this.canasta.items().reduce((t, i) => t + (this.precio(i.productoId) ?? 0) * i.cantidad, 0));

  constructor() {
    effect(() => {
      this.d.set(null); this.error.set('');
      this.api.puesto(+this.id()).subscribe({ next: d => this.d.set(d), error: e => this.error.set(mensajeError(e)) });
    });
  }

  protected enviar() {
    if (!this.auth.logueado()) {
      this.router.navigate(['/acceso'], { queryParams: { volver: this.router.url } });
      return;
    }
    this.enviando.set(true); this.error.set('');
    const items = this.canasta.items().map(i => ({ productoId: i.productoId, cantidad: i.cantidad }));
    // La misma clave para el mismo contenido evita cotizaciones duplicadas si se envía dos veces
    const firma = this.id() + ':' + items.map(i => i.productoId + 'x' + i.cantidad).join(',');
    let clave: { firma: string; id: string } = { firma: '', id: '' };
    try { clave = JSON.parse(localStorage.getItem('kasero_clave') ?? '{}'); } catch { /* sin almacenamiento */ }
    if (clave.firma !== firma) {
      clave = { firma, id: crypto.randomUUID() };
      try { localStorage.setItem('kasero_clave', JSON.stringify(clave)); } catch { /* sin almacenamiento */ }
    }
    this.api.crearCotizacion(+this.id(), clave.id, items).subscribe({
      next: c => { this.canasta.vaciar(); this.router.navigate(['/pedido', c.id]); },
      error: e => { this.error.set(mensajeError(e)); this.enviando.set(false); }
    });
  }
}
