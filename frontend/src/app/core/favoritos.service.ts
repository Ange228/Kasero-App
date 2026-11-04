import { Injectable, effect, inject, signal } from '@angular/core';
import { Api } from './api.service';
import { Auth } from './auth.service';

/** Puestos favoritos del cliente. Se carga al iniciar sesión y se vacía al salir. */
@Injectable({ providedIn: 'root' })
export class Favoritos {
  private api = inject(Api);
  private auth = inject(Auth);

  readonly ids = signal<Set<number>>(new Set());

  constructor() {
    effect(() => {
      if (this.auth.logueado() && !this.auth.esComerciante() && !this.auth.esAdmin()) {
        this.api.favoritos().subscribe({ next: l => this.ids.set(new Set(l.map(c => c.id))), error: () => this.ids.set(new Set()) });
      } else {
        this.ids.set(new Set());
      }
    });
  }

  esFavorito(id: number) { return this.ids().has(id); }

  /** Marca o desmarca; devuelve false si hace falta iniciar sesión. */
  alternar(id: number): boolean {
    if (!this.auth.logueado()) return false;
    const poner = !this.esFavorito(id);
    const nuevo = new Set(this.ids());
    if (poner) nuevo.add(id); else nuevo.delete(id);
    this.ids.set(nuevo);
    (poner ? this.api.agregarFavorito(id) : this.api.quitarFavorito(id)).subscribe({
      error: () => { const revertido = new Set(this.ids()); if (poner) revertido.delete(id); else revertido.add(id); this.ids.set(revertido); }
    });
    return true;
  }
}
