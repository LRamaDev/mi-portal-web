# Implementación v10 · Identidad visual ERSeP

## Objetivo

Aplicar una identidad institucional coherente a la aplicación de transporte, mejorar la lectura de la consulta histórica y ofrecer una guía breve dentro de cada modo de trabajo.

## Cambios incluidos

- Logo de ERSeP en el encabezado de la aplicación.
- Paleta basada en el logo institucional:
  - bordó para identidad y acciones documentales;
  - azul para consultas y campos informativos;
  - verde para operativos y estados favorables;
  - amarillo para alertas, conteos y cambios;
  - grises y marrón como colores complementarios.
- Tema claro como presentación inicial; el tema oscuro continúa disponible.
- Franja institucional multicolor en encabezado y portada.
- Identificación diferenciada de los tres modos: Consultas, Operativos y Reclamos.
- Instructivo resumido y desplegable dentro de cada pestaña.
- Consulta histórica organizada visualmente en tres etapas:
  1. seleccionar la fecha;
  2. identificar el servicio mediante filtros acumulativos;
  3. revisar y exportar el resultado documental.
- Informe semanal separado del resultado del reclamo y con colores para servicios modificados, agregados y eliminados.
- Ajustes responsive para escritorio, tablet y celular.

## Corrección de caché

La captura de la v9 mostraba el HTML nuevo junto con `transporte.css?v=8`, conservado por el navegador. La v10 actualiza el versionado de la hoja de estilos y de los cuatro archivos JavaScript a `?v=10`. Esto obliga al navegador a solicitar los recursos correctos después de la publicación.

## Alcance técnico

La versión no modifica:

- horarios vigentes;
- cabeceras;
- recorridos ni coordenadas;
- respaldos históricos;
- informes JSON;
- PDF cargados;
- procesamiento semanal ni permisos administrativos.

## Verificación

- 48 pruebas de JavaScript aprobadas.
- 15 pruebas de Python aprobadas.
- 63 pruebas totales.
- Control específico del versionado v10, presencia de las tres guías y variables de color institucional.
- `git diff --check` sin errores de formato.

