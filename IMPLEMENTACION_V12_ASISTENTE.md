# v12 · Asistente de búsqueda de servicios

## Objetivo

Incorpora una búsqueda guiada dentro de **Atención a usuarios** para consultar servicios directos sin duplicar ni alterar el cronograma oficial.

La consulta se completa en cuatro pasos:

- localidad donde sube la persona;
- localidad donde baja;
- día del viaje;
- todos los horarios, una hora mínima o el último servicio del día.

El destino se recalcula según el origen y el día elegidos, por lo que solamente ofrece localidades alcanzables con un servicio directo publicado. Los homónimos conservan la identificación de su corredor.

## Fuente y actualización

`asistente.js` no usa una base propia ni una API externa. Consulta el mismo motor que carga `app-transporte/data/horarios.json`, `cabeceras.json` y `recorridos.json`.

Por eso, después de que la carga semanal de los ocho PDF complete su Pull Request y este se fusione a `main`, el asistente usa los horarios nuevos automáticamente al abrir o actualizar la aplicación. No necesita una carga adicional ni expone ninguna clave.

## Alcance

- Devuelve únicamente servicios directos que figuran en la publicación vigente.
- Diferencia salida publicada de paso estimado y permite abrir el resultado en el mapa.
- El acceso rápido **Hoy, desde ahora** usa el horario de Córdoba.
- La consulta de fechas pasadas continúa en la pestaña **Consulta histórica**, que conserva su respaldo documental.
- No recomienda combinaciones o transbordos todavía, para evitar sugerir recorridos no validados.

## Archivos principales

- `app-transporte/index.html`: interfaz del asistente.
- `app-transporte/asistente.js`: pasos guiados y presentación de resultados.
- `app-transporte/transporte.js`: interfaz segura hacia el motor existente de horarios.
- `app-transporte/transporte.css`: estilos responsivos con identidad ERSeP.
