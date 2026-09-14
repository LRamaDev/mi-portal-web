# Ingreso Belgrano · Monserrat

Aplicación web de estudio para preparar, en una misma plataforma, los ingresos a la Escuela Superior de Comercio Manuel Belgrano y al Colegio Nacional de Monserrat.

## Estado actual

- **V1:** publicada y validada en GitHub Pages con perfiles, diagnóstico, práctica, contenidos, progreso y simulacros.
- **V2:** sincronización familiar entre dispositivos mediante Supabase; validada con cambios de perfil y avance pedagógico desde PC y celular.
- **V3 pedagógica – etapa 1:** ampliación del banco de ejercicios, mayor presencia de niveles 3 y 4 y herramienta familiar para reiniciar el progreso sin borrar los nombres de los perfiles.

## Funcionalidades

- Dos perfiles independientes, sin nombres reales dentro del repositorio.
- Modo `Estudiar juntas` con turnos alternados en un único dispositivo.
- Diagnóstico inicial de Matemática y Lengua.
- Mapa de habilidades con contenidos comunes y específicos de cada colegio.
- Práctica adaptativa que prioriza habilidades con menor dominio sin abandonar el repaso.
- Pistas y explicaciones durante la práctica.
- Simulacros Belgrano/Monserrat con corrección al final.
- Actividades que indican cuándo conviene resolver en cuaderno.
- Seguimiento de progreso por habilidad.
- PWA instalable.
- Persistencia local inmediata y sincronización en Supabase.
- Reinicio seguro del progreso de ambos perfiles desde el Panel familiar, conservando sus nombres y sincronizando el estado limpio en la nube.

## Banco pedagógico

La V1 contenía 46 actividades originales. La primera etapa de V3 agrega 36 nuevas actividades, llevando el banco a **82 ejercicios**. La ampliación refuerza especialmente problemas de varios pasos, fracciones, decimales, divisibilidad, perímetros, proporcionalidad, numeración romana, operaciones combinadas, circunferencia, comprensión, inferencias, conectores, tiempos verbales, ortografía, sintaxis y producción escrita.

Las consignas son originales y están alineadas a los programas de ingreso 2026, modelos de examen y materiales de estudio aportados por la familia. No reproducen ni sustituyen exámenes oficiales.

## Estructura

```text
ingreso-belgrano-monserrat/
├─ index.html
├─ styles.css
├─ app.js
├─ config.js
├─ supabase-study-state.sql
├─ manifest.webmanifest
├─ sw.js
├─ assets/
│  └─ icon.svg
└─ data/
   ├─ habilidades.json
   └─ ejercicios.json
```

En V3 la ampliación pedagógica se inyecta desde `config.js` sobre el banco base para conservar compatibilidad con la V1/V2 sin migrar el progreso ya registrado.

## Sincronización entre dispositivos

La app siempre guarda primero en `localStorage`. Cuando hay una cuenta familiar autenticada, el estado también se guarda en Supabase y puede recuperarse desde otro celular, tablet o PC.

La aplicación reutiliza el proyecto Supabase configurado para el portal. `config.js` contiene únicamente la URL y la clave pública/publicable del proyecto; no contiene claves privadas ni `service_role`.

La tabla `public.study_state` tiene Row Level Security habilitado. Cada usuario autenticado puede leer, crear y modificar exclusivamente su propia fila.

## Reiniciar progreso

En `Familia` aparece la opción **Reiniciar progreso de ambos perfiles**. La operación:

1. pide confirmación explícita;
2. conserva los nombres de los perfiles;
3. borra progreso por habilidad, historial y cantidad de sesiones;
4. actualiza `localStorage`;
5. si hay una cuenta familiar iniciada, guarda inmediatamente el estado limpio en `study_state`;
6. recarga la aplicación.

## Caché PWA

La V3 incrementa el caché a `ingreso-bm-v3` para que los dispositivos que ya usaron la V1/V2 reciban la nueva configuración y el banco ampliado.

## Siguiente etapa V3

- Convertir el diagnóstico inicial en un diagnóstico adaptativo por ramas: una respuesta correcta habilitará una variante más exigente de la misma habilidad y un error derivará a una comprobación más básica.
- Reorganizar la práctica en una mezcla aproximada de 60% de habilidades débiles, 25% en desarrollo y 15% consolidadas.
- Ampliar los simulacros para aproximarlos mejor a la estructura y ponderación de cada colegio.
- Dar un tratamiento especial a la producción escrita de Monserrat, que tiene un peso importante en su evaluación.
- Incorporar repaso espaciado y evolución temporal.
- Agregar una tarjeta de acceso desde la portada de `mi-portal-web` cuando la V3 quede validada.
