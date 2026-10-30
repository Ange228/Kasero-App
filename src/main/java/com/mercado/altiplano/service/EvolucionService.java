package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.EvolucionDtos.EvolucionPrecios;
import com.mercado.altiplano.dto.EvolucionDtos.SeriePrecio;
import com.mercado.altiplano.repository.HistorialRepository;
import com.mercado.altiplano.repository.HistorialRepository.FilaSemana;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import org.springframework.stereotype.Service;

/** R-06: evolución semanal de precios y variación contra la semana anterior. */
@Service
public class EvolucionService {
    static final int SEMANAS = 4;
    private final HistorialRepository repo;

    public EvolucionService(HistorialRepository repo) {
        this.repo = repo;
    }

    public EvolucionPrecios evolucion() {
        return armar(repo.promediosSemanales(SEMANAS), SEMANAS);
    }

    /** Alinea los promedios por semana y calcula las variaciones porcentuales. */
    static EvolucionPrecios armar(List<FilaSemana> filas, int maxSemanas) {
        List<String> todas = new ArrayList<>(new TreeSet<>(filas.stream().map(FilaSemana::semana).toList()));
        List<String> semanas = todas.size() > maxSemanas ? todas.subList(todas.size() - maxSemanas, todas.size()) : todas;

        Map<String, List<FilaSemana>> porProducto = new LinkedHashMap<>();
        filas.stream().filter(f -> semanas.contains(f.semana()))
                .forEach(f -> porProducto.computeIfAbsent(f.producto(), k -> new ArrayList<>()).add(f));

        List<SeriePrecio> series = new ArrayList<>();
        BigDecimal sumaActual = BigDecimal.ZERO, sumaAnterior = BigDecimal.ZERO;
        int n = semanas.size();
        for (var e : porProducto.entrySet()) {
            List<BigDecimal> valores = new ArrayList<>();
            for (String s : semanas) {
                valores.add(e.getValue().stream().filter(f -> f.semana().equals(s)).map(FilaSemana::promedio).findFirst().orElse(null));
            }
            BigDecimal actual = n >= 1 ? valores.get(n - 1) : null;
            BigDecimal anterior = n >= 2 ? valores.get(n - 2) : null;
            Double variacion = porcentaje(actual, anterior);
            if (actual != null && anterior != null) { sumaActual = sumaActual.add(actual); sumaAnterior = sumaAnterior.add(anterior); }
            FilaSemana ref = e.getValue().get(0);
            series.add(new SeriePrecio(ref.producto(), ref.icono(), ref.unidad(), valores, variacion));
        }
        return new EvolucionPrecios(semanas, series, porcentaje(sumaActual, sumaAnterior));
    }

    /** (actual - anterior) / anterior * 100 con un decimal; null si falta algún dato. */
    static Double porcentaje(BigDecimal actual, BigDecimal anterior) {
        if (actual == null || anterior == null || anterior.signum() == 0) return null;
        return actual.subtract(anterior).multiply(BigDecimal.valueOf(100))
                .divide(anterior, 1, RoundingMode.HALF_UP).doubleValue();
    }
}
