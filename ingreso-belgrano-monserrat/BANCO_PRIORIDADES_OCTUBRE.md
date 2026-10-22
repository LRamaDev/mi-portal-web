# Banco de prioridades · V6.21

El banco activo pasa de 588 a **690 actividades**: 90 propuestas nuevas de los adjuntos del 22 de octubre y las 12 actividades de fracciones preparadas el 15 de octubre, cuyo PR #112 seguía pendiente. Se conservan los IDs de esas 12; las propuestas posteriores reciben el prefijo `OCT26` y conservan su `idFuente` para evitar sobrescribir ejercicios distintos que llegaron con el mismo ID.

## Cobertura nueva

| Contenido | Perfil de origen | Actividades nuevas |
| --- | --- | ---: |
| Comparación y orden de fracciones | A y V | 20 |
| Problemas con fracciones | A | 10 |
| Operaciones con decimales | A | 10 |
| Perímetros y aplicaciones | A | 10 |
| Funciones del lenguaje | A | 10 |
| Revisión y corrección | A | 10 |
| Producción escrita breve | A | 10 |
| Operaciones con fracciones | V | 10 |

Los archivos «Texto pegado (9)(1).txt» y «Texto pegado (10).txt» eran idénticos; su bloque se incorpora una sola vez. Los perfiles de origen son metadatos: ambos perfiles pueden practicar todas las actividades, vinculadas a sus habilidades. La selección conserva el motor adaptativo, el historial y la exclusión de ejercicios realizados recientemente.

Cada bloque de diez mantiene tres actividades iniciales, cuatro intermedias y tres avanzadas. Se mapean a dificultad 1, 2 y 4, respectivamente; el banco anterior sigue aportando dificultad 3.

## Adecuación pedagógica

- Las nueve producciones abiertas nuevas se realizan en el cuaderno con un máximo de una a tres oraciones según la consigna. Se revisan con cuatro criterios propios, sin comparar el texto con una respuesta única. Después se puede desplegar un ejemplo orientativo. La autocorrección mantiene el peso reducido de evidencia que ya establece el motor pedagógico.
- Los ejercicios de ordenar y varios de respuesta breve utilizan opciones para evitar copiar consignas. Los verdaderos/falsos incluyen una razón en la opción elegida. Los cálculos pueden resolverse en papel.
- Los simulacros utilizan el mismo corrector numérico que la práctica y los criterios específicos de cada producción nueva; no exigen un título o un desenlace a una actividad que pide una entrevista o un copete.
- Los contenidos de producción y revisión se marcan como práctica común a ambos colegios. Esto identifica habilidades transversales, sin afirmar equivalencia entre sus grillas oficiales de examen.

## Correcciones sobre el material recibido

- `LENG-REV-007`: faltaban tres tildes, incluidas las de «seguíamos», no solamente dos.
- `LENG-REV-008`: se reemplaza el recuento incorrecto de errores por una indicación de revisión integral.
- `LENG-PROD-005`: el modelo dice «la palanca».
- Intercalación: «9/20» puede ser otra respuesta interior al intervalo, pero no es equivalente a «1/2». El corrector admite cualquier fracción irreducible válida y rechaza extremos o fracciones sin simplificar.
- Se explicita que el tanque empieza lleno y que las fracciones de extracción se refieren a la misma capacidad; los pintores del bloque V trabajan sobre muros distintos de igual superficie. Se precisa la construcción de la figura en L sin depender de un dibujo ausente.
- Se eliminan comandos de formato espurios, se mejora la lectura de las expresiones matemáticas y se corrigen instrucciones de ordenamiento.
- Se revisan explicaciones demasiado absolutas sobre funciones del lenguaje y registro. Los ejemplos de noticias inventadas se identifican como material de la actividad.

Las referencias curriculares aportadas se conservan como `referenciaAportada`; no constituyen una verificación independiente de esas fuentes ni una certificación de correspondencia con un examen oficial.

## Carga y comprobación

Los datos se guardan en `data/ejercicios-prioridades-octubre.json`. `banco-v6-21.js` los une al banco anterior sin reemplazar registros. La PWA precachea los datos y `respuestas-v6-21.js`, con versión visible 6.21.0. Si una petición adicional falla, se conserva el banco anterior y se reintenta en la siguiente carga.

`node audit-bank.cjs` reconstruye el banco efectivo. `tests/ingreso-v6-21-banco.test.cjs` comprueba IDs, cobertura, dificultad, corrección numérica, intervalos, rúbricas y recuperación ante fallos de carga.
