/* Kasero · Mercado del Altiplano — interfaz web (HTML + CSS + JS sin librerías) */
'use strict';

// ---------- utilidades ----------
const $main = document.getElementById('contenido');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => 'S/ ' + Number(n).toFixed(2);
const fecha = iso => new Date(iso).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'numeric'});
const ESTADO = {PENDIENTE:'Pendiente', CONFIRMADA:'Confirmada', EN_PREPARACION:'En preparación', LISTO:'Listo para recoger', ENTREGADO:'Entregado'};
const MODALIDAD = {ENVIO:'Envío a domicilio', RECOJO:'Recoger en puesto', TERCERO:'Tercero autorizado'};

function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function leer(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; } }

const sesion = {
  get: () => leer('kasero_sesion', null),
  set: s => guardar('kasero_sesion', s),
  borrar: () => { try { localStorage.removeItem('kasero_sesion'); } catch (e) {} }
};
const canasta = {
  get: () => leer('kasero_canasta', []),
  set: c => guardar('kasero_canasta', c)
};

async function api(ruta, opciones = {}) {
  const s = sesion.get();
  const cab = {'Content-Type': 'application/json'};
  if (s) cab.Authorization = 'Bearer ' + s.token;
  const r = await fetch('/api' + ruta, {...opciones, headers: cab,
    body: opciones.body ? JSON.stringify(opciones.body) : undefined});
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && s && ruta !== '/auth/login') sesion.borrar();
    const e = new Error(datos.mensaje || 'No se pudo completar la acción');
    e.status = r.status;
    throw e;
  }
  return datos;
}

const cargando = () => $main.innerHTML = '<p class="cargando" role="status">Cargando…</p>';
const errorVista = (e, reintento) => {
  $main.innerHTML = `<div class="msg error" role="alert">${esc(e.message)}</div>
    <button class="btn sec" id="reint">Reintentar</button>`;
  document.getElementById('reint').onclick = reintento;
};
const requiereSesion = () => {
  if (sesion.get()) return true;
  location.hash = '#/acceso?volver=' + encodeURIComponent(location.hash);
  return false;
};

function tarjetaPuesto(c, extra = '') {
  return `<article class="tarjeta">
    <div class="fila"><div class="avatar" aria-hidden="true">${esc(c.iniciales)}</div>
      <div><strong>${esc(c.nombre)}</strong> <span class="suave">★ ${c.calificacion.toFixed(1)} (${c.numCalificaciones})</span><br>
      <span class="suave">Pasillo ${c.pasillo} · Puesto ${c.nroPuesto} · ${esc(c.seccion)}</span></div></div>
    <div class="fila entre" style="margin-top:10px"><span class="suave">${c.precioMedio != null ? 'Precio medio: <span class="precio">' + money(c.precioMedio) + '</span>' : 'Sin precios'}</span>
    ${extra}</div>
    <a class="btn sec block" style="margin-top:10px" href="#/puesto/${c.id}">Ver puesto →</a></article>`;
}

// ---------- menú ----------
function pintarMenu(ruta) {
  const s = sesion.get();
  const enlaces = [['/', 'Inicio'], ['/buscar', 'Buscar'], ['/comparar', 'Comparar'], ['/precios', 'Precios'],
    ['/pedidos', 'Mis pedidos'], s ? ['/salir', 'Salir (' + s.nombre.split(' ')[0] + ')'] : ['/acceso', 'Ingresar']];
  document.getElementById('menu').innerHTML = enlaces.map(([r, t]) =>
    `<a href="#${r}" class="${ruta === r ? 'activo' : ''}" ${ruta === r ? 'aria-current="page"' : ''}>${esc(t)}</a>`).join('');
}

