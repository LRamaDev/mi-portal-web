# v7 · Exportación y selección múltiple de empresas

La v7 amplía los dos modos de trabajo sin modificar los horarios ni el procedimiento semanal.

## Exportación con membrete

Tanto Atención a usuarios como Control de inspectores incorporan dos acciones:

- **Imprimir / guardar PDF:** abre la impresión del navegador, desde donde se puede elegir una impresora o `Guardar como PDF`.
- **Descargar imagen PNG:** genera una planilla de fondo blanco pensada para consultar desde el teléfono o compartir por WhatsApp.

Los dos formatos incluyen el logo del ERSeP aportado para esta versión, la fecha de generación, el tipo de consulta, los filtros activos y la aclaración entre horarios publicados y estimados.

Para evitar archivos incompletos o ilegibles:

- el PDF admite hasta 500 servicios;
- la imagen admite hasta 50 servicios;
- cuando la selección supera esos límites, la página pide aplicar más filtros y no genera un archivo truncado.

## Control de inspectores

- Las empresas se eligen mediante casillas y permiten selección múltiple.
- Corredor, localidad, empresas y líneas se recalculan de manera acumulativa.
- Quitar empresas no borra el lugar del operativo.
- Las líneas disponibles corresponden únicamente a las empresas, corredor y localidad compatibles.
- La planilla exportada conserva base del equipo, terminal o punto, día, franja horaria, empresas, líneas, destino final y salida publicada.

## Atención a usuarios

La consulta exportada incluye hora de subida, trayecto consultado, empresa, línea, llegada estimada y destino final que figura en el cartel del colectivo.

## Archivos

| Archivo | Acción |
|---|---|
| `app-transporte/index.html` | Modificar |
| `app-transporte/transporte.css` | Modificar |
| `app-transporte/transporte.js` | Modificar |
| `app-transporte/recorridos.js` | Modificar |
| `app-transporte/assets/logo-ersep.png` | Agregar |
| `tests/transporte-recorridos.test.cjs` | Modificar |
| `tests/transporte-ui.test.cjs` | Modificar |
| `IMPLEMENTACION_V7.md` | Agregar |

No se modifican los tres JSON publicados, los PDF, la portada ni `.github/workflows/actualizar-horarios.yml`.

## Pruebas

Los controles automáticos cubren selección múltiple de empresas y líneas, filtros acumulativos, generación del membrete para PDF, descarga PNG en ambos modos y todas las pruebas anteriores de recorridos, horarios, flechas y estimaciones.
