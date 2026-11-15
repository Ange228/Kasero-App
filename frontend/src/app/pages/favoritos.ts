import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { Favoritos } from '../core/favoritos.service';
import { Comerciante } from '../core/models';
import { PuestoCard } from '../shared/puesto-card';

/** Puestos que el cliente guardó como favoritos. */
@Component({
  selector: 'app-favoritos',
  imports: [RouterLink, PuestoCard],
  template: `
    <div class="contenedor pagina">
      <h1>Mis favoritos</h1>
      @if (error()) {
        <div class="msg error" role="alert">{{ error() }}</div>
      } @else if (cargando()) {
        <p class="cargando" role="status">Cargando…</p>
      } @else if (lista().length) {
        <div class="grid g2">@for (c of lista(); track c.id) { <app-puesto-card [c]="c" /> }</div>
      } @else {
        <div class="vacio">Todavía no guardaste puestos.<br>Pulsa el corazón en el perfil de tu casera de siempre.<br><a routerLink="/mercado">Buscar puestos</a></div>
      }
    </div>
  `
})
export class FavoritosPagina {
  private api = inject(Api);
  private favoritos = inject(Favoritos);
  protected lista = signal<Comerciante[]>([]);
  protected cargando = signal(true);
  protected error = signal('');

  constructor() {
    // Al quitar un favorito (corazón) la tarjeta desaparece de la lista
    effect(() => {
      const ids = this.favoritos.ids();
      this.api.favoritos().subscribe({
        next: l => { this.lista.set(l.filter(c => ids.has(c.id) || this.cargando())); this.cargando.set(false); },
        error: e => { this.error.set(mensajeError(e)); this.cargando.set(false); }
      });
    });
  }
}
