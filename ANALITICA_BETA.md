# Métrica privada de búsquedas de la Beta

La Beta registra un evento anónimo llamado `busqueda_realizada` cada vez que se confirma una búsqueda guiada válida. Se informa el tipo de consulta, el modo horario y la cantidad de resultados, sin enviar origen, destino ni texto ingresado.

## Activación

1. Crear o abrir una propiedad de Google Analytics 4.
2. Crear un flujo de datos web para la URL pública de la Beta.
3. Copiar el ID de medición con formato `G-XXXXXXXXXX`.
4. Pegarlo en `app-transporte-beta/analitica.js`, en la variable `MEASUREMENT_ID`.
5. Publicar el cambio y verificar en **Informes → Tiempo real** que aparezca `busqueda_realizada`.

Mientras el identificador esté vacío, la página no carga Google Analytics ni transmite eventos.

## Alcance

La métrica es global y privada para el panel de Analytics. No se muestra ningún contador a los usuarios. La información de uso puede complementarse después con un resumen por día y búsquedas sin resultados.
