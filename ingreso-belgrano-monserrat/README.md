# Ingreso Belgrano · Monserrat

Aplicación web de estudio para preparar, en una misma plataforma, los ingresos a la Escuela Superior de Comercio Manuel Belgrano y al Colegio Nacional de Monserrat.

## Estado actual

- **V1:** publicada y validada en GitHub Pages con perfiles, diagnóstico, práctica, contenidos, progreso y simulacros.
- **V2:** sincronización familiar entre dispositivos mediante Supabase; validada con cambios de perfil y avance pedagógico desde PC y celular.
- **V3 pedagógica – etapa 1:** banco ampliado de 46 a 82 ejercicios, mayor presencia de niveles 3 y 4 y herramienta familiar para reiniciar el progreso conservando los nombres.
- **V3 pedagógica – etapa 2:** diagnóstico adaptativo, práctica 60/25/15 y simulacros construidos por bloques temáticos.
- **V3 pedagógica – etapa 3:** simulacros completos sobre 100 puntos, con estructura y ponderación diferenciadas por colegio y materia.

## Funcionalidades

- Dos perfiles independientes, sin nombres reales dentro del repositorio.
- Modo `Estudiar juntas` con turnos alternados en un único dispositivo.
- Diagnóstico individual y adaptativo de Matemática y Lengua.
- Mapa de habilidades con contenidos comunes y específicos de cada colegio.
- Práctica adaptativa con una mezcla objetivo aproximada de **60% refuerzo, 25% contenidos en desarrollo y 15% mantenimiento**.
- Ajuste de dificultad según el dominio estimado de cada habilidad.
- Pistas y explicaciones durante la práctica, pero no durante diagnóstico y simulacros.
- Simulacros completos individuales con puntaje sobre 100, corrección final y desglose por bloque.
- Producción escrita de Monserrat Lengua con rúbrica guiada de entrenamiento.
- Actividades que indican cuándo conviene resolver en cuaderno.
- Seguimiento de progreso por habilidad.
- PWA instalable.
- Persistencia local inmediata y sincronización en Supabase.
- Reinicio seguro del progreso de ambos perfiles desde el Panel familiar.

## Banco pedagógico

### Videos vinculados a contenidos

Los videos sugeridos forman parte de `data/habilidades.json`: cada habilidad puede incluir un arreglo `videos`. La app usa el ID de esa habilidad para mostrar el recurso, ordenarlo según el progreso y ofrecer una práctica breve del mismo tema. El catálogo de contenidos no se guarda en la cuenta familiar; allí solo se sincroniza el progreso.

Para agregar otro video, sumá una entrada a `videos` dentro de la habilidad correspondiente. Por ejemplo:

```json
"videos": [{"id":"tvs0UpX93mw","titulo":"Oraciones unimembres y bimembres: concepto y ejemplos","perfiles":["p2"]}]
```

`id` es el identificador de 11 caracteres de YouTube (sin parámetros de seguimiento); `titulo` debe describir lo que enseña efectivamente el video; `perfiles` indica a quién se lo sugirió (`p1`, `p2` o ambos). Se pueden incluir varios videos en un mismo contenido. Antes de publicar una nueva incorporación, comprobá que el enlace explica esa habilidad y permite reproducción integrada. El catálogo se actualiza desde la red y conserva una copia local para cuando no haya conexión.

La V1 contenía 46 actividades originales. La primera etapa de V3 agregó 36 nuevas actividades, llevando el banco a **82 ejercicios**. La ampliación refuerza especialmente problemas de varios pasos, fracciones, decimales, divisibilidad, perímetros, proporcionalidad, numeración romana, operaciones combinadas, circunferencia, comprensión, inferencias, conectores, tiempos verbales, ortografía, sintaxis y producción escrita.

Las consignas son originales y están alineadas a los programas de ingreso 2026, modelos de examen y materiales de estudio aportados por la familia. No reproducen ni sustituyen exámenes oficiales.

## Diagnóstico adaptativo

El diagnóstico se realiza de manera individual. Parte de un conjunto de habilidades prioritarias comunes a ambos colegios y agrega muestras específicas de Belgrano y Monserrat.

- Comienza, en general, con actividades de dificultad intermedia.
- Si una respuesta es correcta y existe una variante más exigente de la misma habilidad, puede incorporarla como comprobación.
- Si una respuesta es incorrecta y existe una variante más básica, puede incorporarla para distinguir entre un error puntual y una dificultad conceptual más profunda.
- Se limita la cantidad de extensiones para evitar diagnósticos excesivamente largos.
- El modo `Estudiar juntas` queda reservado a práctica; el diagnóstico y los simulacros completos son individuales para no mezclar evidencias ni puntajes.

