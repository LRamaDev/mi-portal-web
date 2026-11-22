'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const bank=JSON.parse(read('data/desafios-ortografia.json'));
const engine=read('desafios-fracciones.js');
const app=read('app.js');
const html=read('index.html');
const version=html.match(/app-version" content="(6\.\d+\.\d+)"/)?.[1];

test('70 ejercicios originales en cinco tipos de ortografía',()=>{
  const items=Object.values(bank.blocks).flatMap(b=>[...b.A,...b.B]);
  assert.equal(Object.keys(bank.blocks).length,5);
  assert.equal(items.length,70);
  assert.equal(new Set(items.map(t=>t.id)).size,70);
  assert.deepEqual([...new Set(items.map(t=>t.kind))].sort(),
    ['orth-accent','orth-classify','orth-diacritic','orth-fill','orth-sentence']);
  const skills=new Set(['LEN-DIP-HIA','LEN-GJ','LEN-BV','LEN-CSZ','LEN-ACENT','LEN-DIAC']);
  for(const task of items){
    assert.match(task.id,/^MO26-[DJBAT]-[AB]-0[1-7]$/);
    assert.equal(task.hints.length,2,task.id);
    assert.equal(task.steps.length,3,task.id);
    assert.ok(skills.has(task.skill),task.id);
    if(task.kind==='orth-fill')
      assert.equal(task.masked.replace('_',task.letter),task.expected,task.id);
    if(task.kind==='orth-accent')
      assert.equal(task.expected.normalize('NFD').replace(/\p{M}/gu,''),task.unaccented,task.id);
  }
});

test('los accesos nuevos están en Desafíos y versionados para la PWA',()=>{
  assert.equal((html.match(/data-start-ortho=/g)||[]).length,5);
  assert.equal((html.match(/data-ortho-status=/g)||[]).length,5);
  assert.equal((html.match(/data-start-fractions(?=[ >])/g)||[]).length,1);
  assert.equal((html.match(/data-start-model=/g)||[]).length,2);
  assert.ok(version,'no app version');
  assert.ok(read('sw.js').includes('desafios-ortografia.json?v='+version));
  new vm.Script(engine);
  new vm.Script(app);
});

function makeEngine(){
  const elements=new Map();
  function node(id){
    if(!elements.has(id))elements.set(id,{
      value:'',textContent:'',innerHTML:'',disabled:false,hidden:false,onclick:null,
      addEventListener(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}}
    });
    return elements.get(id);
  }
  const dialog={open:false,showModal(){this.open=true},close(){this.open=false},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return []}};
  const document={
    getElementById:id=>id==='fraction-challenge-dialog'?dialog:
      id==='fraction-challenge-content'?surface:node(id),
    querySelector:sel=>sel==='meta[name="app-version"]'?{content:version}:null
  };
  const sources={
    './data/desafios-ortografia.json':bank,
    './data/desafios-fracciones.json':JSON.parse(read('data/desafios-fracciones.json')),
    './data/desafios-modelo.json':JSON.parse(read('data/desafios-modelo.json'))
  };
  const fetch=async url=>{
    const content=sources[String(url).split('?')[0]];
    return {ok:Boolean(content),json:async()=>content};
  };
  const marker='  window.IngresoFractionChallenges={open,close};';
  assert.ok(engine.includes(marker));
  const hook=[
    '  window.IngresoFractionChallenges={open,close};',
    '  window.__orthoTest={',
    '    choose:x=>{session.choice=x;},',
    '    evaluate:(i,choice,value)=>{',
    '      session.index=i;session.choice=choice;',
    "      app.querySelector('#fraction-ans1').value=String(value||'');",
    '      return evaluate(session.tasks[i]);',
    '    },',
    '    render:i=>{session.index=i;showTask();return app.innerHTML;}',
    '  };'
  ].join('\n');
  const window={};
  vm.runInNewContext(engine.replace(marker,hook),{window,document,fetch,Date,console});
  return {window,dialog,surface,node};
}

function samples(t){
  switch(t.kind){
    case 'orth-classify':{
      const i=t.expected==='diptongo'?0:1;return [[i,''],[i?0:1,'']];
    }
    case 'orth-sentence':{
      const i=t.expected==='correcta'?0:1;
      return [[i,t.correction||''],[i?0:1,'']];
    }
    case 'orth-fill':return [[null,t.expected],[null,'x']];
    case 'orth-accent':{
      const i=t.options.indexOf(t.unaccented);
      return [[i,t.expected],[i,t.unaccented]];
    }
    case 'orth-diacritic':{
      const i=t.options.indexOf(t.expected);return [[i,''],[i?0:1,'']];
    }
    default:throw new Error(t.kind);
  }
}

test('70 respuestas correctas y 70 errores comprobados por el motor',async()=>{
  const {window,dialog,surface}=makeEngine();
  let counter=0;
  for(const [block,part] of Object.entries(bank.blocks))for(const round of ['A','B']){
    await window.IngresoFractionChallenges.open({orthographyBlock:block,round});
    assert.equal(dialog.open,true);
    assert.match(surface.innerHTML,/Desafío 1 de 7/);
    for(let i=0;i<7;i++){
      const task=part[round][i], [right,wrong]=samples(task);
      const a=window.__orthoTest.evaluate(i,...right);
      assert.equal(a.valid,true,task.id);
      assert.equal(a.correct,true,task.id);
      const b=window.__orthoTest.evaluate(i,...wrong);
      assert.ok(b.correct!==true,task.id+' incorrect accepted');
      counter++;
    }
    window.IngresoFractionChallenges.close();
  }
  assert.equal(counter,70);
});

