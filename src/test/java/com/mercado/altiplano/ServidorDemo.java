package com.mercado.altiplano;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.springframework.boot.SpringApplication;

/**
 * Modo demo SIN Supabase: levanta un PostgreSQL embebido y la aplicación completa en el puerto 8081.
 * Los datos viven solo mientras el proceso está en marcha. Ejecutar con: mvn spring-boot:test-run
 * (compilar antes el frontend con "npm run build" dentro de frontend/).
 */
public class ServidorDemo {
    public static void main(String[] args) throws Exception {
        EmbeddedPostgres pg = EmbeddedPostgres.start();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            try { pg.close(); } catch (Exception ignorada) { /* cierre del demo */ }
        }));
        System.out.println("Demo con PostgreSQL embebido en " + pg.getJdbcUrl("postgres", "postgres"));
        SpringApplication.run(MercadoApplication.class,
                "--spring.datasource.url=" + pg.getJdbcUrl("postgres", "postgres"),
                "--spring.datasource.username=postgres",
                "--spring.datasource.password=postgres",
                "--server.port=8081");
    }
}
