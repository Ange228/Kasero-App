package com.mercado.altiplano.dto;

import com.mercado.altiplano.dto.CatalogoDtos.ItemCotizacion;
import java.math.BigDecimal;
import java.util.List;

/** DTOs del panel del comerciante. */
public final class PuestoDtos {
    private PuestoDtos() {}

    public record PrecioRequest(BigDecimal precio) {}

    public record EstadoRequest(String estado) {}

    /** Pedido recibido por el puesto. El cliente se muestra abreviado. */
    public record PedidoPuesto(int id, String cliente, String modalidad, String estado, BigDecimal total,
                               String fecha, String direccion, String terceroNombre, String codigoEntrega,
                               List<ItemCotizacion> items) {}
}
