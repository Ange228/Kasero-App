package com.mercado.altiplano.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationException extends ApiException {
    public AuthenticationException(String mensaje) {
        super(HttpStatus.UNAUTHORIZED, mensaje);
    }
}
