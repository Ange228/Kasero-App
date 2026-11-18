package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.service.CatalogoService;
import com.mercado.altiplano.service.ComparadorService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CatalogoController {
    private final CatalogoService catalogo;
    private final ComparadorService comparador;

    public CatalogoController(CatalogoService catalogo, ComparadorService comparador) {
        this.catalogo = catalogo;
        this.comparador = comparador;
    }

    @GetMapping("/sectores")
    public List<Sector> sectores() { return catalogo.sectores(); }

    @GetMapping("/productos")
    public List<Producto> productos() { return catalogo.productos(); }

    @GetMapping("/promociones")
    public List<Promocion> promociones() { return catalogo.promociones(); }

    @GetMapping("/noticias")
    public List<Noticia> noticias() { return catalogo.noticias(); }

    @GetMapping("/precios/resumen")
    public ResumenPrecios resumen() { return catalogo.resumenPrecios(); }

    @GetMapping("/comerciantes")
    public List<Comerciante> buscar(@RequestParam(required = false) String q,
                                    @RequestParam(required = false) String sector,
                                    @RequestParam(required = false) String orden) {
        return catalogo.buscar(q, sector, orden);
    }

    @GetMapping("/comerciantes/{id}")
    public ComercianteDetalle detalle(@PathVariable int id) { return catalogo.detalle(id); }

    @PostMapping("/comparaciones")
    public ComparacionResponse comparar(@RequestBody ComparacionRequest r) {
        return comparador.comparar(r.items());
    }
}
