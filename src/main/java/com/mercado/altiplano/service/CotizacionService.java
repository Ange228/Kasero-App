package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.TransaccionRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CotizacionService {
    private final TransaccionRepository repo;

    public CotizacionService(TransaccionRepository repo) {
        this.repo = repo;
    }

    /** Crea la cotizacion; si la clave ya existe devuelve la misma (sin duplicar). */
    @Transactional
    public CotizacionResponse crear(int usuarioId, CotizacionRequest r) {
        if (r.items() == null || r.items().isEmpty())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Agrega al menos un producto");
        if (r.claveSolicitud() == null || r.claveSolicitud().isBlank())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Falta la clave de la solicitud");
        var existente = repo.cotizacionPorClave(r.claveSolicitud());
        if (existente.isPresent()) return repo.cotizaciones(usuarioId, existente.get()).get(0);

        BigDecimal total = BigDecimal.ZERO;
        for (ItemCanasta it : r.items()) {
            if (it.cantidad() == null || it.cantidad().signum() <= 0)
                throw new ApiException(HttpStatus.BAD_REQUEST, "La cantidad debe ser mayor que cero");
            BigDecimal pu = repo.precio(r.comercianteId(), it.productoId()).orElseThrow(() ->
                    new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                            "El puesto no vende: " + repo.nombreProducto(it.productoId())));
            total = total.add(pu.multiply(it.cantidad()));
        }
        int id = repo.insertarCotizacion(usuarioId, r.comercianteId(), r.claveSolicitud(), total);
        for (ItemCanasta it : r.items()) {
            BigDecimal pu = repo.precio(r.comercianteId(), it.productoId()).get();
            repo.insertarItem(id, it.productoId(), it.cantidad(), pu, pu.multiply(it.cantidad()));
        }
        repo.sumarCotizacion(r.comercianteId());
        return repo.cotizaciones(usuarioId, id).get(0);
    }

    public List<CotizacionResponse> historial(int usuarioId) {
        return repo.cotizaciones(usuarioId, null);
    }
}
