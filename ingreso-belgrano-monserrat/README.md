# Ingreso Belgrano · Monserrat

Aplicación web de estudio para preparar, en una misma plataforma, los ingresos a la Escuela Superior de Comercio Manuel Belgrano y al Colegio Nacional de Monserrat.

## Estado actual

- **V1:** publicada y validada en GitHub Pages con perfiles, diagnóstico, práctica, contenidos, progreso y simulacros.
- **V2:** sincronización familiar entre dispositivos mediante Supabase; validada con cambios de perfil y avance pedagógico desde PC y celular.
- **V3 pedagógica – etapa 1:** banco ampliado de 46 a 82 ejercicios, mayor presencia de niveles 3 y 4 y herramienta familiar para reiniciar el progreso conservando los nombres.
- **V3 pedagógica – etapa 2:** diagnóstico adaptativo, práctica 60/25/15 y simulacros construidos por bloques temáticos.
- **V3 pedagógica – etapa 3:** simulacros completos sobre 100 puntos, con estructura y ponderación diferenciadas por colegio y materia.

## Representaciones de fracciones con un paso más (V6.28)

Las tandas C-H mantienen sus 7 desafíos y sus IDs, pero 16 consignas de **marcar, pintar o ubicar fracciones** ahora exigen una operación previa breve: combinar fracciones de la misma unidad sin superponer, completar hasta el entero, traducir entre fracción impropia y número mixto, o reconocer equivalencias antes de marcar la recta. Las pistas primero orientan el razonamiento y la segunda explica la conversión; la corrección visual no da inmediatamente la cantidad correcta tras un error.

Se preservan A-B, ya recorridas, y todos los IDs de las tandas para respetar el progreso existente por perfil. No se modifican sincronización, Supabase ni evidencias previas. Validar con un perfil que tenga C-H pendientes y comprobar selección, corrección, pistas, renovación del caché y retorno al progreso al cerrar una sesión.

## Desafíos de ingreso: Fracciones (V6.27)

Se incorpora una práctica específica desde **Inicio** y **Entrenar**, basada en el formato de las actividades de ingreso pero con **56 consignas originales** distintas de las ya resueltas: 8 tandas de 7 desafíos (A-H), con selección de sectores, figuras compuestas, números mixtos, fracciones de fracciones, reconstrucción de unidades, problemas de dos respuestas y complementos.

- La alumna pinta celdas con clic o teclado, ubica puntos en rectas numéricas, agrega fichas con botones o escribe resultados numéricos y fracciones equivalentes. El corrector es local, determinista y ofrece un diagnóstico de error, dos pistas progresivas y resolución paso a paso.
- El módulo se habilita **solo para perfiles individuales**. Las ocho tandas son independientes por perfil y se ofrecen en orden A-H; no se repiten como nuevas después de completarlas. Si la sesión se interrumpe, al volver retoma los ejercicios pendientes a partir de las evidencias ya guardadas.
- Cada desafío finalizado produce **una única evidencia** en el motor pedagógico existente. Los aciertos sin ayuda se distinguen de los alcanzados con pistas o después de revisar un error; revelar la solución genera un registro de revisión, no un acierto.
- Se registra el cierre de cada tanda en el historial del perfil. La ficha de estudiante no expone porcentajes de mastery ni compara a A y V; la información detallada queda dentro de las evidencias para el análisis adulto.
- No modifica tablas, políticas de acceso ni el historial anterior. El estado se guarda localmente y se sincroniza mediante los flujos actuales de Supabase. El visitante conserva su progreso aislado en su dispositivo.
- Los recursos `desafios-fracciones.js`, `desafios-fracciones.css` y `data/desafios-fracciones.json` se agregan al caché versionado de la PWA.

**Verificación manual recomendada antes de fusionar:** abrir la app con cada perfil; realizar una selección incorrecta y corregirla; pedir pistas; revelar una solución; escribir fracciones equivalentes; interrumpir y reanudar una tanda; comprobar que la otra alumna sigue teniendo la tanda intacta; probar modo visitante, modo juntas, móvil y funcionamiento sin conexión después de la primera carga. Confirmar en el panel adulto los registros de `study_attempt_evidence` con `origin='desafios_fracciones'` cuando la conexión esté disponible.

## Funcionalidades

- Dos perfiles independientes, sin nombres reales dentro del repositorio.
- Modo `Estudiar juntas` con turnos alternados en un único dispositivo.
- Diagnóstico individual y adaptativo de Matemática y Lengua.
- Mapa de habilidades con contenidos comunes y específicos de cada colegio.
- Práctica adaptativa basada en estados de evidencia: **Sin evidencia → Explorando → En desarrollo → Consistente → Consolidado**.
- Ajuste de dificultad según desempeño reciente, autonomía, variedad, comprobación y retención.
- Pistas y explicaciones durante la práctica, pero no durante diagnóstico y simulacros.
- Simulacros completos individuales con puntaje sobre 100, corrección final y desglose por bloque.
- Producción escrita de Monserrat Lengua con rúbrica guiada de entrenamiento.
- Actividades que indican cuándo conviene resolver en cuaderno.
- Seguimiento cualitativo por habilidad para alumnas; análisis detallado reservado a los datos adultos de Supabase.
- PWA instalable.
- Persistencia local inmediata y sincronización en Supabase.
- Historial pedagógico protegido: los intentos anteriores se conservan y no se borran desde la app.

