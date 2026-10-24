# Curaduría audiovisual y prueba de regresión · v6.22

La biblioteca utiliza el mismo `data/habilidades.json` y no modifica cuentas, progreso, tablas ni política de acceso.

## Recursos reforzados

| Habilidad | Videos | Principal | Alternativos |
| --- | ---: | --- | --- |
| MAT-FR-ORD | 2 | jdEsCe5sLxE | ZqnHbXCCSIc |
| MAT-FR-OPS | 3 | YpSb9LlsFv8 | qJtoI1ipxs8, -ytm1uOGOXk |
| MAT-FR-PROB | 1 | vimcE6ui6NQ | — |
| MAT-DEC-OPS | 3 | y_F5eXD8Cb0 | MzzKzYYVJhI, 1F0BysuI_K8 |
| MAT-CIRC | 2 | Mco4xC2_BZQ | bG3f36JQkuA |
| MAT-PER | 2 | OTT8SKMdBD8 | QkLxkak-Oic |
| LEN-REV | 3 | CCHz_iDHBj0 | 1b4zfLc5M54, 7Rf1w8UT_rg |
| LEN-NARR | 2 | STGGFtIkyDE | 8ZEAslcuDhU |

Los IDs corresponden a enlaces de YouTube encontrados en sus fichas, fuentes educativas o repertorio anterior.
**No se ha comprobado que YouTube permita embeber cada video**: se incluye enlace de apertura directa para cada recurso.
No registrar duración estimada ni declarar una visualización como terminada cuando solo se haya pulsado "Ver video".

## Comportamiento esperado

- Una ficha por habilidad con hasta tres videos; un principal y complementarios plegados.
- Primero los contenidos pedagógicamente prioritarios para cada perfil; el modo juntas no compara progresos.
- "Ver video acá": inserción por acción expresa del estudiante; al cambiarlo o abandonar la pestaña se desmonta el iframe.
- "Abrir en YouTube": alternativa para bloqueos de reproducción en dispositivo, navegador o configuración del video.
- "Practicar este tema": dos ejercicios adaptativos para esa habilidad, filtrando preguntas repetidas en los últimos siete días; cuando no hay material nuevo se conserva el aviso actual.
- Los otros videos ya existentes en habilidades no intervenidas continúan accesibles.

## Pruebas manuales pendientes de publicación

1. Cargar la página limpia y comprobar sello "Versión 6.22.0" en móvil y PC.
2. Entrar al perfil 1, ir a **Videos**, abrir principal, abrir una alternativa y comprobar que solo queda un reproductor activo; repetir desde perfil 2.
3. Abrir **Abrir en YouTube** y confirmar que carga el recurso correcto.
4. Abrir **Contenidos** y reproducir el video de una habilidad; salir y comprobar que se detuvo el audio.
5. Pulsar **Practicar este tema · 2 ejercicios**: deben verse dos actividades nuevas de esa habilidad y guardarse las respuestas en el perfil correcto.
6. Repetir en modo **Estudiar juntas**, comprobando que se alternen turnos y no se expongan datos individuales.
7. Confirmar que persisten el diagnóstico, historial y recuperación de cuenta, ya que no fueron modificados en esta rama.
