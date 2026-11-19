import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes, UrlSegment } from '@angular/router';
import { Auth } from './core/auth.service';

/** Las pantallas de pedidos exigen sesión iniciada. */
const requiereSesion: CanActivateFn = (_r, estado) => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.logueado() || router.createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
};

/** El panel del comerciante solo abre con una cuenta de comerciante. */
const soloComerciante: CanActivateFn = (_r, estado) => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.logueado()) return router.createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
  return auth.esComerciante() || router.createUrlTree(['/']);
};

/** La administración solo abre con una cuenta de administrador. */
const soloAdmin: CanActivateFn = (_r, estado) => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.logueado()) return router.createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
  return auth.esAdmin() || router.createUrlTree(['/']);
};

export const routes: Routes = [
  { path: '', title: 'Kasero · Compra a tus caseros desde casa', loadComponent: () => import('./pages/landing/landing').then(m => m.Landing) },
  { path: 'acceso', title: 'Ingresar · Kasero', loadComponent: () => import('./pages/acceso/acceso').then(m => m.Acceso) },
  { path: 'mercado', title: 'Mercado · Kasero', loadComponent: () => import('./pages/mercado').then(m => m.Mercado) },
  { path: 'buscar', redirectTo: 'mercado' },
  { path: 'puesto/:id', title: 'Puesto · Kasero', loadComponent: () => import('./pages/puesto').then(m => m.Puesto) },
  { path: 'cotizar/:id', title: 'Cotizar · Kasero', loadComponent: () => import('./pages/cotizar').then(m => m.Cotizar) },
  { path: 'comparar', redirectTo: 'precios' },
  { path: 'pedido/:id', canActivate: [requiereSesion], title: 'Confirmar pedido · Kasero', loadComponent: () => import('./pages/pedido').then(m => m.Pedido) },
  { path: 'precios', title: 'Precios · Kasero', loadComponent: () => import('./pages/precios').then(m => m.Precios) },
  { path: 'pedidos', canActivate: [requiereSesion], title: 'Mis pedidos · Kasero', loadComponent: () => import('./pages/pedidos').then(m => m.Pedidos) },
  {
    // /chats y /chats/:id comparten la misma pantalla (bandeja) para que no se recargue al cambiar de conversación
    matcher: (segs: UrlSegment[]) => segs[0]?.path === 'chats' && segs.length <= 2
      ? (segs[1] ? { consumed: segs, posParams: { id: segs[1] } } : { consumed: segs }) : null,
    canActivate: [requiereSesion], title: 'Cotizar y reservar · Kasero', loadComponent: () => import('./pages/chats').then(m => m.Chats)
  },
  { path: 'chat/:id', redirectTo: 'chats/:id' },
  { path: 'mapa', title: 'Caseros · Kasero', loadComponent: () => import('./pages/mapa').then(m => m.Mapa) },
  { path: 'favoritos', canActivate: [requiereSesion], title: 'Favoritos · Kasero', loadComponent: () => import('./pages/favoritos').then(m => m.FavoritosPagina) },
  { path: 'mi-puesto', canActivate: [soloComerciante], title: 'Mi puesto · Kasero', loadComponent: () => import('./pages/mi-puesto').then(m => m.MiPuesto) },
  { path: 'admin', canActivate: [soloAdmin], title: 'Administración · Kasero', loadComponent: () => import('./pages/admin').then(m => m.Admin) },
  { path: '**', redirectTo: '' }
];
