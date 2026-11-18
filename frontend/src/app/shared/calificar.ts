import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { ResenaResultado } from '../core/models';
import { Estrellas } from './estrellas';
import { Icono } from './icono';

/** Formulario para calificar a un comerciante (1 a 5 estrellas y comentario opcional). */
@Component({
  selector: 'app-calificar',
  imports: [FormsModule, Estrellas, Icono],
  template: `
    <form class="caja" (ngSubmit)="enviar()">
      <strong>Califica a {{ nombre() }}</strong>
      <app-estrellas [(valor)]="puntaje" [editable]="true" [tam]="28" />
      <label class="solo-lectores" for="com">Comentario (opcional)</label>
      <textarea id="com" name="com" [(ngModel)]="comentario" maxlength="300" rows="3" placeholder="Cuéntanos cómo fue tu compra (opcional)"></textarea>
      @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }
      <div class="fila">
        <button class="btn" [disabled]="puntaje() === 0 || enviando()"><app-icono nombre="check" [tam]="16" /> Enviar calificación</button>
        <button type="button" class="btn fantasma" (click)="cancelar.emit()">Cancelar</button>
      </div>
    </form>
  `,
  styles: `
    .caja { display: grid; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--borde); }
    textarea { min-height: 80px; padding: 12px 14px; resize: vertical; width: 100%; border-radius: 12px; border: 1.5px solid var(--borde); background: var(--tarjeta); color: var(--texto); font: inherit; }
  `
})
export class Calificar {
  private api = inject(Api);
  readonly comercianteId = input.required<number>();
  readonly nombre = input.required<string>();
  readonly listo = output<ResenaResultado>();
  readonly cancelar = output<void>();

  protected puntaje = signal(0);
  protected comentario = '';
  protected error = signal('');
  protected enviando = signal(false);

  protected enviar() {
    this.enviando.set(true); this.error.set('');
    this.api.calificar(this.comercianteId(), this.puntaje(), this.comentario).subscribe({
      next: r => { this.enviando.set(false); this.listo.emit(r); },
      error: e => { this.error.set(mensajeError(e)); this.enviando.set(false); }
    });
  }
}
