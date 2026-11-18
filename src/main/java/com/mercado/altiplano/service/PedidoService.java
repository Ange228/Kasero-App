package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.TransaccionRepository;
import java.security.SecureRandom;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PedidoService {
    private static final Set<String> MODALIDADES = Set.of("ENVIO", "RECOJO", "TERCERO");
    private final TransaccionRepository repo;
    private final SecureRandom random = new SecureRandom();

    public PedidoService(TransaccionRepository repo) {
        this.repo = repo;
    }

    @Transactional
    public PedidoResponse crear(int usuarioId, PedidoRequest r) {
        if (r.modalidad() == null || !MODALIDADES.contains(r.modalidad()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "Elige una modalidad de entrega");
        if (repo.cotizaciones(usuarioId, r.cotizacionId()).isEmpty())
            throw new ApiException(HttpStatus.NOT_FOUND, "No encontramos esa cotización");
        if (repo.pedidoExiste(r.cotizacionId()))
            throw new ApiException(HttpStatus.CONFLICT, "Esa cotización ya tiene un pedido");
        String direccion = null, tercero = null, codigo = null;
        if ("ENVIO".equals(r.modalidad())) {
            if (r.direccion() == null || r.direccion().isBlank())
                throw new ApiException(HttpStatus.BAD_REQUEST, "Escribe la dirección de envío");
            direccion = r.direccion().trim();
        }
        if ("TERCERO".equals(r.modalidad())) {
            if (r.terceroNombre() == null || r.terceroNombre().isBlank())
                throw new ApiException(HttpStatus.BAD_REQUEST, "Escribe el nombre de la persona autorizada");
            tercero = r.terceroNombre().trim();
            codigo = String.format("%06d", random.nextInt(1_000_000));
        }
        int id = repo.insertarPedido(r.cotizacionId(), r.modalidad(), direccion, tercero, codigo);
        return repo.pedidos(usuarioId, id).get(0);
    }

    public List<PedidoResponse> historial(int usuarioId) {
        return repo.pedidos(usuarioId, null);
    }
}
