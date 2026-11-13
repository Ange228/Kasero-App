import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { ChatResumen } from '../core/models';
import { FechaPipe } from '../shared/formatos';
import { Icono } from '../shared/icono';

/** Bandeja de conversaciones del usuario (cliente o cuenta de comerciante). */
@Component({
  selector: 'app-chats',
  imports: [RouterLink, Icono, FechaPipe],
  template: `
    <div class="contenedor pagina angosto">
      <h1>Cotizar / Reservar</h1>
      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (cargando()) {
        <p class="cargando" role="status">Cargando conversaciones…</p>
      } @else {
        @for (c of chats(); track c.id) {
          <a class="tarjeta fila chat" [routerLink]="['/chat', c.id]">
            <span class="avatar"><app-icono nombre="message-circle" [tam]="22" /></span>
            <span class="texto"><strong>{{ c.contraparte }}</strong><span class="suave ultimo">{{ c.ultimoMensaje || 'Conversación nueva' }}</span></span>
            <span class="suave">{{ c.fecha | fecha }}</span>
          </a>
        } @empty {
          <div class="vacio">Aún no tienes conversaciones.<br>Entra al perfil de un puesto y pulsa <strong>Chatear</strong>.<br><a routerLink="/buscar">Buscar puestos</a></div>
        }
      }
    </div>
  `,
  styles: `
    .angosto { max-width: 760px; }
    .chat { margin-bottom: 10px; text-decoration: none; color: var(--texto); }
    .chat:hover { border-color: var(--verde); }
    .texto { display: grid; flex: 1; min-width: 0; }
    .ultimo { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `
})
export class Chats {
  private api = inject(Api);
  protected chats = signal<ChatResumen[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() {
    this.api.chats().subscribe({
      next: c => { this.chats.set(c); this.cargando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
    });
  }
}
