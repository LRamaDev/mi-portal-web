'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('app.js');
const engine=read('desafios-fracciones.js');
const bank=JSON.parse(read('data/desafios-modelo.json'));
const html=read('index.html');

test('calendario 24–30, dos perfiles, materiales imprimibles y versión coherente',()=>{
  assert.match(html,/app-version" content="6\.37\.0"/);
  for(const date of ['2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28','2026-11-29','2026-11-30'])
    assert.ok(html.includes('value="'+date+'"'),date);
  assert.match(html,/id="week-plan-content"/);
  assert.match(html,/id="week-family-status"/);
  assert.equal(bank.blocks.S.rounds.A.length,7);
  assert.equal(bank.blocks.S.rounds.B.length,7);
  const ids=[...bank.blocks.S.rounds.A,...bank.blocks.S.rounds.B].map(t=>t.id);
  assert.equal(new Set(ids).size,14);
  const sw=read('sw.js');
  for(const file of ['simulacro-final-matematica.html','simulacro-final-lengua.html'])
    assert.ok(sw.includes("'./"+file+"'"),file);
  assert.ok(sw.includes("const VERSION='6.37.0'"));
  for(const file of ['simulacro-final-matematica.html','simulacro-final-lengua.html']){
    const body=read(file);
    assert.match(body,/60 minutos/);
    assert.match(body,/no oficial/);
    assert.match(body,/window\.print\(\)/);
    const points=[...body.matchAll(/class="points">(\d+) puntos/g)].map(m=>Number(m[1]));
    assert.equal(points.reduce((x,y)=>x+y,0),100,file);
  }
});

function harness(){
  const nodes=new Map();
  function node(id){
    if(!nodes.has(id))nodes.set(id,{
      id,value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},hidden:false,
      addEventListener(){},setAttribute(){},classList:{add(){},remove(){},toggle(){}}
    });
    return nodes.get(id);
  }
  const listeners={};
  const document={
    addEventListener(t,fn){(listeners[t]||=[]).push(fn);},
    querySelector:sel=>['#week-plan-content','#week-day-select','#week-family-status','#week-writing-input','#week-note-input','#toast'].includes(sel)?node(sel):null,
    querySelectorAll(){return []}
  };
  const profile=()=>({name:'Perfil',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0});
  const seed={profiles:{p1:profile(),p2:profile()}};
  const saved=[];
  const localStorage={
    getItem:key=>key==='ingreso-belgrano-monserrat-v1'?JSON.stringify(seed):null,
    setItem:(k,v)=>saved.push({k,v}),removeItem(){}
  };
  const opens=[];
  const window={
    INGRESO_ACCESS_MODE:'family',addEventListener(){},
    IngresoFractionChallenges:{open:async opts=>{opens.push(opts)},close(){}},
    setTimeout(){},clearTimeout(){},
    scrollTo(){}
  };
  const marker='  function startRecommended() {';
  const instrument=[
    '  window.__weekTest={',
    '    mode:m=>{activeMode=m},',
    '    date:d=>{selectedWeekDate=d},',
    '    render:renderWeekPlan,',
    '    monitor:renderWeekFamily,',
    '    plan:WEEK_PLAN,',
    '    profiles:()=>state.profiles,',
    '    status:(p,t,d)=>weekTaskStatus(p,t,d),',
    '    check:checkState,',
    '    click:handleWeekClick',
    '  };',
    marker
  ].join('\n');
  assert.ok(app.includes(marker));
  vm.runInNewContext(app.replace(marker,instrument),{window,document,localStorage,Date,Intl,console,CustomEvent:class{}});
  return {test:window.__weekTest,node,opens,saved,listeners};
}

test('la agenda selecciona tareas distintas para cada perfil y nunca bloquea el día siguiente',()=>{
  const {test:t,node}=harness();
  t.mode('p1');t.date('2026-11-25');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Conversión de fracciones y capacidad/);
  assert.match(node('#week-plan-content').innerHTML,/Verbos con G y J/);
  assert.doesNotMatch(node('#week-plan-content').innerHTML,/Divisiones y valor posicional/);
  t.mode('p2');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Divisiones y valor posicional/);
  assert.match(node('#week-plan-content').innerHTML,/Acentuación e hiatos/);
  assert.doesNotMatch(node('#week-plan-content').innerHTML,/Verbos con G y J/);
  t.date('2026-11-26');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Primos, masa, capacidad/);
  assert.match(node('#week-plan-content').innerHTML,/Guardar borrador/);
  t.date('2026-11-27');t.render();
  assert.match(node('#week-plan-content').innerHTML,/simulacro-final-matematica\.html/);
});

