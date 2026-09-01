# v8 · Administración móvil, sentidos acumulativos y coordenadas verificadas

La v8 incorpora la carga conjunta de los ocho cronogramas desde la aplicación,
amplía el modo inspector y aplica el cruce validado de localidades. No cambia los
5.506 servicios publicados ni publica una actualización semanal por sí sola.

## Panel administrador

- El botón **Administrar PDF** abre un panel adaptable a teléfonos.
- Exige exactamente ocho archivos PDF, uno por corredor, de hasta 25 MB cada uno.
- Reconoce los corredores por el nombre original del archivo y los renombra de
  forma estable dentro de `datos-fuente/transporte/`.
- Sube los ocho blobs, construye un único commit y recién entonces crea una rama
  `actualizacion/carga-web-…`; por eso la automatización se ejecuta una sola vez.
- La clave es un token de GitHub de alcance limitado. No se incorpora al código,
  no se guarda y el campo se vacía al terminar.
- El workflow existente valida los ocho archivos y prepara el Pull Request de
  publicación. El panel nunca fusiona ni publica horarios automáticamente.

## Control de inspectores

Los sentidos ahora son casillas acumulativas: **Ida**, **Vuelta** o ambos. El filtro
se combina con localidad, corredor, empresas, líneas, día y franja horaria. La
selección también aparece en el resumen y en las exportaciones PDF/PNG.

## Coordenadas

Se incorporó un catálogo auditable con 91 puntos marcados como `Ubicada` en la
planilla de rastreo:

- 88 se aplican por ID estable a la base de recorridos;
- 3 corresponden a cabeceras que solo figuraban en los PDF;
- no se aplica semejanza de nombres ni se unen homónimos automáticamente;
- Campo La Argentina y El Pueblito usan las coordenadas confirmadas manualmente;
  El Pueblito se aplica únicamente al registro de Sierras Chicas.

La base pasa de 409 a 497 puntos geolocalizados. Los puntos vinculados pendientes
bajan de 217 a 134, y los servicios con ambas cabeceras ubicadas pasan de 5.375 a
5.447 de 5.506 (98,9 %).

## Archivos de la v8

| Archivo | Acción |
|---|---|
| `app-transporte/index.html` | Modificar |
| `app-transporte/transporte.css` | Modificar |
| `app-transporte/transporte.js` | Modificar |
| `app-transporte/recorridos.js` | Modificar |
| `app-transporte/admin.js` | Agregar |
| `app-transporte/data/recorridos.json` | Modificar |
| `app-transporte/data/cabeceras.json` | Modificar |
| `datos-fuente/transporte/coordenadas-validadas.json` | Agregar |
| `scripts/transporte/importar_coordenadas_validadas.py` | Agregar |
| `scripts/transporte/requirements.txt` | Modificar |
| `tests/transporte-admin.test.cjs` | Agregar |
| `tests/transporte-recorridos.test.cjs` | Modificar |
| `tests/transporte-ui.test.cjs` | Modificar |
| `tests/test_procesar_recorridos.py` | Modificar |
| `ACTUALIZACION_HORARIOS.md` | Modificar |
| `IMPLEMENTACION_V8.md` | Agregar |

No cambian `horarios.json`, los PDF vigentes, el logo ni el workflow semanal.

## Verificación

- 39 pruebas JavaScript: recorridos, interfaz, filtros, exportaciones y carga simulada.
- 8 pruebas Python: procedencia, datos y coordenadas verificadas.
- Validación integral: 5.506 servicios, 262 líneas y 184 cabeceras.
