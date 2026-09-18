# Implementación v11.2 — publicación autónoma desde la aplicación

## Objetivo

Completar las dos fusiones de una actualización semanal desde **Administrar PDF**, sin depender de localizar manualmente ramas o Pull Requests.

## Flujo nuevo

1. La persona administradora elige los ocho PDF e ingresa su clave de GitHub.
2. La aplicación sube los archivos, crea la rama `actualizacion/carga-web-…` y abre automáticamente el Pull Request de carga.
3. El panel muestra **Fusionar carga**. Al confirmarlo, los PDF entran en `main`.
4. Ese cambio inicia el workflow de extracción y validación.
5. El panel consulta GitHub hasta encontrar el Pull Request `publicacion/horarios-…` generado por el workflow.
6. Solo cuando la validación terminó muestra **Fusionar y publicar**.
7. La segunda confirmación incorpora `horarios.json`, `cabeceras.json`, el informe de cambios y el respaldo histórico.

Los dos Pull Requests conservan además un enlace directo para revisarlos en GitHub.

## Seguridad

La clave fina debe estar limitada al repositorio `LRamaDev/mi-portal-web` y tener únicamente:

- `Contents: Read and write`.
- `Pull requests: Read and write`.

La clave permanece solo en el campo mientras el panel está abierto y se borra al cerrar o al completar la publicación. El navegador conserva localmente únicamente el número de los Pull Requests, las ramas y el estado del trámite, para poder retomarlo sin guardar credenciales.

## Cambio del workflow

El workflow ahora se inicia cuando los PDF ya fueron fusionados en `main`. Antes se iniciaba al crear la rama de carga, lo que podía hacer que la extracción avanzara antes de que los archivos fuente quedaran incorporados. El disparo manual continúa disponible para recuperación.

## Archivos modificados

- `.github/workflows/actualizar-horarios.yml`
- `app-transporte/admin.js`
- `app-transporte/index.html`
- `app-transporte/transporte.css`
- `tests/transporte-admin.test.cjs`
- `IMPLEMENTACION_V11_2.md`

## Pruebas

Las pruebas cubren la clasificación de los ocho corredores, la creación automática del primer Pull Request, la fusión autenticada, la identificación inequívoca del Pull Request de publicación y la espera hasta que termina la validación.
