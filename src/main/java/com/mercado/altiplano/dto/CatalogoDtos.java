package com.mercado.altiplano.dto;

import java.math.BigDecimal;
import java.util.List;

/** DTOs de catalogo, comparacion, cotizaciones y pedidos. */
public final class CatalogoDtos {
    private CatalogoDtos() {}

    public record Sector(int id, String nombre, String icono) {}

    public record Producto(int id, String nombre, String unidad, String icono, String sector) {}

    public record PrecioItem(int productoId, String nombre, String icono, String unidad,
                             BigDecimal precio, String actualizado) {}

    public record Comerciante(int id, String nombre, String iniciales, int nroPuesto, int pasillo,
                              String seccion, String sector, List<String> metodosPago,
                              String tieneCaseros, double calificacion, int numCalificaciones,
                              int cotizaciones, BigDecimal precioMedio, List<String> productos,
                              String horario) {}

    public record ComercianteDetalle(Comerciante comerciante, List<PrecioItem> precios,
                                     List<String> modalidades) {}

    public record Promocion(int comercianteId, String comerciante, int nroPuesto, int pasillo,
                            String producto, String icono, String unidad,
                            BigDecimal precioOriginal, BigDecimal precioFinal, int descuento) {}

    public record Noticia(String titulo, String detalle) {}

    // ---- Comparador ----
    public record ItemCanasta(int productoId, BigDecimal cantidad) {}

    public record ComparacionRequest(List<ItemCanasta> items) {}

    public record FilaComparacion(Comerciante comerciante, BigDecimal total, BigDecimal diferencia,
                                  boolean masEconomico) {}

    public record FilaIncompleta(Comerciante comerciante, List<String> faltantes) {}

    public record ComparacionResponse(List<FilaComparacion> completos, List<FilaIncompleta> incompletos) {}

    // ---- Cotizaciones ----
    public record CotizacionRequest(int comercianteId, String claveSolicitud, List<ItemCanasta> items) {}

    public record ItemCotizacion(String producto, String icono, String unidad, BigDecimal cantidad,
                                 BigDecimal precioUnit, BigDecimal subtotal) {}

    public record CotizacionResponse(int id, int comercianteId, String comerciante, int nroPuesto,
                                     int pasillo, String estado, BigDecimal total, String fecha,
                                     List<ItemCotizacion> items, boolean tienePedido) {}

    // ---- Pedidos ----
    public record PedidoRequest(int cotizacionId, String modalidad, String direccion, String terceroNombre) {}

    public record PedidoResponse(int id, int cotizacionId, int comercianteId, String comerciante,
                                 int nroPuesto, BigDecimal total, String modalidad, String estado,
                                 String codigoEntrega, String direccion, String terceroNombre,
                                 String fecha) {}

    // ---- Precios ----
    public record PrecioPromedio(String producto, String icono, String unidad, BigDecimal promedio,
                                 BigDecimal minimo, BigDecimal maximo, int puestos) {}

    public record ProductoConteo(String producto, String icono, BigDecimal cantidad) {}

    public record ResumenPrecios(List<PrecioPromedio> promedios, List<ProductoConteo> masCotizados,
                                 List<ProductoConteo> masComprados) {}
}
