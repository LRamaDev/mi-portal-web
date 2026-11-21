import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 corregirReglasVerificadas,prepararSolicitudNarrativa,normalizarNarrativa,narrativaSimulada
} from "./hibrido.mjs";
import {getFixture} from "./fixtures.mjs";

test("la ficción 1 devuelve las seis correcciones humanas con offsets comprobables",()=>{
 const r=corregirReglasVerificadas("ficcion-01");
 assert.equal(r.totalCorrecciones,6);
 assert.deepEqual(r.correcciones.map(e=>e.id),[
   "quizo","se_callo","despues","busco","logro","encontro"
 ]);
 for(const item of r.correcciones) {
   assert.equal(r.texto.slice(item.inicio,item.fin),item.original);
   assert.equal(item.fuente,"referencia_humana_contextual");
 }
 assert.equal(r.calificacion,null);
 assert.equal(r.calificacionValidada,false);
 assert.ok(r.observacionesDeRevision.length>0);
});
test("la ficción 2 conserva dos correcciones, sin marcar una coma opcional como falta",()=>{
 const r=corregirReglasVerificadas("ficcion-02");
 assert.equal(r.totalCorrecciones,2);
 assert.deepEqual(r.correcciones.map(e=>e.id),["separacion_oraciones","como_indirecto"]);
 assert.equal(r.correcciones.some(e=>e.original==="Una mañana"),false);
});
test("la corrección determinística no admite texto arbitrario ni perfiles",()=>{
 assert.throws(()=>corregirReglasVerificadas("A"));
 assert.throws(()=>corregirReglasVerificadas({texto:"Hola"}));
});
test("la solicitud narrativa excluye notas y gramática de su contrato de salida",()=>{
 const q=prepararSolicitudNarrativa("ficcion-01","glm");
 assert.equal(q.body.stream,false);
 assert.equal(q.body.max_completion_tokens,700);
 assert.deepEqual(q.body.chat_template_kwargs,{enable_thinking:false});
 assert.deepEqual(Object.keys(q.body.messages).length,2);
 assert.equal(JSON.parse(q.body.messages[1].content).relato,getFixture("ficcion-01").texto);
 assert.match(q.body.messages[0].content,/no asignes puntajes/i);
 assert.match(q.body.messages[0].content,/no detectes ni expliques tildes/i);
 assert.throws(()=>prepararSolicitudNarrativa("ficcion-01","qwen"));
});
test("narrativa válida devuelve sugerencias sin calificación y siempre bajo revisión",()=>{
 const content=JSON.stringify({
   fortalezas:["El problema narrativo es comprensible."],
   sugerencias:["Podrías ampliar la sensación de incertidumbre en la búsqueda."],
   preguntasRevision:["¿Qué vio primero el protagonista?", "¿Qué obstáculo nuevo podría encontrar?"]
 });
 const r=normalizarNarrativa({choices:[{finish_reason:"stop",message:{content}}]});
 assert.equal(r.calificacion,null);
 assert.equal(r.calificacionValidada,false);
 assert.equal(r.estado,"pendiente_revision_adulta");
});
test("una narrativa con puntaje, reglas inventadas, JSON roto o truncamiento se rechaza",()=>{
 const ok={fortalezas:["El conflicto está claro."],sugerencias:["Se podría enriquecer la escena."],
 preguntasRevision:["¿Cómo se siente el personaje?", "¿Qué detalle mostraría la sorpresa?"]};
 assert.throws(()=>normalizarNarrativa({choices:[{message:{content:JSON.stringify({...ok,puntaje:35})}}]}));
 assert.throws(()=>normalizarNarrativa({choices:[{message:{content:"No es JSON"}}]}));
 assert.throws(()=>normalizarNarrativa({choices:[{finish_reason:"length",message:{content:JSON.stringify(ok)}}]}));
 assert.throws(()=>normalizarNarrativa({choices:[{message:{content:JSON.stringify({...ok,fortalezas:[]})}}]}));
});
test("el modo simulado no incluye texto libre ni números de nota",()=>{
 const r=narrativaSimulada("ficcion-02");
 assert.equal(r.estado,"simulada_no_generada_por_ia");
 assert.equal(r.calificacion,null);
 assert.throws(()=>narrativaSimulada("V"));
});
test("la ruta híbrida protege datos y separa la cuota de IA de la parte local",()=>{
 const src=readFileSync(new URL("./index.ts",import.meta.url),"utf8");
 assert.ok(src.includes('payload.accion === "hibrido"'));
 assert.ok(src.includes('Object.keys(payload).some(k=>!["accion","fixtureId","narrativa","modelo"].includes(k))'));
 assert.ok(src.indexOf('corregirReglasVerificadas(fixtureId)')<src.indexOf('ctx.supabaseAdmin.rpc("ai_poc_take_slot")'));
 assert.ok(src.includes('withSupabase({ auth: "user" }'));
 assert.ok(src.includes('.from("study_access")'));
 assert.ok(src.includes('if (!solicitaNarrativa)'));
 assert.ok(src.includes('runMode === "mock"'));
 assert.ok(src.includes('AbortSignal.timeout(65000)'));
});