// ---------- vistas ----------
async function vistaInicio() {
  const [sectores, promos, noticias] = await Promise.all([api('/sectores'), api('/promociones'), api('/noticias')]);
  let pedidos = [];
  if (sesion.get()) { try { pedidos = await api('/pedidos'); } catch (e) {} }
  $main.innerHTML = `
    <section class="hero"><h1>El sabor de nuestro mercado, ahora más cerca de ti</h1>
      <p>Encuentra tus productos favoritos, compara precios y apoya a nuestros comerciantes.</p>
      <form class="busca" id="fbusca" role="search"><label for="q" class="saltar">Buscar</label>
        <input id="q" placeholder="Buscar productos, comerciantes o puestos…"><button class="btn naranja">Explorar mercado →</button></form>
      <div class="stats"><span>🏪 +200 puestos</span><span>🛒 Diversos sectores</span><span>🍲 Comida tradicional</span></div></section>
    <h2>Categorías <a href="#/buscar">Ver todo →</a></h2>
    <div class="grid g3">${sectores.map(s => `<a class="tarjeta sector" href="#/buscar?sector=${encodeURIComponent(s.nombre)}"><span aria-hidden="true">${s.icono}</span>${esc(s.nombre)}</a>`).join('')}</div>
    <h2>Promociones de la semana</h2>
    <div class="grid g2">${promos.map(p => `<a class="tarjeta" style="text-decoration:none;color:inherit" href="#/puesto/${p.comercianteId}">
      <span class="etq nar">-${p.descuento}%</span> <strong>${p.icono} ${esc(p.producto)}</strong><br>
      <span class="suave">${esc(p.comerciante)} · Puesto ${p.nroPuesto}</span><br>
      <span class="precio">${money(p.precioFinal)}</span> <s class="suave">${money(p.precioOriginal)}</s> por ${esc(p.unidad)}</a>`).join('') || '<p class="vacio">Pronto habrá promociones.</p>'}</div>
    ${sesion.get() ? `<h2>Tus pedidos <a href="#/pedidos">Ver todos →</a></h2>${pedidos.length ?
      pedidos.slice(0, 2).map(p => `<div class="tarjeta fila entre"><span>Pedido #${p.id} · ${esc(p.comerciante)}<br><span class="etq">${ESTADO[p.estado] || p.estado}</span></span><span class="precio">${money(p.total)}</span></div>`).join('')
      : '<p class="suave">Aún no tienes pedidos. ¡Arma tu primera cotización!</p>'}` : ''}
    <h2>Noticias y actividades</h2>
    <div class="grid g2">${noticias.map(n => `<div class="tarjeta"><strong>${esc(n.titulo)}</strong><br><span class="suave">${esc(n.detalle)}</span></div>`).join('')}</div>`;
  document.getElementById('fbusca').onsubmit = e => {
    e.preventDefault();
    location.hash = '#/buscar?q=' + encodeURIComponent(document.getElementById('q').value);
  };
}

async function vistaBuscar(p) {
  const sectores = await api('/sectores');
  const orden = p.orden || 'precio_asc';
  const qs = new URLSearchParams({q: p.q || '', sector: p.sector || '', orden}).toString();
  const lista = await api('/comerciantes?' + qs);
  const base = nuevo => '#/buscar?' + new URLSearchParams({q: p.q || '', sector: p.sector || '', orden, ...nuevo}).toString();
  $main.innerHTML = `<h1>Buscar</h1>
    <form class="busca" id="fb" role="search"><label for="q" class="saltar">Buscar</label>
      <input id="q" value="${esc(p.q || '')}" placeholder="Buscar productos, comerciantes o puestos…"><button class="btn">Buscar</button></form>
    <div class="filtros" style="margin-top:14px"><aside class="tarjeta"><strong>Sector</strong>
      <div class="chips" style="margin:8px 0 14px"><a class="chip ${!p.sector ? 'on' : ''}" href="${base({sector: ''})}" style="text-decoration:none;color:inherit">Todos</a>
      ${sectores.map(s => `<a class="chip ${p.sector === s.nombre ? 'on' : ''}" href="${base({sector: s.nombre})}" style="text-decoration:none;color:inherit">${esc(s.nombre)}</a>`).join('')}</div>
      <label for="ord">Ordenar por</label><select id="ord">
        ${[['precio_asc', 'Menor precio'], ['precio_desc', 'Mayor precio'], ['calificacion', 'Mejor calificación'], ['cotizado', 'Más cotizado']]
          .map(([v, t]) => `<option value="${v}" ${v === orden ? 'selected' : ''}>${t}</option>`).join('')}</select>
      <a class="btn sec block" style="margin-top:12px" href="#/buscar">↺ Restablecer</a></aside>
      <section><p class="suave">${esc(p.sector || 'Todos los sectores')} · ${lista.length} resultado(s)</p>
      ${lista.length ? `<div class="grid g2">${lista.map((c, i) => tarjetaPuesto(c, i === 0 && orden === 'precio_asc' ? '<span class="etq">Más económico</span>' : '')).join('')}</div>`
        : `<div class="vacio">No encontramos puestos con esa búsqueda.<br><a href="#/buscar">Ver todos los puestos</a></div>`}</section></div>`;
  document.getElementById('fb').onsubmit = e => { e.preventDefault(); location.hash = base({q: document.getElementById('q').value}); };
  document.getElementById('ord').onchange = e => { location.hash = base({orden: e.target.value}); };
}

