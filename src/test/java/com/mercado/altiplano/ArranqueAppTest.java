package com.mercado.altiplano;

import static org.assertj.core.api.Assertions.assertThat;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/**
 * Arranca la aplicación completa (Spring + scripts SQL + cuentas demo) sobre un PostgreSQL embebido y
 * prueba la API por HTTP real: JSON, códigos de estado y control de acceso por rol.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ArranqueAppTest {
    private static final EmbeddedPostgres PG = iniciar();
    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired
    private Environment env;

    private static EmbeddedPostgres iniciar() {
        try { return EmbeddedPostgres.start(); } catch (IOException e) { throw new IllegalStateException(e); }
    }

    @DynamicPropertySource
    static void propiedades(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> PG.getJdbcUrl("postgres", "postgres"));
        r.add("spring.datasource.username", () -> "postgres");
        r.add("spring.datasource.password", () -> "postgres");
    }

    @AfterAll
    static void cerrar() throws IOException { PG.close(); }

    private HttpResponse<String> pedir(String metodo, String ruta, String token, String cuerpo) throws Exception {
        var b = HttpRequest.newBuilder(URI.create("http://localhost:" + env.getProperty("local.server.port") + ruta))
                .header("Content-Type", "application/json");
        if (token != null) b.header("Authorization", "Bearer " + token);
        b.method(metodo, cuerpo == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(cuerpo));
        return http.send(b.build(), HttpResponse.BodyHandlers.ofString());
    }

    private String ingresar(String correo) throws Exception {
        var r = pedir("POST", "/api/auth/login", null, "{\"correo\":\"" + correo + "\",\"password\":\"123456\"}");
        assertThat(r.statusCode()).isEqualTo(200);
        return r.body().replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    @Test
    void laAplicacionArrancaYSirveElCatalogoPublico() throws Exception {
        var sectores = pedir("GET", "/api/sectores", null, null);
        assertThat(sectores.statusCode()).isEqualTo(200);
        assertThat(sectores.body()).contains("Verduras", "Frutas", "Carnes");

        var busqueda = pedir("GET", "/api/comerciantes?q=papa&orden=precio_asc", null, null);
        assertThat(busqueda.statusCode()).isEqualTo(200);
        assertThat(busqueda.body()).contains("Nilda");

        assertThat(pedir("GET", "/api/precios/evolucion", null, null).body()).contains("\"semanas\"");
        assertThat(pedir("GET", "/api/promociones", null, null).statusCode()).isEqualTo(200);
        assertThat(pedir("GET", "/api/comerciantes/9999", null, null).statusCode()).isEqualTo(404);
    }

    @Test
    void elLoginDevuelveTokenYRolYRechazaCredencialesMalas() throws Exception {
        var ok = pedir("POST", "/api/auth/login", null, "{\"correo\":\"demo@kasero.local\",\"password\":\"123456\"}");
        assertThat(ok.statusCode()).isEqualTo(200);
        assertThat(ok.body()).contains("\"exitoso\":true", "\"rol\":\"CLIENTE\"", "\"token\"");

        var mal = pedir("POST", "/api/auth/login", null, "{\"correo\":\"demo@kasero.local\",\"password\":\"mala\"}");
        assertThat(mal.statusCode()).isEqualTo(401);
        assertThat(mal.body()).contains("Correo o contraseña incorrectos");
    }

    @Test
    void lasRutasProtegidasExigenSesionYRespetanElRol() throws Exception {
        assertThat(pedir("GET", "/api/chats", null, null).statusCode()).isEqualTo(401);
        assertThat(pedir("GET", "/api/pedidos", null, null).statusCode()).isEqualTo(401);

        String cliente = ingresar("demo@kasero.local");
        assertThat(pedir("GET", "/api/pedidos", cliente, null).statusCode()).isEqualTo(200);
        assertThat(pedir("GET", "/api/admin/puestos", cliente, null).statusCode()).isEqualTo(403);
        assertThat(pedir("GET", "/api/mi-puesto", cliente, null).statusCode()).isEqualTo(403);

        String admin = ingresar("admin@kasero.local");
        var puestos = pedir("GET", "/api/admin/puestos", admin, null);
        assertThat(puestos.statusCode()).isEqualTo(200);
        assertThat(puestos.body()).contains("Nilda", "Oscar");

        String casera = ingresar("nilda@kasero.local");
        assertThat(pedir("GET", "/api/mi-puesto", casera, null).body()).contains("Nilda");
    }

    @Test
    void elFlujoDeCompraFuncionaPorHttp() throws Exception {
        String token = ingresar("demo@kasero.local");
        int idNilda = Integer.parseInt(pedir("GET", "/api/comerciantes?q=nilda", null, null).body()
                .replaceAll(".*?\"id\":(\\d+).*", "$1"));
        var cot = pedir("POST", "/api/cotizaciones", token, "{\"comercianteId\":" + idNilda
                + ",\"claveSolicitud\":\"http-1\",\"items\":[{\"productoId\":1,\"cantidad\":2}]}");
        assertThat(cot.statusCode()).isEqualTo(200);
        assertThat(cot.body()).contains("PENDIENTE");
        int cotId = Integer.parseInt(cot.body().replaceAll("^\\{\"id\":(\\d+).*", "$1"));

        var pedido = pedir("POST", "/api/pedidos", token, "{\"cotizacionId\":" + cotId + ",\"modalidad\":\"RECOJO\"}");
        assertThat(pedido.statusCode()).isEqualTo(200);
        assertThat(pedido.body()).contains("EN_PREPARACION");

        var sinModalidad = pedir("POST", "/api/pedidos", token, "{\"cotizacionId\":" + cotId + ",\"modalidad\":\"DRON\"}");
        assertThat(sinModalidad.statusCode()).isEqualTo(400);
    }
}
