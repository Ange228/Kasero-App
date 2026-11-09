package com.mercado.altiplano.repository;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Consultas de solo lectura sobre el catalogo del mercado (Supabase). */
@Repository
public class CatalogoRepository {

    /** Fila basica de comerciante, antes de armar el DTO. */
    public record ComBase(int id, String nombre, int nro, int pasillo, String seccion, String sector,
                          String pagos, String caseros, double cal, int ncal, int cot, String horario) {}

    private final JdbcTemplate jdbc;

    public CatalogoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Sector> sectores() {
        return jdbc.query("SELECT id, nombre, icono FROM sectores ORDER BY id",
                (rs, i) -> new Sector(rs.getInt(1), rs.getString(2), rs.getString(3)));
    }

    public List<ComBase> comerciantes() {
        return jdbc.query("""
                SELECT c.id, c.nombre, c.nro_puesto, c.pasillo, c.seccion, s.nombre AS sector,
                       c.metodos_pago, c.tiene_caseros, c.calificacion, c.num_calificaciones, c.cotizaciones, c.horario
                FROM comerciantes c JOIN sectores s ON s.id = c.sector_id
                WHERE c.activo ORDER BY c.pasillo, c.nro_puesto""",
                (rs, i) -> new ComBase(rs.getInt("id"), rs.getString("nombre"), rs.getInt("nro_puesto"),
                        rs.getInt("pasillo"), rs.getString("seccion"), rs.getString("sector"),
                        rs.getString("metodos_pago"), rs.getString("tiene_caseros"),
                        rs.getDouble("calificacion"), rs.getInt("num_calificaciones"),
                        rs.getInt("cotizaciones"), rs.getString("horario")));
    }

    public Map<Integer, List<PrecioItem>> preciosPorComerciante() {
        Map<Integer, List<PrecioItem>> mapa = new LinkedHashMap<>();
        jdbc.query("""
                SELECT pr.comerciante_id, p.id, p.nombre, p.icono, p.unidad, pr.precio, pr.actualizado_en
                FROM precios pr JOIN productos p ON p.id = pr.producto_id
                ORDER BY pr.comerciante_id, p.nombre""", rs -> {
            mapa.computeIfAbsent(rs.getInt(1), k -> new ArrayList<>()).add(new PrecioItem(
                    rs.getInt(2), rs.getString(3), rs.getString(4), rs.getString(5),
                    rs.getBigDecimal(6), rs.getString(7)));
        });
        return mapa;
    }

    public List<Producto> productos() {
        return jdbc.query("""
                SELECT p.id, p.nombre, p.unidad, p.icono, s.nombre
                FROM productos p JOIN sectores s ON s.id = p.sector_id ORDER BY p.nombre""",
                (rs, i) -> new Producto(rs.getInt(1), rs.getString(2), rs.getString(3),
                        rs.getString(4), rs.getString(5)));
    }

    public List<Promocion> promociones() {
        return jdbc.query("""
                SELECT c.id, c.nombre, c.nro_puesto, c.pasillo, p.nombre, p.icono, p.unidad,
                       pr.precio, pm.descuento_pct
                FROM promociones pm
                JOIN comerciantes c ON c.id = pm.comerciante_id
                JOIN productos p ON p.id = pm.producto_id
                JOIN precios pr ON pr.comerciante_id = c.id AND pr.producto_id = p.id
                ORDER BY pm.descuento_pct DESC""", (rs, i) -> {
            var original = rs.getBigDecimal(8);
            int pct = rs.getInt(9);
            var fin = original.multiply(java.math.BigDecimal.valueOf(100 - pct))
                    .divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            return new Promocion(rs.getInt(1), rs.getString(2), rs.getInt(3), rs.getInt(4),
                    rs.getString(5), rs.getString(6), rs.getString(7), original, fin, pct);
        });
    }

    public List<Noticia> noticias() {
        return jdbc.query("SELECT titulo, detalle FROM noticias ORDER BY id",
                (rs, i) -> new Noticia(rs.getString(1), rs.getString(2)));
    }

    public List<PrecioPromedio> promediosPorProducto() {
        return jdbc.query("""
                SELECT p.nombre, p.icono, p.unidad, AVG(pr.precio), MIN(pr.precio), MAX(pr.precio), COUNT(*)
                FROM precios pr JOIN productos p ON p.id = pr.producto_id
                GROUP BY p.nombre, p.icono, p.unidad ORDER BY COUNT(*) DESC, p.nombre""",
                (rs, i) -> new PrecioPromedio(rs.getString(1), rs.getString(2), rs.getString(3),
                        rs.getBigDecimal(4).setScale(2, java.math.RoundingMode.HALF_UP),
                        rs.getBigDecimal(5), rs.getBigDecimal(6), rs.getInt(7)));
    }

    public List<ProductoConteo> masCotizados() {
        return jdbc.query("""
                SELECT p.nombre, p.icono, COUNT(*) FROM cotizacion_items ci
                JOIN productos p ON p.id = ci.producto_id
                GROUP BY p.nombre, p.icono ORDER BY COUNT(*) DESC LIMIT 5""",
                (rs, i) -> new ProductoConteo(rs.getString(1), rs.getString(2), rs.getBigDecimal(3)));
    }

    public List<ProductoConteo> masComprados() {
        return jdbc.query("""
                SELECT p.nombre, p.icono, SUM(ci.cantidad) FROM pedidos pe
                JOIN cotizacion_items ci ON ci.cotizacion_id = pe.cotizacion_id
                JOIN productos p ON p.id = ci.producto_id
                GROUP BY p.nombre, p.icono ORDER BY SUM(ci.cantidad) DESC LIMIT 5""",
                (rs, i) -> new ProductoConteo(rs.getString(1), rs.getString(2), rs.getBigDecimal(3)));
    }
}
