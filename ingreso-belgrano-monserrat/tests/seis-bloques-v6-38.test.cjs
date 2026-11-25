'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bank=JSON.parse(read('data/desafios-finales.json'));
const model=JSON.parse(read('data/desafios-modelo.json'));
const ortho=JSON.parse(read('data/desafios-ortografia.json'));
const checks=JSON.parse(read('data/desafios-comprobacion.json'));
const fraction=JSON.parse(read('data/desafios-fracciones.json'));
const app=read('app.js');
const engine=read('desafios-fracciones.js');
const blocks=bank.blocks;
const all=Object.values(blocks).flatMap(b=>b.items);

test('exactamente seis bloques y 34 consignas por perfil, originales y sin perder los bancos anteriores',()=>{
  const counts={A1:7,A2:7,V1:7,V2:4,L1A:4,L1V:5};
  assert.deepEqual(Object.fromEntries(Object.entries(blocks).map(([id,b])=>[id,b.items.length])),counts);
  assert.equal(all.length,34);
  assert.equal(all.filter(t=>blocks[t.finalBlock].profile==='p1').length,18);
  assert.equal(all.filter(t=>blocks[t.finalBlock].profile==='p2').length,16);
  const old=[
    ...Object.values(model.blocks).flatMap(b=>Object.values(b.rounds).flat()),
    ...Object.values(ortho.blocks).flatMap(b=>['A','B','C','D','E','F'].flatMap(r=>b[r]||[])),
    ...Object.values(fraction.rounds).flat(),
    ...Object.values(checks.checks).flatMap(b=>Object.values(b).flat())
  ];
  const ids=new Set(old.map(t=>t.id)),prompts=new Set(old.map(t=>t.prompt));
  assert.equal(new Set(all.map(t=>t.id)).size,34);
  assert.equal(old.length,441);
  for(const t of all){
    assert.equal(ids.has(t.id),false,t.id+' ID reused');
    assert.equal(prompts.has(t.prompt),false,t.id+' prompt reused');
    assert.equal(t.hints.length,2,t.id);
    assert.equal(t.steps.length,3,t.id);
    assert.equal(t.difficulty,4,t.id);
    assert.equal(t.challengePurpose,'transferencia_final',t.id);
    if(t.finalArea==='lengua')assert.ok(t.rubric.length>=3,t.id);
    else assert.ok(t.reasoningPrompt.length>12,t.id);
  }
});

test('25 soluciones numéricas verificadas mediante operaciones independientes',()=>{
  const expected=[
    13/16+0.25,19/8-0.75,11/25+0.16,23/16+0.3125,27/20+0.65,7/8*2.4,7/16*3.2+0.4,
    2.75-6*0.25,3.8+0.75-1.25,2.4-(0.85+0.35),60+45+95,3*0.6+0.45,4.5-6*0.5,3/4*2/0.25,
    2*3.14*(5-3),50.24/(2*3.14),3.14*14,2*3.14*35*3,3.14*(24-18),3.14*6+12,2*3.14*(94.2/(2*3.14)+2),
    7.056/8,47.2/1000,42.36/6,5.64/8+0.125
  ];
  const tasks=[...blocks.A1.items,...blocks.A2.items,...blocks.V1.items,...blocks.V2.items];
  assert.equal(tasks.length,25);
  for(let i=0;i<tasks.length;i++)assert.ok(Math.abs(tasks[i].expected-expected[i])<1e-9,tasks[i].id);
});

