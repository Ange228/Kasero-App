package com.mercado.altiplano.repository;

import com.mercado.altiplano.dto.ResenaDtos.ResenaResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class ResenaRepository {
    /** Calificacion vigente del comerciante: promedio y cantidad de calificaciones. */
    public record Calificacion(double promedio, int total) {}

    private static final RowMapper<ResenaResponse> MAPPER = (rs, i) -> new ResenaResponse(
            rs.getInt(1), abreviar(rs.getString(2)), rs.getInt(3), rs.getString(4),
            rs.getTimestamp(5).toLocalDateTime().toString());

    private final JdbcTemplate jdbc;

    public ResenaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** "Ana Pérez Soto" -> "Ana P." */
    static String abreviar(String nombre) {
        String[] p = nombre.trim().split("\\s+");
        return p.length > 1 ? p[0] + " " + p[1].charAt(0) + "." : p[0];
    }

    public List<ResenaResponse> listar(int comercianteId) {
        return jdbc.query("""
                SELECT r.id, u.nombre, r.puntaje, r.comentario, r.creada_en
                FROM resenas r JOIN usuarios u ON u.id = r.usuario_id
                WHERE r.comerciante_id = ? ORDER BY r.creada_en DESC LIMIT 50""", MAPPER, comercianteId);
    }

    public Optional<ResenaResponse> porId(int id) {
        return jdbc.query("""
                SELECT r.id, u.nombre, r.puntaje, r.comentario, r.creada_en
                FROM resenas r JOIN usuarios u ON u.id = r.usuario_id WHERE r.id = ?""", MAPPER, id)
                .stream().findFirst();
    }

    public Optional<Integer> puntajeDe(int comercianteId, int usuarioId) {
        return jdbc.query("SELECT puntaje FROM resenas WHERE comerciante_id = ? AND usuario_id = ?",
                (rs, i) -> rs.getInt(1), comercianteId, usuarioId).stream().findFirst();
    }

    /** El cliente tiene al menos un pedido con ese comerciante. */
    public boolean haComprado(int usuarioId, int comercianteId) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM pedidos p JOIN cotizaciones q ON q.id = p.cotizacion_id
                WHERE q.usuario_id = ? AND q.comerciante_id = ?""", Integer.class, usuarioId, comercianteId) > 0;
    }

    public int guardar(int comercianteId, int usuarioId, int puntaje, String comentario) {
        return jdbc.queryForObject("""
                INSERT INTO resenas (comerciante_id, usuario_id, puntaje, comentario) VALUES (?,?,?,?)
                ON CONFLICT (comerciante_id, usuario_id)
                DO UPDATE SET puntaje = EXCLUDED.puntaje, comentario = EXCLUDED.comentario, creada_en = NOW()
                RETURNING id""", Integer.class, comercianteId, usuarioId, puntaje, comentario);
    }

    public Optional<Calificacion> calificacion(int comercianteId) {
        return jdbc.query("SELECT calificacion, num_calificaciones FROM comerciantes WHERE id = ? AND activo",
                (rs, i) -> new Calificacion(rs.getDouble(1), rs.getInt(2)), comercianteId).stream().findFirst();
    }

    public void actualizarCalificacion(int comercianteId, BigDecimal promedio, int total) {
        jdbc.update("UPDATE comerciantes SET calificacion = ?, num_calificaciones = ? WHERE id = ?",
                promedio, total, comercianteId);
    }
}
