package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.AuthDtos.LoginRequest;
import com.mercado.altiplano.dto.AuthDtos.LoginResponse;
import com.mercado.altiplano.dto.AuthDtos.RegistroRequest;
import com.mercado.altiplano.model.Usuario;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.AuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    private final SesionService sesiones;

    public AuthController(AuthService auth, SesionService sesiones) {
        this.auth = auth;
        this.sesiones = sesiones;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest r) {
        return auth.login(r.correo(), r.password());
    }

    @PostMapping("/registro")
    public LoginResponse registro(@RequestBody RegistroRequest r) {
        return auth.registrar(r.nombre(), r.correo(), r.password());
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String h) {
        sesiones.cerrar(h);
        return Map.of("exitoso", true);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader(value = "Authorization", required = false) String h) {
        Usuario u = auth.actual(h);
        return Map.of("usuarioId", u.id(), "nombre", u.nombre(), "correo", u.correo());
    }
}
