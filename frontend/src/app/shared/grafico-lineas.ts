import { Component, computed, input } from '@angular/core';
import { SeriePrecio } from '../core/models';

const COLORES = ['#2f7d32', '#e8891d', '#0e7490', '#b3261e', '#7c3aed', '#a16207'];
const ANCHO = 640, ALTO = 280, M = { izq: 48, der: 16, arr: 16, abajo: 34 };

/** Gráfico de líneas en SVG (sin librerías): una línea por producto, una marca por semana. */
@Component({
  selector: 'app-grafico-lineas',
  template: `
    <figure>
      <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + alto" role="img" [attr.aria-label]="descripcion()">
        @for (t of ticks(); track t.y) {
          <line [attr.x1]="m.izq" [attr.x2]="ancho - m.der" [attr.y1]="t.y" [attr.y2]="t.y" class="rejilla" />
          <text [attr.x]="m.izq - 8" [attr.y]="t.y + 4" class="eje" text-anchor="end">{{ t.valor }}</text>
        }
        @for (x of etiquetas(); track x.x) {
          <text [attr.x]="x.x" [attr.y]="alto - 10" class="eje" text-anchor="middle">{{ x.texto }}</text>
        }
        @for (l of lineas(); track l.nombre) {
          <polyline [attr.points]="l.puntos" fill="none" [attr.stroke]="l.color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
          @for (p of l.marcas; track p.x) { <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" [attr.fill]="l.color" /> }
        }
      </svg>
      <figcaption class="leyenda">
        @for (l of lineas(); track l.nombre) { <span><i [style.background]="l.color"></i>{{ l.nombre }}</span> }
      </figcaption>
    </figure>
  `,
  styles: `
    figure { margin: 0; }
    svg { width: 100%; height: auto; display: block; }
    .rejilla { stroke: var(--borde); stroke-dasharray: 3 4; }
    .eje { fill: var(--suave); font-size: 12px; font-family: var(--font-texto); }
    .leyenda { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 8px; font-size: .88rem; }
    .leyenda span { display: inline-flex; align-items: center; gap: 6px; }
    .leyenda i { width: 12px; height: 12px; border-radius: 4px; display: inline-block; }
  `
})
export class GraficoLineas {
  readonly semanas = input.required<string[]>();
  readonly series = input.required<SeriePrecio[]>();

  protected ancho = ANCHO;
  protected alto = ALTO;
  protected m = M;

  private rango = computed(() => {
    const v = this.series().flatMap(s => s.valores).filter((x): x is number => x != null);
    if (!v.length) return { min: 0, max: 1 };
    const min = Math.min(...v), max = Math.max(...v), pad = (max - min || 1) * 0.15;
    return { min: Math.max(0, min - pad), max: max + pad };
  });

  private x = (i: number) => {
    const n = this.semanas().length;
    return n <= 1 ? (ANCHO + M.izq - M.der) / 2 : M.izq + (i * (ANCHO - M.izq - M.der)) / (n - 1);
  };
  private y = (v: number) => {
    const { min, max } = this.rango();
    return ALTO - M.abajo - ((v - min) / (max - min)) * (ALTO - M.abajo - M.arr);
  };

  protected ticks = computed(() => {
    const { min, max } = this.rango();
    return [0, 1, 2, 3].map(i => { const v = min + ((max - min) * i) / 3; return { y: this.y(v), valor: v.toFixed(2) }; });
  });

  protected etiquetas = computed(() => this.semanas().map((s, i) => ({
    x: this.x(i), texto: new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
  })));

  protected lineas = computed(() => this.series().map((s, k) => {
    const marcas = s.valores.map((v, i) => v == null ? null : { x: this.x(i), y: this.y(v) }).filter((p): p is { x: number; y: number } => p !== null);
    return { nombre: s.producto, color: COLORES[k % COLORES.length], marcas, puntos: marcas.map(p => `${p.x},${p.y}`).join(' ') };
  }));

  protected descripcion = computed(() => 'Evolución semanal del precio promedio de ' + this.series().map(s => s.producto).join(', '));
}
