import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer';
import { Header } from './shared/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <a class="saltar" href="#contenido">Saltar al contenido</a>
    <app-header />
    <main id="contenido" tabindex="-1"><router-outlet /></main>
    <app-footer />
  `,
  styles: `
    .saltar { position: absolute; left: -999px; background: #000; color: #fff; padding: 10px 14px; z-index: 99; }
    .saltar:focus { left: 8px; top: 8px; }
    main:focus { outline: none; }
  `
})
export class App {}
