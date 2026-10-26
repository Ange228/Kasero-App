package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.CatalogoDtos.Comerciante;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.FavoritoService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favoritos")
public class FavoritoController {
    private final FavoritoService favoritos;
    private final SesionService sesiones;

    public FavoritoController(FavoritoService favoritos, SesionService sesiones) {
        this.favoritos = favoritos;
        this.sesiones = sesiones;
    }

    @GetMapping
    public List<Comerciante> listar(@RequestHeader(value = "Authorization", required = false) String h) {
        return favoritos.listar(sesiones.requerir(h));
    }

    @PutMapping("/{comercianteId}")
    public Map<String, Object> agregar(@PathVariable int comercianteId,
                                       @RequestHeader(value = "Authorization", required = false) String h) {
        favoritos.agregar(sesiones.requerir(h), comercianteId);
        return Map.of("exitoso", true);
    }

    @DeleteMapping("/{comercianteId}")
    public Map<String, Object> quitar(@PathVariable int comercianteId,
                                      @RequestHeader(value = "Authorization", required = false) String h) {
        favoritos.quitar(sesiones.requerir(h), comercianteId);
        return Map.of("exitoso", true);
    }
}
