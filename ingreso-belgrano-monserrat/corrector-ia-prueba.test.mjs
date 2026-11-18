import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const base=new URL('./',import.meta.url);
const html=readFileSync(new URL('corrector-ia-prueba.html',base),'utf8');
const src=readFileSync(new URL('corrector-ia-prueba.js',base),'utf8');

function harness({authorized=true,loggedIn=true,visitor=false,response=null,diagnosticResponse=null,modelo='glm',fixtureId='ficcion-01',httpError=null}={}){
  const ids=['run-check','check-settings','settings-status','settings-results','connection-status','test-status','result-panel','result-note','result-mode','result-score','result-model','result-strengths',
    'extra-feedback','result-tips','result-errors','fixture-select','model-select'];
  const elements=Object.fromEntries(ids.map(id=>[id,{
    textContent:'',value:id==='fixture-select'?fixtureId:id==='model-select'?modelo:'',
    dataset:{},disabled:['run-check','check-settings'].includes(id),hidden:['result-panel','extra-feedback','settings-results'].includes(id),children:[],listeners:{},
    replaceChildren(){this.children=[];},appendChild(x){this.children.push(x);},addEventListener(t,fn){this.listeners[t]=fn;}
  }]));
  let clients=0,invoked=false,body;
  const client={
    auth:{async getUser(){return {data:{user:loggedIn?{id:'dummy-uid'}:null},error:null};}},
    from(table){assert.equal(table,'study_access');return{select(){return this;},eq(col,id){assert.equal(col,'user_id');assert.equal(id,'dummy-uid');return this;},async maybeSingle(){return {data:authorized?{user_id:'dummy-uid'}:null,error:null};}};},
    functions:{async invoke(slug,opts){
      invoked=true;body=opts.body;assert.equal(slug,'corrector-ia-poc');
      if(body.accion==='diagnostico')return {
        data:diagnosticResponse??{modo:'diagnostico',modoServicio:'real',consumeCupo:false,realizoSolicitudExterna:false,
          comprobaciones:{cuenta:true,token:true,cabecera:true}},error:null
      };
      return httpError ? {data:null,error:httpError}:{data:response??{
        modo:'simulado',fixtureId:body.fixtureId,modelo:body.modelo,
        resultado:{puntajeEstimado:23,maximo:35,fortalezas:['Relato ficticio verificado.']}
      },error:null};
    }}
  };
  vm.runInNewContext(src,{
    window:{INGRESO_CONFIG:{supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'sb_test_publishable'},
      supabase:{createClient(){clients++;return client;}}},
    localStorage:{getItem(){return visitor?'visitor':'family';}},
    document:{getElementById(id){return elements[id];},createElement(){return {textContent:''};}}
  });
  return {elements,flush:()=>new Promise(resolve=>setImmediate(resolve)),click:()=>elements['run-check'].listeners.click(),diag:()=>elements['check-settings'].listeners.click(),get clients(){return clients;},get invoked(){return invoked;},get body(){return body;}};
}

test('Interfaz aislada sin datos personales ni app.js',()=>{
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/id="model-select"/);
 assert.match(html,/id="fixture-select"/);
 assert.doesNotMatch(html,/src="\.\/app\.js|src="\.\/seguridad\.js/);
 assert.doesNotMatch(src,/CLOUDFLARE_API_TOKEN|service_role|Azul|Rofi/);
 assert.match(src,/client\.functions\.invoke\('corrector-ia-poc'/);
});
test('Simulación sin Cloudflare requiere un solo cliente y un clic',async()=>{
 const h=harness();await h.flush();
 assert.equal(h.clients,1);assert.equal(h.invoked,false);
 await h.click();
 assert.equal(h.body.modelo,'glm');assert.equal(h.body.fixtureId,'ficcion-01');
 assert.equal(Object.keys(h.body).length,2);
 assert.equal(h.elements['result-score'].textContent,'23 / 35');
 assert.equal(h.elements['result-mode'].textContent,'Simulado');
 assert.equal(h.elements['test-status'].dataset.state,'ok');
});
test('Se acepta una devolución real ficticia estructurada',async()=>{
 const h=harness({modelo:'oss',fixtureId:'ficcion-02',response:{
   modo:'proveedor',fixtureId:'ficcion-02',modelo:'oss',
   resultado:{puntajeEstimado:19,maximo:35,fortalezas:['Secuencia clara.'],
     sugerencias:['Separá las ideas.'],errores:[{fragmento:'no sabia',correccion:'no sabía',explicacion:'Lleva tilde.'}]}
 }});
 await h.flush();await h.click();
 assert.equal(h.body.modelo,'oss');assert.equal(h.body.fixtureId,'ficcion-02');
 assert.equal(h.elements['result-mode'].textContent,'Cloudflare');
 assert.equal(h.elements['result-score'].textContent,'19 / 35');
 assert.equal(h.elements['extra-feedback'].hidden,false);
 assert.equal(h.elements['result-errors'].children.length,1);
});
test('Modo visitante y sesión inválida no invocan Cloudflare',async()=>{
 for(const opts of [{visitor:true},{loggedIn:false},{authorized:false}]){
   const h=harness(opts);await h.flush();
   assert.equal(h.elements['run-check'].disabled,true);
   assert.equal(h.invoked,false);
 }
});
test('Si el proveedor no respeta el contrato no se muestra como éxito',async()=>{
 const h=harness({response:{modo:'proveedor',fixtureId:'ficcion-01',modelo:'glm',resultado:{puntajeEstimado:100,maximo:35,fortalezas:['X']}}});
 await h.flush();await h.click();
 assert.equal(h.elements['test-status'].dataset.state,'error');
 assert.equal(h.elements['result-panel'].hidden,true);
});
test('Límite HTTP 429 se informa sin datos sensibles',async()=>{
 const h=harness({httpError:{context:{status:429}}});
 await h.flush();await h.click();
 assert.match(h.elements['test-status'].textContent,/límite global/i);
 assert.equal(h.elements['result-panel'].hidden,true);
});
test('Rechaza IDs y modelos inventados antes de llamar al servidor',async()=>{
 const h=harness({modelo:'qwen'});await h.flush();await h.click();
 assert.equal(h.invoked,false);
 assert.equal(h.elements['test-status'].dataset.state,'error');
});

