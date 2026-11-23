'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=JSON.parse(read('data/desafios-modelo.json'));
const orth=JSON.parse(read('data/desafios-ortografia.json'));
const checks=JSON.parse(read('data/desafios-comprobacion.json'));
const frac=JSON.parse(read('data/desafios-fracciones.json'));
const engine=read('desafios-fracciones.js');
const app=read('app.js');
const html=read('index.html');
const modelNew=[...model.blocks.D.rounds.C,...model.blocks.D.rounds.D,
  ...model.blocks.E.rounds.C,...model.blocks.E.rounds.D,...model.blocks.E.rounds.E,
  ...model.blocks.C.rounds.D,...model.blocks.F.rounds.D];
const languageNew=[...orth.blocks.J.F,...orth.blocks.A.E,...orth.blocks.T.F,
  ...orth.blocks.P.C,...orth.blocks.U.A,...orth.blocks.U.B];
const checkTasks=Object.values(checks.checks).flatMap(c=>Object.values(c).flat());
const priorMath=Object.entries(model.blocks).flatMap(([b,v])=>Object.entries(v.rounds)
  .filter(([r])=>!({D:['C','D'],E:['C','D','E'],C:['D'],F:['D']}[b]||[]).includes(r))
  .flatMap(([r,ts])=>ts));
const priorLang=Object.entries(orth.blocks).flatMap(([b,v])=>['A','B','C','D','E','F']
  .filter(r=>v[r]&&!({J:['F'],A:['E'],T:['F'],P:['C'],U:['A','B']}[b]||[]).includes(r))
  .flatMap(r=>v[r]));

test('119 actividades nuevas: 49 Matemática, 42 Lengua y 28 comprobaciones independientes',()=>{
  assert.equal(modelNew.length,49);
  assert.equal(languageNew.length,42);
  assert.equal(checkTasks.length,28);
  assert.equal(priorMath.length+priorLang.length+Object.values(frac.rounds).flat().length,294);
  const combined=[...priorMath,...priorLang,...Object.values(frac.rounds).flat(),
    ...modelNew,...languageNew,...checkTasks];
  assert.equal(combined.length,413);
  assert.equal(new Set(combined.map(t=>t.id)).size,413);
  for(const task of [...modelNew,...languageNew,...checkTasks]){
    assert.equal(task.hints.length,2,task.id);
    assert.equal(task.steps.length,3,task.id);
    assert.ok(task.skill,task.id);
    assert.ok(task.difficulty>=2,task.id);
  }
  assert.equal(checks.checks.transferencia.M.length,7);
  assert.equal(checks.checks.transferencia.L.length,7);
  assert.equal(checks.checks.retencion.M.length,7);
  assert.equal(checks.checks.retencion.L.length,7);
});

function mockEngine(){
  const nodes=new Map();
  function node(k){
    if(!nodes.has(k))nodes.set(k,{
      value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,
      dataset:{},onclick:null,addEventListener(){},setAttribute(){},
      classList:{toggle(){},add(){},remove(){}}
    });
    return nodes.get(k);
  }
  const dialog={open:false,showModal(){this.open=true;},close(){this.open=false;},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return []}};
  const document={
    getElementById:key=>key==='fraction-challenge-dialog'?dialog:
      key==='fraction-challenge-content'?surface:node(key),
    querySelector:selector=>selector==='meta[name="app-version"]'?{content:'6.35.0'}:null
  };
  const sources={
    './data/desafios-fracciones.json':frac,
    './data/desafios-modelo.json':model,
    './data/desafios-ortografia.json':orth,
    './data/desafios-comprobacion.json':checks
  };
  const fetch=async uri=>{const data=sources[String(uri).split('?')[0]];return {ok:!!data,json:async()=>data};};
  const marker='  window.IngresoFractionChallenges={open,close};';
  assert.ok(engine.includes(marker));
  const hook=[
    marker,
    '  window.__checkHarness={',
    '    evaluate:(i,choice,selection,input)=>{',
    '      session.index=i;session.choice=choice;session.selection=new Set(selection||[]);',
    "      app.querySelector('#fraction-ans1').value=String(input??'');",
    '      return evaluate(session.tasks[i]);',
    '    },',
    '    get:()=>session,',
    '    show:i=>{session.index=i;showTask();return app.innerHTML;},',
    '    choose:x=>{session.choice=x;}',
    '  };'
  ].join('\n');
  const window={};
  vm.runInNewContext(engine.replace(marker,hook),{window,document,fetch,console,Date});
  return {window,dialog,surface,node};
}

