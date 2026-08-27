# Actualización semanal de horarios interurbanos

Guía operativa para las personas administradoras del mapa.

## Antes de comenzar

- Tener los ocho PDF de la misma entrega semanal.
- Verificar que se puedan abrir y que correspondan a los corredores previstos.
- No modificar manualmente `horarios.json` ni `cabeceras.json`.

## Carga

1. Abrir el repositorio y asegurarse de estar en `main`.
2. Crear una rama `actualizacion/AAAA-MM-DD`, usando la fecha de los PDF.
3. Dentro de esa rama, entrar en `datos-fuente/transporte/`.
4. Elegir **Add file > Upload files** y subir los ocho PDF juntos.
5. Usar como mensaje: `Cargar cronogramas del DD-MM-AAAA`.
6. Confirmar el commit en la rama de actualización.

## Control automático

1. Abrir la pestaña **Actions**.
2. Entrar en **Actualizar horarios interurbanos**.
3. Esperar el resultado:
   - Verde: los archivos fueron procesados y existe un Pull Request preparado.
   - Rojo: no publicar; abrir el error y corregir la carga.
4. Leer el informe: servicios agregados y eliminados, diferencias por corredor,
   líneas nuevas y cabeceras pendientes.

## Publicación

1. Abrir el Pull Request generado por la automatización.
2. Confirmar que solo cambien `app-transporte/data/horarios.json` y
   `app-transporte/data/cabeceras.json`.
3. Fusionar el Pull Request.
4. Esperar el despliegue de GitHub Pages y probar el mapa.
5. Eliminar la rama `actualizacion/AAAA-MM-DD` y la rama
   `publicacion/horarios-AAAA-MM-DD`.

## Regla de seguridad

La información pública solo se actualiza después del merge. Un control rojo,
un corredor faltante o una diferencia dudosa requieren revisión antes de
publicar.
