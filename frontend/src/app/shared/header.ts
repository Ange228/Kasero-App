import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from '../core/auth.service';
import { Icono } from './icono';
import { Logo } from './logo';

interface Enlace { ruta: string; texto: string; icono: string; exacto?: boolean; }

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Icono, Logo],
  template: `
    <header class="cabecera">
      <div class="contenedor fila entre interior">
        <a routerLink="/" class="marca" aria-label="Kasero, ir al inicio" (click)="menu.set(false)"><app-logo [tam]="44" /></a>

        @if (enInicio() && !auth.logueado()) {
          <!-- Página de inicio: enlaces públicos + ingresar y crear cuenta (sin menú hamburguesa) -->
          <nav class="enlaces" aria-label="Principal">
            @for (e of enlaces(); track e.ruta) {
              <a [routerLink]="e.ruta" routerLinkActive="activo">
                <app-icono [nombre]="e.icono" [tam]="18" /><span>{{ e.texto }}</span>
              </a>
            }
          </nav>
          <div class="acciones">
            <a routerLink="/acceso" class="btn fantasma">Ingresar</a>
            <a routerLink="/acceso" [queryParams]="{ modo: 'registro' }" class="btn">Crear cuenta</a>
          </div>
        } @else {
          <nav class="enlaces" aria-label="Principal">
            @for (e of enlaces(); track e.ruta) {
              <a [routerLink]="e.ruta" routerLinkActive="activo" [routerLinkActiveOptions]="{ exact: !!e.exacto }">
                <app-icono [nombre]="e.icono" [tam]="18" /><span>{{ e.texto }}</span>
              </a>
            }
          </nav>

          <div class="acciones">
            <div class="cuenta">
              <button type="button" class="cuenta-btn" (click)="alternar($event)" [attr.aria-expanded]="menu()" aria-haspopup="menu"
                      [attr.aria-label]="auth.logueado() ? 'Menú de ' + auth.primerNombre() : 'Abrir menú'">
                @if (auth.logueado()) {
                  <span class="ini">{{ auth.primerNombre().charAt(0) }}</span>
                  <span class="nom">{{ auth.primerNombre() }}</span>
                  <app-icono nombre="chevron-down" [tam]="16" />
                } @else {
                  <app-icono [nombre]="menu() ? 'x' : 'menu'" [tam]="24" />
                }
              </button>

              @if (menu()) {
                <div class="panel" role="menu" (click)="menu.set(false)">
                  <div class="solo-movil">
                    @for (e of enlaces(); track e.ruta) {
                      <a role="menuitem" [routerLink]="e.ruta" routerLinkActive="activo"><app-icono [nombre]="e.icono" [tam]="18" />{{ e.texto }}</a>
                    }
                    <hr>
                  </div>
                  @if (auth.logueado()) {
                    <p class="quien">{{ auth.sesion()?.nombre }}</p>
                    @if (auth.esAdmin()) {
                      <a role="menuitem" routerLink="/admin"><app-icono nombre="shield-check" [tam]="18" />Administración</a>
                    } @else if (auth.esComerciante()) {
                      <a role="menuitem" routerLink="/mi-puesto"><app-icono nombre="store" [tam]="18" />Mi puesto</a>
                    } @else {
                      <a role="menuitem" routerLink="/pedidos"><app-icono nombre="package" [tam]="18" />Mis pedidos</a>
                    }
                    <hr>
                    <button type="button" role="menuitem" (click)="salir()"><app-icono nombre="log-out" [tam]="18" />Cerrar sesión</button>
                  } @else {
                    <a role="menuitem" routerLink="/acceso"><app-icono nombre="log-in" [tam]="18" />Ingresar</a>
                    <a role="menuitem" routerLink="/acceso" [queryParams]="{ modo: 'registro' }"><app-icono nombre="user-plus" [tam]="18" />Crear cuenta</a>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </header>
  `,
  styleUrl: './header.scss'
})
export class Header {
  protected auth = inject(Auth);
  private el = inject(ElementRef<HTMLElement>);
  private router = inject(Router);
  protected menu = signal(false);
  protected enInicio = signal(this.esInicio(this.router.url));

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => { this.enInicio.set(this.esInicio(e.urlAfterRedirects)); this.menu.set(false); });
  }

  private esInicio(url: string) { return url === '/' || url.startsWith('/?') || url.startsWith('/#'); }

  /** Mercado (el buscador), Caseros y Precios son públicos; Favoritos y Cotizar/Reservar solo con sesión iniciada. */
  protected enlaces = computed<Enlace[]>(() => {
    const base: Enlace[] = [
      { ruta: '/mercado', texto: 'Mercado', icono: 'search' },
      { ruta: '/mapa', texto: 'Caseros', icono: 'users' },
      { ruta: '/precios', texto: 'Precios', icono: 'tag' }
    ];
    if (!this.auth.logueado()) return base;
    if (!this.auth.esComerciante() && !this.auth.esAdmin()) base.push({ ruta: '/favoritos', texto: 'Favoritos', icono: 'heart' });
    base.push({ ruta: '/chats', texto: this.auth.esComerciante() ? 'Mensajes' : 'Cotizar/Reservar', icono: 'message-circle' });
    return base;
  });

  protected alternar(ev: Event) { ev.stopPropagation(); this.menu.update(v => !v); }
  protected salir() { this.menu.set(false); this.auth.salir(); }

  @HostListener('document:click', ['$event'])
  protected fuera(ev: Event) { if (!this.el.nativeElement.contains(ev.target)) this.menu.set(false); }

  @HostListener('document:keydown.escape')
  protected escape() { this.menu.set(false); }
}
