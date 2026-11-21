import { auditarCorreccionFicticia } from "./auditoria.mjs";
import { diagnosticarCredenciales } from "./credenciales.mjs";
import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { FIXTURES, getFixture } from "./fixtures.mjs";
import { CRITERIOS, MODEL_IDS, prepararSolicitud, interpretarRespuestaCloudflare,
  normalizarCorreccion, correccionSimulada } from "./rubrica.mjs";

test("las dos entradas son ficticias y no contienen campos personales", () => {
  assert.deepEqual(Object.keys(FIXTURES).sort(), ["ficcion-01", "ficcion-02"]);
  assert.equal(getFixture("p1"), null);
  assert.equal(getFixture("ficcion-01").texto.includes("Rofi"), false);
  assert.equal(getFixture("ficcion-02").texto.includes("Azul"), false);
});
test("el puntaje máximo de la rúbrica es 35", () => {
  assert.equal(Object.values(CRITERIOS).reduce((a,b) => a+b, 0), 35);
});
test("solo se aceptan dos modelos autorizados", () => {
  assert.deepEqual(Object.keys(MODEL_IDS).sort(), ["glm", "oss"]);
  assert.throws(() => prepararSolicitud(getFixture("ficcion-01"), "modelo-desconocido"));
});
test("el prompt solo incluye el relato ficticio, sin datos de A o V", () => {
  const request = prepararSolicitud(getFixture("ficcion-01"), "glm");
  assert.equal(request.model, MODEL_IDS.glm);
  assert.equal(JSON.parse(request.body.messages[1].content).texto, getFixture("ficcion-01").texto);
  assert.equal(request.body.response_format, undefined);
  assert.equal(request.body.max_completion_tokens, 1600);
});
test("se normalizan respuestas simuladas y el total se calcula en el servidor", () => {
  const data = correccionSimulada("ficcion-01");
  assert.equal(data.maximo, 35);
  assert.equal(data.puntajeEstimado, 23);
  assert.equal(data.provisional, true);
});
test("se admite la envoltura REST de Cloudflare", () => {
  const source = correccionSimulada("ficcion-02");
  const data = interpretarRespuestaCloudflare({ success:true, result:{ response:JSON.stringify(source) } });
  assert.equal(data.puntajeEstimado, source.puntajeEstimado);
});
test("se admite contenido de chat completions y bloque JSON", () => {
  const source = correccionSimulada("ficcion-02");
  const data = interpretarRespuestaCloudflare({ result: { choices:[{ message:{ content:"```json\n"+JSON.stringify(source)+"\n```" } }] } });
  assert.equal(data.puntajeEstimado, 23);
});
test("se rechazan puntajes inventados o fuera de rango", () => {
  const source = correccionSimulada("ficcion-01");
  assert.throws(() => normalizarCorreccion({...source, criterios:{...source.criterios, ortografia: 9}}));
  assert.throws(() => normalizarCorreccion({...source, criterios:{...source.criterios, puntuacion: -1}}));
  assert.throws(() => normalizarCorreccion({...source, criterios:{...source.criterios, cohesion: 2.5}}));
});
test("se rechazan respuestas incompletas o inválidas", () => {
  const source = correccionSimulada("ficcion-01");
  assert.throws(() => normalizarCorreccion({...source, errores:[{fragmento:"hola"}]}));
  assert.throws(() => normalizarCorreccion({...source, fortalezas:[]}));
  assert.throws(() => interpretarRespuestaCloudflare({success:false}));
  assert.throws(() => interpretarRespuestaCloudflare({result:{response:"no es JSON"}}));
});

test("el endpoint admite las cabeceras CORS de supabase-js", () => {
  const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");
  for (const header of ["authorization", "apikey", "content-type", "x-client-info",
    "x-retry-count", "traceparent", "tracestate", "baggage"]) {
    assert.ok(source.includes(header), "Falta cabecera " + header);
  }
});

test("la función impone cupo global antes de contactar Cloudflare", () => {
  const source=readFileSync(new URL("./index.ts",import.meta.url),"utf8");
  assert.ok(source.includes('ctx.supabaseAdmin.rpc("ai_poc_take_slot")'));
  assert.ok(source.indexOf('ctx.supabaseAdmin.rpc("ai_poc_take_slot")') < source.indexOf('await fetch('));
  assert.ok(source.includes('quota_exceeded'));
  assert.ok(source.includes('quota_unavailable'));
  assert.ok(source.includes('runMode === "mock"'));
});
test("Qwen descontinuado ya no figura en los modelos permitidos", () => {
  assert.equal(MODEL_IDS.qwen, undefined);
  assert.equal(MODEL_IDS.oss, "@cf/openai/gpt-oss-20b");
  assert.throws(() => prepararSolicitud(getFixture("ficcion-02"),"qwen"));
});