function engineHarness(){
  const nodes=new Map();
  const node=k=>{
    if(!nodes.has(k))nodes.set(k,{value:'',textContent:'',innerHTML:'',disabled:false,
      hidden:false,onclick:null,dataset:{},addEventListener(){},setAttribute(){},
      classList:{add(){},remove(){},toggle(){}}});
    return nodes.get(k);
  };
  const dialog={open:false,showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return [];}};
  const document={
    getElementById:key=>key==='fraction-challenge-dialog'?dialog:key==='fraction-challenge-content'?surface:node(key),
    querySelector:key=>key==='meta[name="app-version"]'?{content:'6.38.0'}:null
  };
  const source={
    './data/desafios-finales.json':bank,
    './data/desafios-fracciones.json':fraction,
    './data/desafios-modelo.json':model,
    './data/desafios-ortografia.json':ortho,
    './data/desafios-comprobacion.json':checks
  };
  const fetch=async uri=>({ok:!!source[String(uri).split('?')[0]],json:async()=>source[String(uri).split('?')[0]]});
  const window={};
  const marker='  window.IngresoFractionChallenges={open,close};';
  assert.ok(engine.includes(marker));
  const hook=marker+'\nwindow.__finalTest={get:()=>session,eval:()=>evaluate(session.tasks[session.index])};';
  vm.runInNewContext(engine.replace(marker,hook),{window,document,fetch,console,Date});
  return {window,dialog,surface,node};
}

test('los seis bloques abren, registran respuestas, muestran pistas después y cierran al completar 4, 5 o 7',async()=>{
  const h=engineHarness(),received=[],ended=[];
  for(const [block,b] of Object.entries(blocks)){
    await h.window.IngresoFractionChallenges.open({
      finalBlock:block,onResult:r=>received.push(r),onComplete:e=>ended.push(e)
    });
    assert.equal(h.dialog.open,true,block);
    assert.match(h.surface.innerHTML,new RegExp('Desafío 1 de '+b.items.length));
    assert.equal(h.node('#fraction-hint').disabled,true,block);
    for(let i=0;i<b.items.length;i++){
      const task=b.items[i];
      if(task.finalArea==='matematica'){
        h.node('#fraction-ans1').value=String(task.expected).replace('.',',');
        h.node('#fraction-reason').value='Elegí la operación, convertí las unidades y comprobé el resultado.';
        const outcome=h.window.__finalTest.eval();
        assert.equal(outcome.valid,true,task.id);
        assert.equal(outcome.correct,true,task.id);
        h.node('#fraction-ans1').value=String(task.expected+1);
        assert.equal(h.window.__finalTest.eval().correct,false,task.id);
        h.node('#fraction-ans1').value=String(task.expected).replace('.',',');
      }else{
        h.node('#fraction-ans1').value='Reescribí las oraciones con concordancia, acentos, signos y conectores adecuados.';
        const outcome=h.window.__finalTest.eval();
        assert.equal(outcome.pendingReview,true,task.id);
        assert.equal(outcome.correct,false,task.id);
      }
      h.node('#fraction-check').onclick();
      const saved=received[received.length-1];
      assert.equal(saved.id,task.id);
      assert.equal(saved.finalBlock,block);
      assert.equal(saved.pendingAdultReview,true);
      assert.ok(saved.answerText.length>0);
      if(task.finalArea==='lengua'){
        assert.equal(saved.status,'revisar');
        assert.equal(saved.rubric.length,task.rubric.length);
      }else{
        assert.equal(saved.status,'autonoma');
        assert.ok(saved.reasoningText.length>12);
      }
      h.node('#fraction-next').onclick();
    }
    assert.equal(ended[ended.length-1].results.length,b.items.length,block);
    assert.equal(ended[ended.length-1].finalBlock,block);
    h.window.IngresoFractionChallenges.close();
  }
  assert.equal(received.length,34);
  assert.equal(ended.length,6);
});

