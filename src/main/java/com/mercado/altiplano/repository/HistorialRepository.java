package com.mercado.altiplano.repository;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class HistorialRepository {
    /** Promedio semanal de un producto entre todos los puestos que lo venden. */
    public record FilaSemana(String semana, String producto, String icono, String unidad, BigDecimal promedio) {}

    private final JdbcTemplate jdbc;

    public HistorialRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Semanas anteriores salen del historial; la semana actual, de los precios vigentes. */
    public List<FilaSemana> promediosSemanales(int semanas) {
        return jdbc.query("""
                SELECT h.semana::text, p.nombre, p.icono, p.unidad, AVG(h.precio)
                FROM (
                    SELECT date_trunc('week', registrado_en)::date AS semana, producto_id, precio
                    FROM precios_historial
                    WHERE registrado_en < date_trunc('week', current_date)
                      AND registrado_en >= date_trunc('week', current_date) - make_interval(weeks => CAST(? AS integer) - 1)
                    UNION ALL
                    SELECT date_trunc('week', current_date)::date, producto_id, precio FROM precios
                ) h JOIN productos p ON p.id = h.producto_id
                GROUP BY h.semana, p.nombre, p.icono, p.unidad
                ORDER BY h.semana, p.nombre""",
                (rs, i) -> new FilaSemana(rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        rs.getBigDecimal(5).setScale(2, java.math.RoundingMode.HALF_UP)), semanas);
    }
}