test("acepta respuesta de Chat Completions de Cloudflare", () => {
  const source = correccionSimulada("ficcion-01");
  const envelope = {id:"chatcmpl-example",choices:[{finish_reason:"stop",
    message:{role:"assistant",content:JSON.stringify(source)}}]};
  const answer = interpretarRespuestaCloudflare(envelope);
  assert.equal(answer.puntajeEstimado, 23);
});
test("detecta respuesta truncada, texto no JSON y esquema inválido", () => {
  const source = correccionSimulada("ficcion-01");
  assert.throws(
    () => interpretarRespuestaCloudflare({choices:[{finish_reason:"length",message:{content:JSON.stringify(source)}}]}),
    error => error.code === "provider_truncated"
  );
  assert.throws(
    () => interpretarRespuestaCloudflare({choices:[{finish_reason:"stop",message:{content:"Corrección libre"}}]}),
    error => error.code === "provider_invalid_json"
  );
  assert.throws(
    () => interpretarRespuestaCloudflare({choices:[{finish_reason:"stop",message:{content:JSON.stringify({criterios:{}})}}]}),
    error => error.code === "provider_invalid_schema"
  );
});
test("usa el endpoint uniforme y mensajes de fallo seguros", () => {
  const source=readFileSync(new URL("./index.ts",import.meta.url), "utf8");
  assert.ok(source.includes("/ai/v1/chat/completions"));
  assert.ok(!source.includes("/ai/run/"));
  assert.ok(source.includes('provider_http'));
  assert.ok(source.includes('provider_timeout'));
  assert.ok(source.includes('provider_invalid_json'));
  assert.ok(source.includes('ctx.supabaseAdmin.rpc("ai_poc_take_slot")'));
  assert.ok(source.indexOf('ctx.supabaseAdmin.rpc("ai_poc_take_slot")') < source.indexOf('await fetch('));
});

test("diagnóstico local: configuración con formato válido, sin conexión", () => {
  const result = diagnosticarCredenciales("a".repeat(32), "cftoken_" + "B".repeat(42));
  assert.deepEqual(result, { cuenta: true, token: true, cabecera: true });
});
test("diagnóstico detecta Account ID mal copiado y token con saltos de línea", () => {
  const invalidAccount = diagnosticarCredenciales("https://dash.cloudflare.com/", "cftoken_" + "B".repeat(42));
  assert.equal(invalidAccount.cuenta, false);
  const invalidToken = diagnosticarCredenciales("a".repeat(32), "cftoken_" + "B".repeat(42) + "\n");
  assert.equal(invalidToken.token, false);
  assert.equal(invalidToken.cabecera, false);
});
test("el diagnóstico está antes del límite y no envía solicitudes externas", () => {
  const src=readFileSync(new URL("./index.ts",import.meta.url),"utf8");
  assert.ok(src.includes('payload.accion === "diagnostico"'));
  assert.ok(src.indexOf('payload.accion === "diagnostico"') < src.indexOf('ctx.supabaseAdmin.rpc("ai_poc_take_slot")'));
  assert.ok(src.includes('config_invalid_account'));
  assert.ok(src.includes('config_invalid_token'));
  assert.ok(src.includes('realizoSolicitudExterna: false'));
});

