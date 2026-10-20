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

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.TransaccionRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/** R-03 Pedido y modalidad de entrega (envío, recojo, tercero autorizado). */
class PedidoServiceTest {
    private TransaccionRepository repo;
    private PedidoService servicio;

    private static CotizacionResponse cotizacion() {
        return new CotizacionResponse(5, 1, "Nilda", 5, 4, "PENDIENTE", new BigDecimal("14.50"),
                "2026-11-18T10:00:00", List.of(), false);
    }

    private static PedidoResponse pedido(String modalidad) {
        return new PedidoResponse(1, 5, 1, "Nilda", 5, new BigDecimal("14.50"), modalidad, "EN_PREPARACION",
                null, null, null, "2026-11-18T10:05:00");
    }

    @BeforeEach
    void preparar() {
        repo = mock(TransaccionRepository.class);
        when(repo.cotizaciones(1, 5)).thenReturn(List.of(cotizacion()));
        when(repo.pedidoExiste(5)).thenReturn(false);
        when(repo.insertarPedido(anyInt(), anyString(), any(), any(), any())).thenReturn(1);
        when(repo.pedidos(eq(1), eq(1))).thenReturn(List.of(pedido("RECOJO")));
        servicio = new PedidoService(repo);
    }

    private static int estado(Throwable t) {
        return ((ApiException) t).getStatus().value();
    }

    @Test
    void recojoEnPuestoNoNecesitaDatosAdicionales() {
        var r = servicio.crear(1, new PedidoRequest(5, "RECOJO", null, null));
        assertThat(r.id()).isEqualTo(1);
        verify(repo).insertarPedido(5, "RECOJO", null, null, null);
    }

    @Test
    void elEnvioExigeDireccion() {
        assertThatThrownBy(() -> servicio.crear(1, new PedidoRequest(5, "ENVIO", " ", null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        servicio.crear(1, new PedidoRequest(5, "ENVIO", "Av. Progreso 123", null));
        verify(repo).insertarPedido(5, "ENVIO", "Av. Progreso 123", null, null);
    }

    @Test
    void conTerceroAutorizadoSeRegistraLaPersonaYSeGeneraUnCodigoDeSeisDigitos() {
        servicio.crear(1, new PedidoRequest(5, "TERCERO", null, "Marco Quispe"));
        var codigo = ArgumentCaptor.forClass(String.class);
        verify(repo).insertarPedido(eq(5), eq("TERCERO"), eq(null), eq("Marco Quispe"), codigo.capture());
        assertThat(codigo.getValue()).matches("\\d{6}");
    }

    @Test
    void elTerceroAutorizadoExigeNombre() {
        assertThatThrownBy(() -> servicio.crear(1, new PedidoRequest(5, "TERCERO", null, "")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        verify(repo, never()).insertarPedido(anyInt(), anyString(), any(), any(), any());
    }

    @Test
    void debeElegirseUnaModalidadValida() {
        assertThatThrownBy(() -> servicio.crear(1, new PedidoRequest(5, "DRON", null, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.crear(1, new PedidoRequest(5, null, null, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    void noSePuedePedirUnaCotizacionAjenaOInexistente() {
        when(repo.cotizaciones(2, 5)).thenReturn(List.of());
        assertThatThrownBy(() -> servicio.crear(2, new PedidoRequest(5, "RECOJO", null, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void unaCotizacionSoloGeneraUnPedido() {
        when(repo.pedidoExiste(5)).thenReturn(true);
        assertThatThrownBy(() -> servicio.crear(1, new PedidoRequest(5, "RECOJO", null, null)))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }
}
