package com.mercado.altiplano.repository;

import com.mercado.altiplano.model.Usuario;
import java.util.Optional;

/** Puerto de acceso a datos de usuarios (ADR-001). */
public interface UsuarioRepositoryPort {
    Optional<Usuario> buscarPorCorreo(String correo);

    Optional<Usuario> buscarPorId(int id);

    Usuario guardar(String nombre, String correo, String passwordHash, String rol);
}