async function vistaPuesto(id) {
  const d = await api('/comerciantes/' + id);
  const c = d.comerciante;
  let tab = 'prod';
  const pintar = () => {
    $main.innerHTML = `
      <div class="tarjeta"><div class="fila"><div class="avatar" aria-hidden="true">${esc(c.iniciales)}</div>
        <div><h1 style="margin:0">${esc(c.nombre)} <span class="etq">✓ Verificado</span></h1>
        <span class="suave">★ ${c.calificacion.toFixed(1)} (${c.numCalificaciones} calificaciones) · Pasillo ${c.pasillo} · Puesto ${c.nroPuesto} · ${esc(c.seccion)}</span></div></div>
        <p><strong>Métodos de pago:</strong> ${c.metodosPago.map(m => `<span class="etq">${esc(m)}</span>`).join(' ')}</p>
        <p><strong>Modalidades de entrega:</strong> ${d.modalidades.map(m => `<span class="etq">${esc(m)}</span>`).join(' ')}</p></div>
      <div class="tabs" role="tablist"><button class="${tab === 'prod' ? 'on' : ''}" data-t="prod">Productos</button>
        <button class="${tab === 'sobre' ? 'on' : ''}" data-t="sobre">Sobre nosotros</button></div>
      ${tab === 'prod' ? `<div style="overflow-x:auto"><table><thead><tr><th>Producto</th><th class="num">Precio</th><th>Actualizado</th><th>Cantidad</th><th></th></tr></thead><tbody>
        ${d.precios.map(p => `<tr><td>${p.icono} ${esc(p.nombre)}</td><td class="num precio">${money(p.precio)} / ${esc(p.unidad)}</td><td class="suave">${fecha(p.actualizado)}</td>
        <td><label class="saltar" for="c${p.productoId}">Cantidad de ${esc(p.nombre)}</label><input class="cant" id="c${p.productoId}" type="number" min="0.5" step="0.5" value="1"></td>
        <td><button class="btn sec" data-add="${p.productoId}">Agregar</button></td></tr>`).join('')}</tbody></table></div>
        <div class="fila" style="margin-top:14px;flex-wrap:wrap"><a class="btn" href="#/cotizar/${c.id}">Cotizar / Reservar</a><a class="btn sec" href="#/comparar">Comparar canasta</a>
        <span class="suave">En tu canasta: ${canasta.get().length} producto(s)</span></div>`
      : `<div class="tarjeta"><p>${esc(c.nombre)} atiende en el pasillo ${c.pasillo}, puesto ${c.nroPuesto}, sección ${esc(c.seccion)}.</p>
        <p>¿Tiene caseros fijos? <strong>${esc(c.tieneCaseros)}</strong></p></div>`}`;
    document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; pintar(); });
    document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
      const pid = +b.dataset.add, pr = d.precios.find(x => x.productoId === pid);
      const cant = parseFloat(document.getElementById('c' + pid).value) || 1;
      const cs = canasta.get(), ex = cs.find(x => x.productoId === pid);
      if (ex) ex.cantidad += cant; else cs.push({productoId: pid, nombre: pr.nombre, icono: pr.icono, unidad: pr.unidad, cantidad: cant});
      canasta.set(cs); pintar();
    });
  };
  pintar();
}

