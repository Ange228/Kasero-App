package com.mercado.altiplano.security;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import org.springframework.stereotype.Component;

/** Hash de contrasenas con PBKDF2-HMAC-SHA256 (600 000 iteraciones). Formato: iter:sal:hash */
@Component
public class PasswordHasher {
    private static final int ITERACIONES = 600_000;
    private final SecureRandom random = new SecureRandom();

    public String hash(String password) {
        byte[] sal = new byte[16];
        random.nextBytes(sal);
        return ITERACIONES + ":" + Base64.getEncoder().encodeToString(sal) + ":"
                + Base64.getEncoder().encodeToString(derivar(password, sal, ITERACIONES));
    }

    public boolean verificar(String password, String almacenado) {
        try {
            String[] p = almacenado.split(":");
            byte[] esperado = Base64.getDecoder().decode(p[2]);
            byte[] real = derivar(password, Base64.getDecoder().decode(p[1]), Integer.parseInt(p[0]));
            return MessageDigest.isEqual(esperado, real);
        } catch (RuntimeException e) {
            return false;
        }
    }

    private byte[] derivar(String password, byte[] sal, int iteraciones) {
        try {
            var spec = new PBEKeySpec(password.toCharArray(), sal, iteraciones, 256);
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo calcular el hash", e);
        }
    }
}