## Práctica 60 / 25 / 15

Las sesiones de entrenamiento tienen ocho actividades y buscan aproximadamente esta distribución:

- **5 actividades (≈60%)** de habilidades con menor dominio;
- **2 actividades (25%)** de habilidades en desarrollo o todavía no evaluadas;
- **1 actividad (≈15%)** de habilidades consolidadas para mantenimiento.

Si una categoría no tiene suficientes ejercicios disponibles, el motor completa la sesión con las mejores alternativas del banco. La dificultad elegida también cambia según el dominio estimado y, para contenidos consolidados, se favorece el repaso que lleva más tiempo sin aparecer.

## Simulacros completos · 100 puntos

La etapa 3 agrega `simulacros.js`, un motor específico que intercepta los cuatro botones de simulacro y crea una experiencia individual sin pistas, con corrección únicamente al final. Cada respuesta sigue alimentando el mapa de habilidades; al completar el examen también se registra un resultado de 0 a 100 en el historial del perfil y se sincroniza con Supabase.

### Monserrat · Matemática

Se conserva la estructura del modelo 2026 aportado: **7 ítems, 100 puntos**, con la distribución **15 / 12 / 18 / 10 / 18 / 9 / 18**. Los siete bloques corresponden, de manera equivalente, a datos/fracciones, secuencias, magnitudes, circunferencia, problema con fracciones, numeración romana y geometría/perímetro.

### Monserrat · Lengua

Se conserva la ponderación del examen de Ingreso 2026 aportado:

- Ortografía: **18 puntos**.
- Morfosintaxis: **15 puntos**.
- Discurso: **32 puntos**.
- Producción escrita: **35 puntos**.

La producción se realiza en cuaderno y se revisa con una rúbrica de entrenamiento basada en los criterios observados en la grilla oficial: título, extensión y ausencia de diálogo, coherencia, complicación/resolución, recursos expresivos, repeticiones, morfosintaxis, ortografía y presentación. La distribución interna de esos 35 puntos es aproximada y se muestra explícitamente como herramienta de práctica, no como reproducción exacta de la grilla oficial.

### Belgrano · Matemática

El modelo 2025 aportado tiene **22 consignas numeradas y 100 puntos**. El simulacro conserva esas 22 posiciones y la ponderación de cada número de consigna. Cuando el modelo original contiene varios subapartados dentro de un mismo número, la versión digital los representa de forma condensada en una actividad original equivalente por contenido.

### Belgrano · Lengua

El modelo 2025 aportado divide el examen en **Parte I: 50 puntos** y **Parte II: 50 puntos**. El simulacro conserva esa distribución 50/50. La cantidad interna de actividades es una adaptación digital: la primera parte enfatiza lectura, comprensión, narración, literatura y cohesión; la segunda, gramática, sintaxis, ortografía, comunicación, semántica y paratextos.

## Sincronización entre dispositivos

La app siempre guarda primero en `localStorage`. Cuando hay una cuenta familiar autenticada, el estado también se guarda en Supabase y puede recuperarse desde otro celular, tablet o PC.

La aplicación reutiliza el proyecto Supabase configurado para el portal. `config.js` contiene únicamente la URL y la clave pública/publicable del proyecto; no contiene claves privadas ni `service_role`.

La tabla `public.study_state` tiene Row Level Security habilitado. Cada usuario autenticado puede leer, crear y modificar exclusivamente su propia fila.

## Reiniciar progreso

En `Familia` aparece la opción **Reiniciar progreso de ambos perfiles**. La operación pide confirmación, conserva los nombres, borra progreso, historial y sesiones, actualiza el almacenamiento local y sincroniza el estado limpio en Supabase si la cuenta familiar está iniciada.

## Caché PWA

La etapa 3 usa el caché `ingreso-bm-v3-simulacros` e incluye `simulacros.js`, para que PC y celulares reciban el nuevo motor después de recargar la aplicación.

## Próximas mejoras

- Aumentar la cantidad de variantes por una misma habilidad para que el diagnóstico adaptativo tenga más profundidad.
- Incorporar evolución temporal y repaso espaciado por fecha.
- Preparar sesiones familiares de 20, 30 y 45 minutos.
- Mejorar el historial para mostrar la evolución de puntajes de simulacros a lo largo del tiempo.
- Agregar una tarjeta de acceso desde la portada de `mi-portal-web` cuando la V3 quede validada.
