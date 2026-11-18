package com.mercado.altiplano.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** RNF-05: las contraseñas se guardan con hash PBKDF2 y sal propia. */
class PasswordHasherTest {
    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void verificaLaContrasenaCorrecta() {
        String hash = hasher.hash("MiClave123");
        assertThat(hasher.verificar("MiClave123", hash)).isTrue();
    }

    @Test
    void rechazaUnaContrasenaIncorrecta() {
        String hash = hasher.hash("MiClave123");
        assertThat(hasher.verificar("otraClave", hash)).isFalse();
    }

    @Test
    void elHashNoContieneLaContrasenaEnClaro() {
        assertThat(hasher.hash("MiClave123")).doesNotContain("MiClave123");
    }

    @Test
    void lamismaContrasenaGeneraHashesDistintosPorLaSal() {
        assertThat(hasher.hash("igual")).isNotEqualTo(hasher.hash("igual"));
    }

    @Test
    void unHashMalFormadoNoVerificaNiLanzaError() {
        assertThat(hasher.verificar("x", "no-es-un-hash")).isFalse();
        assertThat(hasher.verificar("x", "")).isFalse();
    }
}
