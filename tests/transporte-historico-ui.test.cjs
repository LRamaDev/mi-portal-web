'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{webcrypto}=require('node:crypto');
const app=path.join(__dirname,'../app-transporte');
const decode=value=>value.replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');

class Element{
  constructor(id,tag){this.id=id;this.tag=tag;this.listeners={};this.options=[];this._value='';this._html='';this.textContent='';this.hidden=false;this.className='';}
  set innerHTML(value){this._html=value;if(this.tag==='select'){this.options=[...value.matchAll(/<option value="([^"]*)"([^>]*)>([\s\S]*?)<\/option>/g)].map(match=>({value:decode(match[1]),textContent:decode(match[3]),disabled:match[2].includes('disabled')}));if(!this.options.some(option=>option.value===this._value))this._value=this.options.length?this.options[0].value:'';}}
  get innerHTML(){return this._html;}
  get selectedIndex(){return this.options.findIndex(option=>option.value===this._value);}
  set value(value){this._value=this.tag==='select'&&!this.options.some(option=>option.value===String(value))?'':String(value);}
  get value(){return this._value;}
  insertAdjacentHTML(_,html){const previous=this.value;this.innerHTML+=html;this.value=previous;}
  addEventListener(type,handler){this.listeners[type]=handler;}
  fire(type,event={}){return this.listeners[type](event);}
}

async function load(){
  const html=fs.readFileSync(path.join(app,'index.html'),'utf8'),elements={};
  for(const match of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g))elements[match[2]]=new Element(match[2],match[1]);
  for(const match of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))elements[match[1]].innerHTML=match[2];
  const fetch=async url=>{
    const target=path.join(app,String(url));
    if(!fs.existsSync(target))return new Response('missing',{status:404});
    return new Response(fs.readFileSync(target),{status:200});
  };
  const context={console,Intl,Date,setTimeout,clearTimeout,fetch,Response,Blob,DecompressionStream,crypto:webcrypto,URL:{createObjectURL(){return 'blob:test';},revokeObjectURL(){}},document:{getElementById(id){return elements[id]||null;},createElement(){return {click(){}};}},TransportRoutes:require('../app-transporte/recorridos.js'),print(){}};
  context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(app,'historico.js'),'utf8'),context);
  await context.TransportHistory.activate();
  await new Promise(resolve=>setImmediate(resolve));
  return {elements,context};
}

test('la interfaz histórica consulta la publicación correspondiente sin cargar todas juntas',async()=>{
  const ui=await load(),elements=ui.elements;
  assert.match(elements['history-coverage'].textContent,/2 publicaciones/);
  elements['history-date'].value='2026-08-25';await elements['history-date'].fire('change');
  elements['history-search'].value='ALTO ALEGRE';elements['history-search'].fire('input');await new Promise(resolve=>setTimeout(resolve,220));
  assert.equal(elements['history-result-count'].textContent,'2');assert.match(elements['history-results'].innerHTML,/VILLA MARÍA - ALTO ALEGRE/);
  elements['history-date'].value='2026-08-30';await elements['history-date'].fire('change');
  assert.equal(elements['history-result-count'].textContent,'0');assert.match(elements['history-result-status'].textContent,/No aparece/);
  elements['history-search'].value='SAIRA';elements['history-search'].fire('input');await new Promise(resolve=>setTimeout(resolve,220));
  assert.match(elements['history-results'].innerHTML,/18:45/);
});

test('la pestaña muestra el informe estructurado de la última carga',async()=>{
  const ui=await load(),elements=ui.elements;
  assert.equal(elements['change-publication'].value,'2026-08-28');
  assert.match(elements['change-summary'].innerHTML,/5\.502/);assert.match(elements['change-summary'].innerHTML,/>2</);
  assert.match(elements['change-details'].innerHTML,/16:30/);assert.match(elements['change-details'].innerHTML,/14:45/);assert.match(elements['change-details'].innerHTML,/ALTO ALEGRE/);
});