function answers(t){
  switch(t.kind){
    case 'model-decimal':return [[null,[],String(t.expected).replace('.',',')],[null,[],String(t.expected+1)]];
    case 'model-fraction':return [[null,[],t.expected.join('/')],[null,[],(t.expected[0]*2)+'/'+(t.expected[1]*2)]];
    case 'fraction-compare':{
      const correct=['<','>','='].indexOf(t.expected);
      return [[correct,[],null],[(correct+1)%3,[],null]];
    }
    case 'fraction-order':return [[null,t.expected,null],[null,[...t.expected].reverse(),null]];
    case 'fraction-between':{
      const [a,b]=t.lower,[c,d]=t.upper;
      return [[null,[],String(a*d+c*b)+'/'+String(2*b*d)],[null,[],a+'/'+b]];
    }
    case 'orth-fill':return [[null,[],t.expected],[null,[],t.masked]];
    case 'orth-accent-write':return [[null,[],t.expected],[null,[],t.word]];
    case 'orth-diacritic-write':return [[null,[],t.expected],[null,[],t.alternate]];
    case 'orth-choice':{
      const i=t.options.indexOf(t.expected);
      return [[i,[],null],[(i+1)%t.options.length,[],null]];
    }
    case 'orth-rewrite':return [[null,[],t.expected],[null,[],t.sentence]];
    case 'orth-rule':return [[null,[],t.expected],[null,[],'otra regla']];
    default:throw Error('No existe respuesta modelo para '+t.kind+' '+t.id);
  }
}

test('el corrector acepta las 119 soluciones y rechaza 119 respuestas equivocadas',async()=>{
  const {window,dialog,surface}=mockEngine();let attempts=0;
  const cases=[
    ...Object.entries(model.blocks).flatMap(([block,v])=>Object.entries(v.rounds)
      .filter(([round])=>({D:['C','D'],E:['C','D','E'],C:['D'],F:['D']}[block]||[]).includes(round))
      .map(([round,items])=>({params:{block,round},items}))),
    ...Object.entries(orth.blocks).flatMap(([block,v])=>
      ['A','B','C','D','E','F'].filter(round=>({J:['F'],A:['E'],T:['F'],P:['C'],U:['A','B']}[block]||[]).includes(round))
      .map(round=>({params:{orthographyBlock:block,round},items:v[round]}))),
    ...Object.entries(checks.checks).flatMap(([phase,areas])=>Object.entries(areas)
      .map(([area,items])=>({params:{checkPhase:phase,checkArea:area},items})))
  ];
  for(const {params,items} of cases){
    await window.IngresoFractionChallenges.open(params);
    assert.equal(dialog.open,true,JSON.stringify(params));
    assert.match(surface.innerHTML,/Desafío 1 de 7/);
    for(let i=0;i<items.length;i++){
      const t=items[i],[right,wrong]=answers(t);
      const pass=window.__checkHarness.evaluate(i,...right);
      assert.equal(pass.valid,true,t.id+' needs a valid answer');
      assert.equal(pass.correct,true,t.id+' should pass');
      const fail=window.__checkHarness.evaluate(i,...wrong);
      assert.notEqual(fail.correct,true,t.id+' should not accept wrong');
      attempts++;
    }
    window.IngresoFractionChallenges.close();
  }
  assert.equal(attempts,119);
});

test('sin pistas antes de comprobar; tras error la corrección no es autónoma',async()=>{
  const {window,node}=mockEngine();const events=[];
  await window.IngresoFractionChallenges.open({
    checkArea:'M',checkPhase:'transferencia',onResult:r=>events.push(r)
  });
  const hint=node('#fraction-hint'),check=node('#fraction-check');
  assert.equal(hint.disabled,true);
  hint.onclick();
  assert.equal(window.__checkHarness.get().hints,0);
  const t=checks.checks.transferencia.M[0];
  node('#fraction-ans1').value=String(t.expected+1);
  check.onclick();
  assert.equal(hint.disabled,false);
  assert.equal(window.__checkHarness.get().attempts,1);
  node('#fraction-ans1').value=String(t.expected).replace('.',',');
  check.onclick();
  assert.equal(events[0].status,'ayuda');
  assert.equal(events[0].firstAttemptCorrect,false);
  assert.equal(events[0].checkPhase,'transferencia');
  window.IngresoFractionChallenges.close();
  const first=[];
  await window.IngresoFractionChallenges.open({
    checkArea:'L',checkPhase:'retencion',onResult:r=>first.push(r)
  });
  const w=checks.checks.retencion.L[0];
  node('#fraction-ans1').value=w.expected;
  check.onclick();
  assert.equal(first[0].status,'autonoma');
  assert.equal(first[0].firstAttemptCorrect,true);
  window.IngresoFractionChallenges.close();
});

