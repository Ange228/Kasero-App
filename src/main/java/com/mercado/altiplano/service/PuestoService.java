package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.PuestoDtos.PedidoPuesto;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.PuestoRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Panel del comerciante: precios propios y avance de los pedidos de su puesto. */
@Service
public class PuestoService {
    private static final BigDecimal PRECIO_MAXIMO = new BigDecimal("9999.99");
    /** Un pedido solo avanza un paso a la vez. */
    private static final Map<String, String> SIGUIENTE = Map.of("EN_PREPARACION", "LISTO", "LISTO", "ENTREGADO");

    private final PuestoRepository repo;

    public PuestoService(PuestoRepository repo) {
        this.repo = repo;
    }

    /** Puesto vinculado a la cuenta, o 403 si es una cuenta de cliente. */
    public int puestoDe(int usuarioId) {
        return repo.comercianteDeUsuario(usuarioId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Esta cuenta no tiene un puesto asignado"));
    }

    public void fijarPrecio(int usuarioId, int productoId, BigDecimal precio) {
        int puesto = puestoDe(usuarioId);
        if (precio == null || precio.signum() <= 0 || precio.compareTo(PRECIO_MAXIMO) > 0)
            throw new ApiException(HttpStatus.BAD_REQUEST, "El precio debe ser mayor que cero y menor a S/ 10 000");
        if (!repo.productoExiste(productoId))
            throw new ApiException(HttpStatus.NOT_FOUND, "Ese producto no existe");
        repo.guardarPrecio(puesto, productoId, precio.setScale(2, java.math.RoundingMode.HALF_UP));
    }

    public void quitarPrecio(int usuarioId, int productoId) {
        if (!repo.quitarPrecio(puestoDe(usuarioId), productoId))
            throw new ApiException(HttpStatus.NOT_FOUND, "Ese producto no está en tu catálogo");
    }

    public List<PedidoPuesto> pedidos(int usuarioId) {
        return repo.pedidos(puestoDe(usuarioId));
    }

    public void cambiarEstado(int usuarioId, int pedidoId, String nuevo) {
        int puesto = puestoDe(usuarioId);
        var pedido = repo.pedido(pedidoId)
                .filter(p -> p.comercianteId() == puesto)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No encontramos ese pedido en tu puesto"));
        if (nuevo == null || !nuevo.equals(SIGUIENTE.get(pedido.estado())))
            throw new ApiException(HttpStatus.CONFLICT, "El pedido no puede pasar de " + pedido.estado() + " a " + nuevo);
        repo.actualizarEstado(pedidoId, nuevo);
    }
}
