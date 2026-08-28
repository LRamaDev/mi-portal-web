'use strict';
// Pruebas DOM simuladas y Leaflet simulado: no sustituyen una revisión visual.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.join(__dirname,'../app-transporte');
const decode=s=>s.replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
class Element {
  constructor(id,tag){this.id=id;this.tag=tag;this.listeners={};this.options=[];this._value='';this._html='';this.textContent='';this.hidden=false;this.attributes={};}
  set innerHTML(text){this._html=text;if(this.tag==='select'){this.options=[...text.matchAll(/<option value="([^"]*)"([^>]*)>([\s\S]*?)<\/option>/g)].map(m=>({value:decode(m[1]),textContent:decode(m[3]),disabled:m[2].includes('disabled')}));this._value=this.options.length?this.options[0].value:'';}}
  get innerHTML(){return this._html;}
  get selectedIndex(){return this.options.findIndex(o=>o.value===this._value);}
  set value(v){this._value=this.tag==='select'&&!this.options.some(o=>o.value===String(v))?'':String(v);}
  get value(){return this._value;}
  insertAdjacentHTML(_,html){const old=this.value;this.innerHTML+=html;this.value=old;}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  fire(k,event={}){return this.listeners[k](event);}
}
async function load({leaflet=true,missingRoutes=false,missingPoint=false}={}) {
  const html=fs.readFileSync(path.join(app,'index.html'),'utf8'),elements={};
  for(const m of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) elements[m[2]]=new Element(m[2],m[1]);
  for(const m of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) elements[m[1]].innerHTML=m[2];
  const responses=Object.fromEntries(['horarios','cabeceras','recorridos'].map(n=>['data/'+n+'.json',JSON.parse(fs.readFileSync(path.join(app,'data',n+'.json')))]));
  if(missingPoint){responses['data/recorridos.json'].places['loc-1177'].lat=null;responses['data/recorridos.json'].places['loc-1177'].lon=null;}
  const layer={items:[],addTo(){return this;},clearLayers(){this.items=[];}};
  const map={setView(){return this;},fitBounds(){return this;},latLngToLayerPoint(p){return {x:p[1],y:-p[0]};}};
  function shape(type,coordinates,options){return {type,coordinates,options,tooltip:null,bindTooltip(t){this.tooltip=t;return this;},addTo(target){if(target.items)target.items.push(this);return this;},setLatLng(p){this.position=p;return this;},getElement(){return {querySelector(){return {style:{}};}};}};}
  const callbacks=new Map();let callback=0;
  const context={Intl,Date,console,setTimeout,clearTimeout,localStorage:{getItem(){return null;},setItem(){}},document:{documentElement:{dataset:{theme:'dark'}},getElementById(id){return elements[id]||null;},addEventListener(){},hidden:false},matchMedia(){return {matches:false};},requestAnimationFrame(fn){callbacks.set(++callback,fn);return callback;},cancelAnimationFrame(id){callbacks.delete(id);},fetch:async url=>({ok:!(missingRoutes&&url==='data/recorridos.json'),json:async()=>responses[url]})};
  if(leaflet)context.L={map:()=>map,tileLayer:(url,o)=>shape('tiles',url,o),layerGroup:()=>layer,circleMarker:(p,o)=>shape('point',p,o),polyline:(p,o)=>shape('line',p,o),marker:(p,o)=>shape('arrow',p,o),divIcon:o=>o};
  context.window=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(app,'recorridos.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(app,'transporte.js'),'utf8'),context);
  for(let i=0;i<30&&!elements.results.innerHTML;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.ok(elements.results.innerHTML);assert.notEqual(elements['updated-date'].textContent,'Error de carga',elements.results.innerHTML);
  return {elements,context,layer,callbacks,responses};
}
function setTrip(ui){
  const {elements:e}=ui;
  for(const [key,value] of Object.entries({company:'EDER SERVICIO DIFERENCIAL',line:'CÓRDOBA - LA GRANJA',origin:'loc-1177',destination:'loc-1248',day:'1'}))e['filter-'+key].value=value;
  e['filter-day'].fire('change');
  const service=ui.responses['data/horarios.json'].services.find(s=>s.line==='CÓRDOBA - LA GRANJA'&&s.company==='EDER SERVICIO DIFERENCIAL'&&s.time==='07:40'&&s.direction==='I');
  const key=service.id+'@1-2';
  e.results.fire('click',{target:{closest(){return {getAttribute(){return key;}};}}});
}
test('carga inicial muestra puntos, filtros y salidas sin trazados activos',async()=>{
  const ui=await load();assert.ok(ui.layer.items.some(x=>x.type==='point'));assert.equal(ui.layer.items.filter(x=>x.type==='line').length,0);assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,0);
  assert.ok(ui.elements['filter-origin'].options.length>100);assert.match(ui.elements['route-coverage'].textContent,/servicios tienen recorrido vinculado/);
});
test('seleccionar tramo muestra tiempos diferenciados, secuencia completa y flecha entre los puntos correctos',async()=>{
  const ui=await load();setTrip(ui);const detail=ui.elements['journey-detail'];
  assert.equal(detail.hidden,false);assert.match(detail.innerHTML,/08:40/);assert.match(detail.innerHTML,/08:55/);assert.match(detail.innerHTML,/07:40/);assert.match(detail.innerHTML,/Salida publicada/);
  assert.equal((detail.innerHTML.match(/class="stop-number"/g)||[]).length,4);
  assert.equal(ui.layer.items.filter(x=>x.type==='line').length,3);assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,1);
  const arrow=ui.layer.items.find(x=>x.type==='arrow'),p=ui.responses['data/recorridos.json'].places['loc-1177'];assert.equal(arrow.coordinates[0],p.lat);assert.equal(arrow.coordinates[1],p.lon);
  const entry=[...ui.callbacks][0];entry[1](0);entry[1](1000);
  assert.match(ui.elements.results.innerHTML,/Paso estimado/);
});
test('un hueco geográfico no se puentea y pausa la flecha, pero conserva la lista',async()=>{
  const ui=await load({missingPoint:true});setTrip(ui);
  assert.equal(ui.layer.items.filter(x=>x.type==='line').length,1);assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,0);assert.match(ui.elements['map-status'].textContent,/flecha se pausa/);assert.match(ui.elements['journey-detail'].innerHTML,/SALSIPUEDES/i);
});
test('cerrar y limpiar eliminan la animación y restablecen los resultados',async()=>{
  const ui=await load();setTrip(ui);ui.elements['journey-detail'].fire('click',{target:{closest(){return true;}}});assert.equal(ui.callbacks.size,0);assert.equal(ui.elements['journey-detail'].hidden,true);
  ui.elements['reset-filters'].fire('click');assert.equal(ui.elements['filter-origin'].value,'');assert.equal(ui.elements['filter-company'].value,'');assert.ok(Number(ui.elements['result-count'].textContent.replaceAll('.',''))>100);
});
test('el tema claro sigue disponible',async()=>{
  const ui=await load();ui.elements['theme-toggle'].fire('click');assert.equal(ui.context.document.documentElement.dataset.theme,'light');assert.equal(ui.elements['theme-label'].textContent,'Modo oscuro');
});
test('sin Leaflet se puede consultar el tramo y su cronología',async()=>{
  const ui=await load({leaflet:false});setTrip(ui);assert.equal(ui.elements['journey-detail'].hidden,false);assert.match(ui.elements['map-status'].textContent,/mapa no está disponible/);
});
test('sin recorridos.json sobreviven las salidas oficiales',async()=>{
  const ui=await load({missingRoutes:true});assert.match(ui.elements['route-coverage'].textContent,/no disponible/);assert.match(ui.elements.results.innerHTML,/Salida PDF/);assert.match(ui.elements.results.innerHTML,/Intermedias pendientes/);
});
