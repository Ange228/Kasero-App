package com.mercado.altiplano.dto;

/** DTOs del chat entre clientes y comerciantes. */
public final class ChatDtos {
    private ChatDtos() {}

    public record ChatRequest(int comercianteId) {}

    public record MensajeRequest(String texto) {}

    /** Conversación vista desde quien consulta: "contraparte" es la otra persona. */
    public record ChatResumen(int id, int comercianteId, String contraparte, String ultimoMensaje, String fecha) {}

    public record Mensaje(int id, String autor, String texto, String fecha, boolean mio) {}
}
