package com.mercado.altiplano.dto;

/** DTOs de calificaciones y reseñas. */
public final class ResenaDtos {
    private ResenaDtos() {}

    public record ResenaRequest(int puntaje, String comentario) {}

    /** El nombre del cliente se muestra abreviado (ej. "Ana P.") para no exponer datos personales. */
    public record ResenaResponse(int id, String usuario, int puntaje, String comentario, String fecha) {}

    public record ResenaResultado(double calificacion, int numCalificaciones, ResenaResponse resena) {}
}