test('acceso directo al circuito B de medidas para V sin exigir completar el de A',async()=>{
  const h=harness();h.test.mode('p2');h.test.date('2026-11-26');
  h.test.click({target:{closest:()=>({disabled:false,dataset:{weekAction:'model:S:B'}})},preventDefault(){}});
  await Promise.resolve();
  assert.equal(h.opens.length,1);
  assert.equal(h.opens[0].block,'S');
  assert.equal(h.opens[0].round,'B');
  assert.equal(h.opens[0].prior.length,0);
});

test('el resumen semanal y el borrador no mezclan perfiles ni equivalen a corrección',()=>{
  const {test:t,node}=harness();
  const p1=t.profiles().p1,p2=t.profiles().p2;
  p1.weekWriting={'2026-11-26':{text:'Relato propio de más de cincuenta caracteres para revisión adulta.',at:1,reviewed:false}};
  p1.weekLog={'2026-11-27':{'simulacro-m':{at:2,kind:'self_report',reviewed:false}}};
  t.mode('p1');t.date('2026-11-26');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Relato propio/);
  t.monitor();
  assert.match(node('#week-family-status').innerHTML,/Jue 26.*1 de 2/);
  assert.match(node('#week-family-status').innerHTML,/Vie 27.*1 de 1/);
  t.mode('p2');t.render();t.monitor();
  assert.doesNotMatch(node('#week-plan-content').innerHTML,/Relato propio/);
  assert.match(node('#week-family-status').innerHTML,/Jue 26.*0 de 2/);
  assert.equal(t.status(p2,t.plan['2026-11-27'].p2.tasks[0],'2026-11-27'),'pending');
  t.mode('together');t.render();t.monitor();
  assert.doesNotMatch(node('#week-family-status').innerHTML,/Perfil 1/);
  assert.match(node('#week-family-status').innerHTML,/individual/);
});

test('comprobación inicial libre y retención cuatro días después de transferir',()=>{
  const {test:t}=harness(),p=t.profiles().p1;
  const initial=Date.parse('2026-11-24T16:00:00Z');
  assert.equal(t.check(p,'M','transferencia',initial).state,'verification');
  assert.equal(t.check(p,'M','retencion',initial).state,'waiting');
  p.history.push({at:initial,type:'desafios_comprobacion',phase:'transferencia',checkArea:'M'});
  assert.equal(t.check(p,'M','retencion',initial+3*86400000).state,'waiting');
  assert.equal(t.check(p,'M','retencion',initial+4*86400000).state,'verification');
});

function engineHarness(){
  const els=new Map();
  function node(id){
    if(!els.has(id))els.set(id,{value:'',textContent:'',innerHTML:'',disabled:false,hidden:false,onclick:null,
      addEventListener(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}}});
    return els.get(id);
  }
  const dialog={open:false,showModal(){this.open=true},close(){this.open=false},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return []}};
  const document={
    getElementById:id=>id==='fraction-challenge-dialog'?dialog:
      id==='fraction-challenge-content'?surface:node(id),
    querySelector:sel=>sel==='meta[name="app-version"]'?{content:'6.37.0'}:null
  };
  const window={};
  const fetch=async()=>({ok:true,json:async()=>bank});
  const anchor='  window.IngresoFractionChallenges={open,close};';
  assert.ok(engine.includes(anchor));
  const instrument=[
    anchor,
    '  window.__weekMath={evaluate:(i,value)=>{',
    "    session.index=i;app.querySelector('#fraction-ans1').value=String(value);",
    '    return evaluate(session.tasks[i]);',
    '  }};'
  ].join('\n');
  vm.runInNewContext(engine.replace(anchor,instrument),{window,document,fetch,Date,console});
  return window;
}
test('las 14 conversiones y problemas de magnitudes aceptan sus respuestas y rechazan errores',async()=>{
  const w=engineHarness();
  for(const round of ['A','B']){
    await w.IngresoFractionChallenges.open({block:'S',round});
    for(let i=0;i<7;i++){
      const task=bank.blocks.S.rounds[round][i];
      const ok=w.__weekMath.evaluate(i,String(task.expected).replace('.',','));
      assert.equal(ok.valid,true,task.id);
      assert.equal(ok.correct,true,task.id);
      const wrong=w.__weekMath.evaluate(i,task.expected+1);
      assert.notEqual(wrong.correct,true,task.id);
    }
    w.IngresoFractionChallenges.close();
  }
});
