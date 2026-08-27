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
