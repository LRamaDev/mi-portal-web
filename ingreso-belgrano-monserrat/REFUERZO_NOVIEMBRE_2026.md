# Secuencia de refuerzo pedagógico · noviembre 2026

## Alcance

Se incorporaron **12 actividades nuevas** en `data/ejercicios-refuerzo-noviembre.json`, sin reemplazar consignas previas, cambiar IDs históricos ni modificar los datos de Supabase. Se cargan desde `banco-refuerzo-noviembre.js` después del ampliador de octubre y antes del motor de la aplicación. Si falla el archivo nuevo, se conserva el banco anterior.

`perfilOrigen` indica la prioridad que motivó el ejercicio, pero **ninguna consigna queda restringida a ese perfil**.

| Perfil de origen | Tema / habilidad | Cantidad |
|---|---|---:|
| A | Comparación y orden de fracciones (MAT-FR-ORD) | 2 |
| A | Decimales (MAT-DEC-OPS) | 2 |
| A | Problema integrador con fracciones (MAT-FR-PROB) | 1 |
| A | Conectores (LEN-CON) | 1 |
| A | Acentuación (LEN-ACENT) | 1 |
| V | Fracción del resto (MAT-FR-PROB) | 1 |
| V | Operaciones combinadas con fracciones (MAT-FR-OPS) | 1 |
| V | Comparación y orden de fracciones (MAT-FR-ORD) | 2 |
| V | Producción narrativa (LEN-PROD) | 1 |
| **Total** | | **12** |

## Revisión de duplicados y correcciones

- Ya había ejercicios de **vuelto** y de **fracción del resto** muy parecidos. En lugar de copiarlos, la compra pide **identificar un error por haber omitido el segundo compás**, y el problema del resto utiliza una nueva situación con 150 cuadernos y fracciones 2/5 y 1/3.
- La comparación de distancias admite m.c.m. y la comparación de lo que falta utiliza **complemento a la unidad**.
- La actividad sobre tilde diacrítica distingue correctamente **él** (pronombre) de **su** (posesivo).
- El problema de la cinta pregunta por el **valor de la parte que quedó sin usar**: 9,5 × $420,50 = $3.994,75.
- La operación combinada da **3/4** y la validación exige respuesta irreducible.
- En producción narrativa se pide un párrafo de cuatro oraciones, con conflicto y resolución. La **rúbrica de cuatro criterios** y el ejemplo orientativo utilizan el modo `selfcheck`; el ejemplo se muestra **después** de revisar el texto, no antes.
- Los videos siguen siendo **opcionales**: se amplió la recomendación de comparación de fracciones para A y se vinculó a producción escrita el video del cuento ya disponible en la habilidad `LEN-NARR`. Ver un video no suma dominio.

## Consignas para comprobación diferida — no cargadas en el banco inmediato

Aplicar a los **3 a 5 días** sin pistas ni video previo, con su propia actividad de revisión. Si se introdujeran ahora como ejercicios normales, el selector podría mostrarlas antes del intervalo de retención.

1. **Matemática:** «Un depósito contiene 90 kg de harina. Se utilizan 2/5 para pan y 24,75 kg para repostería. ¿Cuántos kg quedan?» Clave: 90 × 2/5 = 36; 90 − 36 − 24,75 = **29,25 kg**.
2. **Lengua:** «Corregí los tres errores: *El equipo de científicos cordobeses, encontraron fósiles de un animal prehistorico en las sierras.*» Clave: eliminar la coma sujeto–predicado, escribir **encontró** por concordancia y **prehistórico** con tilde.

Esas dos reservas se implementarían cuando exista un mecanismo de **presentación diferida verificable**.

## Comprobación después de fusionar

1. Confirmar la versión visible **6.24.1** y carga sin errores en móvil y PC.
2. Abrir las cuentas familiares A y V: deben mantener sus avances y guardados.
3. Probar **Contenidos → Comparación y orden de fracciones → Ver video / Practicar**; el video no debe bloquear la práctica.
4. Probar **Producción escrita breve** y su video, verificando el ejemplo oculto hasta completar la rúbrica.
5. Comprobar los resultados **1,485**, **3.994,75**, **60** y **3/4**; rechazar, respectivamente, **14,85**, **3.995,75**, **90** y **6/8**.
6. Comprobar que se pueden seguir resolviendo ejercicios anteriores, que el historial conserva los IDs y que no hay cambios en las tablas de Supabase.

**Límite:** las fuentes curriculares son las propuestas aportadas por la familia; no se afirma que las referencias a páginas de programas oficiales se hayan verificado documentalmente. Las pruebas automatizadas acompañan este cambio, pero sigue pendiente la validación interactiva en un dispositivo real.
