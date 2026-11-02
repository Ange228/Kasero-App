package com.mercado.altiplano.repository;

import com.mercado.altiplano.dto.AdminDtos.*;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Acceso a datos del panel de administración. */
@Repository
public class AdminRepository {
    private final JdbcTemplate jdbc;

    public AdminRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private boolean existe(String sql, Object... args) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM (" + sql + ") t", Integer.class, args) > 0;
    }

    public boolean sectorExiste(int id) { return existe("SELECT 1 FROM sectores WHERE id = ?", id); }
    public boolean puestoExiste(int id) { return existe("SELECT 1 FROM comerciantes WHERE id = ?", id); }
    public boolean productoExiste(int id) { return existe("SELECT 1 FROM productos WHERE id = ?", id); }
    public boolean precioExiste(int comercianteId, int productoId) {
        return existe("SELECT 1 FROM precios WHERE comerciante_id = ? AND producto_id = ?", comercianteId, productoId);
    }

    // ---- Puestos ----
    public List<AdminPuesto> puestos() {
        return jdbc.query("""
                SELECT c.id, c.nombre, c.nro_puesto, c.pasillo, c.seccion, c.sector_id, s.nombre, c.metodos_pago,
                       c.tiene_caseros, c.activo,
                       (SELECT u.correo FROM usuarios u WHERE u.comerciante_id = c.id ORDER BY u.id LIMIT 1)
                FROM comerciantes c JOIN sectores s ON s.id = c.sector_id ORDER BY c.pasillo, c.nro_puesto""",
                (rs, i) -> new AdminPuesto(rs.getInt(1), rs.getString(2), rs.getInt(3), rs.getInt(4), rs.getString(5),
                        rs.getInt(6), rs.getString(7), rs.getString(8), rs.getString(9), rs.getBoolean(10), rs.getString(11)));
    }

    public boolean nombrePuestoExiste(String nombre, int exceptoId) {
        return existe("SELECT 1 FROM comerciantes WHERE LOWER(nombre) = LOWER(?) AND id <> ?", nombre, exceptoId);
    }

    public int crearPuesto(PuestoForm f) {
        return jdbc.queryForObject("""
                INSERT INTO comerciantes (nombre, nro_puesto, pasillo, seccion, sector_id, metodos_pago, tiene_caseros)
                VALUES (?,?,?,?,?,?,?) RETURNING id""", Integer.class,
                f.nombre(), f.nroPuesto(), f.pasillo(), f.seccion(), f.sectorId(), f.metodosPago(), f.tieneCaseros());
    }

    public void actualizarPuesto(int id, PuestoForm f) {
        jdbc.update("""
                UPDATE comerciantes SET nombre = ?, nro_puesto = ?, pasillo = ?, seccion = ?, sector_id = ?,
                       metodos_pago = ?, tiene_caseros = ? WHERE id = ?""",
                f.nombre(), f.nroPuesto(), f.pasillo(), f.seccion(), f.sectorId(), f.metodosPago(), f.tieneCaseros(), id);
    }

    public void cambiarActivo(int id, boolean activo) {
        jdbc.update("UPDATE comerciantes SET activo = ? WHERE id = ?", activo, id);
    }

    public void asignarCuenta(int usuarioId, int comercianteId) {
        jdbc.update("UPDATE usuarios SET rol = 'COMERCIANTE', comerciante_id = ? WHERE id = ?", comercianteId, usuarioId);
    }

    // ---- Productos ----
    public List<AdminProducto> productos() {
        return jdbc.query("""
                SELECT p.id, p.nombre, p.unidad, p.sector_id, s.nombre
                FROM productos p JOIN sectores s ON s.id = p.sector_id ORDER BY s.id, p.nombre""",
                (rs, i) -> new AdminProducto(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getInt(4), rs.getString(5)));
    }

    public boolean nombreProductoExiste(String nombre, int exceptoId) {
        return existe("SELECT 1 FROM productos WHERE LOWER(nombre) = LOWER(?) AND id <> ?", nombre, exceptoId);
    }

    public int crearProducto(ProductoForm f) {
        return jdbc.queryForObject("INSERT INTO productos (nombre, sector_id, unidad) VALUES (?,?,?) RETURNING id",
                Integer.class, f.nombre(), f.sectorId(), f.unidad());
    }

    public void actualizarProducto(int id, ProductoForm f) {
        jdbc.update("UPDATE productos SET nombre = ?, sector_id = ?, unidad = ? WHERE id = ?",
                f.nombre(), f.sectorId(), f.unidad(), id);
    }

    // ---- Noticias ----
    public List<AdminNoticia> noticias() {
        return jdbc.query("SELECT id, titulo, detalle FROM noticias ORDER BY id DESC",
                (rs, i) -> new AdminNoticia(rs.getInt(1), rs.getString(2), rs.getString(3)));
    }

    public boolean tituloNoticiaExiste(String titulo) {
        return existe("SELECT 1 FROM noticias WHERE LOWER(titulo) = LOWER(?)", titulo);
    }

    public int crearNoticia(NoticiaForm f) {
        return jdbc.queryForObject("INSERT INTO noticias (titulo, detalle) VALUES (?,?) RETURNING id", Integer.class,
                f.titulo(), f.detalle());
    }

    public boolean borrarNoticia(int id) { return jdbc.update("DELETE FROM noticias WHERE id = ?", id) > 0; }

    // ---- Promociones ----
    public List<AdminPromo> promociones() {
        return jdbc.query("""
                SELECT pm.id, c.nombre, p.nombre, pm.descuento_pct FROM promociones pm
                JOIN comerciantes c ON c.id = pm.comerciante_id JOIN productos p ON p.id = pm.producto_id
                ORDER BY pm.id DESC""",
                (rs, i) -> new AdminPromo(rs.getInt(1), rs.getString(2), rs.getString(3), rs.getInt(4)));
    }

    public int guardarPromocion(PromoForm f) {
        return jdbc.queryForObject("""
                INSERT INTO promociones (comerciante_id, producto_id, descuento_pct) VALUES (?,?,?)
                ON CONFLICT (comerciante_id, producto_id) DO UPDATE SET descuento_pct = EXCLUDED.descuento_pct
                RETURNING id""", Integer.class, f.comercianteId(), f.productoId(), f.descuento());
    }

    public boolean borrarPromocion(int id) { return jdbc.update("DELETE FROM promociones WHERE id = ?", id) > 0; }
}
