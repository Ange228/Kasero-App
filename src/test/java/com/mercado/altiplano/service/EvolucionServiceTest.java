package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mercado.altiplano.repository.HistorialRepository.FilaSemana;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

/** R-06 Precios referenciales y variación semanal. */
class EvolucionServiceTest {

    private static FilaSemana f(String semana, String producto, String promedio) {
        return new FilaSemana(semana, producto, "", "kg", new BigDecimal(promedio));
    }

    @Test
    void alineaLosPromediosPorSemanaDeLaMasAntiguaALaActual() {
        var r = EvolucionService.armar(List.of(
                f("2026-11-16", "Papa", "2.20"), f("2026-11-02", "Papa", "2.60"), f("2026-11-09", "Papa", "2.40")), 4);
        assertThat(r.semanas()).containsExactly("2026-11-02", "2026-11-09", "2026-11-16");
        assertThat(r.series().get(0).valores()).extracting(BigDecimal::toPlainString).containsExactly("2.60", "2.40", "2.20");
    }

    @Test
    void calculaLaVariacionContraLaSemanaAnterior() {
        var r = EvolucionService.armar(List.of(f("2026-11-09", "Papa", "2.50"), f("2026-11-16", "Papa", "2.00")), 4);
        assertThat(r.series().get(0).variacion()).isEqualTo(-20.0);
    }

    @Test
    void unaSubidaDePrecioDaVariacionPositiva() {
        var r = EvolucionService.armar(List.of(f("2026-11-09", "Tomate", "4.00"), f("2026-11-16", "Tomate", "4.20")), 4);
        assertThat(r.series().get(0).variacion()).isEqualTo(5.0);
    }

    @Test
    void siFaltaUnaSemanaElValorEsNuloYNoHayVariacion() {
        var r = EvolucionService.armar(List.of(
                f("2026-11-09", "Papa", "2.50"), f("2026-11-16", "Papa", "2.00"), f("2026-11-16", "Cebolla", "3.00")), 4);
        var cebolla = r.series().stream().filter(s -> s.producto().equals("Cebolla")).findFirst().orElseThrow();
        assertThat(cebolla.valores()).containsExactly(null, new BigDecimal("3.00"));
        assertThat(cebolla.variacion()).isNull();
    }

    @Test
    void laVariacionGeneralSoloUsaProductosConAmbasSemanas() {
        // Papa 2.00 -> 2.20 (+0.20) y Cebolla 3.00 -> 3.00; Tomate solo tiene la semana actual y no cuenta
        var r = EvolucionService.armar(List.of(
                f("2026-11-09", "Papa", "2.00"), f("2026-11-16", "Papa", "2.20"),
                f("2026-11-09", "Cebolla", "3.00"), f("2026-11-16", "Cebolla", "3.00"),
                f("2026-11-16", "Tomate", "9.99")), 4);
        // (5.20 - 5.00) / 5.00 = +4.0 %
        assertThat(r.variacionGeneral()).isEqualTo(4.0);
    }

    @Test
    void conservaSoloLasUltimasSemanasPedidas() {
        var r = EvolucionService.armar(List.of(
                f("2026-10-19", "Papa", "1"), f("2026-10-26", "Papa", "2"), f("2026-11-02", "Papa", "3"),
                f("2026-11-09", "Papa", "4"), f("2026-11-16", "Papa", "5")), 4);
        assertThat(r.semanas()).hasSize(4).first().isEqualTo("2026-10-26");
        assertThat(r.series().get(0).valores()).hasSize(4);
    }

    @Test
    void sinDatosDevuelveListasVacias() {
        var r = EvolucionService.armar(List.of(), 4);
        assertThat(r.semanas()).isEmpty();
        assertThat(r.series()).isEmpty();
        assertThat(r.variacionGeneral()).isNull();
    }

    @Test
    void noDivideEntreCero() {
        assertThat(EvolucionService.porcentaje(new BigDecimal("2"), BigDecimal.ZERO)).isNull();
        assertThat(EvolucionService.porcentaje(null, new BigDecimal("2"))).isNull();
    }
}
