package com.mercado.altiplano.model;

/** Utilidades para mostrar nombres de personas sin exponer datos completos. */
public final class Nombres {
    private Nombres() {}

    /** "Ana Pérez Soto" -> "Ana P." */
    public static String abreviar(String nombre) {
        String[] p = nombre.trim().split("\\s+");
        return p.length > 1 ? p[0] + " " + p[1].charAt(0) + "." : p[0];
    }
}
