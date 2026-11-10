package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.CatalogoRepository;
import com.mercado.altiplano.repository.CatalogoRepository.ComBase;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CatalogoService {
    private final CatalogoRepository repo;

    public CatalogoService(CatalogoRepository repo) {
        this.repo = repo;
    }

    public List<Sector> sectores() {
        return repo.sectores();
    }

    public List<Producto> productos() {
        return repo.productos();
    }

    public List<Promocion> promociones() {
        return repo.promociones();
    }

    public List<Noticia> noticias() {
        return repo.noticias();
    }

    public ResumenPrecios resumenPrecios() {
        return new ResumenPrecios(repo.promediosPorProducto(), repo.masCotizados(), repo.masComprados());
    }

    /** Todos los comerciantes con su precio medio y productos. */
    public List<Comerciante> todos() {
        var precios = repo.preciosPorComerciante();
        return repo.comerciantes().stream().map(c -> armar(c, precios.getOrDefault(c.id(), List.of()))).toList();
    }

    /** Busca ignorando mayusculas y tildes; todas las palabras deben coincidir. */
    public List<Comerciante> buscar(String texto, String sector, String orden) {
        List<String> palabras = texto == null || texto.isBlank()
                ? List.of() : Arrays.asList(normalizar(texto).split("\\s+"));
        List<Comerciante> lista = new ArrayList<>(todos().stream()
                .filter(c -> sector == null || sector.isBlank() || c.sector().equalsIgnoreCase(sector))
                .filter(c -> {
                    String pajar = normalizar(c.nombre() + " " + c.seccion() + " " + c.sector() + " "
                            + String.join(" ", c.productos()) + " puesto " + c.nroPuesto());
                    return palabras.stream().allMatch(pajar::contains);
                }).toList());
        Comparator<Comerciante> porPrecio = Comparator.comparing(Comerciante::precioMedio,
                Comparator.nullsLast(Comparator.naturalOrder()));
        switch (orden == null ? "" : orden) {
            case "precio_desc" -> lista.sort(Comparator.comparing(Comerciante::precioMedio,
                    Comparator.nullsLast(Comparator.<BigDecimal>reverseOrder())));
            case "calificacion" -> lista.sort(Comparator.comparingDouble(Comerciante::calificacion).reversed());
            case "cotizado" -> lista.sort(Comparator.comparingInt(Comerciante::cotizaciones).reversed());
            default -> lista.sort(porPrecio);
        }
        return lista;
    }

    public ComercianteDetalle detalle(int id) {
        var precios = repo.preciosPorComerciante();
        return repo.comerciantes().stream().filter(c -> c.id() == id).findFirst()
                .map(c -> new ComercianteDetalle(armar(c, precios.getOrDefault(id, List.of())),
                        precios.getOrDefault(id, List.of()),
                        List.of("Envío", "Recoger en puesto", "Tercero autorizado")))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe"));
    }

    private Comerciante armar(ComBase c, List<PrecioItem> precios) {
        BigDecimal medio = precios.isEmpty() ? null : precios.stream().map(PrecioItem::precio)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(precios.size()), 2, RoundingMode.HALF_UP);
        List<String> pagos = Arrays.stream(c.pagos().split("\\s*(,| y )\\s*")).filter(s -> !s.isBlank()).toList();
        String[] partes = c.nombre().split("\\s+");
        String ini = partes.length > 1 ? "" + partes[0].charAt(0) + partes[1].charAt(0)
                : c.nombre().substring(0, Math.min(2, c.nombre().length()));
        return new Comerciante(c.id(), c.nombre(), ini.toUpperCase(), c.nro(), c.pasillo(), c.seccion(),
                c.sector(), pagos, c.caseros(), c.cal(), c.ncal(), c.cot(), medio,
                precios.stream().map(PrecioItem::nombre).toList(), c.horario());
    }

    static String normalizar(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase().trim();
    }
}