async function vistaCotizar(id) {
  const d = await api('/comerciantes/' + id);
  const c = d.comerciante, items = canasta.get();
  const precio = pid => d.precios.find(p => p.productoId === pid);
  const total = items.reduce((t, i) => t + (precio(i.productoId) ? precio(i.productoId).precio * i.cantidad : 0), 0);
  const faltan = items.filter(i => !precio(i.productoId));
  $main.innerHTML = `<h1>Tu cotización</h1><div class="pasos"><span>1 Selecciona productos</span><span class="on">2 Confirma</span><span>3 Envía</span></div>
    <p>Puesto de <strong>${esc(c.nombre)}</strong> · Pasillo ${c.pasillo} · Puesto ${c.nroPuesto}</p>
    ${!items.length ? `<div class="vacio">Tu canasta está vacía.<br><a href="#/puesto/${c.id}">Agregar productos de este puesto</a></div>` : `
    <div style="overflow-x:auto"><table><thead><tr><th>Producto</th><th class="num">Cantidad</th><th class="num">Subtotal</th></tr></thead><tbody>
    ${items.map(i => { const p = precio(i.productoId); return `<tr><td>${i.icono} ${esc(i.nombre)}</td><td class="num">${i.cantidad} ${esc(i.unidad)}</td>
      <td class="num precio">${p ? money(p.precio * i.cantidad) : '<span class="etq nar">No lo vende</span>'}</td></tr>`; }).join('')}</tbody></table></div>
    ${faltan.length ? `<div class="msg error" role="alert">Este puesto no vende: ${faltan.map(f => esc(f.nombre)).join(', ')}. Quítalo de la canasta para enviar la cotización.</div>` : ''}
    <div class="pizarra" style="margin:16px 0"><div>Total (aprox.)</div><div class="monto">${money(total)}</div></div>
    <button class="btn block" id="enviar" ${faltan.length ? 'disabled' : ''}>Enviar cotización</button>
    <p class="suave">ⓘ El comerciante confirmará el precio final disponible.</p><div id="res"></div>`}`;
  const b = document.getElementById('enviar');
  if (b) b.onclick = async () => {
    b.disabled = true;
    if (!requiereSesion()) return;
    // La misma clave para el mismo contenido evita cotizaciones duplicadas
    const firma = id + ':' + items.map(i => i.productoId + 'x' + i.cantidad).join(',');
    let clave = leer('kasero_clave', {});
    if (clave.firma !== firma) { clave = {firma, id: crypto.randomUUID()}; guardar('kasero_clave', clave); }
    try {
      const r = await api('/cotizaciones', {method: 'POST', body: {comercianteId: +id, claveSolicitud: clave.id,
        items: items.map(i => ({productoId: i.productoId, cantidad: i.cantidad}))}});
      canasta.set([]);
      location.hash = '#/pedido/' + r.id;
    } catch (e) {
      document.getElementById('res').innerHTML = `<div class="msg error" role="alert">${esc(e.message)}</div>`;
      b.disabled = false;
    }
  };
}

