package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.CotizacionService;
import com.mercado.altiplano.service.PedidoService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/** Cotizaciones y pedidos: requieren sesion iniciada. */
@RestController
@RequestMapping("/api")
public class PedidosController {
    private final CotizacionService cotizaciones;
    private final PedidoService pedidos;
    private final SesionService sesiones;

    public PedidosController(CotizacionService cotizaciones, PedidoService pedidos, SesionService sesiones) {
        this.cotizaciones = cotizaciones;
        this.pedidos = pedidos;
        this.sesiones = sesiones;
    }

    @PostMapping("/cotizaciones")
    public CotizacionResponse crearCotizacion(@RequestHeader(value = "Authorization", required = false) String h,
                                              @RequestBody CotizacionRequest r) {
        return cotizaciones.crear(sesiones.requerir(h), r);
    }

    @GetMapping("/cotizaciones")
    public List<CotizacionResponse> historialCotizaciones(
            @RequestHeader(value = "Authorization", required = false) String h) {
        return cotizaciones.historial(sesiones.requerir(h));
    }

    @PostMapping("/pedidos")
    public PedidoResponse crearPedido(@RequestHeader(value = "Authorization", required = false) String h,
                                      @RequestBody PedidoRequest r) {
        return pedidos.crear(sesiones.requerir(h), r);
    }

    @GetMapping("/pedidos")
    public List<PedidoResponse> historialPedidos(@RequestHeader(value = "Authorization", required = false) String h) {
        return pedidos.historial(sesiones.requerir(h));
    }
}
