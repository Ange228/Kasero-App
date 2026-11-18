package com.mercado.altiplano.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.mercado.altiplano.dto.ChatDtos.Mensaje;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.ChatRepository;
import com.mercado.altiplano.repository.ChatRepository.ChatFila;
import com.mercado.altiplano.repository.ChatRepository.ChatListado;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** RF-11 Chat cliente-comerciante: solo participan los dueños de la conversación. */
class ChatServiceTest {
    private static final int CLIENTE = 7;        // usuario cliente
    private static final int CASERA = 20;        // usuario vinculado al puesto 1
    private static final int EXTRANO = 99;       // otro cliente

    private ChatRepository repo;
    private ChatService servicio;

    private static int estado(Throwable t) {
        return ((ApiException) t).getStatus().value();
    }

    @BeforeEach
    void preparar() {
        repo = mock(ChatRepository.class);
        when(repo.chat(5)).thenReturn(Optional.of(new ChatFila(5, CLIENTE, 1)));
        when(repo.comercianteDeUsuario(CLIENTE)).thenReturn(Optional.empty());
        when(repo.comercianteDeUsuario(CASERA)).thenReturn(Optional.of(1));
        when(repo.comercianteDeUsuario(EXTRANO)).thenReturn(Optional.empty());
        when(repo.comercianteExiste(1)).thenReturn(true);
        when(repo.insertar(anyInt(), anyString(), anyString()))
                .thenAnswer(i -> new Mensaje(1, i.getArgument(1), i.getArgument(2), "2026-11-18T10:00:00", true));
        servicio = new ChatService(repo);
    }

    @Test
    void elClienteEscribeComoCliente() {
        var m = servicio.enviar(CLIENTE, 5, "Casera, ¿tiene papa yungay?");
        assertThat(m.autor()).isEqualTo("CLIENTE");
        verify(repo).insertar(5, "CLIENTE", "Casera, ¿tiene papa yungay?");
    }

    @Test
    void laCuentaDelPuestoRespondeComoComerciante() {
        assertThat(servicio.enviar(CASERA, 5, "Sí tengo, ¿cuánta cantidad?").autor()).isEqualTo("COMERCIANTE");
    }

    @Test
    void unTerceroNoPuedeLeerNiEscribir() {
        assertThatThrownBy(() -> servicio.enviar(EXTRANO, 5, "hola")).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        assertThatThrownBy(() -> servicio.mensajes(EXTRANO, 5, 0)).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
        verify(repo, never()).insertar(anyInt(), anyString(), anyString());
    }

    @Test
    void otraCuentaDeComercianteTampocoParticipa() {
        when(repo.comercianteDeUsuario(30)).thenReturn(Optional.of(2)); // casera de otro puesto
        assertThatThrownBy(() -> servicio.enviar(30, 5, "hola")).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
    }

    @Test
    void elMensajeNoPuedeEstarVacio() {
        assertThatThrownBy(() -> servicio.enviar(CLIENTE, 5, "   ")).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        assertThatThrownBy(() -> servicio.enviar(CLIENTE, 5, null)).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
    }

    @Test
    void elMensajeAdmiteHastaQuinientosCaracteres() {
        assertThatThrownBy(() -> servicio.enviar(CLIENTE, 5, "x".repeat(501))).satisfies(e -> assertThat(estado(e)).isEqualTo(400));
        servicio.enviar(CLIENTE, 5, "x".repeat(500));
    }

    @Test
    void unaConversacionInexistenteDaError404() {
        when(repo.chat(404)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> servicio.enviar(CLIENTE, 404, "hola")).satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void alLeerSeMarcanComoMiosSoloLosMensajesDeQuienConsulta() {
        servicio.mensajes(CLIENTE, 5, 3);
        verify(repo).mensajes(5, 3, "CLIENTE");
        servicio.mensajes(CASERA, 5, 0);
        verify(repo).mensajes(5, 0, "COMERCIANTE");
    }

    @Test
    void elClienteAbreLaConversacionConUnPuesto() {
        when(repo.obtenerOCrear(CLIENTE, 1)).thenReturn(5);
        when(repo.listado(CLIENTE, null)).thenReturn(List.of(
                new ChatListado(5, 1, "Nilda", "Usuario Demo", null, "2026-11-18T10:00:00")));
        var c = servicio.abrir(CLIENTE, 1);
        assertThat(c.id()).isEqualTo(5);
        assertThat(c.contraparte()).isEqualTo("Nilda");
    }

    @Test
    void elComercianteVeAlClienteConNombreAbreviado() {
        when(repo.listado(null, 1)).thenReturn(List.of(
                new ChatListado(5, 1, "Nilda", "Ana Pérez Soto", "hola", "2026-11-18T10:00:00")));
        assertThat(servicio.mis(CASERA).get(0).contraparte()).isEqualTo("Ana P.");
    }

    @Test
    void noSeAbreChatConUnPuestoInexistente() {
        when(repo.comercianteExiste(99)).thenReturn(false);
        assertThatThrownBy(() -> servicio.abrir(CLIENTE, 99)).satisfies(e -> assertThat(estado(e)).isEqualTo(404));
    }

    @Test
    void lasCuentasDeComercianteNoAbrenChatsComoClientes() {
        assertThatThrownBy(() -> servicio.abrir(CASERA, 1)).satisfies(e -> assertThat(estado(e)).isEqualTo(403));
    }
}
