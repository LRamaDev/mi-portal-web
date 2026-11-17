# Prueba técnica de corrección asistida — Monserrat (aislada)

**Estado al 17/11/2026:** Edge Function `corrector-ia-poc` **desplegada en Supabase Tercer Tiempo**, versión 1, estado ACTIVE y `verify_jwt=true`. El usuario configuró `POC_AI_MODE=mock` en los secretos (su valor no es legible con las herramientas disponibles). **Sin conexión con la aplicación publicada.** No es aún un servicio de corrección para estudiantes.

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
3. Se aceptan exclusivamente `{ "fixtureId": "ficcion-01"|"ficcion-02", "modelo": "qwen"|"glm" }`. **No hay campo de texto libre**, ni cargas de fotos ni referencias a perfiles familiares.
4. `POC_AI_MODE` ausente o distinto de `mock`/`live` devuelve 503. `mock` no llama a Cloudflare.
5. Ninguna respuesta ni texto se escribe en Supabase. No se modifica `study_profile_state`, `study_attempt_evidence`, historial ni maestría.
6. La función rechaza otros orígenes en navegador; **CORS no sustituye la autenticación**.
7. Los puntajes recibidos se validan y se recalculan; no confiar en un valor total enviado por el modelo.

## Comprobaciones posteriores al despliegue

- Supabase confirmó `status=ACTIVE`, `version=1` y `verify_jwt=true`.
- Se recuperó el código de la función desplegada y se comprobó que conserva `withSupabase({auth:"user"})`, la consulta a `study_access`, el bloqueo por modo y las dos fichas ficticias.
- Las pruebas automáticas del PR finalizaron correctamente.
- **Pendiente:** invocación autenticada desde el origen oficial (`https://lramadev.github.io`), sin compartir tokens, para comprobar que `mock` devuelve `modo: simulado`. No hay acceso a una sesión familiar desde el conector y la terminal de esta sesión no puede resolver el host público, por lo que esta verificación no se ha simulado ni afirmado.
- **Pendiente:** verificación del resultado real de Qwen/GLM antes de pasar de `mock` a `live`.
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
