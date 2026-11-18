package com.mercado.altiplano.dto;

import java.math.BigDecimal;
import java.util.List;

/** Evolución semanal de precios (promedio entre puestos). */
public final class EvolucionDtos {
    private EvolucionDtos() {}

    /** Un valor por semana; null cuando no hay datos esa semana. variacion = % contra la semana anterior. */
    public record SeriePrecio(String producto, String icono, String unidad, List<BigDecimal> valores, Double variacion) {}

    /** semanas: fecha (lunes) de cada semana, de la más antigua a la actual. */
    public record EvolucionPrecios(List<String> semanas, List<SeriePrecio> series, Double variacionGeneral) {}
}
