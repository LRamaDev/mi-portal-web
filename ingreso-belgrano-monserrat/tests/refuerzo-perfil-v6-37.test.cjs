'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const bank=JSON.parse(read('data/desafios-modelo.json'));
const app=read('app.js');
const engine=read('desafios-fracciones.js');

test('14 tareas inéditas y resultados únicos por perfil',()=>{
  const A=bank.blocks.X.rounds.A,B=bank.blocks.Y.rounds.A;
  assert.equal(A.length,7);assert.equal(B.length,7);
  assert.equal(bank.blocks.X.profile,'p1');assert.equal(bank.blocks.Y.profile,'p2');
  const old=Object.entries(bank.blocks).filter(([name])=>name!=='X'&&name!=='Y').flatMap(([,b])=>Object.values(b.rounds).flat());
  const used=new Set(old.map(t=>t.id)),prompts=new Set(old.map(t=>t.prompt));
  for(const t of [...A,...B]){
    assert.equal(used.has(t.id),false,t.id);
    assert.equal(prompts.has(t.prompt),false,t.id);
    assert.equal(t.hints.length,2,t.id);assert.equal(t.steps.length,3,t.id);
    assert.equal(t.challengePurpose,'refuerzo_personalizado');
  }
  assert.equal(new Set([...A,...B].map(t=>t.id)).size,14);
  assert.match(read('index.html'),/app-version" content="6\.37\.0"/);
});

function makeEngine(){
  const nodes=new Map();
  const node=k=>{
    if(!nodes.has(k))nodes.set(k,{value:'',textContent:'',innerHTML:'',disabled:false,
      hidden:false,onclick:null,addEventListener(){},setAttribute(){},
      classList:{add(){},remove(){},toggle(){}}});
    return nodes.get(k);
  };
  const dialog={open:false,showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return []}};
  const document={getElementById:k=>k==='fraction-challenge-dialog'?dialog:k==='fraction-challenge-content'?surface:node(k),
    querySelector:q=>q==='meta[name="app-version"]'?{content:'6.37.0'}:null};
  const window={};
  const fetch=async()=>({ok:true,json:async()=>bank});
  const marker='  window.IngresoFractionChallenges={open,close};';
  const hook=marker+'\nwindow.__checkResult=(i,v)=>{session.index=i;app.querySelector("#fraction-ans1").value=String(v);return evaluate(session.tasks[i]);};';
  assert.ok(engine.includes(marker));
  vm.runInNewContext(engine.replace(marker,hook),{window,document,fetch,Date,console});
  return {window,dialog,surface};
}

test('motor comprueba las 14 respuestas esperadas y rechaza otras 14 incorrectas',async()=>{
  const {window,dialog,surface}=makeEngine();
  for(const block of ['X','Y']){
    await window.IngresoFractionChallenges.open({block,round:'A'});
    assert.equal(dialog.open,true,block);
    assert.match(surface.innerHTML,/Desafío 1 de 7/);
    const tasks=bank.blocks[block].rounds.A;
    for(let i=0;i<tasks.length;i++){
      const t=tasks[i];
      const correct=t.kind==='model-fraction'?t.expected.join('/'):String(t.expected).replace('.',',');
      const wrong=t.kind==='model-fraction'?String(t.expected[0]+1)+'/'+t.expected[1]:t.expected+1;
      assert.equal(window.__checkResult(i,correct).correct,true,t.id);
      assert.equal(window.__checkResult(i,wrong).correct,false,t.id);
    }
    window.IngresoFractionChallenges.close();
  }
});

function makeApp(){
  const p=()=>({name:'Perfil',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0});
  const seed={profiles:{p1:p(),p2:p()}},opened=[],nodes=new Map();
  const node=k=>{
    if(!nodes.has(k))nodes.set(k,{value:'',textContent:'',innerHTML:'',disabled:false});
    return nodes.get(k);
  };
  const storage={getItem:k=>k==='ingreso-belgrano-monserrat-v1'?JSON.stringify(seed):null,setItem(){},removeItem(){}};
  const document={addEventListener(){},querySelector:q=>['#week-plan-content','#week-day-select','#week-family-status'].includes(q)?node(q):null,querySelectorAll(){return []}};
  const window={INGRESO_ACCESS_MODE:'family',addEventListener(){},
    IngresoFractionChallenges:{open:async args=>{opened.push(args)},close(){}}};
  const marker='  function startRecommended() {';
  const hook='  window.__test={mode:m=>{activeMode=m},date:d=>{selectedWeekDate=d},plan:WEEK_PLAN,render:renderWeekPlan,click:handleWeekClick};\n'+marker;
  assert.ok(app.includes(marker));
  vm.runInNewContext(app.replace(marker,hook),{window,document,localStorage:storage,Date,Intl,console});
  return {test:window.__test,opened,node};
}

test('hoy muestra las tandas correctas sin repetirlas mañana',()=>{
  const {test:t,node}=makeApp();
  t.mode('p1');t.date('2026-11-24');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Refuerzo personal: fracciones y capacidad/);
  assert.doesNotMatch(node('#week-plan-content').innerHTML,/Refuerzo personal: divisiones y valor posicional/);
  t.mode('p2');t.render();
  assert.match(node('#week-plan-content').innerHTML,/Refuerzo personal: divisiones y valor posicional/);
  assert.doesNotMatch(node('#week-plan-content').innerHTML,/Refuerzo personal: fracciones y capacidad/);
  assert.equal(t.plan['2026-11-24'].p1.tasks[1].action,'model:X:A');
  assert.equal(t.plan['2026-11-24'].p2.tasks[1].action,'model:Y:A');
  assert.equal(t.plan['2026-11-25'].p1.tasks[0].action,'model:E:C');
  assert.equal(t.plan['2026-11-25'].p2.tasks[0].action,'model:D:C');
});

test('no permite iniciar el bloque del otro perfil',async()=>{
  const {test:t,opened}=makeApp();
  function click(action){t.click({target:{closest:()=>({disabled:false,dataset:{weekAction:action}})},preventDefault(){}});}
  t.mode('p1');click('model:X:A');await Promise.resolve();
  assert.equal(opened.length,1);assert.equal(opened[0].block,'X');
  click('model:Y:A');await Promise.resolve();
  assert.equal(opened.length,1);
  t.mode('p2');click('model:Y:A');await Promise.resolve();
  assert.equal(opened.length,2);assert.equal(opened[1].block,'Y');
  click('model:X:A');await Promise.resolve();
  assert.equal(opened.length,2);
});