## Corrección urgente de aislamiento y restauración de perfiles (V6.25)

- Al cambiar entre familiar y visitante, el modo para **la próxima recarga** se persiste sin cambiar el modo activo del almacenamiento en la página actual. Esto impide el cruce de datos durante el guardado `pagehide`.
- La sincronización por perfil prioriza un nombre familiar válido por encima de «Invitado» al fusionar copias antiguas, **sin borrar evidencias, sesiones ni ejercicios**.
- La cuenta familiar mantiene sus dos perfiles; el visitante continúa con su único perfil local y sin acceso al panel de Familia.
- Se añadieron pruebas de regresión para el cambio de modo y la conservación de identidades.

## Mejoras de acceso y comentarios (V6.24)

- **Invitados:** luego de pulsar «Continuar como visitante», la aplicación abre automáticamente un único perfil **Invitado**, con diagnóstico, práctica, simulacros y progreso local. No se muestran las tarjetas de los perfiles familiares ni el panel administrativo. El botón «Salir» permite volver al acceso familiar. Los datos del visitante siguen aislados del progreso de A y V; la versión anterior de los datos locales del visitante no se borra.
- **Comentarios recibidos:** las observaciones largas se distribuyen en varias líneas, incluso si contienen palabras o repeticiones sin espacios. Se impide que las tarjetas ensanchen la grilla y provoquen desplazamiento horizontal tanto en PC como en móvil. Los textos y registros existentes no cambian.

## Avisar errores de ejercicios (V6.23)

Durante diagnósticos, prácticas adaptativas y simulacros completos, cada actividad muestra **«⚑ Avisar un error en este ejercicio»**. La alumna elige una categoría, puede escribir hasta 500 caracteres y continúa en la misma consigna sin perder su respuesta ni modificar el puntaje.

El aviso conserva el **ID del ejercicio**, perfil activo (incluido el turno individual en modo juntas), modalidad, materia, colegio y una copia de la consigna, opciones, respuesta esperada y explicación para poder reproducir el problema incluso si luego cambia el banco. Los reportes son independientes de «Contar algo», que sigue recibiendo impresiones generales.

- Con sesión familiar autorizada se guardan en `public.study_exercise_reports` (Supabase) y se ven en **Familia → Errores informados**; desde ese panel se pueden marcar como revisados o corregidos.
- Si falta conexión, el aviso se conserva en una cola local y se reintenta enviar al reconectar o volver al panel. Un reporte pendiente se etiqueta claramente como tal. En modo visitante solo se conserva en ese dispositivo.
- Ejecutar la migración aditiva `supabase-study-exercise-reports.sql` si se instala la app en otro proyecto Supabase. La tabla aplica RLS, exige una cuenta presente en `study_access` y permite a la cuenta familiar actualizar únicamente el estado del aviso.
- La marca «corregido» es administrativa: **no modifica automáticamente la consigna del banco**. Corregir un ejercicio requiere revisar su fuente, cambiarla y volver a publicarla.
- No se registran nombres reales, respuestas escritas de las alumnas ni datos de navegación en los avisos.

## Banco pedagógico

### Videos vinculados a contenidos

Los videos sugeridos forman parte de `data/habilidades.json`: cada habilidad puede incluir un arreglo `videos`. La app usa el ID de esa habilidad para mostrar el recurso, ordenarlo según el estado pedagógico actual y ofrecer una práctica breve del mismo tema. Los videos son recursos del contenido y están disponibles para ambos perfiles.

Para agregar otro video, sumá una entrada a `videos` dentro de la habilidad correspondiente. Por ejemplo:

```json
"videos": [{"id":"tvs0UpX93mw","titulo":"Oraciones unimembres y bimembres: concepto y ejemplos","perfiles":["p2"]}]
```

`id` es el identificador de 11 caracteres de YouTube (sin parámetros de seguimiento); `titulo` debe describir lo que enseña efectivamente el video; `perfiles` indica a quién se lo sugirió (`p1`, `p2` o ambos). Se pueden incluir varios videos en un mismo contenido. Antes de publicar una nueva incorporación, comprobá que el enlace explica esa habilidad y permite reproducción integrada. El catálogo se actualiza desde la red y conserva una copia local para cuando no haya conexión.

La V1 contenía 46 actividades originales. El banco fue ampliándose por capas y en la V6.21 alcanzó **690 actividades efectivas**. Las ampliaciones refuerzan problemas de varios pasos, fracciones, decimales, divisibilidad, perímetros, proporcionalidad, geometría, comprensión, inferencias, conectores, tiempos verbales, ortografía, sintaxis y producción escrita.

