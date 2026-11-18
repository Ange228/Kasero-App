package com.mercado.altiplano.repository;

import com.mercado.altiplano.security.PasswordHasher;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Crea el usuario de prueba (demo@kasero.local / 123456) si no existe. */
@Component
public class UsuarioDemoInicial implements ApplicationRunner {
    private final UsuarioRepositoryPort usuarios;
    private final PasswordHasher hasher;

    public UsuarioDemoInicial(UsuarioRepositoryPort usuarios, PasswordHasher hasher) {
        this.usuarios = usuarios;
        this.hasher = hasher;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarios.buscarPorCorreo("demo@kasero.local").isEmpty()) {
            usuarios.guardar("Usuario Demo", "demo@kasero.local", hasher.hash("123456"), "CLIENTE");
        }
    }
}