test('Describe HTTP 400 de Cloudflare sin mostrar el cuerpo del proveedor',async()=>{
  const h=harness({httpError:{context:{status:502,clone(){return {async json(){return {code:'provider_http',providerStatus:400,error:'dato secreto que no debe mostrarse'};}};}}}});
  await h.flush();await h.click();
  assert.match(h.elements['test-status'].textContent,/formato de solicitud/i);
  assert.doesNotMatch(h.elements['test-status'].textContent,/dato secreto/);
});
test('Describe JSON inválido y respuesta truncada con mensajes diferenciados',async()=>{
  for(const [code,word] of [['provider_invalid_json','JSON válido'],['provider_truncated','interrumpió'],['provider_invalid_schema','rúbrica']]){
    const h=harness({httpError:{context:{status:502,clone(){return {async json(){return {code};}};}}}});
    await h.flush();await h.click();
    assert.match(h.elements['test-status'].textContent,new RegExp(word,'i'));
    assert.equal(h.elements['result-panel'].hidden,true);
  }
});

test('diagnóstico no consume cupo ni solicita corrección de IA',async()=>{
  const h=harness();await h.flush();
  assert.equal(h.elements['check-settings'].disabled,false);
  await h.diag();
  assert.deepEqual(Object.keys(h.body),['accion']);
  assert.equal(h.body.accion,'diagnostico');
  assert.match(h.elements['settings-status'].textContent,/no confirma la conexión/);
  assert.equal(h.elements['settings-results'].children.length,4);
  assert.equal(h.elements['settings-results'].hidden,false);
});
test('diagnóstico distingue credenciales con formato inválido',async()=>{
  const h=harness({diagnosticResponse:{
    modo:'diagnostico',modoServicio:'real',consumeCupo:false,realizoSolicitudExterna:false,
    comprobaciones:{cuenta:false,token:true,cabecera:true}
  }});
  await h.flush();await h.diag();
  assert.equal(h.elements['settings-status'].dataset.state,'error');
  assert.match(h.elements['settings-results'].children[0].textContent,/Revisar: Account ID/);
});
test('modo visitante no permite diagnosticar',async()=>{
  const h=harness({visitor:true});await h.flush();
  assert.equal(h.elements['check-settings'].disabled,true);
  assert.equal(h.invoked,false);
});

test('diagnóstico de modo deshabilitado no llama al proveedor ni lo presenta como éxito',async()=>{
  const h=harness({diagnosticResponse:{modo:'diagnostico',modoServicio:'deshabilitado',
    consumeCupo:false,realizoSolicitudExterna:false,comprobaciones:{cuenta:true,token:true,cabecera:true}}});
  await h.flush();await h.diag();
  assert.equal(h.body.accion,'diagnostico');
  assert.equal(h.elements['settings-status'].dataset.state,'error');
  assert.match(h.elements['settings-status'].textContent,/POC_AI_MODE/);
  assert.match(h.elements['settings-results'].children[3].textContent,/DESHABILITADO/);
});
test('diagnóstico del modo simulado advierte que no puede corregir con IA',async()=>{
  const h=harness({diagnosticResponse:{modo:'diagnostico',modoServicio:'simulado',
    consumeCupo:false,realizoSolicitudExterna:false,comprobaciones:{cuenta:true,token:true,cabecera:true}}});
  await h.flush();await h.diag();
  assert.match(h.elements['settings-status'].textContent,/modo simulado/);
  assert.match(h.elements['settings-results'].children[3].textContent,/SIMULADO/);
});
test('HTTP 503 diferencia modo inválido de contador inaccesible sin exponer respuestas crudas',async()=>{
  for(const [code,expected] of [['mode_disabled',/POC_AI_MODE/],['quota_unavailable',/contador diario/],
    ['config_invalid_token',/token tiene un formato inválido/]]){
    const h=harness({httpError:{context:{status:503,clone(){return {async json(){
      return {code,error:'secretos que no deben mostrarse'};
    }};}}}});
    await h.flush();await h.click();
    assert.match(h.elements['test-status'].textContent,expected);
    assert.doesNotMatch(h.elements['test-status'].textContent,/secretos que no deben mostrarse/);
  }
});
