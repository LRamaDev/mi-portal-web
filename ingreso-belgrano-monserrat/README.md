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
