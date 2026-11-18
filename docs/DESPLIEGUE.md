# Despliegue de Kasero

La aplicación es una sola pieza: Spring Boot sirve la API y el frontend Angular compilado.
La base de datos es Supabase (PostgreSQL), así que el servidor solo necesita Java 21 y tres variables.

## Integración continua (GitHub Actions)

El flujo `.github/workflows/ci.yml` se ejecuta solo en cada push y pull request:

| Trabajo | Qué hace |
|---|---|
| **backend** | `mvn test`: las pruebas unitarias |
| **frontend** | `npm ci` + `npm run build`: compila Angular |
| **paquete** | Compila todo y genera el JAR (se descarga como artefacto `kasero-jar`) |

Se ve en la pestaña **Actions** del repositorio. No requiere secretos: las pruebas no usan la base de datos.

## Variables de entorno

| Variable | Valor |
|---|---|
| `SUPABASE_DB_URL` | `jdbc:postgresql://<host-del-pooler>:5432/postgres?sslmode=require` |
| `SUPABASE_DB_USER` | `postgres.<project-ref>` |
| `SUPABASE_DB_PASSWORD` | contraseña de la base de datos |
| `PORT` | (opcional) puerto; por defecto 8080 |

Nunca las guardes en el repositorio: se configuran en el panel del servicio donde se despliegue.

## Opción A · Docker (cualquier proveedor)

```bash
docker build -t kasero .
docker run -p 8080:8080 -e SUPABASE_DB_URL="..." -e SUPABASE_DB_USER="..." -e SUPABASE_DB_PASSWORD="..." kasero
```

Sirve para Azure Container Apps, Render, Railway, Fly.io, etc.: se conecta el repositorio, el proveedor
construye con el `Dockerfile` y se cargan las tres variables.

## Opción B · Azure App Service (propuesta del Hito 1)

1. Crear un **App Service** con runtime **Java 21** (Linux).
2. En **Configuración → Variables de entorno**, agregar `SUPABASE_DB_URL`, `SUPABASE_DB_USER` y `SUPABASE_DB_PASSWORD`.
3. Subir el JAR generado por el trabajo **paquete** (artefacto `kasero-jar`) con *Despliegue → Centro de implementación*
   o con `az webapp deploy --src-path target/<archivo>.jar --type jar`.

## Antes de publicar para usuarios reales

- Cambiar o eliminar las cuentas de prueba (`demo@`, `nilda@`, `admin@kasero.local`, todas con contraseña `123456`);
  se crean en `UsuarioDemoInicial` al iniciar.
- Los datos de evolución de precios de semanas anteriores son de **ejemplo** (`data.sql`).
- Las sesiones se guardan en memoria: al reiniciar el servidor hay que iniciar sesión de nuevo.
