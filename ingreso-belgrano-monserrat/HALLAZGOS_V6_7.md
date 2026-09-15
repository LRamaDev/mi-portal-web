# Hallazgos de auditoría V6.7

Este archivo complementa `COBERTURA_V6_7.md` y deja constancia del resultado final de la auditoría automática del banco efectivo. La primera versión del informe de cobertura enumeraba los cuatro problemas conocidos al iniciar la revisión; durante la ejecución real del auditor se detectaron defectos adicionales. Este documento **reemplaza esa lista inicial como registro definitivo de correcciones de V6.7**.

## Resultado

- Banco efectivo auditado: **402 actividades**.
- Habilidades auditadas: **68** (36 de Matemática y 32 de Lengua).
- Actividades corregidas: **22**.
- Los IDs se conservan para no fragmentar el historial de progreso.
- No se modifican Supabase, perfiles ni registros de avance.

## Correcciones específicas

### Errores de respuesta o alternativas

- `V5-M047`: una hora (`12:25`) se convertía a número y generaba una alternativa `NaN`. Se elimina esa alternativa inválida y se mejora la explicación del cálculo horario.
- `V4-L042`: tenía opciones duplicadas. Se normalizan cuatro opciones distintas para evaluar correctamente la grafía de `tuvo`.

### Ambigüedad o clasificación pedagógica

- `V5-L016`: el referente pronominal era ambiguo. Se reemplaza por una referencia inequívoca a `el horario de la reunión`.
- `V4-L051`: estaba etiquetado como parónimos pero evaluaba principalmente grafía. Pasa a distinguir `revelar/rebelar` en contexto.
- `V6-L037`: se reemplaza una actividad débil de parónimos por `sesión/cesión` en contexto.

### Actividades literarias mal estructuradas

Cuatro actividades de V5 habían quedado con los campos desplazados al construir el banco: la consigna, las opciones y la respuesta no llegaban con la estructura esperada. Se reconstruyen conservando los IDs:

- `V5-L027`: personificación.
- `V5-L028`: comparación.
- `V5-L029`: onomatopeya.
- `V5-L030`: imagen olfativa.

### Actividades V6 construidas sin el argumento `texto`

El constructor `lChoice` espera `texto` y luego `consigna`. En trece actividades se había omitido el argumento de texto, por lo que los campos posteriores quedaban corridos. V6.7 repara la estructura antes de que el banco sea consumido por la app:

- `V6-L020`: hiperónimo/hipónimo (`vehículo` → `bicicleta`).
- `V6-L026`: determinantes.
- `V6-L027`: concordancia determinante–sustantivo.
- `V6-L028`: tilde diacrítica (`si/sí`).
- `V6-L029`: tilde diacrítica (`él/el`).
- `V6-L030`: `por qué` en pregunta indirecta.
- `V6-L031`: `aún/sé`.
- `V6-L032`: uso de H (`hormiga`).
- `V6-L033`: uso de H en oración.
- `V6-L034`: familia léxica de `hielo`.
- `V6-L035`: uso de R/RR (`alrededor`).
- `V6-L036`: uso de R/RR en oración.
- `V6-L038`: `actitud/aptitud`.

`V6-L037` también tenía el mismo problema estructural, pero se resolvió a la vez que se reformuló pedagógicamente como ejercicio real de parónimos; por eso figura en la sección anterior y no vuelve a contarse acá.

## Qué valida ahora el auditor

El script `tools/auditar-ingreso-v6-7.cjs` reconstruye el banco efectivo en el mismo orden de capas que usa la aplicación y comprueba, para las 402 actividades:

- IDs únicos;
- habilidad existente y área coherente;
- dificultad entre 1 y 4;
- colegio válido;
- tipo de actividad válido;
- consigna, pista y explicación no vacías;
- respuestas de opción múltiple presentes entre las opciones;
- opciones no duplicadas;
- respuestas de entrada no vacías;
- ausencia de alternativas `NaN` o `undefined`;
- autoevaluaciones con criterios suficientes;
- que las 68 habilidades tengan al menos una actividad.

GitHub Actions ejecuta esta auditoría en cada cambio relevante del módulo de ingreso. De este modo, los defectos estructurales que V6.7 encontró no deberían volver a pasar inadvertidos en futuras ampliaciones del banco.
