package com.mercado.altiplano.repository;

import com.mercado.altiplano.dto.ChatDtos.Mensaje;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChatRepository {
    /** Datos básicos de un chat para validar quién participa. */
    public record ChatFila(int id, int usuarioId, int comercianteId) {}

    /** Fila de listado con los nombres sin abreviar (el servicio decide cuál mostrar). */
    public record ChatListado(int id, int comercianteId, String comerciante, String cliente,
                              String ultimoMensaje, String fecha) {}

    private final JdbcTemplate jdbc;

    public ChatRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean comercianteExiste(int comercianteId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM comerciantes WHERE id = ? AND activo", Integer.class,
                comercianteId) > 0;
    }

    /** Puesto vinculado a la cuenta del usuario (solo cuentas de comerciante). */
    public Optional<Integer> comercianteDeUsuario(int usuarioId) {
        return jdbc.query("SELECT comerciante_id FROM usuarios WHERE id = ? AND comerciante_id IS NOT NULL",
                (rs, i) -> rs.getInt(1), usuarioId).stream().findFirst();
    }

    public Optional<ChatFila> chat(int chatId) {
        return jdbc.query("SELECT id, usuario_id, comerciante_id FROM chats WHERE id = ?",
                (rs, i) -> new ChatFila(rs.getInt(1), rs.getInt(2), rs.getInt(3)), chatId).stream().findFirst();
    }

    public int obtenerOCrear(int usuarioId, int comercianteId) {
        jdbc.update("INSERT INTO chats (usuario_id, comerciante_id) VALUES (?,?) ON CONFLICT DO NOTHING",
                usuarioId, comercianteId);
        return jdbc.queryForObject("SELECT id FROM chats WHERE usuario_id = ? AND comerciante_id = ?",
                Integer.class, usuarioId, comercianteId);
    }

    /** Chats del cliente o, si la cuenta es de comerciante, los de su puesto. */
    public List<ChatListado> listado(Integer usuarioId, Integer comercianteId) {
        // Espacio inicial: los bloques de texto de Java recortan los espacios al final de "WHERE "
        String filtro = usuarioId != null ? " c.usuario_id = ?" : " c.comerciante_id = ?";
        Object arg = usuarioId != null ? usuarioId : comercianteId;
        return jdbc.query("""
                SELECT c.id, c.comerciante_id, co.nombre, u.nombre,
                       (SELECT m.texto FROM mensajes m WHERE m.chat_id = c.id ORDER BY m.id DESC LIMIT 1),
                       COALESCE((SELECT MAX(m.enviado_en) FROM mensajes m WHERE m.chat_id = c.id), c.creado_en)
                FROM chats c JOIN comerciantes co ON co.id = c.comerciante_id JOIN usuarios u ON u.id = c.usuario_id
                WHERE """ + filtro + " ORDER BY 6 DESC",
                (rs, i) -> new ChatListado(rs.getInt(1), rs.getInt(2), rs.getString(3), rs.getString(4),
                        rs.getString(5), ((Timestamp) rs.getObject(6)).toLocalDateTime().toString()), arg);
    }

    public List<Mensaje> mensajes(int chatId, int despuesDe, String autorDeQuienConsulta) {
        return jdbc.query("""
                SELECT id, autor, texto, enviado_en FROM mensajes
                WHERE chat_id = ? AND id > ? ORDER BY id LIMIT 200""",
                (rs, i) -> new Mensaje(rs.getInt(1), rs.getString(2), rs.getString(3),
                        rs.getTimestamp(4).toLocalDateTime().toString(), rs.getString(2).equals(autorDeQuienConsulta)),
                chatId, despuesDe);
    }

    public Mensaje insertar(int chatId, String autor, String texto) {
        return jdbc.queryForObject("""
                INSERT INTO mensajes (chat_id, autor, texto) VALUES (?,?,?)
                RETURNING id, autor, texto, enviado_en""",
                (rs, i) -> new Mensaje(rs.getInt(1), rs.getString(2), rs.getString(3),
                        rs.getTimestamp(4).toLocalDateTime().toString(), true), chatId, autor, texto);
    }
}
