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
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** R-01 Cotizar · RNF-07 integridad · RNF-08 sin duplicados. */
class CotizacionServiceTest {
    private TransaccionRepository repo;
    private CotizacionService servicio;

    private static ItemCanasta item(int pid, String cant) {
        return new ItemCanasta(pid, new BigDecimal(cant));
    }

    private static CotizacionResponse respuesta(int id, String total) {
        return new CotizacionResponse(id, 1, "Nilda", 5, 4, "PENDIENTE", new BigDecimal(total),
                "2026-11-18T10:00:00", List.of(), false);
    }

    @BeforeEach
    void preparar() {
        repo = mock(TransaccionRepository.class);
        when(repo.cotizacionPorClave(anyString())).thenReturn(Optional.empty());
        when(repo.precio(1, 1)).thenReturn(Optional.of(new BigDecimal("2.00")));   // papa
        when(repo.precio(1, 2)).thenReturn(Optional.of(new BigDecimal("2.50")));   // cebolla
        when(repo.precio(1, 99)).thenReturn(Optional.empty());                      // no lo vende
        when(repo.nombreProducto(99)).thenReturn("Caviar");
        when(repo.insertarCotizacion(anyInt(), anyInt(), anyString(), any())).thenReturn(10);
        when(repo.cotizaciones(anyInt(), eq(10))).thenReturn(List.of(respuesta(10, "6.50")));
        servicio = new CotizacionService(repo);
    }

    @Test
    void calculaElTotalConLosPreciosVigentes() {
        // 2 kg de papa (4.00) + 1 kg de cebolla (2.50)
        servicio.crear(1, new CotizacionRequest(1, "clave-1", List.of(item(1, "2"), item(2, "1"))));
        verify(repo).insertarCotizacion(eq(1), eq(1), eq("clave-1"), org.mockito.ArgumentMatchers.argThat(t -> t.compareTo(new BigDecimal("6.50")) == 0));
    }

    @Test
    void guardaCadaProductoConPrecioUnitarioYSubtotal() {
        servicio.crear(1, new CotizacionRequest(1, "clave-1", List.of(item(1, "2"))));
        verify(repo).insertarItem(eq(10), eq(1), eq(new BigDecimal("2")), eq(new BigDecimal("2.00")),
                org.mockito.ArgumentMatchers.argThat(s -> s.compareTo(new BigDecimal("4.00")) == 0));
    }

    @Test
    void devuelveLaCotizacionGuardadaEnEstadoPendiente() {
        var r = servicio.crear(1, new CotizacionRequest(1, "clave-1", List.of(item(1, "2"), item(2, "1"))));
        assertThat(r.estado()).isEqualTo("PENDIENTE");
        assertThat(r.total()).isEqualByComparingTo("6.50");
    }

    @Test
    void siElPuestoNoVendeUnProductoSeRechazaConSuNombre() {
        assertThatThrownBy(() -> servicio.crear(1, new CotizacionRequest(1, "clave-2", List.of(item(1, "1"), item(99, "1")))))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Caviar")
                .satisfies(e -> assertThat(((ApiException) e).getStatus().value()).isEqualTo(422));
        verify(repo, never()).insertarCotizacion(anyInt(), anyInt(), anyString(), any());
    }

    @Test
    void unaSolicitudRepetidaConLaMismaClaveNoCreaOtraCotizacion() {
        when(repo.cotizacionPorClave("clave-repetida")).thenReturn(Optional.of(10));
        var r = servicio.crear(1, new CotizacionRequest(1, "clave-repetida", List.of(item(1, "2"))));
        assertThat(r.id()).isEqualTo(10);
        verify(repo, never()).insertarCotizacion(anyInt(), anyInt(), anyString(), any());
        verify(repo, never()).sumarCotizacion(anyInt());
    }

    @Test
    void alCrearSeSumaUnaCotizacionAlPuesto() {
        servicio.crear(1, new CotizacionRequest(1, "clave-3", List.of(item(1, "1"))));
        verify(repo).sumarCotizacion(1);
    }

    @Test
    void exigeAlMenosUnProducto() {
        assertThatThrownBy(() -> servicio.crear(1, new CotizacionRequest(1, "k", List.of()))).isInstanceOf(ApiException.class);
    }

    @Test
    void exigeUnaClaveDeSolicitud() {
        assertThatThrownBy(() -> servicio.crear(1, new CotizacionRequest(1, " ", List.of(item(1, "1")))))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void laCantidadDebeSerMayorQueCero() {
        assertThatThrownBy(() -> servicio.crear(1, new CotizacionRequest(1, "k", List.of(item(1, "0")))))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> servicio.crear(1, new CotizacionRequest(1, "k", List.of(item(1, "-2")))))
                .isInstanceOf(ApiException.class);
    }
}