Las consignas son originales y están alineadas a los programas de ingreso 2026, modelos de examen y materiales de estudio aportados por la familia. No reproducen ni sustituyen exámenes oficiales.

## Diagnóstico adaptativo

El diagnóstico se realiza de manera individual. Parte de un conjunto de habilidades prioritarias comunes a ambos colegios y agrega muestras específicas de Belgrano y Monserrat.

- Comienza, en general, con actividades de dificultad intermedia.
- Si una respuesta es correcta y existe una variante más exigente de la misma habilidad, puede incorporarla como comprobación.
- Si una respuesta es incorrecta y existe una variante más básica, puede incorporarla para distinguir entre un error puntual y una dificultad conceptual más profunda.
- Se limita la cantidad de extensiones para evitar diagnósticos excesivamente largos.
- El modo `Estudiar juntas` queda reservado a práctica; el diagnóstico y los simulacros completos son individuales para no mezclar evidencias ni puntajes.

## Práctica adaptativa V6.18

Las sesiones de entrenamiento usan la evidencia pedagógica actual para decidir qué conviene presentar:

La selección adaptativa prioriza:
- habilidades con **comprobación pendiente** después de una mejora reciente;
- habilidades **Explorando** o **En desarrollo**;
- contenidos **Consistentes** cuando llega el momento de verificar retención;
- contenidos **Consolidados** cuando corresponde mantenimiento.

Si una categoría no tiene suficientes ejercicios disponibles, el motor completa la sesión con las mejores alternativas del banco. La dificultad se ajusta con la evidencia reciente y un error en un desafío superior no borra automáticamente lo ya establecido en un nivel anterior.

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

## Historial protegido

Desde la V6.18 la app no ofrece un borrado del recorrido pedagógico. Los intentos,
aciertos, errores y sesiones anteriores se conservan como historia de aprendizaje.
El estado actual se calcula principalmente con evidencia reciente, por lo que los
errores antiguos no funcionan como una deuda permanente.

## Caché PWA

La V6.18 usa un caché versionado propio e incluye `pedagogy-v6-18.js`, `simulacros.js` y los módulos pedagógicos vigentes, para que PC y celulares reciban el mismo motor después de recargar la aplicación.

## Próximas mejoras

- Aumentar la cantidad de variantes por una misma habilidad para que el diagnóstico adaptativo tenga más profundidad.
- Seguir ampliando el análisis adulto de evolución temporal con la evidencia detallada V6.18.
- Preparar sesiones familiares de 20, 30 y 45 minutos.
- Mejorar el historial para mostrar la evolución de puntajes de simulacros a lo largo del tiempo.
- Agregar una tarjeta de acceso desde la portada de `mi-portal-web` cuando la V3 quede validada.

### Ampliación de tandas C–H (V6.27)

- Se preservan sin cambios los IDs y las consignas de las tandas A y B. Los perfiles que ya las finalizaron pasan directamente a C, sin reiniciar ni duplicar evidencias.
- Se agregan **42 desafíos originales**, con situaciones nuevas y variedad de representaciones y razonamientos: rectas de 0 a 1 y de 0 a 2, reconstrucción del total con datos parciales, figuras compuestas, complementos y problemas de dos etapas.
- Los tipos `line`, `fractioninput` y `number` se corrigen localmente sin servicios externos. El tipo `cards` usa preguntas y categorías específicas de cada consigna, evitando respuestas genéricas de otros problemas.
- Cada nueva tanda sigue usando 7 evidencias del motor existente y un cierre de sesión individual por perfil. No requiere nuevas migraciones SQL.
- Verificación antes del uso: comprobar que A/B completadas lleven a C, que una recta pueda seleccionarse por toque o teclado, que una fracción equivalente se acepte, que la corrección con ayuda no figure como autónoma, y que la tanda siguiente avance sin mezclar historiales.


## Prácticas interactivas por bloques del examen (V6.29)

**Referencia didáctica:** modelo de prueba de Matemática entregado por la familia (portada «Ingreso 2026», páginas interiores con algunas marcas «Ingreso 2025»). Las nuevas consignas se inspiraron en **los tipos de resolución** de los ejercicios 13–18 (fracciones representadas por figuras, palabras, cantidades y unidades) y 20–22 (perímetros compuestos); **no se copiaron las consignas ni los dibujos del examen**.

