import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const base=new URL('./',import.meta.url);
const page=readFileSync(new URL('corrector-ia-prueba.html',base),'utf8');
const source=readFileSync(new URL('corrector-ia-prueba.js',base),'utf8');

function harness({authorized=true, loggedIn=true, visitor=false, response=null}={}) {
  const ids=['run-check','connection-status','test-status','result-panel','result-mode','result-score','result-strengths'];
  const elements=Object.fromEntries(ids.map(id=>[id,{textContent:'',dataset:{},disabled:id==='run-check',hidden:id==='result-panel',children:[],
    replaceChildren(){this.children=[];},appendChild(x){this.children.push(x);},listeners:{},
    addEventListener(type,fn){this.listeners[type]=fn;}}]));
  let count=0, invoked=false, body;
  const client={
    auth:{async getUser(){return {data:{user:loggedIn?{id:'fictitious-uid'}:null},error:null};}},
    from(table){assert.equal(table,'study_access');return {select(){return this;},eq(col,id){assert.equal(col,'user_id');assert.equal(id,'fictitious-uid');return this;},async maybeSingle(){return {data:authorized?{user_id:'fictitious-uid'}:null,error:null};}};},
    functions:{async invoke(slug,options){invoked=true;assert.equal(slug,'corrector-ia-poc');body=options.body;return {data:response??{modo:'simulado',fixtureId:'ficcion-01',resultado:{puntajeEstimado:23,maximo:35,fortalezas:['Relato ficticio.']}},error:null};}}
  };
  const context={window:{INGRESO_CONFIG:{supabaseUrl:'https://example.supabase.co',supabaseAnonKey:'sb_publishable_test'},supabase:{createClient(){count++;return client;}}},
    localStorage:{getItem(){return visitor?'visitor':'family';}},document:{getElementById(id){return elements[id];},createElement(){return {textContent:''};}}};
  vm.runInNewContext(source,context);
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  return {elements,flush,click:()=>elements['run-check'].listeners.click(),get count(){return count;},get invoked(){return invoked;},get body(){return body;}};
}

test('Página aislada sin cargar seguridad.js ni app.js',()=>{
 assert.match(page,/corrector-ia-prueba\.js/);
 assert.doesNotMatch(page,/src="\.\/app\.js|src="\.\/seguridad\.js/);
 assert.match(page,/name="robots" content="noindex,nofollow"/);
 assert.match(page,/id="run-check" type="button" disabled/);
});
test('Un solo cliente por página y prueba únicamente al hacer clic', async()=>{
 const h=harness(); await h.flush();
 assert.equal(h.count,1);
 assert.equal(h.invoked,false);
 assert.equal(h.elements['run-check'].disabled,false);
 await h.click();
 assert.equal(h.invoked,true);
 assert.equal(h.body.fixtureId,'ficcion-01');
 assert.equal(h.body.modelo,'qwen');
 assert.equal(Object.keys(h.body).length,2);
 assert.equal(h.elements['result-score'].textContent,'23 / 35');
 assert.equal(h.elements['result-panel'].hidden,false);
 assert.equal(h.elements['test-status'].dataset.state,'ok');
});
test('Bloquea modo visitante', async()=>{
 const h=harness({visitor:true}); await h.flush();
 assert.equal(h.count,0); assert.equal(h.elements['run-check'].disabled,true);
 assert.equal(h.invoked,false);
});
test('Bloquea cuenta sin sesión', async()=>{
 const h=harness({loggedIn:false}); await h.flush();
 assert.equal(h.elements['run-check'].disabled,true);
 assert.equal(h.invoked,false);
});
test('Bloquea cuenta fuera de study_access', async()=>{
 const h=harness({authorized:false}); await h.flush();
 assert.equal(h.elements['run-check'].disabled,true);
 assert.equal(h.invoked,false);
});
test('No confunde una respuesta no simulada con un éxito', async()=>{
 const h=harness({response:{modo:'proveedor',fixtureId:'ficcion-01',resultado:{puntajeEstimado:23,maximo:35,fortalezas:['X']}}});
 await h.flush(); await h.click();
 assert.equal(h.elements['test-status'].dataset.state,'error');
 assert.equal(h.elements['result-panel'].hidden,true);
});
test('Sin datos de alumnas ni secretos de proveedor en la interfaz',()=>{
 assert.doesNotMatch(source,/CLOUDFLARE_API_TOKEN|service_role|Rofi|Azul/);
 assert.doesNotMatch(page,/CLOUDFLARE_API_TOKEN|service_role/);
 assert.match(source,/client\.functions\.invoke\('corrector-ia-poc'/);
});
