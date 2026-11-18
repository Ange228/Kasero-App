package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.CatalogoDtos.Comerciante;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.FavoritoRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Puestos favoritos del cliente. */
@Service
public class FavoritoService {
    private final FavoritoRepository repo;
    private final CatalogoService catalogo;

    public FavoritoService(FavoritoRepository repo, CatalogoService catalogo) {
        this.repo = repo;
        this.catalogo = catalogo;
    }

    /** Favoritos del cliente, del más reciente al más antiguo. */
    public List<Comerciante> listar(int usuarioId) {
        List<Integer> ids = repo.ids(usuarioId);
        List<Comerciante> todos = catalogo.todos();
        return ids.stream().map(id -> todos.stream().filter(c -> c.id() == id).findFirst().orElse(null))
                .filter(java.util.Objects::nonNull).toList();
    }

    public void agregar(int usuarioId, int comercianteId) {
        if (!repo.comercianteExiste(comercianteId))
            throw new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe");
        repo.agregar(usuarioId, comercianteId);
    }

    public void quitar(int usuarioId, int comercianteId) {
        repo.quitar(usuarioId, comercianteId);
    }
}
