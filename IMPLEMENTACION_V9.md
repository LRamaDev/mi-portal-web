# v9 · Historial de horarios e informes de actualización

La v9 incorpora un historial documental dentro de GitHub Pages, sin base de
datos externa. Cada actualización semanal mantiene el JSON vigente y añade un
respaldo comprimido, un índice de vigencias y un informe estructurado de cambios.

## Cobertura inicial

El historial se inicia con dos estados recuperados del historial real de
`main`:

| Publicación | Servicios | Aplicación histórica |
|---|---:|---|
| 2026-08-21 | 5.506 | 21/08/2026 al 27/08/2026 |
| 2026-08-28 | 5.504 | Desde el 28/08/2026 |

La comparación inaugural identifica:

- 5.502 servicios sin cambios;
- 2 horarios modificados de Villa María–Saira;
- 2 servicios eliminados de Villa María–Alto Alegre;
- 0 servicios agregados.

## Formato histórico

`app-transporte/data/historico/indice.json` enumera las publicaciones, sus
períodos de aplicación, cantidad de servicios, fechas de los ocho corredores y
rutas relativas a los respaldos e informes.

Cada `backups/horarios-AAAA-MM-DD.json.gz` contiene un JSON autosuficiente con:

- cronograma completo;
- catálogo de cabeceras;
- base orientativa de recorridos;
- fecha y zona horaria.

El respaldo se genera de manera reproducible y registra dos controles SHA-256:
uno del archivo comprimido y otro del JSON interno. La aplicación verifica la
huella comprimida antes de abrirlo.

Los archivos `cambios/cambios-AAAA-MM-DD.json` separan:

- servicios sin cambios;
- horarios o días modificados, con valores anterior y nuevo;
- servicios agregados;
- servicios eliminados;
- altas y bajas de líneas;
- diferencias por corredor y control geográfico.

## Consulta para Reclamos

El tercer modo **RECLAMOS · Consulta histórica**:

1. selecciona el respaldo aplicable según la fecha del hecho;
2. lo descarga únicamente al realizar la consulta;
3. filtra automáticamente por el día de la semana correspondiente;
4. combina origen, destino, corredor, línea, sentido, empresa y búsqueda libre;
5. muestra PDF y página de procedencia;
6. permite imprimir una constancia con membrete.

La interfaz diferencia tres resultados: servicios encontrados, ausencia de
coincidencias dentro de una publicación disponible y falta de cobertura
histórica. Nunca equipara falta de información con inexistencia del servicio.

## Informe semanal

El workflow genera un Markdown legible para el Pull Request y un JSON completo.
La pestaña Reclamos permite visualizarlo, imprimirlo o descargarlo como CSV. El
artefacto de Actions se conserva 90 días y el JSON queda permanentemente dentro
de `main` después de la fusión.

Los cambios de hora se vinculan por corredor, línea, cabeceras, sentido,
empresa, CUIT, modalidad y ruta. La alineación cronológica evita presentar un
cambio como una eliminación más un alta.

## Archivos de la v9

| Archivo | Acción |
|---|---|
| `app-transporte/index.html` | Modificar |
| `app-transporte/transporte.css` | Modificar |
| `app-transporte/transporte.js` | Modificar |
| `app-transporte/historico.js` | Agregar |
| `app-transporte/data/historico/indice.json` | Agregar |
| `app-transporte/data/historico/backups/*.json.gz` | Agregar |
| `app-transporte/data/historico/cambios/*.json` | Agregar |
| `scripts/transporte/comparar_horarios.py` | Modificar |
| `scripts/transporte/actualizar_historial.py` | Agregar |
| `.github/workflows/actualizar-horarios.yml` | Modificar |
| `tests/transporte-historico.test.cjs` | Agregar |
| `tests/transporte-historico-ui.test.cjs` | Agregar |
| `tests/test_historial_horarios.py` | Agregar |
| `tests/test_procesar_cronogramas.py` | Convertir a `unittest` |
| `tests/transporte-ui.test.cjs` | Modificar |
| `ACTUALIZACION_HORARIOS.md` | Modificar |
| `IMPLEMENTACION_V9.md` | Agregar |

No se modifican los 5.504 servicios vigentes, las coordenadas, el logo ni los
recorridos actuales.

## Verificación

```text
node --test tests/*.test.cjs
python -m unittest discover -s tests -p 'test_*.py'
```

Los respaldos se cargan bajo demanda y no forman parte de la descarga inicial
de la página. Los PDF continúan como artefactos temporales durante 30 días; el
historial permanente se basa en los JSON procesados, sus referencias de origen
y las huellas de integridad.

La validación final comprende 47 pruebas JavaScript y 15 pruebas Python: 62 en
total. Los dos respaldos iniciales ocupan aproximadamente 542 KB combinados.
