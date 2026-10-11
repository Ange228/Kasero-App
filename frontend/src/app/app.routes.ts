import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Auth } from './core/auth.service';

/** Las pantallas de pedidos y cotizaciones exigen sesión iniciada. */
const requiereSesion: CanActivateFn = (_r, estado) => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.logueado() || router.createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
};

export const routes: Routes = [
  { path: '', title: 'Kasero · Compra a tus caseros desde casa', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing) },
  { path: 'acceso', title: 'Ingresar · Kasero', loadComponent: () => import('./pages/acceso/acceso').then(m => m.Acceso) },
  { path: 'pedidos', canActivate: [requiereSesion], title: 'Mis pedidos · Kasero', loadComponent: () => import('./pages/pendiente').then(m => m.Pendiente) },
  { path: '**', title: 'Kasero', loadComponent: () => import('./pages/pendiente').then(m => m.Pendiente) }
];
