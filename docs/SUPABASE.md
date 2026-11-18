# Configuración de Supabase para Kasero

La app usa Supabase como base de datos PostgreSQL. El esquema (`src/main/resources/db/schema.sql`)
y los datos iniciales (`data.sql`) se aplican solos al iniciar la app (son idempotentes).

## 1. Crear el proyecto
1. Entra a https://supabase.com y crea un proyecto (nombre sugerido: `kasero`).
2. Guarda la **Database Password** que elijas.
3. Ve a **Project Settings → Database → Connection string → JDBC** y copia el host
   (usa el *Session pooler* si tu red no tiene IPv6).

## 2. Variables de entorno (PowerShell / CMD)
```powershell
$env:SUPABASE_DB_URL      = "jdbc:postgresql://<host>:5432/postgres?sslmode=require"
$env:SUPABASE_DB_USER     = "postgres"          # con pooler: postgres.<project-ref>
$env:SUPABASE_DB_PASSWORD = "<tu password>"
```
Nunca subas estas credenciales a GitHub (`.env` está en `.gitignore`).

## 3. Ejecutar
```powershell
mvn spring-boot:run
```
Abre http://localhost:8080
