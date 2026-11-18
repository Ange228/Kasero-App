package com.mercado.altiplano.model;

public record Usuario(int id, String nombre, String correo, String passwordHash, String rol) {
}
