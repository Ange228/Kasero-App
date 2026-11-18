import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth, mensajeError } from '../../core/auth.service';
import { Icono } from '../../shared/icono';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-acceso',
  imports: [FormsModule, RouterLink, Icono, Logo],
  templateUrl: './acceso.html',
  styleUrl: './acceso.scss'
})
export class Acceso {
  private auth = inject(Auth);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  protected modo = signal<'login' | 'registro'>(this.ruta.snapshot.queryParamMap.get('modo') === 'registro' ? 'registro' : 'login');
  protected nombre = '';
  protected correo = '';
  protected password = '';
  protected error = signal('');
  protected enviando = signal(false);

  protected beneficios = [
    { icono: 'search', texto: 'Encuentra a tus caseros por puesto y sector' },
    { icono: 'scale', texto: 'Compara tu canasta entre varios puestos' },
    { icono: 'truck', texto: 'Recibe en casa, recoge o autoriza a alguien' }
  ];

  protected cambiar(m: 'login' | 'registro') { this.modo.set(m); this.error.set(''); }

  protected enviar() {
    this.error.set('');
    this.enviando.set(true);
    const peticion = this.modo() === 'login'
      ? this.auth.login(this.correo, this.password)
      : this.auth.registrar(this.nombre, this.correo, this.password);
    peticion.subscribe({
      next: () => this.router.navigateByUrl(this.ruta.snapshot.queryParamMap.get('volver') || '/mercado'),
      error: e => { this.error.set(mensajeError(e)); this.enviando.set(false); }
    });
  }
}