- **Bloque R — Representaciones de fracciones:** 2 circuitos A/B, siete desafíos por circuito. Leer figuras sombreadas, comparar una cantidad respecto de otra (incluyendo más de un entero), medios cuadrados, vocales en palabras y colorear fracciones de una figura.
- **Bloque P — Perímetros de figuras compuestas:** 2 circuitos A/B, siete desafíos por circuito. Seleccionar segmentos del contorno exterior, excluir bordes compartidos, estudiar el contorno de un cuadrado con triángulo interior, dos cuadrados unidos, dos rectángulos unidos y hexágono con triángulos. Calcular perímetros a partir de medidas dadas.
- **Misma experiencia del módulo original:** usa **el mismo motor** `IngresoFractionChallenges`, el mismo diálogo, estilos, botones, feedback inmediato, dos pistas, resolución guiada y resumen sin mastery visible. Los circuitos repiten **estructuras de problemas** con números y figuras diferentes; no son 28 ejercicios de tipos inconexos.
- **Datos por perfil:** 28 IDs nuevos `MB26-[RP]-[AB]-0x`, evidencias individuales con el motor V6.18 y origen separado, progreso A→B independiente por bloque y por estudiante. Los circuitos antiguos de fracciones y su historial se conservan. Sin SQL nuevo ni cambios de permisos.
- **Accesibilidad:** diagramas SVG con segmentos seleccionables por clic, toque o teclado; el cálculo debe realizarse en cuaderno, sin calculadora, siguiendo el formato del examen.
- **Recursos:** banco `data/desafios-modelo.json` y mismo `desafios-fracciones.js`/`desafios-fracciones.css`; se incluyen en la caché PWA versión 6.29.0.

### Pruebas de aceptación

1. Elegir un perfil familiar; desde Inicio y desde Entrenar abrir cada bloque (circuito A), sin afectar las tandas antiguas de fracciones.
2. Resolver una fracción equivalente (p. ej., 6/10 = 3/5), un error y una consulta de pista. Comprobar el resumen por autonomía.
3. Seleccionar todos los tramos exteriores de una figura, dejando sin seleccionar el tramo interior, y luego calcular su perímetro.
4. Interrumpir A, volver y verificar que retome ejercicios pendientes; al completar siete, habilitar B.
5. Cambiar al otro perfil y al modo visitante; comprobar aislamiento y persistencia.
6. Verificar en móvil la selección táctil de segmentos y que los recursos se carguen offline tras la primera visita.
7. Revisar evidencias `origin='desafios_modelo_representaciones'` / `origin='desafios_modelo_perimetros'` en el panel adulto; las niñas nunca deben ver porcentajes de dominio.
 

## Pestaña Desafíos: acceso unificado y reparación de clics (V6.30)

El problema observado en la versión anterior era una línea del enlazador de eventos que ejecutaba `$('[data-start-fractions]').forEach(...)`. El selector `$` devuelve un solo elemento, no una lista; llamar a `.forEach` lanzaba una excepción que interrumpía la inicialización del resto de botones.

- **Accesos reunidos:** nueva pestaña **Desafíos**, visible en navegación lateral de escritorio y barra inferior del celular. Muestra tres bloques independientes: Fracciones (8 tandas), Representaciones (2 circuitos) y Perímetros (2 circuitos). Inicio y Entrenar muestran solo accesos a esa pestaña, evitando duplicación de tarjetas y fuentes de error.
- **Mismo motor de práctica:** no se modifican las consignas, los 56+28 ejercicios existentes, la interacción visual, las pistas ni la corrección por ejercicio.
- **Eventos robustos:** los botones `data-start-fractions` y `data-start-model` usan una sola delegación de eventos instalada a nivel de documento, al cargar `app.js`; ya no dependen de que `bindUI()` recorra cada botón de forma correcta.
- **Progreso por estudiante y por bloque:** cada perfil conserva su tanda/circuito pendiente, sus evidencias y su historial. Ninguna tabla SQL ni política de Supabase cambia.
- **Prueba de regresión:** `node --test ingreso-belgrano-monserrat/tests/desafios-smoke.test.cjs` verifica la estructura del menú y la pestaña, sintaxis, inicialización de `bindUI()`, apertura de los tres bloques, avance independiente por perfil y clics en botones deshabilitados. El workflow `.github/workflows/ingreso-desafios.yml` ejecuta la prueba en pull requests y en main.
- **Caché PWA:** versión 6.30.0 con nueva clave de caché; no pide borrar datos locales ni reiniciar perfiles.

Prueba manual posterior al merge: confirmar Versión 6.30.0, entrar a «Desafíos», abrir Fracciones, Representaciones y Perímetros; comprobar navegación desde Inicio/Entrenar y en móvil; solicitar una pista, resolver, cerrar/reanudar y confirmar que los perfiles siguen aislados.


## Lengua · Desafíos de Ortografía (V6.31)

**Fuente pedagógica:** «Examen Lengua.pdf», prueba de ingreso **2026** del Colegio Nacional de Monserrat, apartado I «Ortografía» (18 puntos), **páginas 2 y 3**, consignas I.1–I.5. Los ejercicios de la aplicación son nuevos, no transcripciones de las respuestas del examen.

Se conserva **exactamente el recorrido interactivo de Matemática** (7 desafíos por circuito, 2 pistas graduales, corrección inmediata, posibilidad de revisión, explicación en tres pasos y resumen por autonomía). El banco `data/desafios-ortografia.json` tiene **70 consignas originales**: cinco bloques con dos circuitos A/B de siete ejercicios cada uno.

