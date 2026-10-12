import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { LoginResponse } from './models';

export interface Sesion { token: string; nombre: string; usuarioId: number; }
const CLAVE = 'kasero_sesion';

/** Mensaje legible a partir de un error HTTP de la API. */
export function mensajeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) return e.error?.mensaje ?? 'No se pudo conectar con el servidor';
  return 'Ocurrió un error inesperado';
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly sesion = signal<Sesion | null>(this.leer());
  readonly logueado = computed(() => this.sesion() !== null);
  readonly primerNombre = computed(() => this.sesion()?.nombre.split(' ')[0] ?? '');

  login(correo: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { correo, password }).pipe(tap(r => this.guardar(r)));
  }

  registrar(nombre: string, correo: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/registro', { nombre, correo, password }).pipe(tap(r => this.guardar(r)));
  }

  salir() {
    this.http.post('/api/auth/logout', {}).pipe(catchError(() => [])).subscribe();
    this.limpiar();
    this.router.navigateByUrl('/');
  }

  limpiar() {
    this.sesion.set(null);
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
  }

  private guardar(r: LoginResponse) {
    const s: Sesion = { token: r.token, nombre: r.nombre, usuarioId: r.usuarioId };
    this.sesion.set(s);
    try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
  }

  private leer(): Sesion | null {
    try { return JSON.parse(localStorage.getItem(CLAVE) ?? 'null'); } catch { return null; }
  }
}

/** Agrega el token a cada llamada y cierra la sesión si el servidor responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const s = auth.sesion();
  const conToken = s ? req.clone({ setHeaders: { Authorization: 'Bearer ' + s.token } }) : req;
  return next(conToken).pipe(catchError(e => {
    if (e instanceof HttpErrorResponse && e.status === 401 && s && !req.url.includes('/auth/login')) {
      auth.limpiar();
      router.navigate(['/acceso'], { queryParams: { volver: router.url } });
    }
    return throwError(() => e);
  }));
};
