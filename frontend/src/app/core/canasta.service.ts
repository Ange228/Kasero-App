import { Injectable, computed, signal } from '@angular/core';
import { ItemLocal } from './models';

const CLAVE = 'kasero_canasta';

/** Canasta del cliente (productos y cantidades), guardada en el navegador. */
@Injectable({ providedIn: 'root' })
export class Canasta {
  readonly items = signal<ItemLocal[]>(this.leer());
  readonly cantidad = computed(() => this.items().length);

  agregar(item: ItemLocal) {
    const lista = [...this.items()];
    const ex = lista.find(i => i.productoId === item.productoId);
    if (ex) ex.cantidad += item.cantidad; else lista.push({ ...item });
    this.poner(lista);
  }

  cambiarCantidad(productoId: number, cantidad: number) {
    this.poner(this.items().map(i => i.productoId === productoId ? { ...i, cantidad: Math.max(0.5, cantidad || 1) } : i));
  }

  quitar(productoId: number) { this.poner(this.items().filter(i => i.productoId !== productoId)); }
  vaciar() { this.poner([]); }

  private poner(lista: ItemLocal[]) {
    this.items.set(lista);
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* sin almacenamiento */ }
  }

  private leer(): ItemLocal[] {
    try { return JSON.parse(localStorage.getItem(CLAVE) ?? '[]'); } catch { return []; }
  }
}
