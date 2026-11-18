import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api.service';
import { mensajeError } from '../core/auth.service';
import { AdminNoticia, AdminProducto, AdminPromo, AdminPuesto, PuestoForm, Sector } from '../core/models';
import { Icono } from '../shared/icono';

type Pestana = 'puestos' | 'productos' | 'noticias' | 'promos';

/** Administración: carga y mantiene puestos, productos, noticias y promociones sin tocar SQL. */
@Component({
  selector: 'app-admin',
  imports: [FormsModule, Icono],
  template: `
    <div class="contenedor pagina">
      <h1>Administración</h1>
      <p class="suave sub">Carga y mantiene la información del mercado.</p>

      <div class="tabs" role="tablist">
        @for (t of pestanas; track t.id) {
          <button type="button" role="tab" [class.on]="tab() === t.id" (click)="cambiar(t.id)">{{ t.texto }}</button>
        }
      </div>
      @if (error()) { <div class="msg error" role="alert">{{ error() }}</div> }
      @if (aviso()) { <div class="msg ok" role="status">{{ aviso() }}</div> }

      @switch (tab()) {
        @case ('puestos') {
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Pasillo</th><th>Puesto</th><th>Casera</th><th>Sección</th><th>Cuenta</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                @for (p of puestos(); track p.id) {
                  <tr [class.inactivo]="!p.activo">
                    <td>{{ p.pasillo }}</td><td>{{ p.nroPuesto }}</td>
                    <td><strong>{{ p.nombre }}</strong></td><td>{{ p.seccion }} <span class="suave">· {{ p.sector }}</span></td>
                    <td class="suave">{{ p.cuenta || '—' }}</td>
                    <td><span class="etq" [class.nar]="!p.activo">{{ p.activo ? 'Activo' : 'Inactivo' }}</span></td>
                    <td class="fila">
                      <button type="button" class="btn sec" (click)="editarPuesto(p)">Editar</button>
                      <button type="button" class="btn fantasma" (click)="alternarActivo(p)">{{ p.activo ? 'Desactivar' : 'Activar' }}</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <section class="tarjeta formulario">
            <h3>{{ editandoId() ? 'Editar puesto' : 'Nuevo puesto' }}</h3>
            <div class="campos">
              <div><label for="pn">Nombre de la casera</label><input id="pn" [(ngModel)]="fp.nombre"></div>
              <div><label for="pnr">N.º de puesto (1 a 35)</label><input id="pnr" type="number" min="1" max="35" [(ngModel)]="fp.nroPuesto"></div>
              <div><label for="ppa">Pasillo</label><input id="ppa" type="number" min="1" [(ngModel)]="fp.pasillo"></div>
              <div><label for="pse">Sección</label><input id="pse" [(ngModel)]="fp.seccion"></div>
              <div><label for="psec">Sector</label>
                <select id="psec" [(ngModel)]="fp.sectorId"><option [ngValue]="0">Elige…</option>@for (s of sectores(); track s.id) { <option [ngValue]="s.id">{{ s.nombre }}</option> }</select></div>
              <div><label for="ppg">Métodos de pago</label><input id="ppg" [(ngModel)]="fp.metodosPago" placeholder="Yape y Plin"></div>
              <div><label for="pca">¿Caseros fijos?</label>
                <select id="pca" [(ngModel)]="fp.tieneCaseros"><option>Sí</option><option>Algunas veces</option><option>No</option></select></div>
            </div>
            <div class="fila envolver">
              <button type="button" class="btn" (click)="guardarPuesto()"><app-icono nombre="check" [tam]="16" /> {{ editandoId() ? 'Guardar cambios' : 'Crear puesto' }}</button>
              @if (editandoId()) { <button type="button" class="btn fantasma" (click)="nuevoPuesto()">Cancelar</button> }
            </div>
            @if (editandoId()) {
              <div class="cuenta">
                <label for="cc">Vincular una cuenta de comerciante (correo del usuario)</label>
                <div class="fila envolver"><input id="cc" type="email" [(ngModel)]="correoCuenta" placeholder="casera@correo.com" style="max-width:320px">
                  <button type="button" class="btn sec" (click)="vincular()">Vincular cuenta</button></div>
              </div>
            }
          </section>
        }

        @case ('productos') {
          <div style="overflow-x:auto">
            <table>
              <thead><tr><th>Producto</th><th>Unidad</th><th>Sector</th><th></th></tr></thead>
              <tbody>
                @for (p of productos(); track p.id) {
                  <tr><td><strong>{{ p.nombre }}</strong></td><td>{{ p.unidad }}</td><td>{{ p.sector }}</td>
                    <td><button type="button" class="btn sec" (click)="editarProducto(p)">Editar</button></td></tr>
                }
              </tbody>
            </table>
          </div>
          <section class="tarjeta formulario">
            <h3>{{ prodId() ? 'Editar producto' : 'Nuevo producto' }}</h3>
            <div class="campos">
              <div><label for="rn">Nombre</label><input id="rn" [(ngModel)]="fr.nombre"></div>
              <div><label for="rs">Sector</label>
                <select id="rs" [(ngModel)]="fr.sectorId"><option [ngValue]="0">Elige…</option>@for (s of sectores(); track s.id) { <option [ngValue]="s.id">{{ s.nombre }}</option> }</select></div>
              <div><label for="ru">Unidad</label><select id="ru" [(ngModel)]="fr.unidad"><option>kg</option><option>unidad</option><option>litro</option></select></div>
            </div>
            <div class="fila">
              <button type="button" class="btn" (click)="guardarProducto()"><app-icono nombre="check" [tam]="16" /> {{ prodId() ? 'Guardar cambios' : 'Crear producto' }}</button>
              @if (prodId()) { <button type="button" class="btn fantasma" (click)="nuevoProducto()">Cancelar</button> }
            </div>
          </section>
        }

        @case ('noticias') {
          @for (n of noticias(); track n.id) {
            <div class="tarjeta fila entre" style="margin-bottom:10px">
              <span><strong>{{ n.titulo }}</strong><br><span class="suave">{{ n.detalle }}</span></span>
              <button type="button" class="btn fantasma" (click)="borrarNoticia(n)" [attr.aria-label]="'Eliminar ' + n.titulo"><app-icono nombre="trash-2" [tam]="16" /></button>
            </div>
          } @empty { <p class="vacio">No hay noticias.</p> }
          <section class="tarjeta formulario">
            <h3>Nueva noticia</h3>
            <div class="campos">
              <div><label for="nt">Título</label><input id="nt" maxlength="100" [(ngModel)]="tituloNoticia"></div>
              <div><label for="nd">Detalle</label><input id="nd" maxlength="200" [(ngModel)]="detalleNoticia"></div>
            </div>
            <button type="button" class="btn" (click)="crearNoticia()"><app-icono nombre="plus" [tam]="16" /> Publicar noticia</button>
          </section>
        }

        @case ('promos') {
          @for (p of promos(); track p.id) {
            <div class="tarjeta fila entre" style="margin-bottom:10px">
              <span><span class="etq nar">-{{ p.descuento }}%</span> <strong>{{ p.producto }}</strong> · {{ p.comerciante }}</span>
              <button type="button" class="btn fantasma" (click)="borrarPromo(p)" [attr.aria-label]="'Eliminar promoción de ' + p.producto"><app-icono nombre="trash-2" [tam]="16" /></button>
            </div>
          } @empty { <p class="vacio">No hay promociones activas.</p> }
          <section class="tarjeta formulario">
            <h3>Nueva promoción</h3>
            <div class="campos">
              <div><label for="mc">Puesto</label>
                <select id="mc" [(ngModel)]="promoPuesto"><option [ngValue]="0">Elige…</option>@for (p of puestos(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }} (puesto {{ p.nroPuesto }})</option> }</select></div>
              <div><label for="mp">Producto</label>
                <select id="mp" [(ngModel)]="promoProducto"><option [ngValue]="0">Elige…</option>@for (p of productos(); track p.id) { <option [ngValue]="p.id">{{ p.nombre }}</option> }</select></div>
              <div><label for="md">Descuento (%)</label><input id="md" type="number" min="1" max="90" [(ngModel)]="promoDescuento"></div>
            </div>
            <button type="button" class="btn" (click)="crearPromo()"><app-icono nombre="plus" [tam]="16" /> Guardar promoción</button>
          </section>
        }
      }
    </div>
  `,
  styles: `
    .sub { margin: 6px 0 4px; }
    .formulario { margin-top: 22px; display: grid; gap: 14px; }
    .campos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 16px; }
    .cuenta { border-top: 1px dashed var(--borde); padding-top: 10px; }
    tr.inactivo { opacity: .55; }
  `
})
export class Admin {
  private api = inject(Api);

