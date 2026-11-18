package com.mercado.altiplano.dto;

/** DTOs del modulo de autenticacion. */
public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(String correo, String password) {}

    public record RegistroRequest(String nombre, String correo, String password) {}

    public record LoginResponse(boolean exitoso, String mensaje, int usuarioId, String nombre, String token, String rol) {}
}
