import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Favoritos } from '../core/favoritos.service';
import { Icono } from './icono';

/** Corazón para guardar un puesto en favoritos (pide iniciar sesión si hace falta). */
@Component({
  selector: 'app-fav-boton',
  imports: [Icono],
  template: `
    <button type="button" class="fav" [class.on]="favoritos.esFavorito(comercianteId())" (click)="alternar($event)"
            [attr.aria-pressed]="favoritos.esFavorito(comercianteId())"
            [attr.aria-label]="favoritos.esFavorito(comercianteId()) ? 'Quitar de favoritos' : 'Guardar en favoritos'">
      <app-icono nombre="heart" [tam]="tam()" />
    </button>
  `,
  styles: `
    .fav { background: none; border: 0; padding: 8px; border-radius: 999px; cursor: pointer; color: var(--suave); line-height: 0; }
    .fav:hover { background: var(--verde-cl); color: #c2410c; }
    .fav.on { color: #c2410c; }
  `
})
export class FavBoton {
  protected favoritos = inject(Favoritos);
  private router = inject(Router);
  readonly comercianteId = input.required<number>();
  readonly tam = input(22);

  protected alternar(e: Event) {
    e.preventDefault(); e.stopPropagation();
    if (!this.favoritos.alternar(this.comercianteId())) {
      this.router.navigate(['/acceso'], { queryParams: { volver: this.router.url } });
    }
  }
}