| Bloque | Tipo de consigna del examen | Modalidad interactiva |
|---|---|---|
| D | I.1: diptongo o hiato | Clasificar una palabra; pista de separación silábica |
| J | I.2: oración correcta o incorrecta | Detectar error de G/J y, si existe, escribir la palabra corregida |
| B | I.3: completar B/V/C/S/Z | Escribir una palabra completa con la letra correcta dentro de una oración |
| A | I.4: palabra que necesita tilde | Seleccionar una palabra de cuatro **y escribirla acentuada** |
| T | I.5: tilde diacrítica | Elegir la forma correcta a partir del significado en una oración |

**Criterio de práctica:** la repetición es intencional, los problemas usan vocabulario y contextos distintos a los ya resueltos, y se alterna reconocimiento con producción escrita. No se permite dar por correcta una palabra sin tilde si la tilde es obligatoria. Tampoco se considera completa la clasificación de una oración incorrecta sin escribir la palabra corregida. Las explicaciones se ofrecen al finalizar o como segunda ayuda.

**Integración técnica:** reusa `IngresoFractionChallenges.open({orthographyBlock,round,...})` sobre el mismo diálogo existente y la misma interfaz. `app.js` habilita cinco tarjetas nuevas en la pestaña **Desafíos**, bajo «Lengua · Ortografía», con eventos delegados resistentes a la reorganización de la página. Cada perfil tiene su propia secuencia A→B por bloque, con continuidad por `MO26-[DJBAT]-[AB]-0x`, seguimiento pedagógico por habilidades `LEN-DIP-HIA`, `LEN-GJ`, `LEN-BV`, `LEN-CSZ`, `LEN-ACENT` y `LEN-DIAC`. La base de Supabase no necesita migraciones.

**Verificación automatizada:** `node --test ingreso-belgrano-monserrat/tests/desafios-smoke.test.cjs ingreso-belgrano-monserrat/tests/ortografia-smoke.test.cjs` dentro del flujo CI de Desafíos. Revisa banco, corrección de los 70 ejercicios y 70 respuestas incorrectas, pistas, retroalimentación, regreso a Matemática, activación de botones y separación de perfiles. Versión/caché PWA **6.31.0**.

**Prueba manual tras fusionar:** actualizar hasta ver versión 6.31.0, ir a Desafíos → Lengua · Ortografía; abrir cada bloque desde Perfil A y Perfil V; comprobar el uso táctil de las opciones, la escritura con tildes, el mensaje de error y las pistas; cerrar/reanudar un circuito y verificar que el otro perfil permanece intacto.


## Ampliación de Desafíos de Matemática y Ortografía (V6.32)

Se agregan **70 actividades originales** sin eliminar ni renumerar las 154 existentes. Se mantiene el mismo modal `IngresoFractionChallenges`, con siete consignas por circuito, dos pistas, corrección inmediata, explicación paso a paso y registro por perfil de soluciones autónomas, con ayuda o para revisar.

| Bloque | Situación nueva | Circuitos nuevos | Ejercicios nuevos |
|---|---|---|---:|
| Matemática — Circunferencia (C) | Reconocer centro, radio, diámetro, cuerda, arco y línea circunferencial; hallar radio, diámetro y longitud con π ≈ 3,14 | A y B | 14 |
| Matemática — Comparación y orden de fracciones (F) | Comparar con <, > o =; ordenar tocando tarjetas; escribir cualquier fracción estrictamente intermedia | A y B | 14 |
| Lengua — G/J (J) | Completar G/J en palabras enteras y corregir errores en oraciones | C y D, conservando A/B | 14 |
| Lengua — Acentuación general (A) | Identificar y escribir la palabra que requiere tilde; luego colocarla sin opciones | C y D, conservando A/B | 14 |
| Lengua — Tilde diacrítica en monosílabos (T) | Elegir según contexto y luego escribir el monosílabo correcto sin alternativas | C y D, conservando A/B | 14 |

**Total:** 224 ejercicios especiales en los bancos (56 de fracciones originales, 56 de los cuatro bloques específicos de Matemática y 112 de Ortografía). Los bloques Ortografía Diptongo/Hiato y B/V/C/S/Z conservan dos circuitos A/B sin cambios; G/J, Acentuación y Tilde diacrítica tienen cuatro A/B/C/D.

**Continuidad de perfiles:** si un perfil ya terminó A y B de G/J, Acentuación o Tilde diacrítica, la app le ofrece **C** directamente. Si terminó también C, avanza a **D**. Los dos perfiles no comparten progreso. Los resultados mantienen los ID históricos y usan los nuevos `MB26-C/F` y `MO26-J/A/T-C/D` sin cambios en Supabase.

**Matemática y precisión:** en los problemas de longitud circular, se informa expresamente la aproximación π ≈ 3,14 y se aceptan números decimales con coma o punto; en fracciones se comparan productos cruzados, se respeta la equivalencia y se acepta **cualquier fracción estrictamente intermedia**, no una única solución modelo. En Ortografía se comprueban las tildes y letras efectivamente escritas; un ejemplo sin tilde obligatoria no puede contarse como correcto.

