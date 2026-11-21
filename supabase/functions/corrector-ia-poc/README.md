# Prueba técnica de corrección asistida — Monserrat (aislada)

**Estado al 17/11/2026:** Edge Function `corrector-ia-poc` **desplegada en Supabase Tercer Tiempo**, versión 5, estado ACTIVE y `verify_jwt=true`. El usuario configuró `POC_AI_MODE=mock` en los secretos (su valor no es legible con las herramientas disponibles). **La pantalla de prueba aislada ya está publicada, pero la aplicación de estudio continúa desconectada del corrector.** No es aún un servicio de corrección para estudiantes.

## Qué contiene

- `fixtures.mjs`: solo **dos producciones inventadas**; nunca textos de A o V.
- `rubrica.mjs`: rúbrica fija experimental de siete dimensiones, 35 puntos, prompts pedagógicos, contratos de respuesta y validaciones.
- `index.ts`: prototipo de Edge Function Supabase con autenticación por sesión, consulta a `study_access`, CORS acotado, bloqueo predeterminado, modo simulado y conexión opcional a Cloudflare Workers AI.
- `rubrica.test.mjs`: pruebas sin Internet ni claves, con resultados simulados y respuestas malformadas.

## Prueba local, sin proveedor

Desde la raíz del repositorio:

```bash
node --test supabase/functions/corrector-ia-poc/rubrica.test.mjs
```

Las pruebas verifican la *estructura técnica*, no la calidad de las correcciones de una IA real.

## Mecanismos de seguridad

1. El navegador **no** recibe tokens de Cloudflare. Los secretos quedan en variables de entorno de Supabase.
2. La función exige un JWT válido del usuario y verifica su pertenencia a `study_access`. La comprobación no depende del nombre de perfil informado por el navegador.
3. Se aceptan exclusivamente `{ "fixtureId": "ficcion-01"|"ficcion-02", "modelo": "glm"|"oss" } (la versión anterior de la pantalla puede usar "qwen" solo como alias de simulación)`. **No hay campo de texto libre**, ni cargas de fotos ni referencias a perfiles familiares.
4. `POC_AI_MODE` ausente o distinto de `mock`/`live` devuelve 503. `mock` no llama a Cloudflare.
5. Ninguna respuesta ni texto se escribe en Supabase. No se modifica `study_profile_state`, `study_attempt_evidence`, historial ni maestría.
6. La función rechaza otros orígenes en navegador; **CORS no sustituye la autenticación**.
7. Los puntajes recibidos se validan y se recalculan; no confiar en un valor total enviado por el modelo.

## Comprobaciones posteriores al despliegue

- Supabase confirmó `status=ACTIVE`, `version=5` y `verify_jwt=true`.
- Se recuperó el código de la función desplegada y se comprobó que conserva `withSupabase({auth:"user"})`, la consulta a `study_access`, el bloqueo por modo y las dos fichas ficticias.
- Las pruebas automáticas del PR finalizaron correctamente, incluyendo una prueba de cabeceras CORS del navegador.
- **Verificado en navegador familiar:** la pantalla devolvió `modo: simulado` y `23/35` (captura aportada por el usuario).
- **Pendiente:** ensayo real de GLM/GPT-OSS con los relatos ficticios; requiere que una persona adulta habilite `live` en Supabase después de publicar la pantalla comparadora.
- No se alteraron los datos de los perfiles ni el banco de ejercicios.

## Antes de cualquier prueba real con Cloudflare

- Crear una cuenta de Cloudflare administrada por una persona adulta; obtener un token **limitado a Workers AI** y el `Account ID`. No ponerlos en GitHub, chats ni frontend.
- Revisar las condiciones vigentes del proveedor/modelo. La política de datos de Cloudflare es un insumo, **no reemplaza verificar las condiciones relativas al tratamiento de datos de menores**.
- Verificar permisos y costes del proyecto. Configurar consumo/cupo y deshabilitar la función si no se monitorea.
- Desplegar solo después de revisar código, autenticación, secreto y mecanismo de cuota. Para las pruebas del modelo seguir usando únicamente `ficcion-01` y `ficcion-02`.
- No incorporar respuesta libre de estudiantes sin permisos diferenciados de adulto, controles de abuso y un análisis específico de privacidad.

## Fuentes verificadas (noviembre de 2026)

