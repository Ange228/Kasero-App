@echo off
rem Compila el frontend Angular y levanta Spring Boot.
rem Antes define SUPABASE_DB_URL, SUPABASE_DB_USER y SUPABASE_DB_PASSWORD (ver docs/SUPABASE.md).
cd /d "%~dp0frontend"
call npm install
call npm run build || exit /b 1
cd /d "%~dp0"
call mvn spring-boot:run
