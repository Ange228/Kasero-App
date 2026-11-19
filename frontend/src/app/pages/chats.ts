import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, interval, of } from 'rxjs';
import { Api } from '../core/api.service';
import { Auth, mensajeError } from '../core/auth.service';
import { ChatResumen, Comerciante, Pedido } from '../core/models';
import { ESTADO, FechaPipe, MODALIDAD, SolesPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';
import { Chat } from './chat';

/**
 * Cotizar / Reservar · bandeja estilo SaaS: a la izquierda tus caseros (conversaciones, favoritos y pedidos),
 * en el centro el chat y a la derecha los pedidos que hiciste con ese casero.
 */
@Component({
  selector: 'app-chats',
  imports: [FormsModule, RouterLink, Icono, Chat, FechaPipe, SolesPipe],
  template: `
    <div class="contenedor pagina">
      <div class="bandeja" [class.con-chat]="!!actual()">

        <!-- Lista de caseros -->
        <aside class="lista" aria-label="Tus caseros">
          <header>
            <h1>{{ auth.esComerciante() ? 'Mensajes' : 'Cotizar / Reservar' }}</h1>
            <label class="solo-lectores" for="filtro">Buscar casero</label>
            <div class="filtro"><app-icono nombre="search" [tam]="16" /><input id="filtro" name="filtro" [ngModel]="filtro()" (ngModelChange)="filtro.set($event)" [placeholder]="auth.esComerciante() ? 'Buscar cliente…' : 'Buscar casero…'"></div>
            @if (!auth.esComerciante()) {
              <div class="pestanas" role="tablist">
                <button type="button" role="tab" [class.on]="vista() === 'chats'" (click)="vista.set('chats')">Conversaciones</button>
                <button type="button" role="tab" [class.on]="vista() === 'pedidos'" (click)="vista.set('pedidos')">Pedidos ({{ pedidos().length }})</button>
              </div>
            }
          </header>

          <div class="filas">
            @if (error()) {
              <div class="msg error" role="alert">{{ error() }}</div>
            } @else if (cargando()) {
              <p class="cargando" role="status">Cargando…</p>
            } @else if (vista() === 'chats') {
              @for (c of chatsVisibles(); track c.id) {
                <a class="fila-chat" [class.sel]="actual()?.id === c.id" [routerLink]="['/chats', c.id]">
                  <span class="avatar">{{ iniciales(c.contraparte) }}</span>
                  <span class="texto">
                    <span class="fila entre"><strong>{{ c.contraparte }}</strong><span class="suave peq">{{ c.fecha | fecha }}</span></span>
                    <span class="suave ultimo">{{ c.ultimoMensaje || 'Conversación nueva' }}</span>
                    @if (estadoDe(c.comercianteId); as e) { <span class="etq peq">{{ e }}</span> }
                  </span>
                </a>
              }
              @if (favoritosSinChat().length) {
                <p class="grupo">Favoritos · sin conversación</p>
                @for (f of favoritosSinChat(); track f.id) {
                  <button type="button" class="fila-chat" (click)="iniciar(f.id)">
                    <span class="avatar">{{ f.iniciales }}</span>
                    <span class="texto"><strong>{{ f.nombre }}</strong><span class="suave ultimo">Pasillo {{ f.pasillo }} · Puesto {{ f.nroPuesto }} · Iniciar conversación</span></span>
                  </button>
                }
              }
              @if (!chatsVisibles().length && !favoritosSinChat().length) {
                <div class="vacio">Aún no tienes conversaciones.<br>Entra al <a routerLink="/mercado">Mercado</a> y pulsa <strong>Cotizar / Reservar</strong> en el casero que quieras.</div>
              }
            } @else {
              @for (p of pedidosVisibles(); track p.id) {
                <button type="button" class="fila-chat" (click)="iniciar(p.comercianteId)">
                  <span class="avatar"><app-icono nombre="package" [tam]="20" /></span>
                  <span class="texto">
                    <span class="fila entre"><strong>Pedido #{{ p.id }} · {{ p.comerciante }}</strong></span>
                    <span class="suave ultimo">{{ p.fecha | fecha }} · {{ p.total | soles }}</span>
                    <span class="etq peq">{{ estados[p.estado] || p.estado }}</span>
                  </span>
                </button>
              } @empty { <div class="vacio">Todavía no hiciste pedidos.</div> }
            }
          </div>
        </aside>

        <!-- Conversación -->
        <section class="panel">
          @if (actual(); as a) {
            <header class="cabeza">
              <a routerLink="/chats" class="volver" aria-label="Volver a la lista"><app-icono nombre="arrow-right" [tam]="18" class="atras" /></a>
              <span class="avatar">{{ iniciales(a.contraparte) }}</span>
              <span class="quien"><strong>{{ a.contraparte }}</strong>
                @if (!auth.esComerciante()) { <a class="suave" [routerLink]="['/puesto', a.comercianteId]">Ver perfil del puesto</a> }
              </span>
              @if (!auth.esComerciante()) {
                <a class="btn" [routerLink]="['/cotizar', a.comercianteId]"><app-icono nombre="receipt" [tam]="16" /> Armar pedido</a>
              }
            </header>
            @for (x of [a.id]; track x) { <app-chat [id]="'' + x" /> }
          } @else if (!cargando()) {
            <div class="vacio-panel">
              <app-icono nombre="message-circle" [tam]="40" />
              <p>Elige un casero de la lista para ver la conversación.</p>
            </div>
          }
        </section>

        <!-- Pedidos con ese casero -->
        @if (actual() && !auth.esComerciante()) {
          <aside class="info" aria-label="Pedidos con este casero">
            <h2>Pedidos</h2>
            @for (p of pedidosDelActual(); track p.id) {
              <div class="pedido">
                <div class="fila entre"><strong>Pedido #{{ p.id }}</strong><span class="precio">{{ p.total | soles }}</span></div>
                <span class="suave peq">{{ p.fecha | fecha }} · {{ modalidades[p.modalidad] }}</span>
                <span class="etq peq">{{ estados[p.estado] || p.estado }}</span>
                @if (p.codigoEntrega) { <span class="suave peq">Código: <strong>{{ p.codigoEntrega }}</strong></span> }
              </div>
            } @empty { <p class="suave">Aún no hay pedidos con este casero. Conversa y pulsa «Armar pedido».</p> }
            <a class="btn sec block" routerLink="/pedidos">Ver todos mis pedidos</a>
          </aside>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .bandeja { display: grid; grid-template-columns: 330px minmax(0, 1fr) 290px; gap: 0; height: min(76vh, 760px);
      background: var(--tarjeta); border: 1px solid var(--borde); border-radius: 20px; overflow: hidden; }
    .bandeja:not(:has(.info)) { grid-template-columns: 330px minmax(0, 1fr); }
    .lista { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--borde); }
    .lista header { padding: 18px 16px 10px; display: grid; gap: 12px; border-bottom: 1px solid var(--borde); }
    .lista h1 { font-size: 1.3rem; margin: 0; }
    .filtro { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1.5px solid var(--borde); border-radius: 12px; color: var(--suave); }
    .filtro input { border: 0; background: transparent; min-height: 40px; padding: 0; }
    .filtro input:focus { outline: none; }
    .pestanas { display: flex; gap: 4px; }
    .pestanas button { flex: 1; min-height: 36px; border: 0; border-radius: 10px; background: transparent; color: var(--suave); font: inherit; font-weight: 500; cursor: pointer; }
    .pestanas button.on { background: var(--verde-cl); color: var(--verde-osc); }
    .filas { flex: 1; overflow-y: auto; padding: 8px; display: grid; align-content: start; gap: 2px; }
    .fila-chat { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border-radius: 14px; border: 0; background: transparent;
      text-align: left; text-decoration: none; color: var(--texto); font: inherit; cursor: pointer; width: 100%; }
    .fila-chat:hover { background: var(--verde-cl); }
    .fila-chat.sel { background: var(--verde-cl); box-shadow: inset 3px 0 0 var(--verde-osc); }
    .texto { display: grid; gap: 2px; min-width: 0; flex: 1; }
    .texto strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ultimo { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: .9rem; }
    .peq { font-size: .78rem; }
    .etq.peq { justify-self: start; margin-top: 2px; }
    .grupo { padding: 14px 12px 4px; font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; color: var(--suave); }
    .panel { display: flex; flex-direction: column; min-height: 0; padding: 0 20px 18px; }
    .cabeza { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--borde); margin-bottom: 12px; }
    .quien { display: grid; flex: 1; min-width: 0; }
    .quien a { font-size: .85rem; }
    .volver { display: none; }
    .atras { transform: rotate(180deg); }
    .vacio-panel { margin: auto; text-align: center; color: var(--suave); display: grid; gap: 10px; justify-items: center; }
    .info { border-left: 1px solid var(--borde); padding: 18px 16px; overflow-y: auto; display: grid; align-content: start; gap: 12px; }
    .info h2 { font-size: 1.05rem; margin: 0; }
    .pedido { display: grid; gap: 4px; padding: 12px; border: 1px solid var(--borde); border-radius: 14px; }
    @media (max-width: 1180px) {
      .bandeja, .bandeja:not(:has(.info)) { grid-template-columns: 300px minmax(0, 1fr); }
      .info { display: none; }
    }
    @media (max-width: 760px) {
      .bandeja, .bandeja:not(:has(.info)) { grid-template-columns: 1fr; height: min(80vh, 760px); }
      .bandeja .panel { display: none; }
      .bandeja.con-chat .lista { display: none; }
      .bandeja.con-chat .panel { display: flex; }
      .volver { display: inline-flex; }
    }
  `
})
export class Chats {
  private api = inject(Api);
  private router = inject(Router);
  protected auth = inject(Auth);
  protected estados = ESTADO;
  protected modalidades = MODALIDAD;

  /** Conversación abierta (parámetro de la ruta /chats/:id). */
  readonly id = input<string | undefined>();

  protected chats = signal<ChatResumen[]>([]);
  protected pedidos = signal<Pedido[]>([]);
  protected favoritos = signal<Comerciante[]>([]);
  protected vista = signal<'chats' | 'pedidos'>('chats');
  protected cargando = signal(true);
  protected error = signal('');
  protected filtro = signal('');

  protected actual = computed(() => this.chats().find(c => String(c.id) === this.id()) ?? null);

  private coincide(texto: string) { return texto.toLowerCase().includes(this.filtro().trim().toLowerCase()); }
  protected chatsVisibles = computed(() => { return this.chats().filter(c => this.coincide(c.contraparte)); });
  protected pedidosVisibles = computed(() => { return this.pedidos().filter(p => this.coincide(p.comerciante)); });
  protected favoritosSinChat = computed(() => {

    const conChat = new Set(this.chats().map(c => c.comercianteId));
    return this.favoritos().filter(f => !conChat.has(f.id) && this.coincide(f.nombre));
  });
  protected pedidosDelActual = computed(() => this.pedidos().filter(p => p.comercianteId === this.actual()?.comercianteId));

  constructor() {
    this.cargar();
    // Refresca la lista cada 5 segundos para ver mensajes y pedidos nuevos
    interval(5000).pipe(takeUntilDestroyed()).subscribe(() => this.cargar(true));
  }

  protected iniciales(nombre: string) {
    const p = nombre.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? p[0]?.[1] ?? '')).toUpperCase();
  }

  /** Estado del último pedido con ese casero, para mostrarlo como etiqueta en la lista. */
  protected estadoDe(comercianteId: number) {
    const p = this.pedidos().filter(x => x.comercianteId === comercianteId).sort((a, b) => b.id - a.id)[0];
    return p ? 'Pedido #' + p.id + ' · ' + (this.estados[p.estado] || p.estado) : '';
  }

  protected cargar(silencioso = false) {
    const cliente = !this.auth.esComerciante();
    forkJoin({
      chats: this.api.chats(),
      pedidos: cliente ? this.api.pedidos().pipe(catchError(() => of([] as Pedido[]))) : of([] as Pedido[]),
      favoritos: cliente ? this.api.favoritos().pipe(catchError(() => of([] as Comerciante[]))) : of([] as Comerciante[])
    }).subscribe({
      next: r => { this.error.set(''); this.chats.set(r.chats); this.pedidos.set(r.pedidos); this.favoritos.set(r.favoritos); this.cargando.set(false); },
      error: e => { if (!silencioso) this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }

  /** Abre (o crea) la conversación con ese casero y la muestra en la bandeja. */
  protected iniciar(comercianteId: number) {
    this.api.abrirChat(comercianteId).subscribe({
      next: c => {
        if (!this.chats().some(x => x.id === c.id)) this.chats.update(l => [c, ...l]);
        this.vista.set('chats');
        this.router.navigate(['/chats', c.id]);
      },
      error: e => this.error.set(mensajeError(e))
    });
  }
}