- https://supabase.com/docs/guides/functions/auth
- https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/
- https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/
- https://developers.cloudflare.com/workers-ai/platform/data-usage/
- https://developers.cloudflare.com/workers-ai/platform/pricing/

**Nota de evaluación:** la rúbrica del prototipo es original, orientativa y parcial: un texto digital no permite verificar presentación manuscrita, cantidad real de renglones ni subrayados. La rúbrica oficial del ingreso pondera criterios, pero este ensayo no pretende replicar su calificación.

## Seguridad adicional para pruebas reales (17/11/2026)

- Se instaló en el proyecto de Supabase una cuota **global** de hasta **4 llamadas reales por día UTC** mediante `public.ai_poc_take_slot()`. El incremento es atómico.
- La tabla `public.ai_poc_daily_quota` tiene RLS y no concede permisos a `anon` ni `authenticated`.
- La función solo permite la RPC mediante `ctx.supabaseAdmin`. Si la cuota o su verificación falla, se cancela la llamada a Cloudflare.
- El modo `mock` no consume la cuota.
- Se retiró el modelo `qwen3-30b-a3b-fp8` porque Cloudflare anunció su retirada para el **20 de noviembre de 2026**. Las opciones pasan a ser `glm` (GLM 4.7 Flash) y `oss` (GPT-OSS 20B).
- Los secretos no se leen ni se verifican por el conector. El cambio a `POC_AI_MODE=live` exige una acción explícita de la persona adulta en el panel de Supabase.
- Sigue prohibido enviar texto libre, identidades, fotos o respuestas reales de menores.
- Referencias: https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/ · https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/ · https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/

## Diagnóstico del primer 502 y corrección (17/11/2026)

- La captura de la prueba real mostró error 502 al seleccionar GPT-OSS 20B.
- Los registros de Supabase confirman solicitudes autenticadas que terminaron en 502; la cuota diaria registraba **2 de 4** llamadas.
- El código antiguo devolvía un error genérico que no permitía distinguir rechazo de Cloudflare de validación de JSON. **La causa exacta anterior no quedó registrada** y no se debe afirmar como confirmada.
- La **versión 5**, desplegada en Supabase, ahora utiliza el endpoint uniforme `/ai/v1/chat/completions`, compatible con GLM y GPT-OSS.
- Se eliminó `response_format: {type:"json_object"}`, ya que la compatibilidad JSON Mode no estaba verificada para esos modelos. La función exige y valida JSON devuelto de forma independiente, sin exponer contenidos brutos.
- Se incorporaron códigos de error seguros para `provider_http` (status), `provider_invalid_json`, `provider_invalid_schema`, `provider_truncated`, `provider_empty`, `provider_timeout` y `provider_network`.
- Se corrigió el reconocimiento de JSON entre marcas Markdown y la suite de pruebas finalizó correctamente.
- **Pendiente:** una nueva prueba auténtica limitada a uno de los relatos ficticios para validar una devolución real. No afirmar que el problema quedó resuelto hasta entonces.
- La presentación amigable de esos códigos en la web está en el PR #164 independiente.

Documentación: https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/ · https://developers.cloudflare.com/workers-ai/features/json-mode/

## Prueba de cupo agotado — 17/11/2026

- La pantalla mostró HTTP **429**: límite global de cuatro pruebas por día UTC alcanzado.
- Confirmación directa: `public.ai_poc_daily_quota` contiene `2026-11-17 → requests = 4`.
- En `function_edge_logs` se observan cuatro invocaciones **502** (dos sobre versión 4 y dos sobre versión 5) y una invocación posterior **429**.
- El cupo se reserva **antes** de llamar a Cloudflare: los fallos también cuentan. Esta es la conducta prevista de seguridad; no modificar ni reiniciar la cuota para saltar el límite.
- **No hay evidencia de correcciones reales exitosas**; los logs de acceso solo muestran códigos HTTP, no el código seguro específico devuelto en el cuerpo. La causa del 502 sigue sin confirmarse.
- Próximo intento: recuperar el código amigable del error desde la pantalla ya publicada, usando **solo una** solicitud ficticia cuando empiece un nuevo día UTC. Si hubiera un 502, registrar únicamente el código (`provider_http`, `provider_invalid_json`, `provider_invalid_schema`, `provider_timeout`, etc.) y detener nuevas solicitudes hasta ajustar la causa.
- El siguiente reinicio del cupo es `2026-11-18 00:00 UTC`, equivalente a `2026-11-17 21:00` en Córdoba.
- La pantalla sigue aislada de los perfiles y del resto de la aplicación.

