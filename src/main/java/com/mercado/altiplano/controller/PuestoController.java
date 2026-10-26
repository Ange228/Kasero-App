package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.CatalogoDtos.ComercianteDetalle;
import com.mercado.altiplano.dto.PuestoDtos.EstadoRequest;
import com.mercado.altiplano.dto.PuestoDtos.PedidoPuesto;
import com.mercado.altiplano.dto.PuestoDtos.PrecioRequest;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.CatalogoService;
import com.mercado.altiplano.service.PuestoService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

/** Panel del comerciante: requiere una cuenta vinculada a un puesto. */
@RestController
@RequestMapping("/api/mi-puesto")
public class PuestoController {
    private final PuestoService puestos;
    private final CatalogoService catalogo;
    private final SesionService sesiones;

    public PuestoController(PuestoService puestos, CatalogoService catalogo, SesionService sesiones) {
        this.puestos = puestos;
        this.catalogo = catalogo;
        this.sesiones = sesiones;
    }

    @GetMapping
    public ComercianteDetalle miPuesto(@RequestHeader(value = "Authorization", required = false) String h) {
        return catalogo.detalle(puestos.puestoDe(sesiones.requerir(h)));
    }

    @PutMapping("/precios/{productoId}")
    public Map<String, Object> fijarPrecio(@PathVariable int productoId, @RequestBody PrecioRequest r,
                                           @RequestHeader(value = "Authorization", required = false) String h) {
        puestos.fijarPrecio(sesiones.requerir(h), productoId, r.precio());
        return Map.of("exitoso", true);
    }

    @DeleteMapping("/precios/{productoId}")
    public Map<String, Object> quitarPrecio(@PathVariable int productoId,
                                            @RequestHeader(value = "Authorization", required = false) String h) {
        puestos.quitarPrecio(sesiones.requerir(h), productoId);
        return Map.of("exitoso", true);
    }

    @GetMapping("/pedidos")
    public List<PedidoPuesto> pedidos(@RequestHeader(value = "Authorization", required = false) String h) {
        return puestos.pedidos(sesiones.requerir(h));
    }

    @PutMapping("/pedidos/{id}/estado")
    public Map<String, Object> estado(@PathVariable int id, @RequestBody EstadoRequest r,
                                      @RequestHeader(value = "Authorization", required = false) String h) {
        puestos.cambiarEstado(sesiones.requerir(h), id, r.estado());
        return Map.of("exitoso", true);
    }
}
