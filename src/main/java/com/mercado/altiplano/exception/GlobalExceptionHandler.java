package com.mercado.altiplano.exception;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> manejar(ApiException e) {
        return ResponseEntity.status(e.getStatus())
                .body(Map.of("exitoso", false, "mensaje", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> inesperado(Exception e) {
        // Sin este registro, un error de base de datos o de ruta quedaba invisible para quien opera la app
        LOG.error("Error inesperado en la API", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("exitoso", false, "mensaje", "Ocurrió un error inesperado. Intenta de nuevo."));
    }
}