## Diagnóstico local de secretos (18/11/2026)

- Nuevo comando autenticado `{ "accion": "diagnostico" }`. Comprueba la **forma** de los secretos de Cloudflare (`Account ID` de 32 hex, token sin espacios o caracteres de control, cabecera HTTP construible).
- No devuelve credenciales, fragmentos, huellas ni longitudes. No hace solicitudes al proveedor ni usa la cuota de IA.
- La misma validación se ejecuta en modo real **antes** de reservar un cupo; si falla devuelve uno de `config_invalid_account`, `config_invalid_token`, `config_invalid_header`.
- El diagnóstico local **no garantiza** que el token tenga permisos suficientes ni que exista conectividad externa. Solo verifica sintaxis.
- El código conserva el control `withSupabase({auth:"user"})` y la consulta de autorización familiar a `study_access`.

## Corrección de timeout de GLM — 18/11/2026
- Registros confirmados: petición del 18/11/2026 a las 15:32:23 UTC devolvió HTTP 502 tras **25.731 ms** de ejecución. La función desplegada tenía `AbortSignal.timeout(25000)`, por lo que el límite impuesto por nuestra app es la causa inmediata más probable del corte.
- Se amplía la espera controlada a **65 segundos** (por debajo del timeout de solicitud inactiva de 150s publicado por Supabase) sin reintentos automáticos.
- Se limita la salida del modelo a **1600 tokens** en lugar de 2400 y se piden explicaciones breves. Esto reduce trabajo potencial pero podría requerir ajuste si el modelo devuelve JSON incompleto.
- Se agrega `options: {rejectIfBusy:true}` en el cuerpo de Chat Completions. Cloudflare documenta que, si no tiene capacidad, responde con 429 en lugar de dejar la solicitud en cola.
- No se cambia el límite global diario de cuatro peticiones ni se reinician contadores.
- Ninguna de estas modificaciones demuestra una corrección real exitosa: el siguiente ensayo requiere solicitud autenticada del usuario con uno de los textos ficticios, sin repetir ante error.
- Fuentes: https://supabase.com/docs/guides/functions/limits · https://developers.cloudflare.com/workers-ai/features/reject-if-busy/ .

## Truncamiento detectado — 18/11/2026
- El navegador informó `provider_truncated`: una respuesta llegó desde Cloudflare con `finish_reason=length` (sin poder completar el JSON).
- Supabase registra **3** reservas del cupo de 4 llamadas de ese día; queda una. No se reinició el cupo ni se volvió a consultar la API en esta modificación.
- GLM 4.7 Flash es un modelo de razonamiento. La documentación de Cloudflare admite `chat_template_kwargs: { enable_thinking: false }`, que se añade **solo a GLM** y no se envía a GPT-OSS.
- Se conservan el límite de salida de 1600 tokens, el timeout de 65s, la validación estricta, `rejectIfBusy`, la sesión familiar, la autorización `study_access` y la cuota global de cuatro llamadas por día.
- Esta corrección NO implica aún que GLM entregue JSON válido: falta una prueba de extremo a extremo, con un único texto ficticio.
- Referencias: https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/ ; https://developers.cloudflare.com/agents/models/ai-sdk/ .

## Diagnóstico no consumible para HTTP 503 (18/11/2026)

- La solicitud del 18/11/2026 a las 15:56:23 UTC devolvió `503` en 434 ms, mientras el contador seguía en 3/4: no alcanzó Cloudflare ni consumió cupo.
- El error 503 podía producirse por `POC_AI_MODE` distinto de `mock` o `live`, `config_invalid_*` o `quota_unavailable`. La pantalla agrupaba todos estos estados en un mensaje genérico.
- La acción autenticada `{accion:"diagnostico"}` ahora responde incluso con `POC_AI_MODE` deshabilitado y devuelve solo la clasificación `modoServicio: real | simulado | deshabilitado`, sin mostrar secretos ni consumir cupo.
- El error por modo no habilitado incluye ahora `code: mode_disabled`. La interfaz (PR independiente) distinguirá `mode_disabled`, `quota_unavailable` y configuración inválida sin enviar otro texto a Cloudflare.
- **La causa concreta de ese 503 anterior aún no puede inferirse del registro de acceso solamente.** No crear nuevos intentos de IA hasta ejecutar este diagnóstico.

