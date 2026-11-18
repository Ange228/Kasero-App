package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.CatalogoRepository;
import com.mercado.altiplano.repository.CatalogoRepository.ComBase;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** R-02 Comparar canasta: solo se ordenan puestos con la canasta completa. */
class ComparadorServiceTest {
    private ComparadorService comparador;

    private static ComBase com(int id, String nombre) {
        return new ComBase(id, nombre, id, 4, "Verduras", "Verduras", "Yape", "Sí", 4.5, 10, 0);
    }

    private static PrecioItem p(int pid, String nombre, String precio) {
        return new PrecioItem(pid, nombre, "", "kg", new BigDecimal(precio), "2026-11-18");
    }

    private static ItemCanasta item(int pid, String cant) {
        return new ItemCanasta(pid, new BigDecimal(cant));
    }

    @BeforeEach
    void preparar() {
        var repo = mock(CatalogoRepository.class);
        when(repo.comerciantes()).thenReturn(List.of(com(1, "Nilda"), com(2, "Angela"), com(3, "Lourdes"), com(4, "Micaela")));
        when(repo.productos()).thenReturn(List.of(
                new Producto(1, "Papa", "kg", "", "Verduras"), new Producto(2, "Cebolla", "kg", "", "Verduras"),
                new Producto(3, "Tomate", "kg", "", "Verduras")));
        when(repo.preciosPorComerciante()).thenReturn(Map.of(
                1, List.of(p(1, "Papa", "2.00"), p(2, "Cebolla", "2.50"), p(3, "Tomate", "4.00")),
                2, List.of(p(1, "Papa", "2.20"), p(2, "Cebolla", "2.60"), p(3, "Tomate", "4.20")),
                3, List.of(p(1, "Papa", "1.90"), p(2, "Cebolla", "2.40")),            // no vende tomate
                4, List.of(p(9, "Carne", "28.00"))));                                  // nada de la canasta
        comparador = new ComparadorService(new CatalogoService(repo), repo);
    }

    @Test
    void ordenaDeMenorAMayorTotal() {
        var r = comparador.comparar(List.of(item(1, "2"), item(2, "1"), item(3, "1")));
        // Nilda: 4.00 + 2.50 + 4.00 = 10.50 · Angela: 4.40 + 2.60 + 4.20 = 11.20
        assertThat(r.completos()).extracting(f -> f.comerciante().nombre()).containsExactly("Nilda", "Angela");
        assertThat(r.completos().get(0).total()).isEqualByComparingTo("10.50");
        assertThat(r.completos().get(1).total()).isEqualByComparingTo("11.20");
    }

    @Test
    void marcaAlMasEconomicoYMuestraLaDiferenciaContraEl() {
        var r = comparador.comparar(List.of(item(1, "2"), item(2, "1"), item(3, "1")));
        assertThat(r.completos().get(0).masEconomico()).isTrue();
        assertThat(r.completos().get(0).diferencia()).isEqualByComparingTo("0");
        assertThat(r.completos().get(1).masEconomico()).isFalse();
        assertThat(r.completos().get(1).diferencia()).isEqualByComparingTo("0.70");
    }

    @Test
    void losPuestosSinLaCanastaCompletaAparecenAparteConLoQueLesFalta() {
        var r = comparador.comparar(List.of(item(1, "1"), item(3, "1")));
        assertThat(r.completos()).extracting(f -> f.comerciante().nombre()).doesNotContain("Lourdes");
        assertThat(r.incompletos()).hasSize(1);
        assertThat(r.incompletos().get(0).comerciante().nombre()).isEqualTo("Lourdes");
        assertThat(r.incompletos().get(0).faltantes()).containsExactly("Tomate");
    }

    @Test
    void ignoraLosPuestosQueNoVendenNingunProductoDeLaCanasta() {
        var r = comparador.comparar(List.of(item(1, "1")));
        assertThat(r.completos()).extracting(f -> f.comerciante().nombre()).doesNotContain("Micaela");
        assertThat(r.incompletos()).extracting(f -> f.comerciante().nombre()).doesNotContain("Micaela");
    }

    @Test
    void laCantidadMultiplicaElPrecio() {
        var r = comparador.comparar(List.of(item(1, "5")));
        assertThat(r.completos().get(0).comerciante().nombre()).isEqualTo("Lourdes");
        assertThat(r.completos().get(0).total()).isEqualByComparingTo("9.50");
    }

    @Test
    void sinNingunPuestoCompletoLaListaVieneVacia() {
        var r = comparador.comparar(List.of(item(1, "1"), item(9, "1")));
        assertThat(r.completos()).isEmpty();
    }

    @Test
    void unaCanastaVaciaSeRechaza() {
        assertThatThrownBy(() -> comparador.comparar(List.of())).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> comparador.comparar(null)).isInstanceOf(ApiException.class);
    }
}
