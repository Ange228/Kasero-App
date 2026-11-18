package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.dto.CatalogoDtos.Comerciante;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.FavoritoRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Puestos favoritos del cliente. */
class FavoritoServiceTest {
    private FavoritoRepository repo;
    private CatalogoService catalogo;
    private FavoritoService servicio;

    private static Comerciante com(int id, String nombre) {
        return new Comerciante(id, nombre, "XX", id, 1, "Verduras", "Verduras", List.of("Yape"), "Sí", 4.5, 10, 0,
                new BigDecimal("2.00"), List.of());
    }

    @BeforeEach
    void preparar() {
        repo = mock(FavoritoRepository.class);
        catalogo = mock(CatalogoService.class);
        when(catalogo.todos()).thenReturn(List.of(com(1, "Nilda"), com(2, "Angela"), com(3, "Lourdes")));
        servicio = new FavoritoService(repo, catalogo);
    }

    @Test
    void listaLosFavoritosEnElOrdenGuardado() {
        when(repo.ids(7)).thenReturn(List.of(3, 1));
        assertThat(servicio.listar(7)).extracting(Comerciante::nombre).containsExactly("Lourdes", "Nilda");
    }

    @Test
    void ignoraFavoritosDeUnPuestoQueYaNoExiste() {
        when(repo.ids(7)).thenReturn(List.of(1, 77));
        assertThat(servicio.listar(7)).extracting(Comerciante::nombre).containsExactly("Nilda");
    }

    @Test
    void agregaUnPuestoExistente() {
        when(repo.comercianteExiste(1)).thenReturn(true);
        servicio.agregar(7, 1);
        verify(repo).agregar(7, 1);
    }

    @Test
    void noAgregaUnPuestoInexistente() {
        when(repo.comercianteExiste(99)).thenReturn(false);
        assertThatThrownBy(() -> servicio.agregar(7, 99)).isInstanceOf(ApiException.class)
                .satisfies(e -> assertThat(((ApiException) e).getStatus().value()).isEqualTo(404));
        verify(repo, never()).agregar(7, 99);
    }

    @Test
    void quitaUnFavorito() {
        servicio.quitar(7, 1);
        verify(repo).quitar(7, 1);
    }
}
