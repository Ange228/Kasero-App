package com.mercado.altiplano;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mercado.altiplano.dto.AdminDtos.*;
import com.mercado.altiplano.dto.CatalogoDtos.*;
import com.mercado.altiplano.dto.ResenaDtos.ResenaRequest;
import com.mercado.altiplano.exception.ApiException;
import com.mercado.altiplano.repository.*;
import com.mercado.altiplano.security.PasswordHasher;
import com.mercado.altiplano.security.SesionService;
import com.mercado.altiplano.service.*;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.math.BigDecimal;
import java.sql.Connection;
import java.util.List;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;

/**
 * Recorrido completo contra un PostgreSQL REAL (embebido, igual que Supabase): aplica schema.sql y data.sql
 * y ejercita los servicios con sus repositorios JDBC. Detecta errores de SQL que las pruebas con mocks no ven.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class IntegracionBdTest {
    private EmbeddedPostgres pg;
    private DataSource ds;
    private JdbcTemplate jdbc;

    private AuthService auth;
    private CatalogoService catalogo;
    private ComparadorService comparador;
    private CotizacionService cotizaciones;
    private PedidoService pedidos;
    private ResenaService resenas;
    private ChatService chats;
    private PuestoService puesto;
    private FavoritoService favoritos;
    private EvolucionService evolucion;
    private AdminService admin;

    private int demo, nilda, adminId;       // ids de usuario
    private int idNilda;                    // id del puesto de Nilda
    private int cotizacionId, pedidoId;

    private void aplicarScripts() throws Exception {
        try (Connection c = ds.getConnection()) {
            ScriptUtils.executeSqlScript(c, new ClassPathResource("db/schema.sql"));
            ScriptUtils.executeSqlScript(c, new ClassPathResource("db/data.sql"));
        }
    }

    @BeforeAll
    void iniciar() throws Exception {
        pg = EmbeddedPostgres.start();
        ds = pg.getPostgresDatabase();
        jdbc = new JdbcTemplate(ds);
        aplicarScripts();

        var hasher = new PasswordHasher();
        var sesiones = new SesionService();
        var usuarios = new UsuarioRepository(jdbc);
        new UsuarioDemoInicial(usuarios, hasher, jdbc).run(null);
        auth = new AuthService(usuarios, hasher, sesiones);

        var catalogoRepo = new CatalogoRepository(jdbc);
        catalogo = new CatalogoService(catalogoRepo);
        comparador = new ComparadorService(catalogo, catalogoRepo);
        var tx = new TransaccionRepository(jdbc);
        cotizaciones = new CotizacionService(tx);
        pedidos = new PedidoService(tx);
        resenas = new ResenaService(new ResenaRepository(jdbc));
        chats = new ChatService(new ChatRepository(jdbc));
        puesto = new PuestoService(new PuestoRepository(jdbc));
        favoritos = new FavoritoService(new FavoritoRepository(jdbc), catalogo);
        evolucion = new EvolucionService(new HistorialRepository(jdbc));
        admin = new AdminService(new AdminRepository(jdbc), usuarios);

        demo = auth.login("demo@kasero.local", "123456").usuarioId();
        nilda = auth.login("nilda@kasero.local", "123456").usuarioId();
        adminId = auth.login("admin@kasero.local", "123456").usuarioId();
        idNilda = jdbc.queryForObject("SELECT id FROM comerciantes WHERE nombre = 'Nilda'", Integer.class);
    }

    @AfterAll
    void cerrar() throws Exception {
        if (pg != null) pg.close();
    }

    private int producto(String nombre) {
        return catalogo.productos().stream().filter(p -> p.nombre().equals(nombre)).findFirst().orElseThrow().id();
    }

    private static ItemCanasta item(int pid, String cant) { return new ItemCanasta(pid, new BigDecimal(cant)); }

    // ------------------------------------------------------------------ esquema y datos

    @Test @Order(1)
    void elEsquemaYLosDatosSeAplicanVariasVecesSinError() throws Exception {
        aplicarScripts();
        aplicarScripts();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM comerciantes", Integer.class)).isEqualTo(10);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sectores", Integer.class)).isEqualTo(7);
    }

    @Test @Order(2)
    void lasCaserasDelExcelSeCargaronConPuestosAleatoriosYSeccionesDeComida() {
        assertThat(jdbc.queryForList("SELECT nro_puesto FROM comerciantes", Integer.class))
                .hasSize(10).doesNotHaveDuplicates().allMatch(n -> n >= 1 && n <= 35);
        assertThat(jdbc.queryForList("SELECT seccion FROM comerciantes", String.class))
                .noneMatch(s -> s.toLowerCase().contains("tecnolog") || s.toLowerCase().contains("ropa"))
                .contains("Comida preparada", "Abarrotes y panadería");
    }

    @Test @Order(3)
    void lasCuentasDeLaPlataformaExisten() {
        assertThat(jdbc.queryForObject("SELECT rol FROM usuarios WHERE correo = 'admin@kasero.local'", String.class)).isEqualTo("ADMIN");
        assertThat(jdbc.queryForObject("SELECT comerciante_id FROM usuarios WHERE correo = 'nilda@kasero.local'", Integer.class)).isEqualTo(idNilda);
        assertThat(auth.login("demo@kasero.local", "123456").rol()).isEqualTo("CLIENTE");
    }

    // ------------------------------------------------------------------ catálogo y comparador

    @Test @Order(4)
    void laBusquedaYElPerfilFuncionanContraLaBase() {
        assertThat(catalogo.buscar("papa", null, null)).extracting(Comerciante::nombre).contains("Nilda", "Angela", "Lourdes");
        assertThat(catalogo.buscar("pollo", null, null)).extracting(Comerciante::nombre).contains("Melany", "Luis Alberto");
        assertThat(catalogo.buscar(null, "Carnes", "calificacion")).hasSize(4); // Micaela, María, Melany y Luis Alberto (comida preparada reubicada)
        assertThat(catalogo.detalle(idNilda).precios()).hasSize(4);
        assertThat(catalogo.promociones()).isNotEmpty();
        assertThat(catalogo.noticias()).hasSize(2);
        assertThat(catalogo.resumenPrecios().promedios()).isNotEmpty();
    }

    @Test @Order(5)
    void elComparadorOrdenaLosPuestosQueVendenLaCanastaCompleta() {
        var r = comparador.comparar(List.of(item(producto("Papa"), "2"), item(producto("Cebolla"), "1"),
                item(producto("Tomate"), "1"), item(producto("Zanahoria"), "1")));
        assertThat(r.completos()).extracting(f -> f.comerciante().nombre()).containsExactly("Nilda", "Angela", "Lourdes");
        assertThat(r.completos().get(0).total()).isEqualByComparingTo("12.50");
        assertThat(r.completos().get(0).masEconomico()).isTrue();
    }

    // ------------------------------------------------------------------ cotización, pedido y reseña

    @Test @Order(6)
    void cotizarSinDuplicarYRechazarProductosQueNoSeVenden() {
        var items = List.of(item(producto("Papa"), "2"), item(producto("Cebolla"), "1"));
        var c = cotizaciones.crear(demo, new CotizacionRequest(idNilda, "clave-integracion-1", items));
        cotizacionId = c.id();
        assertThat(c.estado()).isEqualTo("PENDIENTE");
        assertThat(c.total()).isEqualByComparingTo("6.50");
        assertThat(c.items()).hasSize(2);

        assertThat(cotizaciones.crear(demo, new CotizacionRequest(idNilda, "clave-integracion-1", items)).id()).isEqualTo(cotizacionId);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM cotizaciones", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT cotizaciones FROM comerciantes WHERE id = ?", Integer.class, idNilda)).isEqualTo(325);

        assertThatThrownBy(() -> cotizaciones.crear(demo, new CotizacionRequest(idNilda, "clave-2", List.of(item(producto("Fresa"), "1")))))
                .isInstanceOf(ApiException.class).hasMessageContaining("Fresa");
        assertThat(cotizaciones.historial(demo)).hasSize(1);
    }

    @Test @Order(7)
    void elPedidoConTerceroGeneraCodigoYSeVeEnElHistorial() {
        var p = pedidos.crear(demo, new PedidoRequest(cotizacionId, "TERCERO", null, "Marco Quispe"));
        pedidoId = p.id();
        assertThat(p.codigoEntrega()).matches("\\d{6}");
        assertThat(p.estado()).isEqualTo("EN_PREPARACION");
        assertThat(pedidos.historial(demo)).hasSize(1);
        assertThat(cotizaciones.historial(demo).get(0).tienePedido()).isTrue();
        assertThatThrownBy(() -> pedidos.crear(demo, new PedidoRequest(cotizacionId, "RECOJO", null, null)))
                .isInstanceOf(ApiException.class);
    }

    @Test @Order(8)
    void soloQuienComproPuedeCalificarYElPromedioSeActualiza() {
        int otro = auth.registrar("Beto Rojas", "beto@correo.com", "clave12345").usuarioId();
        assertThatThrownBy(() -> resenas.calificar(otro, idNilda, new ResenaRequest(5, "ok")))
                .isInstanceOf(ApiException.class).hasMessageContaining("pedido");

        var r = resenas.calificar(demo, idNilda, new ResenaRequest(5, "Excelente atención"));
        assertThat(r.numCalificaciones()).isEqualTo(129);
        assertThat(r.calificacion()).isEqualTo(4.80);          // (4.80 * 128 + 5) / 129 = 4.8016
        var cambio = resenas.calificar(demo, idNilda, new ResenaRequest(3, null));
        assertThat(cambio.numCalificaciones()).isEqualTo(129);  // la misma persona no suma otra
        assertThat(resenas.listar(idNilda)).hasSize(1);
        assertThat(resenas.listar(idNilda).get(0).usuario()).isEqualTo("Usuario D.");
    }

    // ------------------------------------------------------------------ chat

    @Test @Order(9)
    void elClienteYLaCaseraConversanYUnTerceroNoPuedeLeer() {
        var chat = chats.abrir(demo, idNilda);
        assertThat(chats.abrir(demo, idNilda).id()).isEqualTo(chat.id());          // no duplica
        chats.enviar(demo, chat.id(), "Casera, ¿tiene papa yungay?");
        chats.enviar(nilda, chat.id(), "Sí tengo, ¿cuánta cantidad?");

        var vistoPorCliente = chats.mensajes(demo, chat.id(), 0);
        assertThat(vistoPorCliente).extracting(m -> m.autor()).containsExactly("CLIENTE", "COMERCIANTE");
        assertThat(vistoPorCliente).extracting(m -> m.mio()).containsExactly(true, false);
        assertThat(chats.mensajes(nilda, chat.id(), vistoPorCliente.get(0).id())).hasSize(1);   // solo los nuevos

        assertThat(chats.mis(demo).get(0).contraparte()).isEqualTo("Nilda");
        assertThat(chats.mis(nilda).get(0).contraparte()).isEqualTo("Usuario D.");
        assertThat(chats.mis(demo).get(0).ultimoMensaje()).startsWith("Sí tengo");

        int extrano = auth.login("beto@correo.com", "clave12345").usuarioId();
        assertThatThrownBy(() -> chats.mensajes(extrano, chat.id(), 0)).isInstanceOf(ApiException.class);
    }

    // ------------------------------------------------------------------ panel del comerciante

    @Test @Order(10)
    void laCaseraCambiaPreciosYAvanzaElPedido() {
        int papa = producto("Papa");
        puesto.fijarPrecio(nilda, papa, new BigDecimal("2.40"));
        assertThat(catalogo.detalle(idNilda).precios().stream().filter(p -> p.productoId() == papa).findFirst().orElseThrow().precio())
                .isEqualByComparingTo("2.40");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM precios_historial WHERE comerciante_id = ? AND producto_id = ? AND registrado_en = CURRENT_DATE",
                Integer.class, idNilda, papa)).isEqualTo(1);

        var recibidos = puesto.pedidos(nilda);
        assertThat(recibidos).hasSize(1);
        assertThat(recibidos.get(0).cliente()).isEqualTo("Usuario D.");
        assertThat(recibidos.get(0).items()).hasSize(2);

        assertThatThrownBy(() -> puesto.cambiarEstado(nilda, pedidoId, "ENTREGADO")).isInstanceOf(ApiException.class);
        puesto.cambiarEstado(nilda, pedidoId, "LISTO");
        assertThat(pedidos.historial(demo).get(0).estado()).isEqualTo("LISTO");
        assertThatThrownBy(() -> puesto.pedidos(demo)).isInstanceOf(ApiException.class);   // un cliente no entra al panel

        puesto.quitarPrecio(nilda, producto("Zanahoria"));
        assertThat(catalogo.detalle(idNilda).precios()).hasSize(3);
    }

    // ------------------------------------------------------------------ favoritos y evolución

    @Test @Order(11)
    void favoritosSeAgreganListanYQuitan() {
        favoritos.agregar(demo, idNilda);
        favoritos.agregar(demo, idNilda);                                    // repetir no falla
        assertThat(favoritos.listar(demo)).extracting(Comerciante::nombre).containsExactly("Nilda");
        favoritos.quitar(demo, idNilda);
        assertThat(favoritos.listar(demo)).isEmpty();
    }

    @Test @Order(12)
    void laEvolucionSemanalUsaElHistorialDeEjemploYLaSemanaActual() {
        var e = evolucion.evolucion();
        assertThat(e.semanas()).hasSize(4);
        assertThat(e.series()).extracting(s -> s.producto()).contains("Papa", "Cebolla", "Tomate");
        var papa = e.series().stream().filter(s -> s.producto().equals("Papa")).findFirst().orElseThrow();
        assertThat(papa.valores()).doesNotContainNull();
        assertThat(papa.variacion()).isNotNull();
        assertThat(e.variacionGeneral()).isNotNull();
    }

    // ------------------------------------------------------------------ administración

    @Test @Order(13)
    void elAdministradorGestionaPuestosProductosNoticiasYPromociones() {
        int sectorVerduras = jdbc.queryForObject("SELECT id FROM sectores WHERE nombre = 'Verduras'", Integer.class);
        int nuevo = admin.crearPuesto(adminId, new PuestoForm("Rosa", 30, 8, "Verduras", sectorVerduras, "Yape", "Sí"));
        assertThat(admin.puestos(adminId)).hasSize(11);
        assertThatThrownBy(() -> admin.crearPuesto(adminId, new PuestoForm("rosa", 31, 8, "Verduras", sectorVerduras, "Yape", "Sí")))
                .isInstanceOf(ApiException.class).hasMessageContaining("Ya existe");

        admin.actualizarPuesto(adminId, nuevo, new PuestoForm("Rosa", 31, 8, "Verduras y hierbas", sectorVerduras, "Yape y Plin", "Algunas veces"));
        assertThat(jdbc.queryForObject("SELECT seccion FROM comerciantes WHERE id = ?", String.class, nuevo)).isEqualTo("Verduras y hierbas");

        int choclo = admin.crearProducto(adminId, new ProductoForm("Choclo", sectorVerduras, "unidad"));
        assertThat(admin.productos(adminId)).extracting(AdminProducto::nombre).contains("Choclo");
        puesto.fijarPrecio(nilda, choclo, new BigDecimal("1.50"));
        admin.guardarPromocion(adminId, new PromoForm(idNilda, choclo, 25));
        assertThat(catalogo.promociones()).extracting(Promocion::producto).contains("Choclo");
        assertThat(admin.promociones(adminId)).extracting(AdminPromo::producto).contains("Choclo");

        int noticia = admin.crearNoticia(adminId, new NoticiaForm("Feria del choclo", "Este sábado en el pasillo 4"));
        assertThat(catalogo.noticias()).extracting(Noticia::titulo).contains("Feria del choclo");
        admin.borrarNoticia(adminId, noticia);
        assertThat(catalogo.noticias()).extracting(Noticia::titulo).doesNotContain("Feria del choclo");

        admin.asignarCuenta(adminId, nuevo, "beto@correo.com");
        assertThat(admin.puestos(adminId).stream().filter(p -> p.id() == nuevo).findFirst().orElseThrow().cuenta()).isEqualTo("beto@correo.com");

        admin.cambiarActivo(adminId, nuevo, false);
        assertThat(catalogo.buscar("rosa", null, null)).isEmpty();           // un puesto inactivo no aparece en la búsqueda

        assertThatThrownBy(() -> admin.puestos(demo)).isInstanceOf(ApiException.class);
    }
}