test("el prototipo limita salida y espera con margen sin reintentos", () => {
  const src=readFileSync(new URL("./index.ts",import.meta.url),"utf8");
  assert.ok(src.includes("AbortSignal.timeout(65000)"));
  assert.ok(!src.includes("AbortSignal.timeout(25000)"));
  assert.ok(src.includes("options: { rejectIfBusy: true }"));
  assert.ok(src.indexOf('ctx.supabaseAdmin.rpc("ai_poc_take_slot")') < src.indexOf('await fetch('));
  // Dos rutas independientes, cada una con una sola llamada sin reintentos automáticos.
  assert.equal((src.match(/await fetch\(/g)||[]).length,2);
  for(const field of ['withSupabase({ auth: "user" }', 'from("study_access")',
    'getFixture(fixtureId)', 'runMode === "mock"']) {
    assert.ok(src.includes(field), "Falta control "+field);
  }
});

test("GLM genera corrección directa sin gastar tokens de razonamiento", () => {
  const sample = getFixture("ficcion-01");
  const request = prepararSolicitud(sample, "glm");
  assert.deepEqual(request.body.chat_template_kwargs, { enable_thinking: false });
  assert.equal(request.body.max_completion_tokens, 1600);
  assert.equal(request.body.stream, false);
  assert.equal(request.model, MODEL_IDS.glm);
});
test("GPT-OSS conserva su configuración específica sin parámetros de GLM", () => {
  const request = prepararSolicitud(getFixture("ficcion-02"), "oss");
  assert.equal(request.body.chat_template_kwargs, undefined);
  assert.equal(request.model, MODEL_IDS.oss);
});
test("la respuesta truncada se rechaza incluso cuando contiene un JSON válido", () => {
  const source = correccionSimulada("ficcion-01");
  assert.throws(
    () => interpretarRespuestaCloudflare({ choices: [
      {finish_reason: "length", message: {content: JSON.stringify(source)}}
    ]}),
    error => error.code === "provider_truncated"
  );
});


test("el diagnóstico informa estado de modo antes del bloqueo por POC_AI_MODE", () => {
  const src=readFileSync(new URL("./index.ts",import.meta.url),"utf8");
  const diag=src.indexOf('payload.accion === "diagnostico"');
  // Analizar la ruta histórica aparte: el híbrido gratuito está delante del gate.
  const historical=src.slice(src.indexOf('  // Las comprobaciones no consumen cupo'));
  const gate=historical.indexOf('code: "mode_disabled"');
  const quota=historical.indexOf('ctx.supabaseAdmin.rpc("ai_poc_take_slot")');
  const fetch=historical.indexOf('await fetch(');
  assert.ok(diag>0 && gate>0 && quota>gate && fetch>quota);
  assert.ok(src.includes('modoServicio, consumeCupo: false, realizoSolicitudExterna: false'));
  assert.ok(src.includes('runMode === "live" ? "real"'));
  assert.ok(src.includes('runMode === "mock" ? "simulado"'));
});

test("un 35/35 con faltas se oculta y se marca para revisión adulta", () => {
  const original=correccionSimulada("ficcion-01");
  const response={...original,
    criterios:{coherencia:7,complicacion_resolucion:8,recursos_expresivos:5,cohesion:4,
      morfosintaxis:3,ortografia:4,puntuacion:4},
    puntajeEstimado:35,
    errores:[{fragmento:"El chico quizo abrirla",correccion:"El chico quiso abrirla",
      explicacion:"Se escribe quiso con s."}]
  };
  const audited=auditarCorreccionFicticia("ficcion-01",getFixture("ficcion-01"),response);
  assert.equal(audited.puntajeEstimado,null);
  assert.equal(audited.puntajePropuestoPorModelo,35);
  assert.equal(audited.calificacionValidada,false);
  assert.ok(audited.auditoria.motivos.includes("puntaje_maximo_con_errores"));
  assert.ok(audited.auditoria.motivos.includes("errores_esperados_omitidos"));
  assert.ok(audited.auditoria.indiciosConocidosOmitidos > 0);
});
test("no mostramos fragmentos inventados por el modelo", () => {
  const source=correccionSimulada("ficcion-02");
  const invented={fragmento:"La luna cantaba",correccion:"La luna brillaba",explicacion:"No corresponde"};
  const audited=auditarCorreccionFicticia("ficcion-02",getFixture("ficcion-02"),
    {...source,errores:[invented,...source.errores]});
  assert.equal(audited.errores.some(e=>e.fragmento==="La luna cantaba"),false);
  assert.equal(audited.auditoria.fragmentosInventadosDescartados,1);
  assert.equal(audited.puntajeEstimado,null);
});
test("también se evita usar como calificación una corrección razonable no calibrada", () => {
  const source=correccionSimulada("ficcion-02");
  const audited=auditarCorreccionFicticia("ficcion-02",getFixture("ficcion-02"),source);
  assert.equal(audited.puntajeEstimado,null);
  assert.equal(audited.calificacionValidada,false);
  assert.equal(audited.puntajePropuestoPorModelo,23);
});
test("la auditoría precede a cualquier respuesta real al navegador", () => {
  const source=readFileSync(new URL("./index.ts",import.meta.url),"utf8");
  assert.ok(source.includes('auditarCorreccionFicticia(fixtureId, getFixture(fixtureId), result)'));
  assert.ok(source.indexOf('auditarCorreccionFicticia(fixtureId, getFixture(fixtureId), result)') <
    source.indexOf('modo: "proveedor", fixtureId, modelo, resultado: revisado'));
  assert.ok(source.includes('withSupabase({ auth: "user" }'));
});

test("se admiten hasta diez observaciones para relatar todos los errores ficticios",()=>{
  const source=correccionSimulada("ficcion-01");
  const six=Array.from({length:6},(_,i)=>({fragmento:"señal "+i,
    correccion:"cambio "+i,explicacion:"Explicación del caso "+i}));
  assert.equal(normalizarCorreccion({...source,errores:six}).errores.length,6);
  assert.throws(()=>normalizarCorreccion({...source,errores:Array.from({length:11},()=>six[0])}));
});
