package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.dto.ResenaDtos.ResenaRequest;
import com.mercado.altiplano.dto.ResenaDtos.ResenaResponse;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.ResenaRepository;
import com.mercado.altiplano.repository.ResenaRepository.Calificacion;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Calificaciones y reseñas de comerciantes. */
class ResenaServiceTest {
    private ResenaRepository repo;
    private ResenaService servicio;

    private static int estado(Throwable t) {
        return ((ApiException) t).getStatus().value();
    }

    @BeforeEach
    void preparar() {
        repo = mock(ResenaRepository.class);
        when(repo.calificacion(1)).thenReturn(Optional.of(new Calificacion(4.00, 10)));
        when(repo.haComprado(7, 1)).thenReturn(true);
        when(repo.puntajeDe(1, 7)).thenReturn(Optional.empty());
        when(repo.guardar(anyInt(), anyInt(), anyInt(), any())).thenReturn(55);
        when(repo.porId(55)).thenReturn(Optional.of(new ResenaResponse(55, "Ana P.", 5, "Excelente", "2026-11-18T10:00:00")));
        servicio = new ResenaService(repo);
    }

    @Test
    void unaCalificacionNuevaActualizaElPromedioYElTotal() {
        // (4.00 * 10 + 5) / 11 = 4.09
        var r = servicio.calificar(7, 1, new ResenaRequest(5, "Excelente"));
        assertThat(r.calificacion()).isEqualTo(4.09);
        assertThat(r.numCalificaciones()).isEqualTo(11);
        verify(repo).actualizarCalificacion(eq(1), org.mockito.ArgumentMatchers.argThat(p -> p.compareTo(new BigDecimal("4.09")) == 0), eq(11));
    }

    @Test
    void sielClienteCambiaSuCalificacionNoSeSumaOtra() {
        when(repo.puntajeDe(1, 7)).thenReturn(Optional.of(2));
        // (4.00 * 10 - 2 + 5) / 10 = 4.30
        var r = servicio.calificar(7, 1, new ResenaRequest(5, null));
        assertThat(r.calificacion()).isEqualTo(4.30);
        assertThat(r.numCalificaciones()).isEqualTo(10);
    }

    @Test
    void elPuntajeDebeEstarEntreUnoYCinco() {
        assertThatThrownBy(() -> servicio.calificar(7, 1, new ResenaRequest(0, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.calificar(7, 1, new ResenaRequest(6, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        verify(repo, never()).guardar(anyInt(), anyInt(), anyInt(), any());
    }

    @Test
    void elComentarioAdmiteHastaTrescientosCaracteres() {
        assertThatThrownBy(() -> servicio.calificar(7, 1, new ResenaRequest(4, "x".repeat(301))))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        servicio.calificar(7, 1, new ResenaRequest(4, "x".repeat(300)));
    }

    @Test
    void unComentarioEnBlancoSeGuardaComoVacio() {
        servicio.calificar(7, 1, new ResenaRequest(4, "   "));
        verify(repo).guardar(1, 7, 4, null);
    }

    @Test
    void soloPuedeCalificarQuienHizoUnPedidoEnElPuesto() {
        when(repo.haComprado(8, 1)).thenReturn(false);
        assertThatThrownBy(() -> servicio.calificar(8, 1, new ResenaRequest(5, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        verify(repo, never()).guardar(anyInt(), anyInt(), anyInt(), anyString());
    }

    @Test
    void unPuestoInexistenteDaError404() {
        when(repo.calificacion(99)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> servicio.calificar(7, 99, new ResenaRequest(5, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void elPromedioNuncaSaleDelRangoDeUnoACinco() {
        assertThat(ResenaService.nuevoPromedio(5.0, 100, null, 5)).isEqualByComparingTo("5.00");
        assertThat(ResenaService.nuevoPromedio(1.0, 1, 1, 1)).isEqualByComparingTo("1.00");
    }
}