  protected pestanas: { id: Pestana; texto: string }[] = [
    { id: 'puestos', texto: 'Puestos' }, { id: 'productos', texto: 'Productos' },
    { id: 'noticias', texto: 'Noticias' }, { id: 'promos', texto: 'Promociones' }
  ];
  protected tab = signal<Pestana>('puestos');
  protected error = signal('');
  protected aviso = signal('');

  protected sectores = signal<Sector[]>([]);
  protected puestos = signal<AdminPuesto[]>([]);
  protected productos = signal<AdminProducto[]>([]);
  protected noticias = signal<AdminNoticia[]>([]);
  protected promos = signal<AdminPromo[]>([]);

  // Formulario de puestos
  protected editandoId = signal<number | null>(null);
  protected fp: PuestoForm = this.puestoVacio();
  protected correoCuenta = '';
  // Productos
  protected prodId = signal<number | null>(null);
  protected fr = { nombre: '', sectorId: 0, unidad: 'kg' };
  // Noticias y promociones
  protected tituloNoticia = '';
  protected detalleNoticia = '';
  protected promoPuesto = 0;
  protected promoProducto = 0;
  protected promoDescuento = 10;

  constructor() { this.cargar(); }

  private puestoVacio(): PuestoForm {
    return { nombre: '', nroPuesto: 1, pasillo: 1, seccion: '', sectorId: 0, metodosPago: 'Yape', tieneCaseros: 'Sí' };
  }

