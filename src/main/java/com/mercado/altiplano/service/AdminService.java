package com.mercado.altiplano.service;

import com.mercado.altiplano.dto.AdminDtos.*;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.model.Usuario;
import com.mercado.altiplano.repository.AdminRepository;
import com.mercado.altiplano.repository.UsuarioRepositoryPort;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/** Administración de la plataforma: puestos, productos, noticias y promociones (solo rol ADMIN). */
@Service
public class AdminService {
    static final Set<String> UNIDADES = Set.of("kg", "unidad", "litro");
    static final Set<String> CASEROS = Set.of("Sí", "Algunas veces", "No");

    private final AdminRepository repo;
    private final UsuarioRepositoryPort usuarios;

    public AdminService(AdminRepository repo, UsuarioRepositoryPort usuarios) {
        this.repo = repo;
        this.usuarios = usuarios;
    }

    /** Solo las cuentas con rol ADMIN pasan; el resto recibe 403. */
    public void exigirAdmin(int usuarioId) {
        boolean admin = usuarios.buscarPorId(usuarioId).map(Usuario::rol).filter("ADMIN"::equals).isPresent();
        if (!admin) throw new ApiException(HttpStatus.FORBIDDEN, "Solo el administrador puede hacer esto");
    }

    private static ApiException invalido(String mensaje) { return new ApiException(HttpStatus.BAD_REQUEST, mensaje); }

    private static String texto(String valor, String campo, int max) {
        String t = valor == null ? "" : valor.trim();
        if (t.isEmpty()) throw invalido("Falta " + campo);
        if (t.length() > max) throw invalido(campo.substring(0, 1).toUpperCase() + campo.substring(1) + " admite hasta " + max + " caracteres");
        return t;
    }

    // ---- Puestos ----
    public List<AdminPuesto> puestos(int usuarioId) { exigirAdmin(usuarioId); return repo.puestos(); }

    public int crearPuesto(int usuarioId, PuestoForm f) {
        exigirAdmin(usuarioId);
        PuestoForm limpio = validarPuesto(f, 0);
        return repo.crearPuesto(limpio);
    }

    public void actualizarPuesto(int usuarioId, int id, PuestoForm f) {
        exigirAdmin(usuarioId);
        if (!repo.puestoExiste(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe");
        repo.actualizarPuesto(id, validarPuesto(f, id));
    }

    private PuestoForm validarPuesto(PuestoForm f, int exceptoId) {
        String nombre = texto(f.nombre(), "el nombre", 80);
        String seccion = texto(f.seccion(), "la sección", 60);
        String pagos = texto(f.metodosPago(), "los métodos de pago", 80);
        if (f.nroPuesto() < 1 || f.nroPuesto() > 35) throw invalido("El número de puesto debe estar entre 1 y 35");
        if (f.pasillo() < 1) throw invalido("El pasillo debe ser 1 o mayor");
        if (f.tieneCaseros() == null || !CASEROS.contains(f.tieneCaseros())) throw invalido("Elige si tiene caseros fijos");
        if (!repo.sectorExiste(f.sectorId())) throw invalido("Elige un sector válido");
        if (repo.nombrePuestoExiste(nombre, exceptoId)) throw new ApiException(HttpStatus.CONFLICT, "Ya existe un puesto con ese nombre");
        return new PuestoForm(nombre, f.nroPuesto(), f.pasillo(), seccion, f.sectorId(), pagos, f.tieneCaseros());
    }

    public void cambiarActivo(int usuarioId, int id, boolean activo) {
        exigirAdmin(usuarioId);
        if (!repo.puestoExiste(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe");
        repo.cambiarActivo(id, activo);
    }

    /** Vincula la cuenta (por correo) al puesto: podrá usar el panel "Mi puesto" y responder chats. */
    public void asignarCuenta(int usuarioId, int puestoId, String correo) {
        exigirAdmin(usuarioId);
        if (!repo.puestoExiste(puestoId)) throw new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe");
        Usuario u = usuarios.buscarPorCorreo(correo == null ? "" : correo.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "No hay ninguna cuenta con ese correo"));
        if ("ADMIN".equals(u.rol())) throw new ApiException(HttpStatus.CONFLICT, "Una cuenta de administrador no puede ser de comerciante");
        repo.asignarCuenta(u.id(), puestoId);
    }

    // ---- Productos ----
    public List<AdminProducto> productos(int usuarioId) { exigirAdmin(usuarioId); return repo.productos(); }

    public int crearProducto(int usuarioId, ProductoForm f) {
        exigirAdmin(usuarioId);
        return repo.crearProducto(validarProducto(f, 0));
    }

    public void actualizarProducto(int usuarioId, int id, ProductoForm f) {
        exigirAdmin(usuarioId);
        if (!repo.productoExiste(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Ese producto no existe");
        repo.actualizarProducto(id, validarProducto(f, id));
    }

    private ProductoForm validarProducto(ProductoForm f, int exceptoId) {
        String nombre = texto(f.nombre(), "el nombre", 60);
        if (f.unidad() == null || !UNIDADES.contains(f.unidad())) throw invalido("La unidad debe ser kg, unidad o litro");
        if (!repo.sectorExiste(f.sectorId())) throw invalido("Elige un sector válido");
        if (repo.nombreProductoExiste(nombre, exceptoId)) throw new ApiException(HttpStatus.CONFLICT, "Ya existe un producto con ese nombre");
        return new ProductoForm(nombre, f.sectorId(), f.unidad());
    }

    // ---- Noticias ----
    public List<AdminNoticia> noticias(int usuarioId) { exigirAdmin(usuarioId); return repo.noticias(); }

    public int crearNoticia(int usuarioId, NoticiaForm f) {
        exigirAdmin(usuarioId);
        String titulo = texto(f.titulo(), "el título", 100), detalle = texto(f.detalle(), "el detalle", 200);
        if (repo.tituloNoticiaExiste(titulo)) throw new ApiException(HttpStatus.CONFLICT, "Ya existe una noticia con ese título");
        return repo.crearNoticia(new NoticiaForm(titulo, detalle));
    }

    public void borrarNoticia(int usuarioId, int id) {
        exigirAdmin(usuarioId);
        if (!repo.borrarNoticia(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Esa noticia no existe");
    }

    // ---- Promociones ----
    public List<AdminPromo> promociones(int usuarioId) { exigirAdmin(usuarioId); return repo.promociones(); }

    public int guardarPromocion(int usuarioId, PromoForm f) {
        exigirAdmin(usuarioId);
        if (f.descuento() < 1 || f.descuento() > 90) throw invalido("El descuento debe estar entre 1% y 90%");
        if (!repo.puestoExiste(f.comercianteId())) throw new ApiException(HttpStatus.NOT_FOUND, "Ese puesto no existe");
        if (!repo.productoExiste(f.productoId())) throw new ApiException(HttpStatus.NOT_FOUND, "Ese producto no existe");
        if (!repo.precioExiste(f.comercianteId(), f.productoId()))
            throw invalido("El puesto todavía no vende ese producto: agrégalo primero con su precio");
        return repo.guardarPromocion(f);
    }

    public void borrarPromocion(int usuarioId, int id) {
        exigirAdmin(usuarioId);
        if (!repo.borrarPromocion(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Esa promoción no existe");
    }
}
