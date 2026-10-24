package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.ChatDtos.ChatResumen;
import com.mercado.altiplano.dto.ChatDtos.Mensaje;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.model.Nombres;
import com.mercado.altiplano.repository.ChatRepository;
import com.mercado.altiplano.repository.ChatRepository.ChatFila;
import com.mercado.altiplano.repository.ChatRepository.ChatListado;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Chat cliente-comerciante (RF-11). El cliente escribe desde su cuenta; el comerciante,
 * desde una cuenta vinculada a su puesto. Solo participan quienes pertenecen a la conversación.
 */
@Service
public class ChatService {
    static final String CLIENTE = "CLIENTE";
    static final String COMERCIANTE = "COMERCIANTE";
    private static final int MAX_TEXTO = 500;
    private final ChatRepository repo;

    public ChatService(ChatRepository repo) {
        this.repo = repo;
    }

    /** Abre (o recupera) la conversación del cliente con un puesto. */
    public ChatResumen abrir(int usuarioId, int comercianteId) {
        if (!repo.comercianteExiste(comercianteId))
            throw new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe");
        if (repo.comercianteDeUsuario(usuarioId).isPresent())
            throw new ApiException(HttpStatus.FORBIDDEN, "Las cuentas de comerciante responden desde su bandeja");
        int id = repo.obtenerOCrear(usuarioId, comercianteId);
        return mis(usuarioId).stream().filter(c -> c.id() == id).findFirst().orElseThrow();
    }

    public List<ChatResumen> mis(int usuarioId) {
        Optional<Integer> puesto = repo.comercianteDeUsuario(usuarioId);
        boolean esComerciante = puesto.isPresent();
        return repo.listado(esComerciante ? null : usuarioId, puesto.orElse(null)).stream()
                .map(c -> resumen(c, esComerciante)).toList();
    }

    public List<Mensaje> mensajes(int usuarioId, int chatId, int despuesDe) {
        ChatFila chat = chatDe(chatId);
        return repo.mensajes(chatId, despuesDe, autorDe(chat, usuarioId));
    }

    public Mensaje enviar(int usuarioId, int chatId, String texto) {
        String limpio = texto == null ? "" : texto.trim();
        if (limpio.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Escribe un mensaje");
        if (limpio.length() > MAX_TEXTO)
            throw new ApiException(HttpStatus.BAD_REQUEST, "El mensaje admite hasta 500 caracteres");
        ChatFila chat = chatDe(chatId);
        return repo.insertar(chatId, autorDe(chat, usuarioId), limpio);
    }

    private ChatFila chatDe(int chatId) {
        return repo.chat(chatId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No encontramos esa conversación"));
    }

    /** Rol con el que participa el usuario en el chat, o 403 si no pertenece a él. */
    String autorDe(ChatFila chat, int usuarioId) {
        if (chat.usuarioId() == usuarioId) return CLIENTE;
        if (repo.comercianteDeUsuario(usuarioId).filter(p -> p == chat.comercianteId()).isPresent()) return COMERCIANTE;
        throw new ApiException(HttpStatus.FORBIDDEN, "No participas en esa conversación");
    }

    private static ChatResumen resumen(ChatListado c, boolean comoComerciante) {
        String contraparte = comoComerciante ? Nombres.abreviar(c.cliente()) : c.comerciante();
        return new ChatResumen(c.id(), c.comercianteId(), contraparte, c.ultimoMensaje(), c.fecha());
    }
}
