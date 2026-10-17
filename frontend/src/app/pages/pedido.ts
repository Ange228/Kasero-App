import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { iconoProducto } from '../core/iconos';
import { Cotizacion, Modalidad, Pedido as PedidoModelo } from '../core/models';
import { MODALIDAD, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Pantalla 6 · Confirmar pedido y elegir modalidad de entrega. */
@Component({
  selector: 'app-pedido',
  imports: [FormsModule, RouterLink, Icono, SolesPipe],
  template: `
    <div class="contenedor pagina angosto">
      @if (confirmado(); as p) {
        <div class="msg ok" role="status"><strong>¡Pedido #{{ p.id }} confirmado!</strong><br>{{ modalidades[p.modalidad] }} · {{ p.total | soles }}</div>
        @if (p.codigoEntrega) {
          <div class="pizarra" style="margin:16px 0"><div>Código de entrega para {{ p.terceroNombre }}</div><div class="monto">{{ p.codigoEntrega }}</div></div>
        }
        <a class="btn" routerLink="/pedidos">Ver mis pedidos</a>
      } @else if (error() && !q()) {
        <div class="msg error" role="alert">{{ error() }}</div>
        <a class="btn sec" routerLink="/pedidos">Mis pedidos</a>
      } @else if (!q()) {
        <p class="cargando" role="status">Cargando…</p>
      } @else {
        <h1>Confirmar pedido</h1>
        <div class="msg ok" role="status">Cotización #{{ q()!.id }} enviada a {{ q()!.comerciante }}. Ahora elige cómo recibirás tu compra.</div>

        <section class="tarjeta">
          <strong>Productos</strong>
          <table>
            <tbody>
              @for (i of q()!.items; track i.producto) {
                <tr><td><span class="prod"><app-icono [nombre]="ico(i.producto)" [tam]="18" /> {{ i.producto }}</span></td><td>{{ i.cantidad }} {{ i.unidad }}</td><td class="num precio">{{ i.subtotal | soles }}</td></tr>
              }
              <tr><th colspan="2">Total</th><td class="num precio">{{ q()!.total | soles }}</td></tr>
            </tbody>
          </table>
        </section>

        <div class="seccion-t"><h2>Selecciona la modalidad de entrega</h2></div>
        @for (o of opciones; track o.valor) {
          <label class="opcion" [class.on]="modalidad() === o.valor">
            <input type="radio" name="modalidad" [value]="o.valor" [checked]="modalidad() === o.valor" (change)="modalidad.set(o.valor)">
            <app-icono [nombre]="o.icono" [tam]="24" />
            <span><strong>{{ o.titulo }}</strong><br><span class="suave">{{ o.texto }}</span></span>
          </label>
        }
        @if (modalidad() === 'ENVIO') {
          <label for="dir">Dirección de envío</label>
          <input id="dir" name="dir" [(ngModel)]="direccion" autocomplete="street-address">
        }
        @if (modalidad() === 'TERCERO') {
          <label for="ter">Nombre de la persona autorizada</label>
          <input id="ter" name="ter" [(ngModel)]="tercero">
        }
        @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }
        <button type="button" class="btn grande block" style="margin-top:18px" [disabled]="enviando()" (click)="confirmar()">
          <app-icono nombre="circle-check" [tam]="20" /> Confirmar pedido
        </button>
      }
    </div>
  `,
  styles: `
    .angosto { max-width: 820px; }
    .prod { display: inline-flex; gap: 8px; align-items: center; }
    .opcion app-icono { color: var(--verde-osc); margin-top: 2px; }
  `
})
export class Pedido {
  private api = inject(Api);
  private router = inject(Router);
  protected ico = iconoProducto;
  protected modalidades = MODALIDAD;

  readonly id = input.required<string>();
  protected q = signal<Cotizacion | null>(null);
  protected confirmado = signal<PedidoModelo | null>(null);
  protected modalidad = signal<Modalidad>('ENVIO');
  protected direccion = '';
  protected tercero = '';
  protected error = signal('');
  protected enviando = signal(false);

  protected opciones: { valor: Modalidad; titulo: string; texto: string; icono: string }[] = [
    { valor: 'ENVIO', titulo: 'Envío', texto: 'El pedido llega a tu dirección.', icono: 'truck' },
    { valor: 'RECOJO', titulo: 'Recoger en puesto', texto: 'Recoge en el mercado.', icono: 'store' },
    { valor: 'TERCERO', titulo: 'Tercero autorizado', texto: 'Alguien de tu confianza lo recoge con un código.', icono: 'user-check' }
  ];

  constructor() {
    effect(() => {
      this.api.cotizaciones().subscribe({
        next: lista => {
          const c = lista.find(x => x.id === +this.id());
          if (!c) this.error.set('No encontramos esa cotización');
          else if (c.tienePedido) this.router.navigate(['/pedidos']);
          else this.q.set(c);
        },
        error: e => this.error.set(mensajeError(e))
      });
    });
  }

  protected confirmar() {
    this.enviando.set(true); this.error.set('');
    this.api.crearPedido(this.q()!.id, this.modalidad(), this.direccion, this.tercero).subscribe({
      next: p => this.confirmado.set(p),
      error: e => { this.error.set(mensajeError(e)); this.enviando.set(false); }
    });
  }
}
