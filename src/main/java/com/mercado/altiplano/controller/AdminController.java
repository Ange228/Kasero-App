package com.mercado.altiplano.controller;

import com.mercado.altiplano.dto.AdminDtos.*;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.AdminService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

/** Panel de administración: todas las rutas exigen sesión de un usuario con rol ADMIN. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService admin;
    private final SesionService sesiones;

    public AdminController(AdminService admin, SesionService sesiones) {
        this.admin = admin;
        this.sesiones = sesiones;
    }

    private static Map<String, Object> ok() { return Map.of("exitoso", true); }

    private static Map<String, Object> creado(int id) { return Map.of("exitoso", true, "id", id); }

    // Puestos
    @GetMapping("/puestos")
    public List<AdminPuesto> puestos(@RequestHeader(value = "Authorization", required = false) String h) {
        return admin.puestos(sesiones.requerir(h));
    }

    @PostMapping("/puestos")
    public Map<String, Object> crearPuesto(@RequestHeader(value = "Authorization", required = false) String h, @RequestBody PuestoForm f) {
        return creado(admin.crearPuesto(sesiones.requerir(h), f));
    }

    @PutMapping("/puestos/{id}")
    public Map<String, Object> actualizarPuesto(@PathVariable int id, @RequestBody PuestoForm f,
                                                @RequestHeader(value = "Authorization", required = false) String h) {
        admin.actualizarPuesto(sesiones.requerir(h), id, f);
        return ok();
    }

    @PutMapping("/puestos/{id}/activo")
    public Map<String, Object> activo(@PathVariable int id, @RequestBody ActivoRequest r,
                                      @RequestHeader(value = "Authorization", required = false) String h) {
        admin.cambiarActivo(sesiones.requerir(h), id, r.activo());
        return ok();
    }

    @PostMapping("/puestos/{id}/cuenta")
    public Map<String, Object> cuenta(@PathVariable int id, @RequestBody CuentaRequest r,
                                      @RequestHeader(value = "Authorization", required = false) String h) {
        admin.asignarCuenta(sesiones.requerir(h), id, r.correo());
        return ok();
    }

    // Productos
    @GetMapping("/productos")
    public List<AdminProducto> productos(@RequestHeader(value = "Authorization", required = false) String h) {
        return admin.productos(sesiones.requerir(h));
    }

    @PostMapping("/productos")
    public Map<String, Object> crearProducto(@RequestHeader(value = "Authorization", required = false) String h, @RequestBody ProductoForm f) {
        return creado(admin.crearProducto(sesiones.requerir(h), f));
    }

    @PutMapping("/productos/{id}")
    public Map<String, Object> actualizarProducto(@PathVariable int id, @RequestBody ProductoForm f,
                                                  @RequestHeader(value = "Authorization", required = false) String h) {
        admin.actualizarProducto(sesiones.requerir(h), id, f);
        return ok();
    }

    // Noticias
    @GetMapping("/noticias")
    public List<AdminNoticia> noticias(@RequestHeader(value = "Authorization", required = false) String h) {
        return admin.noticias(sesiones.requerir(h));
    }

    @PostMapping("/noticias")
    public Map<String, Object> crearNoticia(@RequestHeader(value = "Authorization", required = false) String h, @RequestBody NoticiaForm f) {
        return creado(admin.crearNoticia(sesiones.requerir(h), f));
    }

    @DeleteMapping("/noticias/{id}")
    public Map<String, Object> borrarNoticia(@PathVariable int id, @RequestHeader(value = "Authorization", required = false) String h) {
        admin.borrarNoticia(sesiones.requerir(h), id);
        return ok();
    }

    // Promociones
    @GetMapping("/promociones")
    public List<AdminPromo> promociones(@RequestHeader(value = "Authorization", required = false) String h) {
        return admin.promociones(sesiones.requerir(h));
    }

    @PostMapping("/promociones")
    public Map<String, Object> guardarPromocion(@RequestHeader(value = "Authorization", required = false) String h, @RequestBody PromoForm f) {
        return creado(admin.guardarPromocion(sesiones.requerir(h), f));
    }

    @DeleteMapping("/promociones/{id}")
    public Map<String, Object> borrarPromocion(@PathVariable int id, @RequestHeader(value = "Authorization", required = false) String h) {
        admin.borrarPromocion(sesiones.requerir(h), id);
        return ok();
    }
}
