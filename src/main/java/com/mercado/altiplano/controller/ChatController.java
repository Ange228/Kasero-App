package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.ChatDtos.ChatRequest;
import com.mercado.altiplano.dto.ChatDtos.ChatResumen;
import com.mercado.altiplano.dto.ChatDtos.Mensaje;
import com.mercado.altiplano.dto.ChatDtos.MensajeRequest;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.ChatService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/** Chat: todas las rutas requieren sesión iniciada. */
@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private final ChatService chats;
    private final SesionService sesiones;

    public ChatController(ChatService chats, SesionService sesiones) {
        this.chats = chats;
        this.sesiones = sesiones;
    }

    @GetMapping
    public List<ChatResumen> mis(@RequestHeader(value = "Authorization", required = false) String h) {
        return chats.mis(sesiones.requerir(h));
    }

    @PostMapping
    public ChatResumen abrir(@RequestHeader(value = "Authorization", required = false) String h,
                             @RequestBody ChatRequest r) {
        return chats.abrir(sesiones.requerir(h), r.comercianteId());
    }

    @GetMapping("/{id}/mensajes")
    public List<Mensaje> mensajes(@PathVariable int id, @RequestParam(defaultValue = "0") int despues,
                                  @RequestHeader(value = "Authorization", required = false) String h) {
        return chats.mensajes(sesiones.requerir(h), id, despues);
    }

    @PostMapping("/{id}/mensajes")
    public Mensaje enviar(@PathVariable int id, @RequestBody MensajeRequest r,
                          @RequestHeader(value = "Authorization", required = false) String h) {
        return chats.enviar(sesiones.requerir(h), id, r.texto());
    }
}
