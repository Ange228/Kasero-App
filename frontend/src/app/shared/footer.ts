import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from './icono';
import { Logo } from './logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Icono, Logo],
  template: `
    <footer class="pie">
      <div class="contenedor">
        <div class="cuerpo">
          <div class="marca">
            <app-logo [tam]="48" />
            <p>El canal digital de los mercados de abastos. Compra a tus caseros de siempre, sin hacer cola y con precios claros.</p>
            <div class="pagos">
              <span><app-icono nombre="smartphone" [tam]="16" /> Yape</span>
              <span><app-icono nombre="wallet" [tam]="16" /> Plin</span>
              <span><app-icono nombre="map-pin" [tam]="16" /> Arequipa</span>
            </div>
          </div>

          <nav aria-label="Explora">
            <h3>Explora</h3>
            <a routerLink="/mercado">Mercado</a>
            <a routerLink="/mercado">Buscar puestos</a>
            <a routerLink="/precios" fragment="comparar">Comparar precios</a>
            <a routerLink="/precios">Precios del mercado</a>
          </nav>

          <nav aria-label="Tu cuenta">
            <h3>Tu cuenta</h3>
            <a routerLink="/acceso">Ingresar</a>
            <a routerLink="/acceso" [queryParams]="{ modo: 'registro' }">Crear cuenta</a>
            <a routerLink="/pedidos">Mis pedidos</a>
          </nav>

          <div>
            <h3>Proyecto</h3>
            <p class="dato">Curso de Calidad de Software</p>
            <p class="dato">Docente: Maribel Molina Barriga</p>
            <p class="dato">Universidad La Salle · 2026</p>
          </div>
        </div>

        <div class="base">
          <span>© 2026 Kasero · Mercado del Altiplano, Arequipa</span>
          <span>Proyecto académico · Los precios y datos son referenciales</span>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.scss'
})
export class Footer {}