async function vistaComparar() {
  const productos = await api('/productos');
  const pintar = async () => {
    const items = canasta.get();
    let res = null;
    if (items.length) res = await api('/comparaciones', {method: 'POST', body: {items: items.map(i => ({productoId: i.productoId, cantidad: i.cantidad}))}});
    $main.innerHTML = `<h1>Comparar precios — Canasta de referencia</h1>
      <div class="tarjeta"><strong>🛒 Tu canasta</strong>
      ${items.length ? `<table><tbody>${items.map(i => `<tr><td>${i.icono} ${esc(i.nombre)}</td>
        <td><label class="saltar" for="q${i.productoId}">Cantidad de ${esc(i.nombre)}</label><input class="cant" id="q${i.productoId}" data-q="${i.productoId}" type="number" min="0.5" step="0.5" value="${i.cantidad}"> ${esc(i.unidad)}</td>
        <td><button class="btn sec" data-del="${i.productoId}" aria-label="Quitar ${esc(i.nombre)}">Quitar</button></td></tr>`).join('')}</tbody></table>`
        : '<p class="suave">Agrega productos para comparar el total entre puestos.</p>'}
      <div class="fila" style="margin-top:10px"><label class="saltar" for="np">Agregar producto</label>
        <select id="np"><option value="">Agregar producto…</option>${productos.map(p => `<option value="${p.id}">${p.icono} ${esc(p.nombre)} (${esc(p.unidad)})</option>`).join('')}</select>
        <button class="btn" id="addp">Agregar</button><button class="btn sec" id="vaciar">Vaciar</button></div></div>
      ${res ? `<h2>Resultado</h2>${res.completos.length ? `<div style="overflow-x:auto"><table><thead><tr><th>Comerciante</th><th class="num">Precio total</th><th class="num">Diferencia</th><th></th></tr></thead><tbody>
        ${res.completos.map(f => `<tr><td><strong>${esc(f.comerciante.nombre)}</strong> ${f.masEconomico ? '<span class="etq">Más económico</span>' : ''}<br>
          <span class="suave">★ ${f.comerciante.calificacion.toFixed(1)} · Pasillo ${f.comerciante.pasillo} · Puesto ${f.comerciante.nroPuesto}</span></td>
          <td class="num precio">${money(f.total)}</td><td class="num">${f.masEconomico ? '—' : '+ ' + money(f.diferencia)}</td>
          <td><a class="btn sec" href="#/cotizar/${f.comerciante.id}">Cotizar</a></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="vacio">Ningún puesto vende toda la canasta. Prueba quitando algún producto.</div>'}
        ${res.incompletos.length ? `<h2>No venden toda la canasta</h2>${res.incompletos.map(f => `<div class="tarjeta">${esc(f.comerciante.nombre)} — le falta: ${f.faltantes.map(esc).join(', ')}</div>`).join('')}` : ''}
        <p class="suave">ⓘ Solo se comparan puestos que venden todos los productos de la misma canasta.</p>` : ''}`;
    document.getElementById('addp').onclick = () => {
      const v = +document.getElementById('np').value; if (!v) return;
      const p = productos.find(x => x.id === v), cs = canasta.get();
      if (!cs.find(x => x.productoId === v)) cs.push({productoId: v, nombre: p.nombre, icono: p.icono, unidad: p.unidad, cantidad: 1});
      canasta.set(cs); pintar();
    };
    document.getElementById('vaciar').onclick = () => { canasta.set([]); pintar(); };
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { canasta.set(canasta.get().filter(x => x.productoId !== +b.dataset.del)); pintar(); });
    document.querySelectorAll('[data-q]').forEach(i => i.onchange = () => {
      const cs = canasta.get(), it = cs.find(x => x.productoId === +i.dataset.q);
      it.cantidad = Math.max(0.5, parseFloat(i.value) || 1); canasta.set(cs); pintar();
    });
  };
  await pintar();
}

async function vistaPedido(id) {
  if (!requiereSesion()) return;
  const cots = await api('/cotizaciones');
  const q = cots.find(c => c.id === +id);
  if (!q) { $main.innerHTML = '<div class="msg error">No encontramos esa cotización.</div>'; return; }
  if (q.tienePedido) { location.hash = '#/pedidos'; return; }
  let mod = 'ENVIO';
  const pintar = () => {
    $main.innerHTML = `<h1>Confirmar pedido</h1>
      <div class="msg ok" role="status">Cotización #${q.id} enviada a ${esc(q.comerciante)}. Ahora elige cómo recibirás tu compra.</div>
      <div class="tarjeta"><strong>Productos</strong><table><tbody>${q.items.map(i => `<tr><td>${i.icono} ${esc(i.producto)}</td><td>${i.cantidad} ${esc(i.unidad)}</td><td class="num precio">${money(i.subtotal)}</td></tr>`).join('')}
        <tr><th colspan="2">Total</th><td class="num precio">${money(q.total)}</td></tr></tbody></table></div>
      <h2>Selecciona la modalidad de entrega</h2>
      ${[['ENVIO', 'Envío', 'El pedido llega a tu dirección.'], ['RECOJO', 'Recoger en puesto', 'Recoge en el mercado.'], ['TERCERO', 'Tercero autorizado', 'Alguien de tu confianza lo recoge.']]
        .map(([v, t, d]) => `<label class="opcion ${mod === v ? 'on' : ''}"><input type="radio" name="mod" value="${v}" ${mod === v ? 'checked' : ''}><span><strong>${t}</strong><br><span class="suave">${d}</span></span></label>`).join('')}
      ${mod === 'ENVIO' ? '<label for="dir">Dirección de envío</label><input id="dir" autocomplete="street-address">' : ''}
      ${mod === 'TERCERO' ? '<label for="ter">Nombre de la persona autorizada</label><input id="ter">' : ''}
      <div id="res"></div><button class="btn block" id="conf" style="margin-top:14px">Confirmar pedido</button>`;
    document.querySelectorAll('[name=mod]').forEach(r => r.onchange = () => { mod = r.value; pintar(); });
    document.getElementById('conf').onclick = async () => {
      try {
        const p = await api('/pedidos', {method: 'POST', body: {cotizacionId: q.id, modalidad: mod,
          direccion: document.getElementById('dir')?.value, terceroNombre: document.getElementById('ter')?.value}});
        $main.innerHTML = `<div class="msg ok" role="status"><strong>¡Pedido #${p.id} confirmado!</strong><br>${MODALIDAD[p.modalidad]} · ${money(p.total)}</div>
          ${p.codigoEntrega ? `<div class="pizarra"><div>Código de entrega para ${esc(p.terceroNombre)}</div><div class="monto">${esc(p.codigoEntrega)}</div></div>` : ''}
          <p><a class="btn" href="#/pedidos">Ver mis pedidos</a></p>`;
      } catch (e) { document.getElementById('res').innerHTML = `<div class="msg error" role="alert">${esc(e.message)}</div>`; }
    };
  };
  pintar();
}

