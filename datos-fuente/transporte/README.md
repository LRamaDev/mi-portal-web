# Carga semanal de cronogramas

Esta carpeta recibe temporalmente los ocho PDF semanales. Los documentos se
procesan desde una rama cuyo nombre comience con `actualizacion/`; nunca deben
cargarse directamente en `main`.

## Procedimiento de cada lunes

1. Desde `main`, crear una rama llamada `actualizacion/AAAA-MM-DD`.
2. Entrar en `datos-fuente/transporte/` dentro de esa rama.
3. Subir juntos los ocho PDF recibidos y confirmar el commit.
4. Abrir **Actions > Actualizar horarios interurbanos** y esperar el control verde.
5. Abrir el Pull Request creado automáticamente y leer el informe de cambios.
6. Si los controles son correctos, fusionar el Pull Request.
7. Comprobar el mapa publicado y eliminar las ramas de carga y publicación.

La automatización exige exactamente un cronograma vigente de cada corredor,
rechaza cualquier fila que no pueda interpretar y no incorpora los PDF a
`main`. Los originales quedan disponibles como artefacto de la ejecución por
30 días.

## Si aparece un control rojo

No publicar. Abrir la ejecución fallida para leer el motivo. Corregir o
reemplazar el PDF en la misma rama de carga; el sistema volverá a ejecutarse.

## Coordenadas y trazados viales

Los PDF semanales no modifican automáticamente las coordenadas ni los caminos
del mapa. Esos datos tienen su propio ciclo de validación:

1. Ejecutar `scripts/transporte/auditar_paradas_recorridos.py`.
2. Verificar faltantes y alertas con línea, corredor y paradas vecinas.
3. Incorporar únicamente coordenadas confirmadas por ID estable.
4. Generar trazados con `scripts/transporte/generar_trazados_orientativos.py`.
5. Revisar visualmente cada perfil y publicarlo como recorrido orientativo.

Si una coordenada produce un salto incompatible con las paradas anteriores o
posteriores, se conserva como dato dudoso pero se excluye de ese recorrido. El
mapa representa el hueco con un conector punteado hasta que el punto sea
verificado.

El archivo de trabajo recomendado es el catálogo único: cada punto se identifica
por ID y su coordenada se pega una sola vez, aunque aparezca en muchas líneas.
La búsqueda puede apoyarse en nombre, corredor, línea y paradas vecinas. Una
parada vista manualmente en Google Maps sirve como fuente de revisión, pero no
se debe extraer el contenido de Google de manera masiva. Para proponer candidatos
automáticamente se priorizan las paradas de OpenStreetMap y luego se aplica el
mismo control lógico antes de incorporarlas.

La aplicación no consulta un enrutador al abrirse. Las geometrías aprobadas se
guardan en `app-transporte/data/trazados.json`; si faltan, el mapa conserva su
conexión esquemática.
