# Calidad de Software

## Integrantes

* Castro Mamani Sebastián Adriano
* Huamani Vasquez Juan José
* Yabar Carazas Melvin Jarred
* Zela Flores Gabriel Frank
* Díaz Chávez Hugo
* Castillo Tovar Angélica Valeria

## Descripción

Repositorio correspondiente al curso de **Calidad de Software**, donde se desarrollarán actividades, trabajos y proyectos relacionados con la calidad, evaluación, pruebas y mejora de productos de software.

## Objetivo

Aplicar conceptos, estándares y buenas prácticas de calidad de software durante el desarrollo y evaluación de sistemas.

---

**Curso:** Calidad de Software
**Docente:** Maribel Molina Barriga
**Año:** 2026

# Kasero - Mercado del Altiplano

Canal digital para promover la inserción de los mercados de abastos en plataformas digitales: los clientes encuentran a sus caseros, cotizan y comparan su canasta, piden con la modalidad de entrega que prefieran y se comunican con ellos, mientras los comerciantes ganan visibilidad y un canal de venta a distancia.

![Java](https://img.shields.io/badge/JAVA-21-ED8B00?style=for-the-badge\&logo=openjdk\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/SPRING_BOOT-4.1.1-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![Angular](https://img.shields.io/badge/ANGULAR-22-DD0031?style=for-the-badge\&logo=angular\&logoColor=white)
![Supabase](https://img.shields.io/badge/SUPABASE-PostgreSQL-3ECF8E?style=for-the-badge\&logo=supabase\&logoColor=white)
![Maven](https://img.shields.io/badge/MAVEN-3.10.0-C71A36?style=for-the-badge\&logo=apachemaven\&logoColor=white)
![Status](https://img.shields.io/badge/STATUS-v0.4.0-F2C94C?style=for-the-badge)

---

## 1. Funcionalidades

| Actor | Qué puede hacer |
| :---- | :-------------- |
| **Visitante** | Ver la página de presentación, explorar el mercado, buscar y filtrar puestos, ver perfiles y opiniones, comparar una canasta, consultar precios y su evolución semanal, y ver el mapa por pasillos |
| **Cliente** | Todo lo anterior, más: cotizar, pedir (envío, recojo en puesto o tercero autorizado con código), seguir sus pedidos, calificar comerciantes, guardar favoritos y chatear con el casero |
| **Comerciante** | Panel *Mi puesto*: actualizar los precios de su catálogo, ver los pedidos recibidos y avanzar su estado (en preparación, listo, entregado); responder los chats de su puesto |
| **Administrador** | Panel *Administración*: crear y editar puestos y productos, activar o desactivar puestos, publicar noticias y promociones, y vincular cuentas de comerciante |

Requisitos del Hito 1 cubiertos: R-01 cotizar, R-02 comparar, R-03 pedido y modalidades de entrega, R-04 buscar y filtrar, R-05 perfil del comerciante, R-06 precios referenciales y variación semanal, R-07 autenticación y R-08 inicio por sectores; además de chat (RF-11), reseñas y favoritos.

---

## 2. Arquitectura del Proyecto

Arquitectura en capas. El frontend Angular consume la API REST de Spring Boot, que accede a Supabase (PostgreSQL) a través de repositorios JDBC.

```text
┌─────────────────────────────────────────────┐
│           CAPA DE PRESENTACION              │
│                                             │
│ Angular 22 (frontend/)                      │
│ Controladores REST (controller/)            │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│       CAPA DE APLICACION / NEGOCIO          │
│                                             │
│ Servicios (service/): Auth, Catalogo,       │
│ Comparador, Cotizacion, Pedido, Resena,     │
│ Chat, Puesto, Favorito, Evolucion, Admin    │
│ Seguridad (security/) · Excepciones         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│           CAPA DE ACCESO A DATOS            │
│                                             │
│ Repositorios JDBC (repository/)             │
│ UsuarioRepositoryPort (puerto, ADR-001)     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             CAPA DE DOMINIO                 │
│                                             │
│ Modelo (model/) · DTOs (dto/)               │
└─────────────────────────────────────────────┘
```

Los servicios no conocen a Supabase: el acceso a datos se esconde detrás de los repositorios, y el de usuarios además detrás de un puerto (`UsuarioRepositoryPort`), lo que permite probar la autenticación con un repositorio en memoria.

---

## 3. Estructura de Directorios

```text
Kasero-App/
├── .github/workflows/ci.yml       Integración continua (GitHub Actions)
├── docs/
│   ├── adr/ADR-001-abstraccion-repositorio.md
│   ├── SUPABASE.md                Cómo configurar la base de datos
│   └── DESPLIEGUE.md              Docker y Azure App Service
├── frontend/                      Interfaz Angular 22
│   └── src/app/
│       ├── core/                  API, sesión, canasta, favoritos, modelos
│       ├── shared/                Header, footer, iconos, estrellas, gráfico
│       └── pages/                 Landing, acceso, mercado, buscar, puesto, ...
├── src/
│   ├── main/java/com/mercado/altiplano/
│   │   ├── controller/  dto/  exception/  model/
│   │   ├── repository/  security/  service/
│   │   └── MercadoApplication.java
│   ├── main/resources/
│   │   ├── db/schema.sql  db/data.sql     Esquema y datos iniciales (Supabase)
│   │   ├── application.properties
│   │   └── static/                Frontend compilado (no se versiona)
│   └── test/java/                 Pruebas unitarias e integración
├── Dockerfile · ejecutar.bat · pom.xml
└── README.md
```

---

## 4. Tecnologías y Herramientas

| Tecnología / Herramienta | Versión | Uso                                          |
| :----------------------- | :------ | :------------------------------------------- |
| **Java**                 | 21      | Lenguaje del backend                         |
| **Spring Boot**          | 4.1.1   | API REST                                     |
| **Supabase (PostgreSQL)**| -       | Base de datos (ver `docs/SUPABASE.md`)       |
| **Angular**              | 22      | Interfaz web (componentes, rutas, servicios) |
| **TypeScript / SCSS**    | -       | Código y estilos del frontend                |
| **Lucide**               | -       | Iconos vectoriales (`@lucide/angular`)       |
| **DM Sans + Inter**      | -       | Tipografías autohospedadas                   |
| **Maven**                | 3.10.0  | Construcción y dependencias del backend      |
| **JUnit 5 + Mockito**    | -       | Pruebas unitarias                            |
| **PostgreSQL embebido**  | 14      | Pruebas de integración sin Supabase          |
| **GitHub Actions**       | -       | Integración continua                         |

---

## 5. Ejecución

### Requisitos

Java 21, Maven 3.10, Node.js 22 o superior y un proyecto de Supabase.

### Base de datos (Supabase)

Define `SUPABASE_DB_URL`, `SUPABASE_DB_USER` y `SUPABASE_DB_PASSWORD` siguiendo [`docs/SUPABASE.md`](docs/SUPABASE.md).
Al iniciar, la app crea las tablas y carga los datos de las 10 caseras entrevistadas (`src/main/resources/db/`).
Las credenciales nunca van en el código.

### Iniciar la aplicación

En la misma ventana donde definiste las variables:

```powershell
ejecutar.bat
```

Compila el frontend (`frontend/` → `src/main/resources/static/`) y levanta Spring Boot en http://localhost:8080.
Para hacerlo a mano:

```powershell
cd frontend
npm install
npm run build
cd ..
mvn spring-boot:run
```

Para desarrollar con recarga en vivo, deja Spring Boot corriendo y ejecuta `npm start` en `frontend/`
(http://localhost:4200, con proxy a `/api`).

### Modo demo sin Supabase

Levanta la aplicación completa sobre un PostgreSQL embebido (los datos duran mientras el proceso corre):

```powershell
mvn spring-boot:test-run -Dspring-boot.run.main-class=com.mercado.altiplano.ServidorDemo
```

Abre http://localhost:8081 (requiere haber compilado antes el frontend).

### Pruebas

```powershell
mvn test
```

127 pruebas, todas en verde:

* **Unitarias (JUnit 5 + Mockito):** hash de contraseñas, sesiones, autenticación, búsqueda y orden, comparador,
  cotizaciones sin duplicados, pedidos, calificaciones, chat, panel del comerciante, favoritos, evolución de precios y administración.
* **Integración con PostgreSQL real embebido:** aplica `schema.sql` y `data.sql` (varias veces, son idempotentes) y recorre
  el flujo completo con los repositorios JDBC (13 pruebas).
* **Arranque de la aplicación y API por HTTP:** JSON, códigos de estado y control de acceso por rol (4 pruebas).

### Integración continua y despliegue

`.github/workflows/ci.yml` ejecuta en GitHub Actions las pruebas, la compilación de Angular y el empaquetado del JAR en cada push.
Hay un `Dockerfile` listo. Ver [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

---

## 6. Cuentas de Prueba

Se crean al iniciar (contraseña guardada con PBKDF2). Son solo para desarrollo: cámbialas o elimínalas en producción.

| Rol | Correo | Contraseña | Para qué sirve |
| :-- | :----- | :--------- | :------------- |
| Cliente | `demo@kasero.local` | `123456` | Cotizar, pedir, calificar, favoritos y chat |
| Comerciante (puesto de Nilda) | `nilda@kasero.local` | `123456` | Botón *Mi puesto* y responder chats |
| Administrador | `admin@kasero.local` | `123456` | Botón *Administración* |

También puedes registrarte desde la pantalla de acceso (contraseña de 8 o más caracteres).
Para probar el chat, escribe como `demo` desde el perfil de Nilda (*Chatear*) y responde como `nilda` en *Mensajes* desde otra ventana.

---

## 7. API REST

| Grupo | Endpoints |
| :---- | :-------- |
| Autenticación | `POST /api/auth/login` · `/registro` · `/logout` · `GET /api/auth/me` |
| Catálogo (público) | `GET /api/sectores` · `/productos` · `/promociones` · `/noticias` · `/comerciantes` (`q`, `sector`, `orden`) · `/comerciantes/{id}` |
| Precios (público) | `GET /api/precios/resumen` · `/precios/evolucion` · `POST /api/comparaciones` |
| Opiniones | `GET` y `POST /api/comerciantes/{id}/resenas` |
| Cliente (sesión) | `POST` y `GET /api/cotizaciones` · `/pedidos` · `GET /api/chats` · `POST /api/chats` · `GET` y `POST /api/chats/{id}/mensajes` · `GET`, `PUT` y `DELETE /api/favoritos/{id}` |
| Comerciante (sesión) | `GET /api/mi-puesto` · `PUT` y `DELETE /api/mi-puesto/precios/{productoId}` · `GET /api/mi-puesto/pedidos` · `PUT /api/mi-puesto/pedidos/{id}/estado` |
| Administración | `/api/admin/puestos` · `/productos` · `/noticias` · `/promociones` (CRUD) · `POST /api/admin/puestos/{id}/cuenta` |

Las rutas con sesión usan `Authorization: Bearer <token>` (sesión de 8 horas). Los errores devuelven `{"exitoso": false, "mensaje": "..."}`.

---

## 8. Modelo de Datos

Tablas en Supabase: `usuarios`, `sectores`, `comerciantes`, `productos`, `precios`, `precios_historial`, `cotizaciones`,
`cotizacion_items`, `pedidos`, `promociones`, `noticias`, `resenas`, `chats`, `mensajes` y `favoritos`.

Los datos de los comerciantes provienen de la entrevista a los caseros (`Entrevista FA.xlsx`). Para el catálogo se aplicaron estas reglas:
el número de puesto es un valor aleatorio entre 1 y 35, y las secciones no comestibles (tecnología, ropa) se reemplazaron por rubros de comida.
Los precios, las promociones y el historial de semanas anteriores son **datos de ejemplo**.

---

## 9. Decisiones Arquitectonicas

Se desacopló la lógica de autenticación de la persistencia concreta mediante `UsuarioRepositoryPort`, y el tratamiento de errores HTTP
se centralizó en `GlobalExceptionHandler`. Mejoran el bajo acoplamiento, la modificabilidad, la reutilización y la comprobabilidad.
Detalle en [`docs/adr/ADR-001-abstraccion-repositorio.md`](docs/adr/ADR-001-abstraccion-repositorio.md).

---

## 10. Calidad (ISO/IEC 25010)

| Característica | Cómo se aplica |
| :------------- | :------------- |
| Adecuación funcional | Reglas de negocio con pruebas por requisito (cotizar, comparar, pedir, buscar, perfil, autenticación) |
| Fiabilidad | Cotizaciones sin duplicados (clave de solicitud), historial con fechas y estados, scripts SQL idempotentes |
| Seguridad | Contraseñas con PBKDF2 (600 000 iteraciones), sesión de 8 horas, mensajes de error que no revelan qué dato falló, control de acceso por rol, nombres abreviados en datos públicos |
| Mantenibilidad | Capas, puertos de repositorio, clases pequeñas, convenciones y documentación |
| Usabilidad y accesibilidad | Estados de carga, vacío y error, etiquetas en formularios, foco visible, enlace para saltar al contenido, modo oscuro |
| Portabilidad | Diseño adaptable a teléfono, tablet y computadora |

---

## 11. Alcance Actual

### Implementado

* [x] Autenticación (registro, ingreso, cierre de sesión) con contraseña cifrada
* [x] Persistencia en Supabase (PostgreSQL)
* [x] Búsqueda, filtros por sector y orden por precio, calificación o cotizaciones
* [x] Perfil del puesto, comparador de canasta y cotizaciones sin duplicados
* [x] Pedidos con envío, recojo en puesto o tercero autorizado (código de entrega)
* [x] Precios promedio y evolución semanal
* [x] Calificaciones y reseñas
* [x] Chat cliente-comerciante
* [x] Favoritos y mapa del mercado por pasillos
* [x] Panel del comerciante y panel de administración
* [x] Interfaz Angular con landing de captación
* [x] Pruebas unitarias e integración, integración continua y Dockerfile

### Pendiente

* [ ] Carga de datos abiertos reales (CENAMA y MIDAGRI) para los precios referenciales
* [ ] Despliegue en la nube (Azure) con las cuentas del equipo
* [ ] Sesiones persistentes (hoy se guardan en memoria)
* [ ] Prueba de la interfaz en Firefox y Edge

---

## 12. Estado del Proyecto

**Versión actual:** `v0.4.0`
**Estado:** En desarrollo
**Tipo:** Proyecto académico