test('misma experiencia: sin ayuda, con pistas, para revisar; Matemática intacta',async()=>{
  const {window,surface,node}=makeEngine();
  const events=[];
  await window.IngresoFractionChallenges.open({
    orthographyBlock:'D',round:'A',onResult:x=>events.push(x)
  });
  window.__orthoTest.choose(0);
  node('#fraction-check').onclick();
  assert.equal(events[0].status,'autonoma');
  assert.equal(events[0].skill,'LEN-DIP-HIA');
  node('#fraction-next').onclick();
  window.__orthoTest.choose(0);
  node('#fraction-check').onclick();
  assert.equal(events.length,1);
  node('#fraction-hint').onclick();
  window.__orthoTest.choose(1);
  node('#fraction-check').onclick();
  assert.equal(events[1].status,'ayuda');
  node('#fraction-next').onclick();
  node('#fraction-hint').onclick();
  node('#fraction-hint').onclick();
  node('#fraction-hint').onclick();
  assert.equal(events[2].status,'revisar');
  window.IngresoFractionChallenges.close();
  await window.IngresoFractionChallenges.open({round:'A'});
  assert.match(surface.innerHTML,/Dos mosaicos circulares/);
  window.IngresoFractionChallenges.close();
  await window.IngresoFractionChallenges.open({block:'R',round:'A'});
  assert.match(surface.innerHTML,/Reconocer lo sombreado/);
  window.IngresoFractionChallenges.close();
});


test('clic en Ortografía abre el circuito propio de cada perfil sin mezclar avances',()=>{
  const listeners={};const elements=new Map();
  function node(key){
    if(!elements.has(key))elements.set(key,{
      dataset:{},textContent:'',disabled:false,title:'',
      addEventListener(){},classList:{toggle(){},add(){},remove(){}}
    });
    return elements.get(key);
  }
  const btn=node('btn');btn.dataset.startOrtho='D';
  btn.hasAttribute=key=>key==='data-start-ortho';
  const label=node('label');label.dataset.orthoStatus='D';
  const document={
    addEventListener(n,callback){(listeners[n]||=[]).push(callback);},
    querySelector:node,
    querySelectorAll(sel){
      if(sel==='[data-start-ortho]')return [btn];
      if(sel==='[data-ortho-status]')return [label];
      return [];
    }
  };
  const profile=()=>({name:'Perfil',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0});
  const state={profiles:{p1:profile(),p2:profile()}};
  state.profiles.p1.history=[{
    type:'desafios_ortografia',orthographyBlockId:'D',roundId:'A',at:1
  }];
  const localStorage={
    getItem:key=>key==='ingreso-belgrano-monserrat-v1'?JSON.stringify(state):null,
    setItem(){},removeItem(){}
  };
  const opened=[];
  const window={
    INGRESO_ACCESS_MODE:'family',addEventListener(){},
    IngresoFractionChallenges:{open:async args=>opened.push({
      block:args.orthographyBlock,round:args.round
    })},
    IngresoPedagogy:{
      ensureAnalysis:()=>({state:'explorando'}),
      derivePurpose:()=> 'practica',
      createEvidence:args=>({
        exerciseId:args.exercise.id,skillId:args.exercise.habilidad,
        correct:args.correct,hintUsed:args.hintUsed,origin:args.origin
      }),
      applyAttempt:(p,e,event)=>p.evidence.push(event)
    }
  };
  const marker='  function startRecommended() {';
  assert.ok(app.includes(marker));
  const hook=[
    '  window.__orthoAppSmoke={',
    '    mode:m=>{activeMode=m;},render:renderOrthographyEntries,',
    '    record:recordOrthographyAttempt,profiles:()=>state.profiles',
    '  };',
    marker
  ].join('\n');
  vm.runInNewContext(app.replace(marker,hook),{window,document,localStorage,console});
  const verify=window.__orthoAppSmoke;
  const click=()=>listeners.click.forEach(callback=>callback({
    target:{closest:()=>btn},preventDefault(){}
  }));
  verify.mode('p1');verify.render();click();
  assert.equal(opened.at(-1).round,'B');
  verify.mode('p2');verify.render();click();
  assert.equal(opened.at(-1).round,'A');
  verify.mode('p1');
  verify.record('p1',{
    id:'MO26-D-B-01',orthographyBlock:'D',skill:'LEN-DIP-HIA',
    status:'ayuda',difficulty:2,durationMs:10000
  });
  assert.equal(verify.profiles().p1.evidence.length,1);
  assert.equal(verify.profiles().p2.evidence.length,0);
  assert.equal(verify.profiles().p1.evidence[0].hintUsed,true);
  verify.mode('together');verify.render();
  assert.equal(btn.disabled,true);
  const before=opened.length;click();
  assert.equal(opened.length,before);
});
