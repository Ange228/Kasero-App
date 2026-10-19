package com.mercado.altiplano.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mercado.altiplano.exception.AuthenticationException;
import org.junit.jupiter.api.Test;

/** R-07: sesiones con token; las funciones protegidas exigen una sesión válida. */
class SesionServiceTest {
    private final SesionService sesiones = new SesionService();

    @Test
    void unTokenCreadoPermiteIdentificarAlUsuario() {
        String token = sesiones.crear(7);
        assertThat(sesiones.requerir("Bearer " + token)).isEqualTo(7);
    }

    @Test
    void cadaSesionTieneUnTokenDistinto() {
        assertThat(sesiones.crear(1)).isNotEqualTo(sesiones.crear(1));
    }

    @Test
    void unTokenDesconocidoSeRechaza() {
        assertThatThrownBy(() -> sesiones.requerir("Bearer inventado"))
                .isInstanceOf(AuthenticationException.class);
    }

    @Test
    void sinEncabezadoSeRechaza() {
        assertThatThrownBy(() -> sesiones.requerir(null)).isInstanceOf(AuthenticationException.class);
        assertThatThrownBy(() -> sesiones.requerir("")).isInstanceOf(AuthenticationException.class);
    }

    @Test
    void alCerrarSesionElTokenDejaDeServir() {
        String h = "Bearer " + sesiones.crear(3);
        sesiones.cerrar(h);
        assertThatThrownBy(() -> sesiones.requerir(h)).isInstanceOf(AuthenticationException.class);
    }
}
