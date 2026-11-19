import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { Mensaje } from '../core/models';
import { Icono } from '../shared/icono';

/** Conversación con un casero. Se actualiza sola cada pocos segundos. */
@Component({
  selector: 'app-chat',
  imports: [FormsModule, RouterLink, Icono],
  template: `
    <div class="contenedor pagina caja">
      <a routerLink="/chats" class="volver"><app-icono nombre="arrow-right" [tam]="16" class="atras" /> Cotizar / Reservar</a>

      <section class="hilo" #hilo aria-live="polite" aria-label="Conversación">
        @if (error() && !mensajes().length) {
          <div class="msg error" role="alert">{{ error() }}</div>
        }
        @for (m of mensajes(); track m.id) {
          <div class="burbuja" [class.mia]="m.mio">
            <p>{{ m.texto }}</p>
            <span class="hora">{{ hora(m.fecha) }}</span>
          </div>
        } @empty {
          @if (!error()) { <p class="vacio">Escribe el primer mensaje, por ejemplo: «Casera, ¿tiene papa yungay?»</p> }
        }
      </section>

      @if (error() && mensajes().length) { <div class="msg error" role="alert">{{ error() }}</div> }
      <form class="envio" (ngSubmit)="enviar()">
        <label for="texto" class="solo-lectores">Mensaje</label>
        <input id="texto" name="texto" [(ngModel)]="texto" maxlength="500" autocomplete="off" placeholder="Escribe un mensaje…">
        <button class="btn" [disabled]="!texto.trim() || enviando()" aria-label="Enviar mensaje"><app-icono nombre="arrow-right" [tam]="20" /></button>
      </form>
    </div>
  `,
  styles: `
    .caja { max-width: 760px; display: grid; gap: 12px; }
    .volver { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-size: .9rem; }
    .atras { transform: rotate(180deg); }
    .hilo { background: var(--tarjeta); border: 1px solid var(--borde); border-radius: var(--radio); padding: 16px; height: min(60vh, 520px); overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .burbuja { max-width: 78%; background: var(--verde-cl); border-radius: 16px 16px 16px 4px; padding: 10px 14px; align-self: flex-start; }
    .burbuja.mia { align-self: flex-end; background: var(--verde-osc); color: #fff; border-radius: 16px 16px 4px 16px; }
    .burbuja p { white-space: pre-wrap; word-break: break-word; }
    .hora { display: block; font-size: .7rem; opacity: .7; text-align: right; margin-top: 2px; }
    .envio { display: flex; gap: 10px; }
  `
})
export class Chat implements AfterViewChecked {
  private api = inject(Api);
  private destroy = inject(DestroyRef);
  private hilo = viewChild<ElementRef<HTMLElement>>('hilo');
  private bajar = false;

  readonly id = input.required<string>();
  protected mensajes = signal<Mensaje[]>([]);
  protected error = signal('');
  protected enviando = signal(false);
  protected texto = '';

  constructor() {
    queueMicrotask(() => {
      this.refrescar();
      // Consulta mensajes nuevos cada 4 segundos mientras la pantalla esté abierta
      interval(4000).pipe(takeUntilDestroyed(this.destroy)).subscribe(() => this.refrescar());
    });
  }

  ngAfterViewChecked() {
    const el = this.hilo()?.nativeElement;
    if (this.bajar && el) { el.scrollTop = el.scrollHeight; this.bajar = false; }
  }

  protected hora(iso: string) { return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }); }

  private refrescar() {
    const ultimo = this.mensajes().at(-1)?.id ?? 0;
    this.api.mensajes(+this.id(), ultimo).subscribe({
      next: nuevos => {
        this.error.set('');
        if (nuevos.length) { this.mensajes.update(l => [...l, ...nuevos]); this.bajar = true; }
      },
      error: e => this.error.set(mensajeError(e))
    });
  }

  protected enviar() {
    const t = this.texto.trim();
    if (!t) return;
    this.enviando.set(true);
    this.api.enviarMensaje(+this.id(), t).subscribe({
      next: m => { this.texto = ''; this.error.set(''); this.mensajes.update(l => l.some(x => x.id === m.id) ? l : [...l, m]); this.bajar = true; this.enviando.set(false); },
      error: e => { this.error.set(mensajeError(e)); this.enviando.set(false); }
    });
  }
}
