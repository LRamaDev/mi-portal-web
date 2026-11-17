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
  assert.deepEqual(Object.keys(MODEL_IDS).sort(), ["glm", "qwen"]);
  assert.throws(() => prepararSolicitud(getFixture("ficcion-01"), "modelo-desconocido"));
});
test("el prompt solo incluye el relato ficticio, sin datos de A o V", () => {
  const request = prepararSolicitud(getFixture("ficcion-01"), "qwen");
  assert.equal(request.model, MODEL_IDS.qwen);
  assert.equal(JSON.parse(request.body.messages[1].content).texto, getFixture("ficcion-01").texto);
  assert.equal(request.body.response_format.type, "json_object");
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
