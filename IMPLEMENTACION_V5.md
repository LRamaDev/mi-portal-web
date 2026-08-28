# v5 · Viajes entre localidades y tiempos estimados

Actualización preparada sobre `main`, commit `fbed90e` (v4). No está publicada automáticamente.

## Qué cambia

- Buscador Origen/Destino: incluye las localidades intermedias de recorridos vinculados, en el orden correcto.
- Filtros acumulativos por corredor, línea, sentido, empresa, modalidad, día y texto.
- Horarios de paso y duración del tramo estimados con la salida vigente del PDF y los tiempos entre localidades del Excel.
- Ida y Vuelta mantienen secuencias y tiempos propios; no se invierte un recorrido para fabricar el opuesto.
- Mapa inicialmente sin trazados. Al seleccionar una opción se muestra la secuencia, el tramo elegido y una flecha orientativa.
- Panel de localidades y procedencia: salida PDF, referencia de hoja/fila del Excel, notas a revisar y ubicaciones pendientes.
- Temas claro/oscuro preservados. La lista funciona aunque no cargue Leaflet; si falta el JSON nuevo, quedan las salidas y cabeceras anteriores.

## Archivos de la aplicación

| Archivo | Acción |
|---|---|
| `app-transporte/index.html` | Reemplazar |
| `app-transporte/transporte.css` | Reemplazar |
| `app-transporte/transporte.js` | Reemplazar |
| `app-transporte/recorridos.js` | Agregar |
| `app-transporte/data/recorridos.json` | Agregar |

También se incluyen este documento, `REVISION_RECORRIDOS_V5.md`, el conversor `scripts/transporte/procesar_recorridos.py` y tres archivos de pruebas en `tests/`. Se pueden agregar al repositorio para conservar la documentación y las herramientas; no son necesarios para que el navegador consulte el mapa.

No se reemplazan `horarios.json`, `cabeceras.json`, el `index.html` de la portada, otros módulos ni `.github/workflows/actualizar-horarios.yml`.

## Incorporación segura, por etapas

1. Desde `main`, crear `mejora/recorridos-intermedios-v5`.
2. Entrar a la carpeta existente `app-transporte`. Verificar rama y ruta antes de usar Upload files.
3. Subir allí solo `index.html`, `transporte.css`, `transporte.js` y `recorridos.js`. No subir una carpeta `app-transporte` dentro de otra.
4. Entrar a `app-transporte/data` y agregar `recorridos.json`. No borrar los otros dos JSON.
5. Volver a la raíz de esa misma rama para agregar documentación, `scripts/` y `tests/`, conservando las carpetas del paquete.
6. Abrir un PR contra `main`. Revisar que solo haya tres archivos existentes modificados, todos en `app-transporte`; el resto debe ser nuevo.
7. Revisar los controles y el informe de cobertura. Fusionar solo después de revisar el PR completo.
8. Esperar GitHub Pages, usar Ctrl+F5 y probar la aplicación. Conservar la rama hasta terminar las pruebas.

## Comprobaciones al publicar

- Elegir Sierras Chicas, empresa EDER, origen Salsipuedes, destino Agua de Oro y lunes. La salida PDF de Córdoba a las 07:40 (base 21/08/2026) se estima a las 08:40 y 08:55 respectivamente.
- Elegir Agua de Oro → La Granja y luego el sentido opuesto. Para Córdoba–La Granja de EDER, la ida demora 10 minutos en ese tramo y la vuelta 15; no se reutiliza un único tiempo para ambos.
- Verificar que la flecha pase por las localidades en orden y que la salida PDF siga visible aunque la persona suba en una localidad intermedia.
- Seleccionar una opción con ubicaciones pendientes: debe avisar mapa parcial, mantener todas las localidades en la lista y no saltar sobre los puntos sin coordenadas.
- Limpiar filtros: el mapa vuelve a mostrar solamente puntos. Verificar también el modo claro y Volver al portal.

## Cómo sigue la actualización de los lunes

No cambia. Los ocho PDF actualizan solamente `horarios.json` y `cabeceras.json` mediante el workflow ya instalado.

Los vínculos de recorridos no dependen de la hora, el día, la fecha de publicación ni el ID de la salida. Si esos campos cambian, se reutiliza el mismo perfil y se recalculan las estimaciones con la salida nueva.

La identidad incluye corredor, CUIT, modalidad, línea, sentido, cabeceras y texto de variante/ruta. Una variante nueva o modificada no recibe un recorrido por semejanza: queda pendiente, conserva la salida publicada y aparece en la cobertura actual de la pantalla. La revisión de nuevas variantes no está automatizada por el workflow de PDF.

## Cómo se interpreta el día

El selector indica el día de subida en el origen elegido. Si el PDF publica una salida el domingo a las 23:30 y la persona sube 60 minutos después, corresponde al lunes a las 00:30. `+1 día` siempre se cuenta desde la salida PDF. La ficha de fuentes conserva los días originales de la salida.

## Límites visibles

- No es un mapa de calles ni un sistema de posición en vivo.
- La geografía disponible procede de la base existente y de coincidencias únicas de nombre en Georef. No se inventan coordenadas de parajes, empalmes o nombres ambiguos.
- Si faltan coordenadas, se dibujan solo segmentos entre localidades consecutivas ubicadas. Si el tramo elegido tiene huecos, la flecha se pausa.
- Las estimaciones no son horarios legales de paso ni incorporan un margen de retraso. No se usan para evaluar automáticamente incumplimientos.
- Las observaciones se muestran, con su localidad cuando corresponde, sin convertirlas en restricciones automáticas.
- Los registros consecutivos repetidos sin identificación de llegada/salida y las variantes condicionadas a horarios no identificados quedan pendientes de revisión.
- El informe de cobertura adjunto corresponde al cronograma usado para preparar la v5. La cobertura de la pantalla se calcula con los JSON cargados en ese momento.

## Actualizar la base orientativa cuando cambie el Excel

Es una operación independiente y menos frecuente. No hay que subir el Excel todos los lunes ni colocarlo entre los ocho PDF. El conversor no modifica el XLSX ni ejecuta sus fórmulas; lee los valores guardados.

En una copia local del repositorio, con Python 3 disponible:

```bash
python scripts/transporte/procesar_recorridos.py "nuevo-recorrido.xlsx" \
  --schedule app-transporte/data/horarios.json \
  --locations app-transporte/data/cabeceras.json \
  --existing-routes app-transporte/data/recorridos.json \
  --output app-transporte/data/recorridos.json \
  --report REVISION_RECORRIDOS_V5.md
```

Esta operación preserva coordenadas previas cuando coinciden ID y nombre. Los puntos nuevos sin ubicación quedan pendientes. Revisar el informe y preparar otro PR; no editar a mano los horarios semanales para hacer coincidir un recorrido.

## Pruebas técnicas

```bash
node --test tests/transporte-recorridos.test.cjs tests/transporte-ui.test.cjs
python -B tests/test_procesar_recorridos.py
```

Las pruebas de integración usan los datos de referencia de esta entrega. Son 24 pruebas JavaScript (incluyen un DOM y Leaflet simulados) y 7 pruebas Python; no equivalen a una prueba visual en un navegador real. No requieren instalar paquetes. No se añadió ni modificó ningún workflow.

## Reversión

Si después de publicar aparece un problema, usar el botón Revert del PR v5 para preparar un PR de reversión y revisarlo antes de fusionar. No eliminar los JSON de horarios vigentes ni restaurar una versión antigua de sus datos. Evitar revertir archivos que hayan cambiado desde esta actualización sin revisar antes el diff.
