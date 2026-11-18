# ADR-001 · Abstracción del repositorio de usuarios

**Estado:** Aceptada · **Fecha:** 2026

## Contexto

La primera versión del módulo de autenticación hacía que `AuthService` dependiera directamente de la clase concreta
`UsuarioRepository`. Eso ataba la lógica de negocio a la tecnología de persistencia (primero memoria, luego Supabase) y
dificultaba probar el servicio de forma aislada.

## Decisión

Introducir el puerto `UsuarioRepositoryPort` en la capa de acceso a datos:

```text
AuthService ──▶ UsuarioRepositoryPort ◀── UsuarioRepository (JDBC / Supabase)
```

`AuthService` y `AdminService` dependen solo de la interfaz. La implementación concreta puede cambiarse sin tocar la lógica.
Además, los errores de negocio se lanzan como `ApiException` (por ejemplo `AuthenticationException`) y un único
`GlobalExceptionHandler` los traduce a respuestas HTTP.

## Consecuencias

* **Bajo acoplamiento y modificabilidad:** pasar de datos en memoria a Supabase solo cambió la implementación del repositorio.
* **Comprobabilidad:** `AuthServiceTest` usa un repositorio en memoria sin base de datos.
* **Costo:** una interfaz adicional que mantener.
* **Alcance:** el patrón se aplicó a usuarios; el resto de repositorios son clases JDBC inyectadas directamente. Extender el
  puerto a ellos es una mejora posible si se necesitara cambiar de motor de base de datos.
