package com.mercado.altiplano.repository;

import com.mercado.altiplano.model.Usuario;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** Implementacion sobre Supabase (PostgreSQL). */
@Repository
public class UsuarioRepository implements UsuarioRepositoryPort {
    private static final RowMapper<Usuario> MAPPER = (rs, i) -> new Usuario(
            rs.getInt("id"), rs.getString("nombre"), rs.getString("correo"),
            rs.getString("password_hash"), rs.getString("rol"));

    private final JdbcTemplate jdbc;

    public UsuarioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Usuario> buscarPorCorreo(String correo) {
        return jdbc.query("SELECT * FROM usuarios WHERE LOWER(correo) = LOWER(?)", MAPPER, correo)
                .stream().findFirst();
    }

    @Override
    public Optional<Usuario> buscarPorId(int id) {
        return jdbc.query("SELECT * FROM usuarios WHERE id = ?", MAPPER, id).stream().findFirst();
    }

    @Override
    public Usuario guardar(String nombre, String correo, String passwordHash, String rol) {
        int id = jdbc.queryForObject(
                "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?,?,?,?) RETURNING id",
                Integer.class, nombre, correo.toLowerCase(), passwordHash, rol);
        return new Usuario(id, nombre, correo.toLowerCase(), passwordHash, rol);
    }
}
