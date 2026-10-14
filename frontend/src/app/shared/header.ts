import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../core/auth.service';
import { Canasta } from '../core/canasta.service';
import { Icono } from './icono';
import { Logo } from './logo';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icono, Logo],
  template: `
    <header class="cabecera" [class.abierto]="menu()">
      <div class="contenedor fila entre interior">
        <a routerLink="/" class="marca" aria-label="Kasero, ir al inicio" (click)="menu.set(false)"><app-logo [tam]="44" /></a>

        <nav class="enlaces" aria-label="Principal">
          @for (e of enlaces; track e.ruta) {
            <a [routerLink]="e.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: e.exacto }" (click)="menu.set(false)">
              <app-icono [nombre]="e.icono" [tam]="18" />{{ e.texto }}
            </a>
          }
        </nav>

        <div class="acciones">
          @if (auth.logueado()) {
            <a routerLink="/pedidos" class="btn sec" (click)="menu.set(false)"><app-icono nombre="user" [tam]="18" />{{ auth.primerNombre() }}</a>
            <button type="button" class="btn fantasma" (click)="salir()"><app-icono nombre="log-out" [tam]="18" />Salir</button>
          } @else {
            <a routerLink="/acceso" class="btn fantasma" (click)="menu.set(false)">Ingresar</a>
            <a routerLink="/acceso" [queryParams]="{ modo: 'registro' }" class="btn" (click)="menu.set(false)">Crear cuenta</a>
          }
        </div>

        <button type="button" class="hamburguesa" (click)="menu.set(!menu())" [attr.aria-expanded]="menu()" aria-label="Abrir menú">
          <app-icono [nombre]="menu() ? 'x' : 'menu'" [tam]="26" />
        </button>
      </div>
    </header>
  `,
  styleUrl: './header.scss'
})
export class Header {
  protected auth = inject(Auth);
  protected canasta = inject(Canasta);
  protected menu = signal(false);
  protected enlaces = [
    { ruta: '/', texto: 'Inicio', icono: 'store', exacto: true },
    { ruta: '/mercado', texto: 'Mercado', icono: 'shopping-basket', exacto: true },
    { ruta: '/buscar', texto: 'Buscar', icono: 'search', exacto: false },
    { ruta: '/comparar', texto: 'Comparar', icono: 'scale', exacto: false },
    { ruta: '/precios', texto: 'Precios', icono: 'tag', exacto: false }
  ];

  protected salir() { this.menu.set(false); this.auth.salir(); }
}
