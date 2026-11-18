// Prueba técnica aislada. Solo procesa dos textos ficticios definidos en fixtures.mjs.
// NUNCA enviar respuestas reales de estudiantes desde esta función.
import { withSupabase } from "npm:@supabase/server@1";
import { getFixture } from "./fixtures.mjs";
import { diagnosticarCredenciales } from "./credenciales.mjs";
import { MODEL_IDS, prepararSolicitud, interpretarRespuestaCloudflare, correccionSimulada } from "./rubrica.mjs";

const ORIGEN = "https://lramadev.github.io";
const json = (obj: unknown, status = 200, origin = "") => new Response(JSON.stringify(obj), {
  status, headers: { "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(origin === ORIGEN ? { "Access-Control-Allow-Origin": ORIGEN, Vary: "Origin" } : {}) }
});
const authHandler = withSupabase({ auth: "user" }, async (req, ctx) => {
  const origin = req.headers.get("Origin") ?? "";
  const userId = ctx.userClaims?.id;
  if (!userId) return json({ error: "No autorizado" }, 401, origin);

  // La sesión familiar sola NO alcanza: la cuenta también debe figurar en study_access.
  const { data: permiso, error: accessError } = await ctx.supabase.from("study_access")
    .select("user_id").eq("user_id", userId).maybeSingle();
  if (accessError || !permiso?.user_id) return json({ error: "Cuenta no habilitada" }, 403, origin);

  const runMode = Deno.env.get("POC_AI_MODE") ?? "disabled";
  if (runMode !== "mock" && runMode !== "live") return json({ error: "Prueba deshabilitada" }, 503, origin);

  const length = Number(req.headers.get("Content-Length") || "0");
  if (length > 1024) return json({ error: "Solicitud demasiado extensa" }, 413, origin);
  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 1024) return json({ error: "Solicitud demasiado extensa" }, 413, origin);
    payload = JSON.parse(raw);
  } catch { return json({ error: "JSON inválido" }, 400, origin); }

  // Diagnóstico de CONFIGURACIÓN, sin conexión externa y sin consumir cupo.
  // Solo disponible para la cuenta familiar autenticada y autorizada.
  if (payload && !Array.isArray(payload) && typeof payload === "object" &&
      Object.keys(payload).length === 1 && payload.accion === "diagnostico") {
    const estado = diagnosticarCredenciales(
      Deno.env.get("CLOUDFLARE_ACCOUNT_ID"),
      Deno.env.get("CLOUDFLARE_API_TOKEN")
    );
    return json({ estado: "ok", modo: "diagnostico", comprobaciones: estado,
      consumeCupo: false, realizoSolicitudExterna: false }, 200, origin);
  }

  // Solo IDs; prohibimos explícitamente texto, nombres, perfil y otras propiedades.
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).some(k => !["fixtureId", "modelo"].includes(k))) {
    return json({ error: "Solo se admiten datos de prueba" }, 400, origin);
  }
  const fixtureId = payload.fixtureId;
  // Compatibilidad temporal: la pantalla inicial enviaba "qwen" en modo simulado.
  // Ese alias NUNCA habilita el modelo retirado en Cloudflare.
  const modelo = payload.modelo === "qwen" && runMode === "mock"
    ? "glm" : (payload.modelo ?? "glm");
  if (typeof fixtureId !== "string" || typeof modelo !== "string" ||
      !getFixture(fixtureId) || !Object.hasOwn(MODEL_IDS, modelo)) {
    return json({ error: "Prueba desconocida" }, 400, origin);
  }

  if (runMode === "mock") return json({ estado: "ok", modo: "simulado", fixtureId, modelo,
    resultado: correccionSimulada(fixtureId) }, 200, origin);

  const account = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const token = Deno.env.get("CLOUDFLARE_API_TOKEN");
  const checks = diagnosticarCredenciales(account, token);
  if (!checks.cuenta) return json({ error: "El Account ID no tiene el formato esperado",
    code: "config_invalid_account" }, 503, origin);
  if (!checks.token) return json({ error: "El token no tiene el formato esperado",
    code: "config_invalid_token" }, 503, origin);
  if (!checks.cabecera) return json({ error: "El encabezado Authorization no pudo construirse",
    code: "config_invalid_header" }, 503, origin);

  // Cuota GLOBAL atómica en PostgreSQL, máximo cuatro llamadas reales por día UTC.
  // Solo la cuenta privilegiada de la función puede ejecutar esta RPC; falla cerrada.
  const { data: allowed, error: quotaError } = await ctx.supabaseAdmin.rpc("ai_poc_take_slot");
  if (quotaError) return json({ error: "Límite de seguridad no disponible", code: "quota_unavailable" }, 503, origin);
  if (allowed !== true) return json({ error: "Se alcanzó el máximo de cuatro pruebas diarias", code: "quota_exceeded" }, 429, origin);

  // La solicitud al proveedor se construye SOLO a partir de texto ficticio del servidor.
  const { model, body } = prepararSolicitud(getFixture(fixtureId), modelo);
  try {
    // Endpoint unificado para ambos modelos. El ID del modelo está en el body.
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/v1/chat/completions`, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" }, body: JSON.stringify({ model, ...body, options: { rejectIfBusy: true } }),
      // La espera anterior de 25s cortaba solicitudes mientras Cloudflare seguía generando.
      // Supabase admite un request idle timeout de 150s. Acotamos a 65s, sin reintentos.
      signal: AbortSignal.timeout(65000)
    });
    if (!response.ok) {
      return json({ error: "Cloudflare rechazó la solicitud",
        code: "provider_http", providerStatus: response.status }, 502, origin);
    }
    let envelope;
    try { envelope = await response.json(); }
    catch { return json({ error: "Cloudflare devolvió una respuesta no JSON", code: "provider_invalid_envelope" }, 502, origin); }
    try {
      const result = interpretarRespuestaCloudflare(envelope);
      return json({ estado: "ok", modo: "proveedor", fixtureId, modelo, resultado: result }, 200, origin);
    } catch (error) {
      const codes = ["provider_invalid_envelope", "provider_truncated", "provider_empty",
        "provider_invalid_format", "provider_invalid_json", "provider_invalid_schema"];
      const code = codes.includes(error?.code) ? error.code : "provider_invalid_schema";
      return json({ error: "La corrección no pasó la validación", code }, 502, origin);
    }
  } catch (error) {
    const code = error?.name === "TimeoutError" || error?.name === "AbortError"
      ? "provider_timeout" : "provider_network";
    // No registrar ni exponer textos, respuestas o credenciales del proveedor.
    return json({ error: "No fue posible consultar Cloudflare", code }, 502, origin);
  }
});

export default {
  async fetch(req: Request): Promise<Response> {
    const origin = req.headers.get("Origin") ?? "";
    if (origin && origin !== ORIGEN) return json({ error: "Origen no permitido" }, 403);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": ORIGEN, "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage",
        "Access-Control-Max-Age": "300", Vary: "Origin" } });
    }
    if (req.method !== "POST") return json({ error: "Método no permitido" }, 405, origin);
    return authHandler(req);
  }
};
