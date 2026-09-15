# Testeo familiar

Objetivo: validar la experiencia real de estudio antes de seguir ampliando funciones.

## Recorrido sugerido por perfil

1. Entrar al perfil individual.
2. Hacer el diagnóstico adaptativo si todavía no fue completado.
3. Hacer una práctica corta de Matemática o Lengua.
4. Probar un simulacro del colegio correspondiente.
5. Usar el botón `¿Cómo fue?` para dejar una valoración rápida y, si hace falta, un comentario breve.

Las opciones de valoración son: `Fácil`, `Bien`, `Difícil` y `Confuso`.

No hace falta escribir nombres ni datos personales en el comentario.

## Registro

Con la cuenta familiar iniciada, las opiniones se guardan en `public.study_feedback` mediante RLS, vinculadas solamente a la cuenta autenticada y al identificador de perfil (`p1`, `p2` o `together`). Si no hay sesión o conexión disponible, la app conserva la opinión en `localStorage` como respaldo local.

La información registrada incluye únicamente tipo de sesión, área, colegio cuando corresponde, valoración, comentario opcional y fecha.