## Auditoría pedagógica tras primera respuesta real — 19/11/2026

- La prueba con `ficcion-01` y GLM 4.7 Flash respondió correctamente por primera vez, pero **dio 35/35 a un texto con faltas evidentes**.
- El modelo ofreció explicaciones incorrectas: `quizo` no es un subjuntivo en la frase, `después` es adverbio y `logró` está en 3.ª persona; omitió `se callo → se cayó`.
- Se agrega `auditoria.mjs`, con referencias esperadas SOLO para los dos relatos ficticios. Descarta errores cuya cita no aparezca literalmente en el texto; identifica cobertura incompleta y contradicciones de máximo puntaje.
- **No se muestra ninguna nota como válida automáticamente**, ni siquiera cuando el modelo devuelve JSON correcto. `puntajeEstimado: null`, `puntajePropuestoPorModelo` conserva la cifra como dato de investigación, `calificacionValidada:false` y `auditoria.estado:requiere_revision_adulta`.
- La auditoría **no puede certificar la exactitud de una explicación gramatical** ni sustituir la valoración humana. Antes de permitir datos de estudiantes deben añadirse pruebas de calidad y privacidad aplicables a menores.
- Para la UI experimental se requiere el PR de presentación posterior, que mostrará claramente `Puntaje sin validar` y advertencias al titular.
- No se hacen consultas de IA durante pruebas de CI ni al desplegar.

## Benchmark offline de dos relatos ficticios — 19/11/2026
- Se agregó una referencia humana en `benchmark/REFERENCIA_PEDAGOGICA.md` y una versión procesable `benchmark/referencia-humana.mjs`.
- La transcripción manual del primer resultado real de GLM permite comprobar **5 de 6** detecciones ortográficas, con explicaciones gramaticales erróneas y una calificación **35/35 no validable**.
- GPT-OSS 20B sigue **pendiente de prueba real**. No se infirieron ni inventaron resultados.
- Se detectó una contradicción de contrato: 6 errores obligatorios, pero antes se admitían solo 5 observaciones; se cambió a **10 observaciones máximo**. Este cambio sigue únicamente en el PR experimental, **NO se despliega como parte de la creación del benchmark**.
- El comparador offline verifica coincidencia de errores y sustituciones; **no** sustituye la corrección adulta de explicaciones o narrativa. No realiza llamadas externas ni altera la base de datos.

## Corrector híbrido experimental — 19/11/2026

Se añadió la acción autenticada `{ "accion":"hibrido", "fixtureId":"ficcion-01" }`, separada de la antigua corrección IA. El backend solo reconoce `ficcion-01` y `ficcion-02`, ya corregidos de forma contextual por una persona adulta.

**Componente de forma, sin IA:** `hibrido.mjs` convierte las referencias humanas de `benchmark/referencia-humana.mjs` en correcciones con fragmento original, propuesta, explicación y posición exacta. No corrige texto libre, no hace consultas externas, no consume cupo y **no asigna notas**; funciona en `mock`, `live` o modo deshabilitado.

**Componente narrativo, separado y optativo:** `{ "accion":"hibrido", "fixtureId":"ficcion-01", "narrativa":true, "modelo":"glm" }`. En `mock` utiliza respuestas SIMULADAS; en `live` exige autenticación, autorización `study_access`, credenciales válidas y un cupo global de cuatro llamadas UTC antes de contactar Cloudflare. El modelo recibe exclusivamente la consigna y el relato **ficticios**; solo se le solicita fortalezas, sugerencias narrativas y preguntas de revisión. Se rechazan salidas que incluyan puntuaciones u otros campos. Aun así las sugerencias **no están validadas pedagógicamente**: requieren revisión adulta.

**Alcance limitado intencionalmente:** esto no es un corrector general de ortografía ni puede utilizarse con producciones de A/V. Las reglas de referencia solo son seguras porque están adaptadas a esos fragmentos exactos. Cualquier ampliación debe construir y verificar referencias nuevas. No modifica `study_profile_state`, `study_attempt_evidence` ni la aplicación principal.

**Pruebas (sin proveedor):**
```sh
node --test supabase/functions/corrector-ia-poc/hibrido.test.mjs
```

No fusionar el PR #161 ni activar la IA para textos reales de menores sin revisar privacidad, permisos adultos y adecuación pedagógica.