**Pruebas automáticas:** `node --test ingreso-belgrano-monserrat/tests/desafios-smoke.test.cjs ingreso-belgrano-monserrat/tests/ortografia-smoke.test.cjs ingreso-belgrano-monserrat/tests/ampliacion-desafios-v6-32.test.cjs`. El workflow `.github/workflows/ingreso-desafios.yml` las ejecuta en cada PR. La caché PWA avanza a 6.32.0.

**Prueba manual recomendada antes de empezar el uso habitual:** entrar con ambos perfiles a Desafíos y abrir Circunferencia y Comparación; comprobar selección de dibujos, orden táctil y escritura fraccionaria; verificar una respuesta decimal «31,4» y una incorrecta; retomar las tandas C/D de Ortografía y escribir monosílabos con/sin tilde; probar en un celular y comprobar que ambos perfiles conservan su historial.


## Estados visuales por perfil en la pestaña Desafíos (V6.34)

La pestaña **Desafíos** marca cada una de sus 13 tarjetas mediante **color, texto visible y un botón contextual**. No utiliza puntuaciones ni porcentajes de dominio, y no compara a las estudiantes:

| Color de tarjeta | Etiqueta | Cuándo aparece | Acción |
|---|---|---|---|
| Verde | Completado | Todos los circuitos/tandas actualmente disponibles figuran completados en el historial del perfil activo | Botón deshabilitado «Todo completado» |
| Naranja | En curso | El siguiente circuito tiene al menos una evidencia registrada, pero todavía no está completo | «Continuar circuito/tanda X» |
| Violeta | Nuevos desafíos | Hay circuitos anteriores completados y quedó otro disponible sin empezar; **esto incluye circuitos añadidos por una actualización posterior** | «Hacer nuevos desafíos · X» |
| Azul | Por hacer | No tiene ningún circuito finalizado ni evidencia del siguiente | «Empezar circuito/tanda A» |
| Gris | Elegí un perfil | Está activo el modo conjunto, que no registra recorridos individuales | Botón deshabilitado |

El encabezado de la pestaña incluye una leyenda visual con los cuatro estados y un resumen de bloques con trabajo disponible, ya terminados y con nuevos circuitos. El estado se calcula usando **el historial y las evidencias existentes**: `FR26-*`, `MB26-<bloque>-<ronda>-*` y `MO26-<bloque>-<ronda>-*`. La identificación de los circuitos disponibles usa las listas de la **versión actual**, evitando que A/B completos oculten un C o E agregado posteriormente.

El indicador se actualiza al abrir Desafíos, al cambiar de perfil, al completar un circuito y también luego de guardar una respuesta dentro de un circuito comenzado. No se alteran los IDs de ejercicios, registros históricos, contraseñas, permisos, tablas ni políticas de Supabase. El visitante recibe su propio indicador; el modo conjunto no muestra progreso de ninguno de los dos perfiles.

Los colores siempre están acompañados por palabras y los botones conservan texto legible. Se incluyen pruebas de regresión en `tests/estados-desafios-v6-34.test.cjs`, incorporadas al flujo CI de Desafíos: 13 tarjetas y leyenda, estados completado/nuevo/en curso/pendiente, reconocimiento de una ampliación A/B→C, continuidad y aislamiento entre perfiles.

**Comprobación manual tras el merge:** abrir la versión 6.34.0, entrar a cada perfil y comprobar que las tarjetas finalizadas están verdes; las recién ampliadas violetas; iniciar una para que pase a naranja; terminar el último circuito disponible para que pase a verde. Probar también la navegación en celular.


## Actualización pedagógica del 23 de noviembre (versión 6.35)

**Punto de partida verificado:** ambos perfiles tienen 294 evidencias de resolución para los 42 circuitos de la versión anterior. Perfil A tiene 42 cierres en `history` y Perfil V, 40; los dos cierres faltantes de V se reconocen **a través de las siete evidencias individuales** de cada ronda, sin modificar, borrar ni reconstruir sus históricos en Supabase.

### Contenidos y progresión

La ampliación suma **119 consignas nuevas**, que se agregan a las 294 existentes:

| Tipo | Circuitos | Nuevas consignas | Qué cambia |
|---|---|---:|---|
| Matemática guiada | E-C/D/E (conversión fracción-decimal) | 21 | Propias, impropias, denominadores 10/100/1000/10000, conversión a irreducibles y contextos |
| Matemática guiada | D-C/D (operaciones decimales) | 14 | Dividir por 10/100/1000, reparto, medidas, dinero y operaciones combinadas |
| Matemática de transferencia | C-D y F-D | 14 | Problemas compuestos de circunferencia y comparación/orden/intercalación de fracciones impropias |
| Lengua guiada | J-F, A-E, T-F, P-C y U-A/B | 42 | Conjugación G/J, hiatos y tildes, escritura de monosílabos, puntuación, concordancia, conectores, unimembres/bimembres y revisión de oraciones |
| Comprobaciones separadas | Transferencia Matemática y Lengua; Retención Matemática y Lengua | 28 | Cuatro recorridos mixtos de siete consignas originales |

