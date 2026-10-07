package com.mercado.altiplano.security;

import com.mercado.altiplano.exception.AuthenticationException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/** Sesiones de 8 horas identificadas por un token aleatorio. */
@Service
public class SesionService {
    private static final Duration DURACION = Duration.ofHours(8);

    private record Sesion(int usuarioId, Instant expira) {}

    private final Map<String, Sesion> sesiones = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String crear(int usuarioId) {
        byte[] b = new byte[32];
        random.nextBytes(b);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
        sesiones.put(token, new Sesion(usuarioId, Instant.now().plus(DURACION)));
        return token;
    }

    public void cerrar(String authorization) {
        sesiones.remove(extraer(authorization));
    }

    /** Devuelve el id del usuario o lanza 401. */
    public int requerir(String authorization) {
        Sesion s = sesiones.get(extraer(authorization));
        if (s == null || s.expira().isBefore(Instant.now())) {
            throw new AuthenticationException("Inicia sesión para continuar");
        }
        return s.usuarioId();
    }

    private String extraer(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) return "";
        return authorization.substring(7).trim();
    }
}
