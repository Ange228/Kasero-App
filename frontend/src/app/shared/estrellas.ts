import { Component, input, model } from '@angular/core';
import { Icono } from './icono';

/** Estrellas de calificación: solo lectura o editables (1 a 5). */
@Component({
  selector: 'app-estrellas',
  imports: [Icono],
  template: `
    @if (editable()) {
      <div class="grupo" role="radiogroup" aria-label="Calificación">
        @for (n of [1, 2, 3, 4, 5]; track n) {
          <button type="button" class="estrella" [class.llena]="n <= valor()" role="radio"
                  [attr.aria-checked]="n === valor()" [attr.aria-label]="n + (n === 1 ? ' estrella' : ' estrellas')" (click)="valor.set(n)">
            <app-icono nombre="star" [tam]="tam()" />
          </button>
        }
      </div>
    } @else {
      <span class="grupo" role="img" [attr.aria-label]="valor().toFixed(1) + ' de 5 estrellas'">
        @for (n of [1, 2, 3, 4, 5]; track n) {
          <span class="estrella" [class.llena]="n <= redondeo()"><app-icono nombre="star" [tam]="tam()" /></span>
        }
      </span>
    }
  `,
  styles: `
    .grupo { display: inline-flex; gap: 2px; }
    .estrella { color: var(--borde); background: none; border: 0; padding: 4px; line-height: 0; }
    button.estrella { cursor: pointer; border-radius: 8px; }
    button.estrella:hover { color: var(--naranja); }
    span.estrella { padding: 0; }
    .estrella.llena { color: var(--naranja); }
  `
})
export class Estrellas {
  readonly valor = model(0);
  readonly editable = input(false);
  readonly tam = input(18);
  protected redondeo = () => Math.round(this.valor());
}
