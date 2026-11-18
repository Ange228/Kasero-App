package com.mercado.altiplano.dto;

/** DTOs del panel de administración. */
public final class AdminDtos {
    private AdminDtos() {}

    // ---- Puestos ----
    public record PuestoForm(String nombre, int nroPuesto, int pasillo, String seccion, int sectorId,
                             String metodosPago, String tieneCaseros) {}

    public record AdminPuesto(int id, String nombre, int nroPuesto, int pasillo, String seccion, int sectorId,
                              String sector, String metodosPago, String tieneCaseros, boolean activo, String cuenta) {}

    public record ActivoRequest(boolean activo) {}

    public record CuentaRequest(String correo) {}

    // ---- Productos ----
    public record ProductoForm(String nombre, int sectorId, String unidad) {}

    public record AdminProducto(int id, String nombre, String unidad, int sectorId, String sector) {}

    // ---- Noticias ----
    public record NoticiaForm(String titulo, String detalle) {}

    public record AdminNoticia(int id, String titulo, String detalle) {}

    // ---- Promociones ----
    public record PromoForm(int comercianteId, int productoId, int descuento) {}

    public record AdminPromo(int id, String comerciante, String producto, int descuento) {}
}