**Total: 413 consignas**, con 119 nuevas y el banco anterior inalterado. El motor `desafios-fracciones.js` sigue utilizando el mismo diálogo: siete consignas por circuito, «Comprobar», ayudas progresivas, «Siguiente desafío», explicación y resumen.

### Distinción pedagógica y condiciones de acceso

- **Práctica guiada:** repite el procedimiento con datos y problemas nuevos. Identificada como `practica_guiada` en el nuevo banco.
- **Transferencia:** situaciones distintas que combinan habilidades; los circuitos de Matemática C-D, F-D y E-E contienen tareas de transferencia. Las nuevas comprobaciones separadas se identifican `CK26-M-T-01…07` y `CK26-L-T-01…07`.
- **Retención:** comprobaciones `CK26-M-R-01…07` y `CK26-L-R-01…07`, disponibles a partir del **cuarto día después de la práctica prioritaria**, una vez finalizada la transferencia del área. Una espera mayor no las elimina.
- Las comprobaciones **no ofrecen pistas antes de la primera respuesta válida**. Si la primera respuesta es incorrecta y luego se corrige, queda «con ayuda» y `firstAttemptCorrect=false`, nunca «autónoma». El historial distingue `desafios_comprobacion` con `phase: transferencia|retencion` y las evidencias con `origin`/`purpose` independientes.
- Matemática: transferencia después de E-E y D-D. Lengua: después de J-F, A-E, T-F, P-C y U-B. Son condiciones explícitas que impiden que un acierto aislado dentro de la práctica guiada se considere dominio.
- El acceso a retención se calcula desde la **fecha más reciente de los circuitos guiados requeridos**. No hay ejecución automática, tareas programadas ni envío de notificaciones. La fecha se muestra en la tarjeta y se reevalúa cuando se abre la pestaña.
- Los estados visuales incluyen **«Para reforzar»** y **«Comprobación pendiente»** además de por hacer, en curso, nuevos y completados. El color siempre tiene su etiqueta; ningún porcentaje o diagnóstico adulto aparece en las tarjetas.

### Evidencias, privacidad y corrección escrita

Se mantienen el mismo `STORAGE_KEY`, los IDs originales, el perfil invitado aislado, las cuentas familiares y las tablas, políticas y permisos de Supabase **sin migraciones**. Las nuevas evidencias se almacenan por perfil mediante el mecanismo existente `IngresoPedagogy.createEvidence/applyAttempt` y su sincronización actual. La distinción práctica/transferencia/retención se conserva mediante `purpose`, `origin`, `context`, `hintUsed` y las sesiones de cierre; no se altera a mano ningún registro previo.

La corrección de **producciones escritas** incorporada aquí está limitada intencionalmente a **oraciones breves con una solución objetivo** (por ejemplo, corrección de concordancia, tildes y signos) mediante `orth-rewrite` y `orth-rule`. La aplicación no califica redacciones abiertas de manera automática ni finge que una coincidencia literal mida coherencia, creatividad o calidad narrativa. Las producciones libres requieren evaluación humana o un corrector contextual distinto, a integrar por separado después de validar su seguridad y su rúbrica.

### Pruebas

`node --test ingreso-belgrano-monserrat/tests/desafios-smoke.test.cjs ingreso-belgrano-monserrat/tests/ortografia-smoke.test.cjs ingreso-belgrano-monserrat/tests/ampliacion-desafios-v6-32.test.cjs ingreso-belgrano-monserrat/tests/estados-desafios-v6-34.test.cjs ingreso-belgrano-monserrat/tests/transferencia-retencion-v6-35.test.cjs`

Las comprobaciones nuevas verifican **119 respuestas correctas y 119 incorrectas**, id único para 413 consignas, continuidad y privacidad de perfiles, conservación de evidencias completas sin cierre, apertura del modal, ausencia de pistas en el primer intento, diferencia entre respuesta autónoma y corregida, habilitación a los cuatro días, y versionado de PWA. La suite anterior de la v6.33 sigue ejecutándose en el otro workflow.

**Prueba manual imprescindible tras fusionar:** confirmar v6.35.0, abrir los circuitos E-C/D/E y D-C/D en ambos perfiles; resolver y cerrar uno; completar los requisitos de transferencia en un perfil de prueba; intentar una comprobación sin pista antes de responder; verificar que retención permanece bloqueada hasta el día indicado, y que el perfil opuesto y sus históricos no cambian.


## Última semana Monserrat: estudio autónomo y seguimiento remoto (V6.36)

Se amplía la PR v6.35 antes de su fusión para responder al relevamiento del 24 de noviembre y a la disponibilidad familiar: acompañamiento presencial el martes 24 y trabajo autónomo por la mañana los días 25, 26 y 27, con revisión remota por la cuenta familiar.

### Mi actividad de hoy

