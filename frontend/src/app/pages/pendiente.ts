import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Marcador temporal de las pantallas que se migran en el paso 2. */
@Component({
  selector: 'app-pendiente',
  imports: [RouterLink],
  template: `<div class="contenedor pagina vacio"><h2>Esta pantalla llega en el siguiente paso</h2><p><a routerLink="/">Volver al inicio</a></p></div>`
})
export class Pendiente {}
