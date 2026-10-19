package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.dto.CatalogoDtos.Comerciante;
import com.mercado.altiplano.dto.CatalogoDtos.PrecioItem;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.CatalogoRepository;
import com.mercado.altiplano.repository.CatalogoRepository.ComBase;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** R-04 Buscar, filtrar y ordenar · R-05 Perfil del comerciante. */
class CatalogoServiceTest {
    private CatalogoService servicio;

    private static ComBase com(int id, String nombre, String seccion, String sector, double cal, int cot) {
        return new ComBase(id, nombre, id, id, seccion, sector, "Yape y Plin", "Sí", cal, 10, cot);
    }

    private static PrecioItem precio(int pid, String nombre, String p) {
        return new PrecioItem(pid, nombre, "", "kg", new BigDecimal(p), "2026-11-18");
    }

    @BeforeEach
    void preparar() {
        var repo = mock(CatalogoRepository.class);
        when(repo.comerciantes()).thenReturn(List.of(
                com(1, "Nilda", "Verduras", "Verduras", 4.8, 300),
                com(2, "Ángela", "Frutas", "Frutas", 4.6, 150),
                com(3, "Micaela", "Carnes", "Carnes", 4.7, 140)));
        when(repo.preciosPorComerciante()).thenReturn(Map.of(
                1, List.of(precio(1, "Papa", "2.00"), precio(2, "Cebolla", "3.00")),
                2, List.of(precio(5, "Fresa", "8.00"), precio(6, "Plátano", "2.00"))));
        servicio = new CatalogoService(repo);
    }

    @Test
    void buscaIgnorandoMayusculasYTildes() {
        assertThat(servicio.buscar("ANGELA", null, null)).extracting(Comerciante::nombre).containsExactly("Ángela");
        assertThat(servicio.buscar("angela", null, null)).hasSize(1);
    }

    @Test
    void buscaPorProductoQueVendeElPuesto() {
        assertThat(servicio.buscar("papa", null, null)).extracting(Comerciante::nombre).containsExactly("Nilda");
    }

    @Test
    void debenCoincidirTodasLasPalabrasEscritas() {
        assertThat(servicio.buscar("nilda papa", null, null)).hasSize(1);
        assertThat(servicio.buscar("nilda fresa", null, null)).isEmpty();
    }

    @Test
    void sinResultadosDevuelveListaVacia() {
        assertThat(servicio.buscar("zzz", null, null)).isEmpty();
    }

    @Test
    void filtraPorSector() {
        assertThat(servicio.buscar(null, "Carnes", null)).extracting(Comerciante::nombre).containsExactly("Micaela");
    }

    @Test
    void ordenaPorMenorPrecioConLosSinPreciosAlFinal() {
        // precio medio: Nilda 2.50, Ángela 5.00, Micaela sin precios
        assertThat(servicio.buscar(null, null, "precio_asc")).extracting(Comerciante::nombre)
                .containsExactly("Nilda", "Ángela", "Micaela");
    }

    @Test
    void ordenaPorMayorPrecio() {
        assertThat(servicio.buscar(null, null, "precio_desc").get(0).nombre()).isEqualTo("Ángela");
    }

    @Test
    void ordenaPorMejorCalificacion() {
        assertThat(servicio.buscar(null, null, "calificacion")).extracting(Comerciante::nombre)
                .containsExactly("Nilda", "Micaela", "Ángela");
    }

    @Test
    void ordenaPorMasCotizado() {
        assertThat(servicio.buscar(null, null, "cotizado").get(0).nombre()).isEqualTo("Nilda");
    }

    @Test
    void elPerfilMuestraPreciosPuestoYModalidades() {
        var d = servicio.detalle(1);
        assertThat(d.comerciante().nroPuesto()).isEqualTo(1);
        assertThat(d.precios()).hasSize(2);
        assertThat(d.precios().get(0).actualizado()).isNotBlank();
        assertThat(d.modalidades()).hasSize(3);
        assertThat(d.comerciante().metodosPago()).containsExactly("Yape", "Plin");
    }

    @Test
    void unPuestoInexistenteDaError404() {
        assertThatThrownBy(() -> servicio.detalle(99)).isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus().value()).isEqualTo(404));
    }
}
