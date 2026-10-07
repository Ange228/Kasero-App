package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.CatalogoRepository;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Compara el total de una misma canasta entre puestos (solo los que la venden completa). */
@Service
public class ComparadorService {
    private final CatalogoService catalogo;
    private final CatalogoRepository repo;

    public ComparadorService(CatalogoService catalogo, CatalogoRepository repo) {
        this.catalogo = catalogo;
        this.repo = repo;
    }

    public ComparacionResponse comparar(List<ItemCanasta> items) {
        if (items == null || items.isEmpty())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agrega al menos un producto a la canasta");
        Map<Integer, String> nombres = new HashMap<>();
        repo.productos().forEach(p -> nombres.put(p.id(), p.nombre()));
        var precios = repo.preciosPorComerciante();

        List<FilaComparacion> completos = new ArrayList<>();
        List<FilaIncompleta> incompletos = new ArrayList<>();
        List<Object[]> temp = new ArrayList<>();
        for (Comerciante c : catalogo.todos()) {
            Map<Integer, BigDecimal> mapa = new HashMap<>();
            precios.getOrDefault(c.id(), List.of()).forEach(p -> mapa.put(p.productoId(), p.precio()));
            List<String> faltan = new ArrayList<>();
            BigDecimal total = BigDecimal.ZERO;
            int encontrados = 0;
            for (ItemCanasta it : items) {
                BigDecimal pu = mapa.get(it.productoId());
                if (pu == null) faltan.add(nombres.getOrDefault(it.productoId(), "producto " + it.productoId()));
                else { total = total.add(pu.multiply(it.cantidad())); encontrados++; }
            }
            if (faltan.isEmpty()) temp.add(new Object[]{c, total});
            else if (encontrados > 0) incompletos.add(new FilaIncompleta(c, faltan));
        }
        temp.sort(Comparator.comparing(o -> (BigDecimal) o[1]));
        BigDecimal minimo = temp.isEmpty() ? BigDecimal.ZERO : (BigDecimal) temp.get(0)[1];
        for (int i = 0; i < temp.size(); i++) {
            BigDecimal t = (BigDecimal) temp.get(i)[1];
            completos.add(new FilaComparacion((Comerciante) temp.get(i)[0], t, t.subtract(minimo), i == 0));
        }
        return new ComparacionResponse(completos, incompletos);
    }
}
