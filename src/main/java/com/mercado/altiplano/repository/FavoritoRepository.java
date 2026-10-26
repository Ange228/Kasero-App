package com.mercado.altiplano.repository;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class FavoritoRepository {
    private final JdbcTemplate jdbc;

    public FavoritoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Integer> ids(int usuarioId) {
        return jdbc.query("SELECT comerciante_id FROM favoritos WHERE usuario_id = ? ORDER BY creado_en DESC",
                (rs, i) -> rs.getInt(1), usuarioId);
    }

    public boolean comercianteExiste(int comercianteId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM comerciantes WHERE id = ? AND activo", Integer.class,
                comercianteId) > 0;
    }

    public void agregar(int usuarioId, int comercianteId) {
        jdbc.update("INSERT INTO favoritos (usuario_id, comerciante_id) VALUES (?,?) ON CONFLICT DO NOTHING",
                usuarioId, comercianteId);
    }

    public void quitar(int usuarioId, int comercianteId) {
        jdbc.update("DELETE FROM favoritos WHERE usuario_id = ? AND comerciante_id = ?", usuarioId, comercianteId);
    }
}
