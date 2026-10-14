import { Component, input } from '@angular/core';

/** Logotipo de Kasero (canasta) con el nombre del mercado. */
@Component({
  selector: 'app-logo',
  template: `
    <svg viewBox="0 0 64 64" [attr.width]="tam()" [attr.height]="tam()" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1f5a23"/>
      <path d="M14 27h36l-3.2 18.2a4 4 0 0 1-3.9 3.3H21.1a4 4 0 0 1-3.9-3.3L14 27z" fill="#fff"/>
      <path d="M22 27l6-10M42 27l-6-10" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="38" r="4.5" fill="#e8891d"/>
    </svg>
    @if (texto()) {
      <span class="nombre"><strong>Kasero</strong><small>Mercado del Altiplano</small></span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 12px; }
    .nombre { display: flex; flex-direction: column; line-height: 1.1; }
    strong { font: 600 1.3rem var(--font-titulo); letter-spacing: -0.05em; }
    small { font-size: .72rem; opacity: .7; letter-spacing: 0; }
  `
})
export class Logo {
  readonly tam = input(40);
  readonly texto = input(true);
}