async function vistaPrecios() {
  const r = await api('/precios/resumen');
  const max = Math.max(...r.promedios.map(p => Number(p.maximo)), 1);
  $main.innerHTML = `<h1>Precios del mercado</h1>
    <div class="grid g2"><section class="tarjeta"><h2 style="margin-top:0">Productos más cotizados</h2>
      ${r.masCotizados.length ? r.masCotizados.map((p, i) => `<div class="fila entre"><span>${i + 1} ${p.icono} ${esc(p.producto)}</span><span class="precio">${p.cantidad}</span></div>`).join('') : '<p class="suave">Aún no hay cotizaciones registradas.</p>'}</section>
    <section class="tarjeta"><h2 style="margin-top:0">Productos más comprados</h2>
      ${r.masComprados.length ? r.masComprados.map((p, i) => `<div class="fila entre"><span>${i + 1} ${p.icono} ${esc(p.producto)}</span><span class="precio">${p.cantidad}</span></div>`).join('') : '<p class="suave">Aún no hay pedidos registrados.</p>'}</section></div>
    <h2>Precio promedio por producto</h2>
    <div class="tarjeta">${r.promedios.map(p => `<div style="margin:10px 0"><div class="fila entre"><span>${p.icono} ${esc(p.producto)} <span class="suave">(${p.puestos} puesto${p.puestos > 1 ? 's' : ''})</span></span>
      <span class="precio">${money(p.promedio)} / ${esc(p.unidad)}</span></div><div class="barra" aria-hidden="true"><i style="width:${Math.round(p.promedio / max * 100)}%"></i></div>
      <span class="suave">Mín ${money(p.minimo)} · Máx ${money(p.maximo)}</span></div>`).join('')}</div>`;
}

async function vistaPedidos() {
  if (!requiereSesion()) return;
  const [pedidos, cots] = await Promise.all([api('/pedidos'), api('/cotizaciones')]);
  const pend = cots.filter(c => !c.tienePedido);
  $main.innerHTML = `<h1>Mis pedidos</h1>
    ${pend.length ? `<h2>Cotizaciones por confirmar</h2>${pend.map(c => `<div class="tarjeta fila entre" style="margin-bottom:8px">
      <span><strong>Cotización #${c.id}</strong> · ${esc(c.comerciante)}<br><span class="suave">${fecha(c.fecha)} · ${c.items.length} producto(s)</span></span>
      <span class="fila"><span class="precio">${money(c.total)}</span><a class="btn" href="#/pedido/${c.id}">Elegir entrega</a></span></div>`).join('')}` : ''}
    <h2>Historial de pedidos</h2>
    ${pedidos.length ? pedidos.map(p => `<div class="tarjeta" style="margin-bottom:8px"><div class="fila entre"><span><strong>Pedido #${p.id}</strong> · ${esc(p.comerciante)}<br>
      <span class="suave">${fecha(p.fecha)} · ${MODALIDAD[p.modalidad]}</span></span><span class="precio">${money(p.total)}</span></div>
      <span class="etq">${ESTADO[p.estado] || p.estado}</span>${p.codigoEntrega ? ` <span class="suave">Código de entrega: <strong>${esc(p.codigoEntrega)}</strong> (${esc(p.terceroNombre)})</span>` : ''}</div>`).join('')
      : '<div class="vacio">Todavía no hiciste pedidos.<br><a href="#/buscar">Buscar puestos</a></div>'}`;
}