  private cargar() {
    forkJoin({
      s: this.api.sectores(), p: this.api.adminPuestos(), r: this.api.adminProductos(),
      n: this.api.adminNoticias(), m: this.api.adminPromociones()
    }).subscribe({
      next: x => { this.sectores.set(x.s); this.puestos.set(x.p); this.productos.set(x.r); this.noticias.set(x.n); this.promos.set(x.m); },
      error: e => this.error.set(mensajeError(e))
    });
  }

  protected cambiar(t: Pestana) { this.tab.set(t); this.error.set(''); this.aviso.set(''); }
  private ok(texto: string) { this.error.set(''); this.aviso.set(texto); this.cargar(); }
  private fallo(e: unknown) { this.aviso.set(''); this.error.set(mensajeError(e)); }

  // ---- Puestos ----
  protected nuevoPuesto() { this.editandoId.set(null); this.fp = this.puestoVacio(); this.correoCuenta = ''; }
  protected editarPuesto(p: AdminPuesto) {
    this.editandoId.set(p.id);
    this.fp = { nombre: p.nombre, nroPuesto: p.nroPuesto, pasillo: p.pasillo, seccion: p.seccion, sectorId: p.sectorId, metodosPago: p.metodosPago, tieneCaseros: p.tieneCaseros };
    this.correoCuenta = p.cuenta ?? '';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
  protected guardarPuesto() {
    const id = this.editandoId();
    (id ? this.api.adminEditarPuesto(id, this.fp) : this.api.adminCrearPuesto(this.fp)).subscribe({
      next: () => { this.ok(id ? 'Puesto actualizado' : 'Puesto creado'); this.nuevoPuesto(); }, error: e => this.fallo(e)
    });
  }
  protected alternarActivo(p: AdminPuesto) {
    this.api.adminActivoPuesto(p.id, !p.activo).subscribe({ next: () => this.ok(`${p.nombre} ${p.activo ? 'desactivado' : 'activado'}`), error: e => this.fallo(e) });
  }
  protected vincular() {
    this.api.adminCuentaPuesto(this.editandoId()!, this.correoCuenta).subscribe({ next: () => this.ok('Cuenta vinculada al puesto'), error: e => this.fallo(e) });
  }

  // ---- Productos ----
  protected nuevoProducto() { this.prodId.set(null); this.fr = { nombre: '', sectorId: 0, unidad: 'kg' }; }
  protected editarProducto(p: AdminProducto) {
    this.prodId.set(p.id); this.fr = { nombre: p.nombre, sectorId: p.sectorId, unidad: p.unidad };
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
  protected guardarProducto() {
    const id = this.prodId();
    (id ? this.api.adminEditarProducto(id, this.fr) : this.api.adminCrearProducto(this.fr)).subscribe({
      next: () => { this.ok(id ? 'Producto actualizado' : 'Producto creado'); this.nuevoProducto(); }, error: e => this.fallo(e)
    });
  }

  // ---- Noticias y promociones ----
  protected crearNoticia() {
    this.api.adminCrearNoticia(this.tituloNoticia, this.detalleNoticia).subscribe({
      next: () => { this.tituloNoticia = ''; this.detalleNoticia = ''; this.ok('Noticia publicada'); }, error: e => this.fallo(e)
    });
  }
  protected borrarNoticia(n: AdminNoticia) { this.api.adminBorrarNoticia(n.id).subscribe({ next: () => this.ok('Noticia eliminada'), error: e => this.fallo(e) }); }
  protected crearPromo() {
    this.api.adminGuardarPromo(this.promoPuesto, this.promoProducto, this.promoDescuento).subscribe({ next: () => this.ok('Promoción guardada'), error: e => this.fallo(e) });
  }
  protected borrarPromo(p: AdminPromo) { this.api.adminBorrarPromo(p.id).subscribe({ next: () => this.ok('Promoción eliminada'), error: e => this.fallo(e) }); }
}
