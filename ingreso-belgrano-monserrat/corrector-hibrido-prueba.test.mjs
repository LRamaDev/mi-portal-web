import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const dir=new URL("./",import.meta.url);
const html=readFileSync(new URL("corrector-hibrido-prueba.html",dir),"utf8");
const code=readFileSync(new URL("corrector-hibrido-prueba.js",dir),"utf8");
const ids=["hybrid-local","hybrid-narrative","hybrid-fixture","hybrid-model",
 "access-status","local-status","narrative-status","hybrid-results","narrative-results",
 "hybrid-story","hybrid-corrections","hybrid-observations","narrative-strengths",
 "narrative-tips","narrative-questions","narrative-badge"];
function harness({visitor=false,auth=true,authorized=true,fail=false}={}){
 const elements=Object.fromEntries(ids.map(id=>[id,{
   textContent:"",dataset:{},disabled:["hybrid-local","hybrid-narrative"].includes(id),
   hidden:["hybrid-results","narrative-results"].includes(id),
   value:id==="hybrid-fixture"?"ficcion-01":id==="hybrid-model"?"glm":"",
   children:[],listeners:{},replaceChildren(){this.children=[];},
   appendChild(c){this.children.push(c);},addEventListener(event,fn){this.listeners[event]=fn;}
 }]));
 let calls=[];
 const client={
  auth:{async getUser(){return {data:{user:auth?{id:"dummy-user"}:null},error:null};}},
  from(name){assert.equal(name,"study_access");return {select(){return this;},
   eq(){return this;},async maybeSingle(){return {data:authorized?{user_id:"dummy-user"}:null,error:null};}};},
  functions:{async invoke(slug,{body}) {
    calls.push(body);assert.equal(slug,"corrector-ia-poc");
    if(fail)return {error:{context:{status:503}},data:null};
    const local={estado:"ok",modo:"hibrido",fixtureId:body.fixtureId,correccion:{
     fixtureId:body.fixtureId,texto:"El chico quizo abrirla.",totalCorrecciones:1,
     correcciones:[{original:"quizo",propuesta:"quiso",explicacion:"Se escribe quiso.",
       inicio:9,fin:14}],
     observacionesDeRevision:["Agregar detalles al conflicto."],
     calificacion:null,calificacionValidada:false
    },narrativa:null,consumeCupo:false,realizoSolicitudExterna:false};
    if(body.narrativa===true) local.narrativa={
      fortalezas:["El conflicto se comprende claramente."],
      sugerencias:["Ampliá la descripción del personaje."],
      preguntasRevision:["¿Qué está sintiendo el personaje?","¿Qué puede hacer después?"],
      estado:"simulada_no_generada_por_ia",calificacion:null,calificacionValidada:false
    };
    return {data:local,error:null};
  }}
 };
 const context={window:{INGRESO_CONFIG:{supabaseUrl:"https://example.supabase.co",supabaseAnonKey:"test"},
   supabase:{createClient(){return client;}}},
  document:{getElementById(id){return elements[id];},createElement(){return {textContent:""};}},
  localStorage:{getItem(){return visitor?"visitor":"family";}}};
 vm.runInNewContext(code,context);
 const flush=()=>new Promise(resolve=>setImmediate(resolve));
 return {elements,calls,flush,
  local:()=>elements["hybrid-local"].listeners.click(),
  narrative:()=>elements["hybrid-narrative"].listeners.click()};
}
test("página separada de la app, sin campo libre, sin nota y sin claves",()=>{
 assert.doesNotMatch(html,/<textarea|type="file"|src="\.\/app\.js"/i);
 assert.match(html,/noindex,nofollow/);
 assert.doesNotMatch(code,/CLOUDFLARE_API_TOKEN|service_role/);
 assert.match(code,/accion:"hibrido"/);
});
test("no hace llamadas hasta que una sesión autorizada pulse corrección local",async()=>{
 const h=harness();await h.flush();assert.equal(h.calls.length,0);
 assert.equal(h.elements["hybrid-local"].disabled,false);
 assert.equal(h.elements["hybrid-narrative"].disabled,true);
 await h.local();
 assert.deepEqual(JSON.parse(JSON.stringify(h.calls[0])),{accion:"hibrido",fixtureId:"ficcion-01"});
 assert.equal(h.elements["hybrid-results"].hidden,false);
 assert.equal(h.elements["hybrid-narrative"].disabled,false);
 assert.equal(h.elements["hybrid-corrections"].children.length,1);
});
test("la segunda acción es optativa y distingue simulación de IA",async()=>{
 const h=harness();await h.flush();await h.local();await h.narrative();
 assert.equal(h.calls.length,2);
 assert.deepEqual(JSON.parse(JSON.stringify(h.calls[1])),
  {accion:"hibrido",fixtureId:"ficcion-01",modelo:"glm",narrativa:true});
 assert.equal(h.elements["narrative-results"].hidden,false);
 assert.match(h.elements["narrative-badge"].textContent,/Simulación/);
});
test("no habilita acciones con sesión ausente, visitante o cuenta no autorizada",async()=>{
 for(const options of [{visitor:true},{auth:false},{authorized:false}]){
  const h=harness(options);await h.flush();
  assert.equal(h.elements["hybrid-local"].disabled,true);
  assert.equal(h.elements["hybrid-narrative"].disabled,true);
  assert.equal(h.calls.length,0);
 }
});
test("el fallo de respuesta no muestra resultados ficticios como válidos",async()=>{
 const h=harness({fail:true});await h.flush();await h.local();
 assert.equal(h.elements["hybrid-results"].hidden,true);
 assert.equal(h.elements["hybrid-narrative"].disabled,true);
 assert.equal(h.elements["local-status"].dataset.state,"error");
});
