package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.dto.AdminDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.model.Usuario;
import com.mercado.altiplano.repository.AdminRepository;
import com.mercado.altiplano.repository.UsuarioRepositoryPort;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** Panel de administración: solo ADMIN, con validación de datos. */
class AdminServiceTest {
    private static final int ADMIN = 1, CLIENTE = 2, COMERCIANTE = 3;

    private AdminRepository repo;
    private UsuarioRepositoryPort usuarios;
    private AdminService servicio;

    private static int estado(Throwable t) { return ((ApiException) t).getStatus().value(); }

    private static PuestoForm puesto(String nombre, int nro) {
        return new PuestoForm(nombre, nro, 4, "Verduras", 1, "Yape y Plin", "Sí");
    }

    @BeforeEach
    void preparar() {
        repo = mock(AdminRepository.class);
        usuarios = mock(UsuarioRepositoryPort.class);
        when(usuarios.buscarPorId(ADMIN)).thenReturn(Optional.of(new Usuario(ADMIN, "Admin", "admin@x.com", "h", "ADMIN")));
        when(usuarios.buscarPorId(CLIENTE)).thenReturn(Optional.of(new Usuario(CLIENTE, "Ana", "ana@x.com", "h", "CLIENTE")));
        when(usuarios.buscarPorId(COMERCIANTE)).thenReturn(Optional.of(new Usuario(COMERCIANTE, "Nilda", "n@x.com", "h", "COMERCIANTE")));
        when(repo.sectorExiste(1)).thenReturn(true);
        when(repo.puestoExiste(5)).thenReturn(true);
        when(repo.productoExiste(9)).thenReturn(true);
        when(repo.crearPuesto(any())).thenReturn(50);
        when(repo.crearProducto(any())).thenReturn(60);
        servicio = new AdminService(repo, usuarios);
    }

    @Test
    void soloElAdministradorPuedeUsarElPanel() {
        for (int usuario : new int[]{CLIENTE, COMERCIANTE, 99}) {
            assertThatThrownBy(() -> servicio.crearPuesto(usuario, puesto("Rosa", 10))).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
            assertThatThrownBy(() -> servicio.puestos(usuario)).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        }
        verify(repo, never()).crearPuesto(any());
    }

    @Test
    void creaUnPuestoValidoLimpiandoEspacios() {
        assertThat(servicio.crearPuesto(ADMIN, puesto("  Rosa  ", 10))).isEqualTo(50);
        verify(repo).crearPuesto(new PuestoForm("Rosa", 10, 4, "Verduras", 1, "Yape y Plin", "Sí"));
    }

    @Test
    void elNumeroDePuestoVaDelUnoAlTreintaYCinco() {
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, puesto("Rosa", 0))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, puesto("Rosa", 36))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        servicio.crearPuesto(ADMIN, puesto("Rosa", 35));
    }

    @Test
    void elPuestoExigeNombreSeccionSectorYCaseros() {
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, puesto(" ", 10))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, new PuestoForm("Rosa", 10, 4, "", 1, "Yape", "Sí")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, new PuestoForm("Rosa", 10, 4, "Verduras", 77, "Yape", "Sí")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, new PuestoForm("Rosa", 10, 4, "Verduras", 1, "Yape", "Quizá")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    void noPermiteDosPuestosConElMismoNombre() {
        when(repo.nombrePuestoExiste("Rosa", 0)).thenReturn(true);
        assertThatThrownBy(() -> servicio.crearPuesto(ADMIN, puesto("Rosa", 10))).satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }

    @Test
    void alEditarUnPuestoSuNombreNoChocaConsigoMismo() {
        servicio.actualizarPuesto(ADMIN, 5, puesto("Nilda", 5));
        verify(repo).nombrePuestoExiste("Nilda", 5);
        verify(repo).actualizarPuesto(5, puesto("Nilda", 5));
    }

    @Test
    void editarUnPuestoInexistenteDa404() {
        assertThatThrownBy(() -> servicio.actualizarPuesto(ADMIN, 404, puesto("Rosa", 10))).satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void desactivaUnPuestoSinBorrarlo() {
        servicio.cambiarActivo(ADMIN, 5, false);
        verify(repo).cambiarActivo(5, false);
    }

    @Test
    void asignaUnaCuentaDeComercianteAlPuesto() {
        when(usuarios.buscarPorCorreo("ana@x.com")).thenReturn(Optional.of(new Usuario(CLIENTE, "Ana", "ana@x.com", "h", "CLIENTE")));
        servicio.asignarCuenta(ADMIN, 5, " ana@x.com ");
        verify(repo).asignarCuenta(CLIENTE, 5);
    }

    @Test
    void noAsignaCuentasInexistentesNiDeAdministrador() {
        when(usuarios.buscarPorCorreo("nadie@x.com")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> servicio.asignarCuenta(ADMIN, 5, "nadie@x.com")).satisfies(e -> assertThat(estado(e)).isEqualTo(404));
        when(usuarios.buscarPorCorreo("admin@x.com")).thenReturn(Optional.of(new Usuario(ADMIN, "Admin", "admin@x.com", "h", "ADMIN")));
        assertThatThrownBy(() -> servicio.asignarCuenta(ADMIN, 5, "admin@x.com")).satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        verify(repo, never()).asignarCuenta(anyInt(), anyInt());
    }

    @Test
    void creaProductosConUnidadPermitida() {
        assertThat(servicio.crearProducto(ADMIN, new ProductoForm("Choclo", 1, "unidad"))).isEqualTo(60);
        assertThatThrownBy(() -> servicio.crearProducto(ADMIN, new ProductoForm("Choclo", 1, "metro")))
                .satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    void noPermiteProductosRepetidosNiSectoresInvalidos() {
        when(repo.nombreProductoExiste("Papa", 0)).thenReturn(true);
        assertThatThrownBy(() -> servicio.crearProducto(ADMIN, new ProductoForm("Papa", 1, "kg"))).satisfies(e -> assertThat(estado(e)).isEqualTo(409));
        assertThatThrownBy(() -> servicio.crearProducto(ADMIN, new ProductoForm("Choclo", 99, "kg"))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    void lasNoticiasExigenTituloDetalleYNoSeRepiten() {
        assertThatThrownBy(() -> servicio.crearNoticia(ADMIN, new NoticiaForm("", "x"))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.crearNoticia(ADMIN, new NoticiaForm("Aviso", "x".repeat(201)))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        when(repo.tituloNoticiaExiste("Aviso")).thenReturn(true);
        assertThatThrownBy(() -> servicio.crearNoticia(ADMIN, new NoticiaForm("Aviso", "detalle"))).satisfies(e -> assertThat(estado(e)).isEqualTo(409));
    }

    @Test
    void borrarUnaNoticiaInexistenteDa404() {
        when(repo.borrarNoticia(7)).thenReturn(false);
        assertThatThrownBy(() -> servicio.borrarNoticia(ADMIN, 7)).satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void laPromocionExigeDescuentoValidoYQueElPuestoVendaElProducto() {
        assertThatThrownBy(() -> servicio.guardarPromocion(ADMIN, new PromoForm(5, 9, 0))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.guardarPromocion(ADMIN, new PromoForm(5, 9, 91))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        when(repo.precioExiste(5, 9)).thenReturn(false);
        assertThatThrownBy(() -> servicio.guardarPromocion(ADMIN, new PromoForm(5, 9, 20))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        when(repo.precioExiste(5, 9)).thenReturn(true);
        servicio.guardarPromocion(ADMIN, new PromoForm(5, 9, 20));
        verify(repo).guardarPromocion(new PromoForm(5, 9, 20));
    }
}
