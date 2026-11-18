package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.PuestoRepository;
import com.mercado.altiplano.repository.PuestoRepository.PedidoFila;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Panel del comerciante: precios propios y avance de pedidos. */
class PuestoServiceTest {
    private static final int CASERA = 20;     // cuenta vinculada al puesto 1
    private static final int CLIENTE = 7;     // cuenta sin puesto

    private PuestoRepository repo;
    private PuestoService servicio;

    private static int estado(Throwable t) {
        return ((ApiException) t).getStatus().value();
    }

    @BeforeEach
    void preparar() {
        repo = mock(PuestoRepository.class);
        when(repo.comercianteDeUsuario(CASERA)).thenReturn(Optional.of(1));
        when(repo.comercianteDeUsuario(CLIENTE)).thenReturn(Optional.empty());
        when(repo.productoExiste(3)).thenReturn(true);
        servicio = new PuestoService(repo);
    }

    @Test
    void soloLasCuentasConPuestoUsanElPanel() {
        assertThatThrownBy(() -> servicio.fijarPrecio(CLIENTE, 3, new BigDecimal("2")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        assertThatThrownBy(() -> servicio.pedidos(CLIENTE)).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        verify(repo, never()).guardarPrecio(anyInt(), anyInt(), any());
    }

    @Test
    void guardaElPrecioDelProductoEnSuPropioPuesto() {
        servicio.fijarPrecio(CASERA, 3, new BigDecimal("2.505"));
        verify(repo).guardarPrecio(1, 3, new BigDecimal("2.51"));
    }

    @Test
    void elPrecioDebeSerMayorQueCeroYRazonable() {
        for (String malo : new String[]{"0", "-1", "10000"}) {
            assertThatThrownBy(() -> servicio.fijarPrecio(CASERA, 3, new BigDecimal(malo)))
                    .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        }
        assertThatThrownBy(() -> servicio.fijarPrecio(CASERA, 3, null)).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    void unProductoInexistenteDaError404() {
        assertThatThrownBy(() -> servicio.fijarPrecio(CASERA, 99, new BigDecimal("2")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void alQuitarUnProductoQueNoTieneDaError404() {
        when(repo.quitarPrecio(1, 3)).thenReturn(false);
        assertThatThrownBy(() -> servicio.quitarPrecio(CASERA, 3)).satisfies(e -> assertThat(estado(e)).isEqualTo(404));
        when(repo.quitarPrecio(1, 3)).thenReturn(true);
        servicio.quitarPrecio(CASERA, 3);
    }

    @Test
    void elPedidoAvanzaDeEnPreparacionAListoYDeListoAEntregado() {
        when(repo.pedido(10)).thenReturn(Optional.of(new PedidoFila(10, 1, "EN_PREPARACION")));
        servicio.cambiarEstado(CASERA, 10, "LISTO");
        verify(repo).actualizarEstado(10, "LISTO");

        when(repo.pedido(11)).thenReturn(Optional.of(new PedidoFila(11, 1, "LISTO")));
        servicio.cambiarEstado(CASERA, 11, "ENTREGADO");
        verify(repo).actualizarEstado(11, "ENTREGADO");
    }

    @Test
    void noSePuedeSaltarNiRetrocederUnEstado() {
        when(repo.pedido(10)).thenReturn(Optional.of(new PedidoFila(10, 1, "EN_PREPARACION")));
        assertThatThrownBy(() -> servicio.cambiarEstado(CASERA, 10, "ENTREGADO"))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        when(repo.pedido(11)).thenReturn(Optional.of(new PedidoFila(11, 1, "LISTO")));
        assertThatThrownBy(() -> servicio.cambiarEstado(CASERA, 11, "EN_PREPARACION"))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        verify(repo, never()).actualizarEstado(anyInt(), anyString());
    }

    @Test
    void unPedidoEntregadoYaNoCambia() {
        when(repo.pedido(12)).thenReturn(Optional.of(new PedidoFila(12, 1, "ENTREGADO")));
        assertThatThrownBy(() -> servicio.cambiarEstado(CASERA, 12, "LISTO"))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }

    @Test
    void noSePuedeTocarUnPedidoDeOtroPuesto() {
        when(repo.pedido(13)).thenReturn(Optional.of(new PedidoFila(13, 2, "EN_PREPARACION")));
        assertThatThrownBy(() -> servicio.cambiarEstado(CASERA, 13, "LISTO"))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(404));
        verify(repo, never()).actualizarEstado(anyInt(), anyString());
    }
}