function appHarness(){
  const nodeCache=new Map();
  const node=k=>{
    if(!nodeCache.has(k))nodeCache.set(k,{
      value:'',textContent:'',innerHTML:'',disabled:false,dataset:{},
      classList:{add(){},remove(){},toggle(){}},addEventListener(){}
    });
    return nodeCache.get(k);
  };
  const seed={profiles:{
    p1:{name:'Perfil 1',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0},
    p2:{name:'Perfil 2',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0}
  }};
  const localStorage={getItem:k=>k==='ingreso-belgrano-monserrat-v1'?JSON.stringify(seed):null,setItem(){},removeItem(){}};
  const document={addEventListener(){},querySelector:q=>['#week-plan-content','#week-day-select','#week-family-status','#final-family-work','#toast'].includes(q)?node(q):null,querySelectorAll(){return []}};
  const opened=[];
  const window={INGRESO_ACCESS_MODE:'family',addEventListener(){},
    IngresoFractionChallenges:{open:async args=>opened.push(args),close(){}}};
  const marker='  function startRecommended() {';
  assert.ok(app.includes(marker));
  const hook='  window.__finalApp={mode:v=>{activeMode=v;},date:v=>{selectedWeekDate=v;},plan:WEEK_PLAN,render:renderWeekPlan,status:finalBlockStatus,record:recordFinalAttempt,review:renderFinalFamily,profiles:()=>state.profiles,start:startFinalChallenges};\n'+marker;
  vm.runInNewContext(app.replace(marker,hook),{window,document,localStorage,Date,Intl,console,setTimeout(){},clearTimeout(){}});
  return {t:window.__finalApp,opened,node};
}
test('la agenda reemplaza otras tandas: miércoles 7/7; jueves 11/9; viernes y domingo simulacros',()=>{
  const {t}=appHarness();
  function days(p,day){
    return t.plan[day][p].tasks.map(task=>task.action);
  }
  assert.deepEqual(Array.from(days('p1','2026-11-25')),['final:A1']);
  assert.deepEqual(Array.from(days('p2','2026-11-25')),['final:V1']);
  assert.deepEqual(Array.from(days('p1','2026-11-26')),['final:A2','final:L1A']);
  assert.deepEqual(Array.from(days('p2','2026-11-26')),['final:V2','final:L1V']);
  for(const p of ['p1','p2']){
    assert.equal(days(p,'2026-11-27')[0],'paper:simulacro-m');
    assert.equal(days(p,'2026-11-29')[0],'paper:simulacro-l');
  }
});
test('las respuestas se conservan por perfil y no se califican automáticamente como dominio',async()=>{
  const {t,node,opened}=appHarness();
  t.mode('p1');t.date('2026-11-25');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Conversión avanzada de fracciones/);
  t.start('A1');await Promise.resolve();
  assert.equal(opened.length,1);
  assert.equal(opened[0].finalBlock,'A1');
  t.start('V1');await Promise.resolve();
  assert.equal(opened.length,1,'p1 cannot open p2 work');
  const record={id:'FA26-A1-01',finalBlock:'A1',status:'autonoma',answerText:'1,0625',
    reasoningText:'Primero convertí 13/16 y después sumé 0,25.',firstAttemptCorrect:true,durationMs:120000};
  t.record('p1','A1',record);
  assert.equal(t.profiles().p1.finalResponses[record.id].pendingAdultReview,true);
  assert.equal(t.profiles().p1.finalResponses[record.id].numericCorrect,true);
  assert.equal(t.profiles().p1.evidence.length,0,'mastery evidence remains untouched');
  assert.equal(t.profiles().p2.finalResponses,undefined);
  t.review();
  assert.match(node('#final-family-work').innerHTML,/Primero convertí/);
  t.mode('p2');t.review();
  assert.doesNotMatch(node('#final-family-work').innerHTML,/Primero convertí/);
  t.record('p2','A1',record);
  assert.equal(t.profiles().p2.finalResponses,undefined,'no cross-profile writes');
});
test('versión publicada y caché contienen el nuevo banco sin reiniciar los datos',()=>{
  assert.match(read('index.html'),/app-version" content="6\.38\.0"/);
  assert.match(read('index.html'),/id="final-family-work"/);
  assert.ok(read('sw.js').includes('desafios-finales.json?v=6.38.0'));
  assert.ok(read('sw.js').includes("const VERSION='6.38.0'"));
  new vm.Script(app);
  new vm.Script(engine);
});
