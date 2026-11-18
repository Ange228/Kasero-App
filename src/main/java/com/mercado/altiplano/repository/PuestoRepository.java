package com.mercado.altiplano.repository;

import com.mercado.altiplano.dto.CatalogoDtos.ItemCotizacion;
import com.mercado.altiplano.dto.PuestoDtos.PedidoPuesto;
import com.mercado.altiplano.model.Nombres;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Acceso a datos del panel del comerciante. */
@Repository
public class PuestoRepository {
    /** Datos mínimos de un pedido para validar dueño y estado. */
    public record PedidoFila(int id, int comercianteId, String estado) {}

    private final JdbcTemplate jdbc;

    public PuestoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Integer> comercianteDeUsuario(int usuarioId) {
        return jdbc.query("SELECT comerciante_id FROM usuarios WHERE id = ? AND comerciante_id IS NOT NULL",
                (rs, i) -> rs.getInt(1), usuarioId).stream().findFirst();
    }

    public boolean productoExiste(int productoId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM productos WHERE id = ?", Integer.class, productoId) > 0;
    }

    public void guardarPrecio(int comercianteId, int productoId, BigDecimal precio) {
        jdbc.update("""
                INSERT INTO precios (comerciante_id, producto_id, precio, actualizado_en) VALUES (?,?,?,CURRENT_DATE)
                ON CONFLICT (comerciante_id, producto_id)
                DO UPDATE SET precio = EXCLUDED.precio, actualizado_en = CURRENT_DATE""",
                comercianteId, productoId, precio);
    }

    public boolean quitarPrecio(int comercianteId, int productoId) {
        return jdbc.update("DELETE FROM precios WHERE comerciante_id = ? AND producto_id = ?",
                comercianteId, productoId) > 0;
    }

    public Optional<PedidoFila> pedido(int pedidoId) {
        return jdbc.query("""
                SELECT p.id, q.comerciante_id, p.estado FROM pedidos p JOIN cotizaciones q ON q.id = p.cotizacion_id
                WHERE p.id = ?""", (rs, i) -> new PedidoFila(rs.getInt(1), rs.getInt(2), rs.getString(3)), pedidoId)
                .stream().findFirst();
    }

    public void actualizarEstado(int pedidoId, String estado) {
        jdbc.update("UPDATE pedidos SET estado = ? WHERE id = ?", estado, pedidoId);
    }

    public List<PedidoPuesto> pedidos(int comercianteId) {
        return jdbc.query("""
                SELECT p.id, u.nombre, p.modalidad, p.estado, q.total, p.creado_en,
                       p.direccion, p.tercero_nombre, p.codigo_entrega, q.id
                FROM pedidos p JOIN cotizaciones q ON q.id = p.cotizacion_id JOIN usuarios u ON u.id = q.usuario_id
                WHERE q.comerciante_id = ? ORDER BY p.creado_en DESC LIMIT 100""",
                (rs, i) -> new PedidoPuesto(rs.getInt(1), Nombres.abreviar(rs.getString(2)), rs.getString(3),
                        rs.getString(4), rs.getBigDecimal(5), rs.getTimestamp(6).toLocalDateTime().toString(),
                        rs.getString(7), rs.getString(8), rs.getString(9), items(rs.getInt(10))), comercianteId);
    }

    private List<ItemCotizacion> items(int cotizacionId) {
        return jdbc.query("""
                SELECT p.nombre, p.icono, p.unidad, ci.cantidad, ci.precio_unit, ci.subtotal
                FROM cotizacion_items ci JOIN productos p ON p.id = ci.producto_id
                WHERE ci.cotizacion_id = ? ORDER BY ci.id""",
                (rs, i) -> new ItemCotizacion(rs.getString(1), rs.getString(2), rs.getString(3),
                        rs.getBigDecimal(4), rs.getBigDecimal(5), rs.getBigDecimal(6)), cotizacionId);
    }
}
