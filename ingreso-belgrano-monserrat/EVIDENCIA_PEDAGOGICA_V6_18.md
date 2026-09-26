# Evidencia pedagógica V6.18

## Propósito

V6.18 separa dos cosas que antes estaban mezcladas:

1. **Historial de aprendizaje:** todo lo que ocurrió a lo largo del tiempo.
2. **Estado pedagógico actual:** qué indica principalmente la evidencia reciente y qué conviene hacer después.

Los campos históricos `attempts`, `correct`, `mastery`, `recent`,
`maxDifficultyCorrect` y `lowestMastery` se conservan para compatibilidad.
El porcentaje `mastery` deja de gobernar la práctica adaptativa y deja de
mostrarse a las alumnas.

## Estados

| Estado | Regla principal |
|---|---|
| Sin evidencia | No hay intentos registrados. |
| Explorando | Hay una o dos evidencias, todavía insuficientes para una conclusión estable. |
| En desarrollo | Hay evidencia suficiente para orientar la práctica, pero todavía no cumple los criterios de consistencia. |
| Consistente | Evidencia reciente objetiva y variada: al menos 4 evidencias recientes, 3 correctas, 2 autónomas, 3 ejercicios distintos y al menos un acierto autónomo en dificultad objetivo. |
| Consolidado | El contenido ya era Consistente, se verifica nuevamente después del intervalo de retención y la confianza alcanza nivel alto. |

La dificultad objetivo habitual para comprobar una habilidad es 3
(`Desafiarme`), salvo que el banco de esa habilidad no llegue a ese nivel.

### Puente desde datos históricos

Los perfiles existentes no pierden su historia. Un contenido histórico puede
quedar listo para una comprobación cuando:

- tiene al menos 5 intentos históricos;
- los últimos 3 registros históricos son correctos;
- alcanzó correctamente la dificultad objetivo.

Eso **no** lo convierte en Consistente por sí solo. Requiere un nuevo ejercicio
objetivo, autónomo y de dificultad adecuada, registrado por V6.18.

## Tendencia

- **mejorando:** los dos resultados objetivos más recientes mejoran claramente
  respecto de los dos anteriores; también se reconoce una racha reciente de
  aciertos después de un historial menos estable.
- **revisar:** aparecen errores reiterados en el nivel ya establecido o por
  debajo de él.
- **estable:** no se observa un cambio fuerte en ninguna dirección.

Un error en una dificultad superior al nivel ya establecido se considera
información sobre transferencia/desafío y no borra automáticamente el dominio
del nivel anterior.

## Confianza

- **baja:** evidencia todavía escasa. Un único acierto siempre queda aquí.
- **media:** existe un volumen razonable de evidencia histórica o varias
  evidencias nuevas.
- **alta:** exige evidencia nueva variada y temporalmente distribuida, o una
  comprobación de retención con suficiente evidencia detallada.

El historial anterior puede aportar confianza media, pero no alta por sí solo.

## Peso de la evidencia

La evidencia nueva considera:

- dificultad: niveles más altos pesan algo más;
- autonomía: un acierto con pista pesa menos que uno autónomo;
- tipo de evaluación: los `selfcheck` tienen peso menor;
- recencia: los últimos seis eventos reciben pesos decrecientes;
- variedad: se cuentan ejercicios distintos;
- separación temporal;
- retención.

Para el cálculo reciente se usan pesos de recencia:
`1, 0.86, 0.74, 0.62, 0.52, 0.44`.

Factores de dificultad:
- D1: 0.85
- D2: 0.95
- D3: 1.05
- D4: 1.15

Una pista aplica un factor de autonomía de 0.70.

## Comprobación y retención

Cuando una habilidad muestra una mejora reciente fuerte, se marca
`needsVerification`. La práctica adaptativa prioriza un ejercicio distinto,
cercano a la dificultad objetivo.

Al alcanzar **Consistente**:

1. se registra `consistentSince`;
2. se programa `retentionDueAt` a los 3 días;
3. una respuesta correcta anterior a ese plazo no cuenta como retención;
4. después del plazo se pide una evidencia nueva, objetiva, autónoma y de
   dificultad adecuada;
5. si la retención se verifica y la confianza es alta, pasa a
   **Consolidado**;
6. un contenido consolidado vuelve a mantenimiento aproximadamente 7 días
   después de la última evidencia.

## Producción escrita

Los ejercicios de producción con autoevaluación aportan historia, tendencia y
evidencia de práctica, pero una secuencia formada únicamente por `selfcheck`
no puede llevar por sí sola a Consistente o Consolidado.

## Evidencia registrada por intento

Cada evento V6.18 incluye:

- `eventId`
- `profileId`
- fecha/hora (`at` / `occurred_at`)
- `exerciseId`
- `skillId`
- `area`
- `school`, cuando corresponde
- `difficulty`
- `correct`
- `hintUsed`
- `autonomous`
- `context`: diagnóstico, práctica o simulacro
- `origin`: manual, recomendación, video, contenidos, simulacro, etc.
- `purpose`: exploración, práctica, comprobación, desafío, retención o evaluación
- `durationMs`, cuando puede medirse
- `evaluationMode`: objective/selfcheck
- `evaluationWeight`

La migración `supabase-study-attempt-evidence-v6-18.sql` crea una tabla
append-only con RLS. No modifica ni elimina `study_state` ni
`study_profile_state`.

## Interfaz de alumnas

La interfaz no muestra:

- porcentaje de dominio;
- confianza analítica;
- tendencia analítica;
- conteos detallados de progreso del otro perfil;
- rankings o comparaciones.

En su lugar muestra devoluciones formativas como:

- “Este tema necesita un poco más de práctica.”
- “¡Viene mejorando!”
- “Ya lo resolvés muy bien. Más adelante lo vamos a repasar.”

En modo juntas se oculta el detalle individual; cada respuesta sigue
atribuyéndose al perfil cuyo turno corresponde.