function appHarness(){
  const profile=()=>({name:'Perfil',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0});
  const data={profiles:{p1:profile(),p2:profile()}};
  const storage={
    getItem:k=>k==='ingreso-belgrano-monserrat-v1'?JSON.stringify(data):null,
    setItem(){},removeItem(){}
  };
  const document={addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}};
  const window={addEventListener(){},INGRESO_ACCESS_MODE:'family'};
  const marker='  function startRecommended() {';
  const instrumentation=[
    '  window.__checkApp={',
    '    modes:m=>{activeMode=m},',
    '    profiles:()=>state.profiles,',
    '    completedModel:completedModelRounds,',
    '    completedOrtho:completedOrthographyRounds,',
    '    state:checkState,',
    '    prefix:checkPrefix,',
    '    record:recordCheckAttempt,',
    '    refresh:refreshChallengeIndicators',
    '  };',
    marker
  ].join('\n');
  assert.ok(app.includes(marker));
  vm.runInNewContext(app.replace(marker,instrumentation),{window,document,localStorage:storage,Date,console});
  return window.__checkApp;
}

test('un circuito con sus siete evidencias no se ofrece de nuevo aunque falte cierre formal',()=>{
  const t=appHarness(),profile=t.profiles().p2;
  for(let i=1;i<=7;i++){
    profile.evidence.push({exerciseId:'MB26-D-B-'+String(i).padStart(2,'0')});
    profile.evidence.push({exerciseId:'MO26-P-B-'+String(i).padStart(2,'0')});
  }
  assert.equal(t.completedModel(profile,'D').has('B'),true);
  assert.equal(t.completedOrtho(profile,'P').has('B'),true);
  assert.equal(profile.history.length,0,'no se inventaron cierres');
});

test('transferencia tras práctica; retención recién cuatro días después y por perfil',()=>{
  const t=appHarness(),p=t.profiles().p1,other=t.profiles().p2;
  const DAY=86400000,now=Date.now(),old=now-5*DAY,recent=now-2*DAY;
  const guided=[
    ['desafios_modelo','E','E'],['desafios_modelo','D','D'],
    ['desafios_ortografia','J','F'],['desafios_ortografia','A','E'],
    ['desafios_ortografia','T','F'],['desafios_ortografia','U','B'],
    ['desafios_ortografia','P','C']
  ];
  for(const [type,block,round] of guided)p.history.push({
    type,blockId:type==='desafios_modelo'?block:undefined,
    orthographyBlockId:type==='desafios_ortografia'?block:undefined,
    roundId:round,at:old
  });
  assert.equal(t.state(other,'M','transferencia',now).state,'waiting');
  assert.equal(t.state(p,'M','transferencia',now).state,'verification');
  assert.equal(t.state(p,'L','transferencia',now).state,'verification');
  assert.equal(t.state(p,'M','retencion',now).state,'waiting');
  p.history.push({type:'desafios_comprobacion',checkArea:'M',phase:'transferencia',at:old});
  p.history.push({type:'desafios_comprobacion',checkArea:'L',phase:'transferencia',at:old});
  assert.equal(t.state(p,'M','retencion',now).state,'verification');
  assert.equal(t.state(p,'L','retencion',now).state,'verification');
  p.history.find(x=>x.type==='desafios_modelo'&&x.blockId==='E').at=recent;
  assert.equal(t.state(p,'M','retencion',now).state,'waiting');
  assert.ok(t.state(p,'M','retencion',now).dueAt>now);
  assert.equal(t.state(p,'L','retencion',now).state,'verification');
  assert.equal(other.history.length,0);
});

test('versión, privacidad y estados diferenciados sin cambios en la base',()=>{
  assert.match(html,/app-version" content="6\.35\.0"/);
  assert.equal((html.match(/data-start-model=/g)||[]).length,6);
  assert.equal((html.match(/data-start-ortho=/g)||[]).length,7);
  assert.equal((html.match(/data-start-check=/g)||[]).length,4);
  assert.equal((html.match(/class="challenge-status-label"/g)||[]).length,18);
  assert.ok(read('sw.js').includes('desafios-comprobacion.json?v=6.35.0'));
  assert.ok(app.includes("purpose:result.checkPhase"));
  assert.ok(!app.includes("MASTERED_FROM_SINGLE_ATTEMPT"));
  new vm.Script(engine);new vm.Script(app);
});
