// Prueba técnica aislada. Solo procesa dos textos ficticios definidos en fixtures.mjs.
// NUNCA enviar respuestas reales de estudiantes desde esta función.
import { withSupabase } from "npm:@supabase/server@1";
import { getFixture } from "./fixtures.mjs";
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

  // Solo IDs; prohibimos explícitamente texto, nombres, perfil y otras propiedades.
  if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
      Object.keys(payload).some(k => !["fixtureId", "modelo"].includes(k))) {
    return json({ error: "Solo se admiten datos de prueba" }, 400, origin);
  }
  const fixtureId = payload.fixtureId;
  const modelo = payload.modelo ?? "qwen";
  if (typeof fixtureId !== "string" || typeof modelo !== "string" ||
      !getFixture(fixtureId) || !Object.hasOwn(MODEL_IDS, modelo)) {
    return json({ error: "Prueba desconocida" }, 400, origin);
  }

  if (runMode === "mock") return json({ estado: "ok", modo: "simulado", fixtureId, modelo,
    resultado: correccionSimulada(fixtureId) }, 200, origin);

  const account = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
  const token = Deno.env.get("CLOUDFLARE_API_TOKEN");
  if (!account || !token) return json({ error: "Proveedor no configurado" }, 503, origin);

  // La solicitud al proveedor se construye SOLO a partir de texto ficticio del servidor.
  // Producción pendiente: incorporar cuota persistente ANTES de habilitar respuestas reales.
  const { model, body } = prepararSolicitud(getFixture(fixtureId), modelo);
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/ai/run/${model}`, {
      method: "POST", headers: { "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) return json({ error: "El proveedor no respondió correctamente" }, 502, origin);
    const result = interpretarRespuestaCloudflare(await response.json());
    return json({ estado: "ok", modo: "proveedor", fixtureId, modelo, resultado: result }, 200, origin);
  } catch {
    // No registrar ni exponer texto, credenciales o respuestas del proveedor.
    return json({ error: "No se pudo validar la respuesta del proveedor" }, 502, origin);
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
