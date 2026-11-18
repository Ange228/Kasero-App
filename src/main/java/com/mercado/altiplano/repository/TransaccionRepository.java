package com.mercado.altiplano.repository;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Cotizaciones y pedidos del cliente. */
@Repository
public class TransaccionRepository {
    private final JdbcTemplate jdbc;

    public TransaccionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Integer> cotizacionPorClave(String clave) {
        return jdbc.query("SELECT id FROM cotizaciones WHERE clave_solicitud = ?",
                (rs, i) -> rs.getInt(1), clave).stream().findFirst();
    }

    public Optional<BigDecimal> precio(int comercianteId, int productoId) {
        return jdbc.query("SELECT precio FROM precios WHERE comerciante_id = ? AND producto_id = ?",
                (rs, i) -> rs.getBigDecimal(1), comercianteId, productoId).stream().findFirst();
    }

    public String nombreProducto(int productoId) {
        return jdbc.query("SELECT nombre FROM productos WHERE id = ?", (rs, i) -> rs.getString(1), productoId)
                .stream().findFirst().orElse("producto " + productoId);
    }

    public int insertarCotizacion(int usuarioId, int comercianteId, String clave, BigDecimal total) {
        return jdbc.queryForObject("""
                INSERT INTO cotizaciones (usuario_id, comerciante_id, clave_solicitud, total)
                VALUES (?,?,?,?) RETURNING id""", Integer.class, usuarioId, comercianteId, clave, total);
    }

    public void insertarItem(int cotizacionId, int productoId, BigDecimal cantidad, BigDecimal pu, BigDecimal sub) {
        jdbc.update("""
                INSERT INTO cotizacion_items (cotizacion_id, producto_id, cantidad, precio_unit, subtotal)
                VALUES (?,?,?,?,?)""", cotizacionId, productoId, cantidad, pu, sub);
    }

    public void sumarCotizacion(int comercianteId) {
        jdbc.update("UPDATE comerciantes SET cotizaciones = cotizaciones + 1 WHERE id = ?", comercianteId);
    }

    public List<CotizacionResponse> cotizaciones(int usuarioId, Integer id) {
        String sql = """
                SELECT q.id, c.id, c.nombre, c.nro_puesto, c.pasillo, q.estado, q.total, q.creada_en,
                       EXISTS (SELECT 1 FROM pedidos p WHERE p.cotizacion_id = q.id)
                FROM cotizaciones q JOIN comerciantes c ON c.id = q.comerciante_id
                WHERE q.usuario_id = ?""" + (id == null ? "" : " AND q.id = ?") + " ORDER BY q.creada_en DESC";
        Object[] args = id == null ? new Object[]{usuarioId} : new Object[]{usuarioId, id};
        return jdbc.query(sql, (rs, i) -> new CotizacionResponse(rs.getInt(1), rs.getInt(2), rs.getString(3),
                rs.getInt(4), rs.getInt(5), rs.getString(6), rs.getBigDecimal(7),
                rs.getTimestamp(8).toLocalDateTime().toString(), items(rs.getInt(1)), rs.getBoolean(9)), args);
    }

    private List<ItemCotizacion> items(int cotizacionId) {
        return jdbc.query("""
                SELECT p.nombre, p.icono, p.unidad, ci.cantidad, ci.precio_unit, ci.subtotal
                FROM cotizacion_items ci JOIN productos p ON p.id = ci.producto_id
                WHERE ci.cotizacion_id = ? ORDER BY ci.id""",
                (rs, i) -> new ItemCotizacion(rs.getString(1), rs.getString(2), rs.getString(3),
                        rs.getBigDecimal(4), rs.getBigDecimal(5), rs.getBigDecimal(6)), cotizacionId);
    }

    public boolean pedidoExiste(int cotizacionId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM pedidos WHERE cotizacion_id = ?", Integer.class,
                cotizacionId) > 0;
    }

    public int insertarPedido(int cotizacionId, String modalidad, String direccion, String tercero, String codigo) {
        jdbc.update("UPDATE cotizaciones SET estado = 'CONFIRMADA' WHERE id = ?", cotizacionId);
        return jdbc.queryForObject("""
                INSERT INTO pedidos (cotizacion_id, modalidad, direccion, tercero_nombre, codigo_entrega)
                VALUES (?,?,?,?,?) RETURNING id""", Integer.class, cotizacionId, modalidad, direccion, tercero, codigo);
    }

    public List<PedidoResponse> pedidos(int usuarioId, Integer pedidoId) {
        String sql = """
                SELECT p.id, q.id, c.id, c.nombre, c.nro_puesto, q.total, p.modalidad, p.estado,
                       p.codigo_entrega, p.direccion, p.tercero_nombre, p.creado_en
                FROM pedidos p JOIN cotizaciones q ON q.id = p.cotizacion_id
                JOIN comerciantes c ON c.id = q.comerciante_id
                WHERE q.usuario_id = ?""" + (pedidoId == null ? "" : " AND p.id = ?") + " ORDER BY p.creado_en DESC";
        Object[] args = pedidoId == null ? new Object[]{usuarioId} : new Object[]{usuarioId, pedidoId};
        return jdbc.query(sql, (rs, i) -> new PedidoResponse(rs.getInt(1), rs.getInt(2), rs.getInt(3),
                rs.getString(4), rs.getInt(5), rs.getBigDecimal(6), rs.getString(7), rs.getString(8),
                rs.getString(9), rs.getString(10), rs.getString(11),
                rs.getTimestamp(12).toLocalDateTime().toString()), args);
    }
}