La primera sección de **Desafíos** muestra una guía fechada del 24 al 30 de noviembre de 2026. Usa la fecha local de Córdoba para el día sugerido; permite elegir cualquier otro día y **no impone cierres ni bloqueos de jornada**. Todo se resuelve en el perfil individual y el día siguiente no depende de terminar el anterior:

| Día | Perfil 1 (A) | Perfil 2 (V) |
|---|---|---|
| Mar 24 | Comprobación inicial de Matemática sin pistas | Comprobación inicial de Matemática sin pistas |
| Mié 25 | Conversión fracción-decimal E-C y G/J J-F | División decimal D-C y Acentuación A-E |
| Jue 26 | Medidas y divisibilidad S-A; narración breve | Primos y magnitudes S-B; narración breve |
| Vie 27 | Simulacro de Matemática en papel, 60 minutos | Ídem |
| Sáb 28 | Revisión de 2–3 errores y retención si ya corresponde | Ídem |
| Dom 29 | Simulacro de Lengua en papel, 60 minutos | Ídem |
| Lun 30 | Repaso liviano y descanso | Ídem |

Los accesos de las tandas programadas **abren directamente** el circuito asignado, sin exigir que el otro perfil termine un circuito anterior. Antes de iniciar se comprueba que ese circuito no figure completado. Las tandas guardan intentos, ayudas y cierres mediante el motor y la sincronización anteriores.

### Contenidos complementarios

Se crea el bloque S de Matemática con **14 consignas originales**: S-A sobre capacidad, tiempo, múltiplos, MCM y ángulos; S-B sobre primos/compuestos, masa, capacidad y operaciones combinadas. Cada tarea se registra bajo su habilidad del catálogo. No se fuerza a ambos perfiles a hacer las dos tandas.

**Banco acumulado:** 294 ejercicios anteriores + 119 de v6.35 + 14 de este bloque = **427 consignas únicas**.

### Comprobación inicial y retención

La transferencia de Matemática y Lengua se habilita directamente como **comprobación inicial**, sin necesitar completar primero 35 o 42 ejercicios guiados. Sigue impidiendo pistas antes del primer intento válido; resolver tras equivocarse queda etiquetado como «con ayuda».

La retención se habilita **cuatro días después de finalizar la comprobación inicial de la materia**, con fecha explícita. No afecta los otros días del calendario ni bloquea el simulacro; puede realizarse después de esa fecha. Las evidencias siguen registradas individualmente con propósito y origen propio; ningún acierto aislado implica dominio consolidado.

### Simulacros imprimibles y producción escrita

- `simulacro-final-matematica.html`: **16 consignas originales**, 100 puntos orientativos, 60 minutos. Incluye fracciones, decimales, divisibilidad, medidas, geometría y problemas integrados.
- `simulacro-final-lengua.html`: relato original, **12 consignas**, 100 puntos orientativos, 60 minutos. Incluye lectura, comprensión, ortografía, gramática, puntuación y producción narrativa.
- Son **modelos propios no oficiales**: se abren en una pestaña y pueden imprimirse desde el navegador. Se cachean para uso sin conexión.
- El botón **«Lo realicé en papel»** registra únicamente una declaración de realización en `profile.weekLog[fecha][id]`, con `reviewed:false`. **No equivale a corregir, aprobar ni completar un simulacro digital**.
- El borrador narrativo del jueves se guarda en `profile.weekWriting[fecha]` con fecha y `reviewed:false`. El sistema no asigna puntajes automáticos a textos abiertos ni los compara con respuestas modelo. El sábado y lunes pueden guardarse notas breves en `profile.weekNotes` y un registro de la actividad en `weekLog`.

### Consulta remota sin confundir alumnos

En **Familia** se agrega un resumen de actividades semanales **solo del perfil seleccionado**, sin mostrar las evidencias del otro perfil, estadísticas comparativas ni diagnósticos en modo «Estudiar juntas». Cuando la sesión familiar está autenticada, el estado y los borradores usan el guardado y la sincronización existentes; sin autenticación quedan en el dispositivo. Es un resumen por perfil, **no un panel de supervisión adulto autenticado en tiempo real**; la consulta remota necesita que se sincronicen los dispositivos.

### Pruebas y compatibilidad

Prueba nueva: `tests/ultima-semana-v6-36.test.cjs`, incluida en `.github/workflows/ingreso-desafios.yml`. Comprueba calendario y aislamiento de los perfiles, navegación directa a S-B, modelos imprimibles de 100 puntos, retención a cuatro días, 14 respuestas correctas y 14 incorrectas, disponibilidad de transferencia inicial y versión. Se mantiene intacto el `STORAGE_KEY`, sin cambios SQL, RLS, permisos ni pérdida de historiales.

**Control manual:** después de fusionar, confirmar v6.36.0, probar el botón Mi actividad de hoy en cada perfil, resolver una consigna guiada y otra sin pistas, cambiar de día y de perfil, guardar una narración y verla desde el mismo perfil en otro dispositivo con la cuenta sincronizada, imprimir ambos modelos y confirmar que lo realizado en papel figura *sin corregir*.
