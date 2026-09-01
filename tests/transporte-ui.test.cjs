'use strict';
// Pruebas DOM simuladas y Leaflet simulado: no sustituyen una revisión visual.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const app=path.join(__dirname,'../app-transporte');
const decode=s=>s.replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
class Element {
  constructor(id,tag){this.id=id;this.tag=tag;this.listeners={};this.options=[];this._value='';this._html='';this.textContent='';this.hidden=false;this.attributes={};this.complete=tag==='img';this.naturalWidth=tag==='img'?549:0;}
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
  const html=fs.readFileSync(path.join(app,'index.html'),'utf8'),elements={},downloads=[],printState={count:0};
  for(const m of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)) elements[m[2]]=new Element(m[2],m[1]);
  for(const m of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) elements[m[1]].innerHTML=m[2];
  const responses=Object.fromEntries(['horarios','cabeceras','recorridos'].map(n=>['data/'+n+'.json',JSON.parse(fs.readFileSync(path.join(app,'data',n+'.json')))]));
  if(missingPoint){responses['data/recorridos.json'].places['loc-1177'].lat=null;responses['data/recorridos.json'].places['loc-1177'].lon=null;}
  const layer={items:[],addTo(){return this;},clearLayers(){this.items=[];}};
  const map={setView(){return this;},fitBounds(){return this;},latLngToLayerPoint(p){return {x:p[1],y:-p[0]};}};
  function shape(type,coordinates,options){return {type,coordinates,options,tooltip:null,bindTooltip(t){this.tooltip=t;return this;},addTo(target){if(target.items)target.items.push(this);return this;},setLatLng(p){this.position=p;return this;},getElement(){return {querySelector(){return {style:{}};}};}};}
  const callbacks=new Map();let callback=0;
  const context={Intl,Date,console,setTimeout,clearTimeout,localStorage:{getItem(){return null;},setItem(){}},document:{documentElement:{dataset:{theme:'dark'}},getElementById(id){return elements[id]||null;},createElement(tag){if(tag==='canvas'){const ctx={fillStyle:'',font:'',fillRect(){},fillText(){},drawImage(){},measureText(text){return {width:String(text).length*8};}};return {width:0,height:0,getContext(){return ctx;},toDataURL(){return 'data:image/png;base64,dGVzdA==';}};}if(tag==='a')return {href:'',download:'',click(){downloads.push({href:this.href,download:this.download});}};return new Element('',tag);},addEventListener(){},hidden:false},matchMedia(){return {matches:false};},requestAnimationFrame(fn){callbacks.set(++callback,fn);return callback;},cancelAnimationFrame(id){callbacks.delete(id);},print(){printState.count++;},fetch:async url=>({ok:!(missingRoutes&&url==='data/recorridos.json'),json:async()=>responses[url]})};
  if(leaflet)context.L={map:()=>map,tileLayer:(url,o)=>shape('tiles',url,o),layerGroup:()=>layer,circleMarker:(p,o)=>shape('point',p,o),polyline:(p,o)=>shape('line',p,o),marker:(p,o)=>shape('arrow',p,o),divIcon:o=>o};
  context.window=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(app,'recorridos.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(app,'transporte.js'),'utf8'),context);
  for(let i=0;i<30&&!elements.results.innerHTML;i++)await new Promise(resolve=>setImmediate(resolve));
  assert.ok(elements.results.innerHTML);assert.notEqual(elements['updated-date'].textContent,'Error de carga',elements.results.innerHTML);
  return {elements,context,layer,callbacks,responses,downloads,printState};
}
function setTrip(ui){
  const {elements:e}=ui;
  for(const [key,value] of Object.entries({company:'EDER SERVICIO DIFERENCIAL',line:'CÓRDOBA - LA GRANJA',origin:'loc-1177',destination:'loc-1248',day:'1'}))e['filter-'+key].value=value;
  e['filter-day'].fire('change');
  const service=ui.responses['data/horarios.json'].services.find(s=>s.line==='CÓRDOBA - LA GRANJA'&&s.company==='EDER SERVICIO DIFERENCIAL'&&s.time==='07:40'&&s.direction==='I');
  const key=service.id+'@1-2';
  e.results.fire('click',{target:{closest(){return {getAttribute(){return key;}};}}});
}
function setFullTrip(ui){
  const {elements:e}=ui;
  for(const [key,value] of Object.entries({company:'EDER SERVICIO DIFERENCIAL',line:'CÓRDOBA - LA GRANJA',origin:'loc-1',destination:'loc-1219',day:'1'}))e['filter-'+key].value=value;
  e['filter-day'].fire('change');
  const service=ui.responses['data/horarios.json'].services.find(s=>s.line==='CÓRDOBA - LA GRANJA'&&s.company==='EDER SERVICIO DIFERENCIAL'&&s.time==='07:40'&&s.direction==='I');
  const key=service.id+'@0-3';
  e.results.fire('click',{target:{closest(){return {getAttribute(){return key;}};}}});
}
function setFaldaToCordoba(ui){
  const {elements:e}=ui;
  for(const [key,value] of Object.entries({company:'EMPRESA SARMIENTO S.R.L.',line:'CÓRDOBA - ALTA GRACIA',origin:'loc-1605',destination:'loc-1',day:'6'}))e['filter-'+key].value=value;
  e['filter-day'].fire('change');
  const service=ui.responses['data/horarios.json'].services.find(s=>s.line==='CÓRDOBA - ALTA GRACIA'&&s.company==='EMPRESA SARMIENTO S.R.L.'&&s.time==='14:00'&&s.direction==='V');
  const key=service.id+'@2-9';
  e.results.fire('click',{target:{closest(){return {getAttribute(){return key;}};}}});
}
test('carga inicial muestra puntos, filtros y salidas sin trazados activos',async()=>{
  const ui=await load();assert.ok(ui.layer.items.some(x=>x.type==='point'));assert.equal(ui.layer.items.filter(x=>x.type==='line').length,0);assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,0);
  assert.ok(ui.elements['filter-origin'].options.length>100);assert.match(ui.elements['route-coverage'].textContent,/servicios tienen recorrido vinculado/);
});
test('seleccionar tramo muestra tiempos diferenciados, secuencia completa y flecha entre los puntos correctos',async()=>{
  const ui=await load();setTrip(ui);const detail=ui.elements['journey-detail'];
  assert.equal(detail.hidden,false);assert.match(detail.innerHTML,/08:40/);assert.match(detail.innerHTML,/08:55/);assert.match(detail.innerHTML,/07:40/);assert.match(detail.innerHTML,/Salida publicada/);
  assert.match(ui.elements.results.innerHTML,/Destino final · cartel: LA GRANJA/);
  assert.equal((detail.innerHTML.match(/class="stop-number"/g)||[]).length,4);
  assert.equal(ui.layer.items.filter(x=>x.type==='line').length,3);assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,1);
  const arrow=ui.layer.items.find(x=>x.type==='arrow'),p=ui.responses['data/recorridos.json'].places['loc-1177'];assert.equal(arrow.coordinates[0],p.lat);assert.equal(arrow.coordinates[1],p.lon);
  const entry=[...ui.callbacks][0];entry[1](0);entry[1](1000);
  assert.match(ui.elements.results.innerHTML,/Paso estimado/);
});
test('si el origen no tiene coordenadas, no inventa una flecha y conserva la lista',async()=>{
  const ui=await load({missingPoint:true});setTrip(ui);
  assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,0);assert.match(ui.elements['map-status'].textContent,/origen o el destino/);assert.match(ui.elements['journey-detail'].innerHTML,/SALSIPUEDES/i);
});
test('un hueco intermedio usa conector esquemático y mantiene la flecha',async()=>{
  const ui=await load({missingPoint:true});setFullTrip(ui);
  assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,1);assert.ok(ui.layer.items.some(x=>x.type==='line'&&x.options.className==='schematic-bridge'));
  assert.match(ui.elements['map-status'].textContent,/conectores punteados/);assert.match(ui.elements['journey-detail'].innerHTML,/LA GRANJA/i);
});
test('Falda del Carmen → Córdoba conserva la flecha y muestra el cartel final',async()=>{
  const ui=await load();setFaldaToCordoba(ui);
  assert.equal(ui.layer.items.filter(x=>x.type==='arrow').length,1);assert.ok(ui.layer.items.some(x=>x.type==='line'&&x.options.className==='schematic-bridge'));
  assert.match(ui.elements['map-status'].textContent,/conectores punteados/);assert.match(ui.elements.results.innerHTML,/Destino final · cartel: CÓRDOBA/);
  assert.match(ui.elements['journey-detail'].innerHTML,/14:24/);assert.match(ui.elements['journey-detail'].innerHTML,/15:31/);
});
test('los tres modos de uso se pueden alternar sin mezclar sus paneles',async()=>{
  const ui=await load();ui.elements['mode-inspectors'].fire('click');
  assert.equal(ui.elements['inspector-mode-panel'].hidden,false);assert.equal(ui.elements['user-mode-panel'].hidden,true);assert.equal(ui.elements['claims-mode-panel'].hidden,true);assert.match(ui.elements['page-title'].textContent,/control/i);
  ui.elements['mode-claims'].fire('click');assert.equal(ui.elements['claims-mode-panel'].hidden,false);assert.equal(ui.elements['inspector-mode-panel'].hidden,true);assert.equal(ui.elements['user-mode-panel'].hidden,true);assert.match(ui.elements['page-title'].textContent,/fecha/i);
  ui.elements['mode-users'].fire('click');assert.equal(ui.elements['claims-mode-panel'].hidden,true);assert.equal(ui.elements['inspector-mode-panel'].hidden,true);assert.equal(ui.elements['user-mode-panel'].hidden,false);
});
test('la identidad ERSeP y las tres guías se publican con recursos v10',()=>{
  const html=fs.readFileSync(path.join(app,'index.html'),'utf8'),css=fs.readFileSync(path.join(app,'transporte.css'),'utf8');
  assert.match(html,/<title>Horarios interurbanos · ERSeP<\/title>/);
  assert.match(html,/transporte\.css\?v=10/);assert.doesNotMatch(html,/transporte\.css\?v=[1-9]["']/);
  assert.equal((html.match(/class="mode-guide/g)||[]).length,3);
  assert.match(html,/history-filters-heading/);assert.match(html,/class="brand-logo"/);
  for(const script of ['recorridos','historico','transporte','admin'])assert.match(html,new RegExp(script+'\\.js\\?v=10'));
  for(const color of ['--ersep-bordo','--ersep-blue','--ersep-green','--ersep-yellow'])assert.match(css,new RegExp(color+':'));
  assert.match(css,/v10: identidad institucional ERSeP/);
});
test('inspectores pueden combinar empresas y las líneas se recalculan acumulativamente',async()=>{
  const ui=await load(),e=ui.elements;e['mode-inspectors'].fire('click');e['inspector-locality'].value='loc-1177';e['inspector-locality'].fire('change');
  assert.match(e['inspector-companies'].innerHTML,/EDER SERVICIO DIFERENCIAL/);assert.match(e['inspector-companies'].innerHTML,/INTERCORDOBA S\.A\./);
  e['inspector-companies-none'].fire('click');assert.equal(e['inspector-locality'].value,'loc-1177');assert.match(e['inspector-summary'].textContent,/No hay empresas/);
  for(const company of ['EDER SERVICIO DIFERENCIAL','INTERCORDOBA S.A.'])e['inspector-companies'].fire('change',{target:{checked:true,getAttribute(){return company;}}});
  e['inspector-day'].value='';e['inspector-from'].value='08:00';e['inspector-to'].value='12:00';e['inspector-day'].fire('change');assert.match(e['inspector-summary'].textContent,/2 empresas/);assert.match(e['inspector-results'].innerHTML,/EDER SERVICIO DIFERENCIAL/);assert.match(e['inspector-results'].innerHTML,/INTERCORDOBA S\.A\./);assert.ok((e['inspector-lines'].innerHTML.match(/data-inspector-line/g)||[]).length>=2);
  e['inspector-print'].fire('click');assert.equal(ui.printState.count,1);assert.match(e['print-sheet'].innerHTML,/Planilla de control de horarios/);assert.match(e['print-sheet'].innerHTML,/EDER SERVICIO DIFERENCIAL/);
  e['inspector-image'].fire('click');assert.equal(ui.downloads.length,1);assert.match(ui.downloads[0].download,/^ERSeP-control-/);
});
test('inspectores pueden acumular Ida y Vuelta y conservar el lugar del operativo',async()=>{
  const ui=await load(),e=ui.elements;e['mode-inspectors'].fire('click');e['inspector-locality'].value='loc-1177';e['inspector-locality'].fire('change');
  assert.match(e['inspector-directions'].innerHTML,/Ida/);assert.match(e['inspector-directions'].innerHTML,/Vuelta/);
  e['inspector-directions-none'].fire('click');assert.equal(e['inspector-locality'].value,'loc-1177');assert.match(e['inspector-summary'].textContent,/No hay sentidos/);
  e['inspector-directions'].fire('change',{target:{checked:true,getAttribute(){return 'I';}}});assert.match(e['inspector-summary'].textContent,/Ida/);assert.doesNotMatch(e['inspector-summary'].textContent,/Vuelta/);
  e['inspector-directions'].fire('change',{target:{checked:true,getAttribute(){return 'V';}}});assert.match(e['inspector-summary'].textContent,/Ida \+ Vuelta/);assert.match(e['inspector-results'].innerHTML,/Ida/);assert.match(e['inspector-results'].innerHTML,/Vuelta/);
});
test('la consulta se puede preparar para PDF y descargar como imagen con membrete',async()=>{
  const ui=await load();setTrip(ui);ui.elements['user-print'].fire('click');assert.equal(ui.printState.count,1);assert.match(ui.elements['print-sheet'].innerHTML,/logo-ersep\.png/);assert.match(ui.elements['print-sheet'].innerHTML,/Consulta de horarios interurbanos/);assert.match(ui.elements['print-sheet'].innerHTML,/Destino final/);
  ui.elements['user-image'].fire('click');assert.equal(ui.downloads.length,1);assert.match(ui.downloads[0].download,/^ERSeP-consulta-\d{4}-\d{2}-\d{2}\.png$/);assert.match(ui.elements['user-export-status'].textContent,/Imagen descargada/);
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
