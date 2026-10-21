package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.ResenaDtos.ResenaRequest;
import com.mercado.altiplano.dto.ResenaDtos.ResenaResponse;
import com.mercado.altiplano.dto.ResenaDtos.ResenaResultado;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.ResenaRepository;
import com.mercado.altiplano.repository.ResenaRepository.Calificacion;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Calificaciones de 1 a 5 estrellas: solo clientes con un pedido en el puesto, una reseña por cliente. */
@Service
public class ResenaService {
    private static final int MAX_COMENTARIO = 300;
    private final ResenaRepository repo;

    public ResenaService(ResenaRepository repo) {
        this.repo = repo;
    }

    public List<ResenaResponse> listar(int comercianteId) {
        return repo.listar(comercianteId);
    }

    @Transactional
    public ResenaResultado calificar(int usuarioId, int comercianteId, ResenaRequest r) {
        if (r.puntaje() < 1 || r.puntaje() > 5)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Elige de 1 a 5 estrellas");
        String comentario = r.comentario() == null ? null : r.comentario().trim();
        if (comentario != null && comentario.length() > MAX_COMENTARIO)
            throw new ApiException(HttpStatus.BAD_REQUEST, "El comentario admite hasta 300 caracteres");
        if (comentario != null && comentario.isEmpty()) comentario = null;

        Calificacion actual = repo.calificacion(comercianteId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe"));
        if (!repo.haComprado(usuarioId, comercianteId))
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo puedes calificar a comerciantes a los que ya les hiciste un pedido");

        Integer anterior = repo.puntajeDe(comercianteId, usuarioId).orElse(null);
        int id = repo.guardar(comercianteId, usuarioId, r.puntaje(), comentario);
        BigDecimal promedio = nuevoPromedio(actual.promedio(), actual.total(), anterior, r.puntaje());
        int total = anterior == null ? actual.total() + 1 : actual.total();
        repo.actualizarCalificacion(comercianteId, promedio, total);
        return new ResenaResultado(promedio.doubleValue(), total, repo.porId(id).orElseThrow());
    }

    /**
     * Promedio actualizado al agregar una calificación nueva (anterior == null)
     * o al cambiar la que el mismo cliente había dado antes.
     */
    static BigDecimal nuevoPromedio(double actual, int total, Integer anterior, int nuevo) {
        double suma = actual * total;
        int n = total;
        if (anterior == null) n = total + 1; else suma -= anterior;
        double promedio = (suma + nuevo) / n;
        return BigDecimal.valueOf(Math.min(5, Math.max(1, promedio))).setScale(2, RoundingMode.HALF_UP);
    }
}
