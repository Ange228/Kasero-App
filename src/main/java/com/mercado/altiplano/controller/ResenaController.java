package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.ResenaDtos.ResenaRequest;
import com.mercado.altiplano.dto.ResenaDtos.ResenaResponse;
import com.mercado.altiplano.dto.ResenaDtos.ResenaResultado;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.ResenaService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comerciantes/{id}/resenas")
public class ResenaController {
    private final ResenaService resenas;
    private final SesionService sesiones;

    public ResenaController(ResenaService resenas, SesionService sesiones) {
        this.resenas = resenas;
        this.sesiones = sesiones;
    }

    @GetMapping
    public List<ResenaResponse> listar(@PathVariable int id) {
        return resenas.listar(id);
    }

    @PostMapping
    public ResenaResultado calificar(@PathVariable int id,
                                     @RequestHeader(value = "Authorization", required = false) String h,
                                     @RequestBody ResenaRequest r) {
        return resenas.calificar(sesiones.requerir(h), id, r);
    }
}
