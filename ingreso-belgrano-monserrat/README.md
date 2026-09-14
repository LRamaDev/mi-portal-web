# Ingreso Belgrano · Monserrat

Aplicación web de estudio para preparar, en una misma plataforma, los ingresos a la Escuela Superior de Comercio Manuel Belgrano y al Colegio Nacional de Monserrat.

## Estado actual

- **V1:** publicada y validada en GitHub Pages con perfiles, diagnóstico, práctica, contenidos, progreso y simulacros.
- **V2:** sincronización familiar entre dispositivos mediante Supabase; validada con cambios de perfil y avance pedagógico desde PC y celular.
- **V3 pedagógica – etapa 1:** banco ampliado de 46 a 82 ejercicios, mayor presencia de niveles 3 y 4 y herramienta familiar para reiniciar el progreso conservando los nombres.
- **V3 pedagógica – etapa 2:** motor adaptativo para diagnóstico y práctica, simulacros por estructura de colegio y corrección final más útil.

## Funcionalidades

- Dos perfiles independientes, sin nombres reales dentro del repositorio.
- Modo `Estudiar juntas` con turnos alternados en un único dispositivo.
- Diagnóstico individual y adaptativo de Matemática y Lengua.
- Mapa de habilidades con contenidos comunes y específicos de cada colegio.
- Práctica adaptativa con una mezcla objetivo aproximada de **60% refuerzo, 25% contenidos en desarrollo y 15% mantenimiento**.
- Ajuste de dificultad según el dominio estimado de cada habilidad.
- Pistas y explicaciones durante la práctica, pero no durante diagnóstico y simulacros.
- Simulacros Belgrano/Monserrat armados con bloques de contenidos más cercanos a la estructura de cada ingreso.
- Producción escrita incluida en el simulacro de Lengua de Monserrat como revisión guiada.
- Corrección final de respuestas objetivas en diagnóstico y simulacros.
- Actividades que indican cuándo conviene resolver en cuaderno.
- Seguimiento de progreso por habilidad.
- PWA instalable.
- Persistencia local inmediata y sincronización en Supabase.
- Reinicio seguro del progreso de ambos perfiles desde el Panel familiar.

## Banco pedagógico

La V1 contenía 46 actividades originales. La primera etapa de V3 agregó 36 nuevas actividades, llevando el banco a **82 ejercicios**. La ampliación refuerza especialmente problemas de varios pasos, fracciones, decimales, divisibilidad, perímetros, proporcionalidad, numeración romana, operaciones combinadas, circunferencia, comprensión, inferencias, conectores, tiempos verbales, ortografía, sintaxis y producción escrita.

Las consignas son originales y están alineadas a los programas de ingreso 2026, modelos de examen y materiales de estudio aportados por la familia. No reproducen ni sustituyen exámenes oficiales.

## Diagnóstico adaptativo

El diagnóstico se realiza de manera individual. Parte de un conjunto de habilidades prioritarias comunes a ambos colegios y agrega muestras específicas de Belgrano y Monserrat.

- Comienza, en general, con actividades de dificultad intermedia.
- Si una respuesta es correcta y existe una variante más exigente de la misma habilidad, puede incorporarla como comprobación.
- Si una respuesta es incorrecta y existe una variante más básica, puede incorporarla para distinguir entre un error puntual y una dificultad conceptual más profunda.
- Se limita la cantidad de extensiones para evitar diagnósticos excesivamente largos.
- El modo `Estudiar juntas` queda reservado a práctica y simulacros; el diagnóstico exige entrar al perfil individual para no mezclar evidencias.

## Práctica 60 / 25 / 15

Las sesiones de entrenamiento tienen ocho actividades y buscan aproximadamente esta distribución:

- **5 actividades (≈60%)** de habilidades con menor dominio;
- **2 actividades (25%)** de habilidades en desarrollo o todavía no evaluadas;
- **1 actividad (≈15%)** de habilidades consolidadas para mantenimiento.

Si una categoría no tiene suficientes ejercicios disponibles, el motor completa la sesión con las mejores alternativas del banco. La dificultad elegida también cambia según el dominio estimado y, para contenidos consolidados, se favorece el repaso que lleva más tiempo sin aparecer.

## Simulacros por colegio

Los simulacros ya no toman ocho ejercicios completamente al azar. Se construyen mediante bloques de contenidos:

- **Belgrano Matemática:** números/divisibilidad, fracciones/decimales y magnitudes/geometría/problemas.
- **Monserrat Matemática:** numeración/patrones/datos, divisibilidad/fracciones/decimales y magnitudes/geometría/problemas.
- **Belgrano Lengua:** comprensión/texto/comunicación/cohesión, gramática/narración y ortografía/puntuación.
- **Monserrat Lengua:** comprensión/discurso/narración, gramática/sintaxis, ortografía/puntuación y una producción escrita guiada.

Son simulacros de entrenamiento más representativos, pero todavía no deben interpretarse como una reproducción exacta de la ponderación oficial de cada examen.

## Sincronización entre dispositivos

La app siempre guarda primero en `localStorage`. Cuando hay una cuenta familiar autenticada, el estado también se guarda en Supabase y puede recuperarse desde otro celular, tablet o PC.

La aplicación reutiliza el proyecto Supabase configurado para el portal. `config.js` contiene únicamente la URL y la clave pública/publicable del proyecto; no contiene claves privadas ni `service_role`.

La tabla `public.study_state` tiene Row Level Security habilitado. Cada usuario autenticado puede leer, crear y modificar exclusivamente su propia fila.

## Reiniciar progreso

En `Familia` aparece la opción **Reiniciar progreso de ambos perfiles**. La operación pide confirmación, conserva los nombres, borra progreso, historial y sesiones, actualiza el almacenamiento local y sincroniza el estado limpio en Supabase si la cuenta familiar está iniciada.

## Caché PWA

La segunda etapa de V3 usa el caché `ingreso-bm-v3-adaptativo`, para que PC y celulares reciban el nuevo motor después de recargar la aplicación.

## Próximas mejoras

- Aumentar la cantidad de variantes por una misma habilidad para que el diagnóstico adaptativo tenga más profundidad.
- Incorporar ponderación de puntajes más cercana a cada examen oficial, especialmente la producción escrita de Monserrat.
- Agregar evolución temporal y repaso espaciado por fecha.
- Preparar sesiones familiares de 20, 30 y 45 minutos.
- Agregar una tarjeta de acceso desde la portada de `mi-portal-web` cuando la V3 quede validada.