function vistaAcceso(p) {
  let modo = 'login';
  const volver = p.volver ? decodeURIComponent(p.volver) : '#/';
  const pintar = () => {
    $main.innerHTML = `<div style="max-width:420px;margin:0 auto"><div class="tarjeta">
      <div class="fila" style="justify-content:center"><div class="avatar" aria-hidden="true">△</div></div>
      <h1 style="text-align:center">${modo === 'login' ? 'Ingresar a Kasero' : 'Crear cuenta'}</h1>
      <div class="tabs"><button class="${modo === 'login' ? 'on' : ''}" data-m="login">Ingresar</button><button class="${modo === 'reg' ? 'on' : ''}" data-m="reg">Registrarse</button></div>
      <form id="fa" novalidate>
        ${modo === 'reg' ? '<label for="nom">Nombre</label><input id="nom" autocomplete="name" required>' : ''}
        <label for="cor">Correo</label><input id="cor" type="email" autocomplete="email" required>
        <label for="pas">Contraseña${modo === 'reg' ? ' (mínimo 8 caracteres)' : ''}</label><input id="pas" type="password" autocomplete="${modo === 'login' ? 'current-password' : 'new-password'}" required>
        <div id="res" role="alert" aria-live="polite"></div>
        <button class="btn block" style="margin-top:14px">${modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</button></form>
      ${modo === 'login' ? '<p class="suave" style="text-align:center">Cuenta de prueba: demo@kasero.local / 123456</p>' : ''}</div></div>`;
    document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { modo = b.dataset.m; pintar(); });
    document.getElementById('fa').onsubmit = async e => {
      e.preventDefault();
      const body = {correo: document.getElementById('cor').value, password: document.getElementById('pas').value};
      if (modo === 'reg') body.nombre = document.getElementById('nom').value;
      try {
        const r = await api(modo === 'login' ? '/auth/login' : '/auth/registro', {method: 'POST', body});
        sesion.set({token: r.token, nombre: r.nombre, usuarioId: r.usuarioId});
        location.hash = volver;
      } catch (err) { document.getElementById('res').innerHTML = `<div class="msg error">${esc(err.message)}</div>`; }
    };
  };
  pintar();
}

async function salir() {
  try { await api('/auth/logout', {method: 'POST'}); } catch (e) {}
  sesion.borrar(); location.hash = '#/';
}

// ---------- enrutador ----------
async function enrutar() {
  const h = location.hash.slice(1) || '/';
  const [ruta, qs] = h.split('?');
  const params = Object.fromEntries(new URLSearchParams(qs || ''));
  const seg = ruta.split('/').filter(Boolean);
  pintarMenu(ruta);
  if (ruta === '/salir') return salir();
  cargando();
  const ir = async () => {
    try {
      if (!seg.length) await vistaInicio();
      else if (seg[0] === 'buscar') await vistaBuscar(params);
      else if (seg[0] === 'puesto') await vistaPuesto(seg[1]);
      else if (seg[0] === 'cotizar') await vistaCotizar(seg[1]);
      else if (seg[0] === 'comparar') await vistaComparar();
      else if (seg[0] === 'pedido') await vistaPedido(seg[1]);
      else if (seg[0] === 'precios') await vistaPrecios();
      else if (seg[0] === 'pedidos') await vistaPedidos();
      else if (seg[0] === 'acceso') vistaAcceso(params);
      else $main.innerHTML = '<div class="vacio">Página no encontrada. <a href="#/">Volver al inicio</a></div>';
    } catch (e) {
      if (e.status === 401) { location.hash = '#/acceso?volver=' + encodeURIComponent(location.hash); return; }
      errorVista(e, ir);
    }
  };
  await ir();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', enrutar);
enrutar();
