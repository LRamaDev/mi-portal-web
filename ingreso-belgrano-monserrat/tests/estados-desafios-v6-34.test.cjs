'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('app.js');
const html=read('index.html');
const css=read('desafios-fracciones.css');
const sw=read('sw.js');

test('13 tarjetas muestran badge textual y colores contrastados para todos los estados',()=>{
  assert.equal((html.match(/class="challenge-status-label"/g)||[]).length,18);
  assert.ok(html.includes('id="challenge-overview"'));
  for(const name of ['Nuevos desafíos','En curso','Por hacer','Completado'])
    assert.ok(html.includes(name),name);
  for(const key of ['new','active','pending','completed','locked'])
    assert.ok(css.includes('[data-challenge-state="'+key+'"]'),key);
  const version=html.match(/app-version" content="(6\.\d+\.\d+)"/)?.[1];
  assert.ok(version);
  assert.ok(sw.includes("const VERSION='"+version+"'"));
  assert.match(sw,/const CACHE='ingreso-bm-v\d+-\d+-[^']+';/);
  new vm.Script(app,{filename:'app.js'});
  new vm.Script(read('desafios-fracciones.js'),{filename:'desafios-fracciones.js'});
});

function setup(){
  const cards=[];
  const list=[
    ['fraction',null],['model','R'],['model','P'],['model','C'],
    ['model','F'],['model','D'],['model','E'],
    ['ortho','D'],['ortho','J'],['ortho','B'],['ortho','A'],['ortho','T'],['ortho','P']
  ];
  for(const [type,key] of list){
    const button={
      textContent:'Empezar',title:'',disabled:false,dataset:{
        ...(type==='model'?{startModel:key}:{}),
        ...(type==='ortho'?{startOrtho:key}:{})
      }
    };
    const badge={textContent:'Por hacer'};
    const card={
      dataset:{},
      querySelector(sel){
        if(sel==='.challenge-status-label')return badge;
        if(sel==='[data-start-fractions], [data-start-model], [data-start-ortho]')return button;
        return null;
      }
    };
    const label={
      textContent:'',dataset:{
        ...(type==='model'?{modelStatus:key}:{}),
        ...(type==='ortho'?{orthoStatus:key}:{})
      },
      closest(sel){return sel==='.challenge-hub-card'?card:null;}
    };
    cards.push({type,key,button,badge,card,label});
  }
  const selected=(type)=>cards.filter(c=>c.type===type);
  const overview={textContent:''};
  const document={
    addEventListener(){},
    querySelector(selector){return selector==='#challenge-overview'?overview:null;},
    querySelectorAll(selector){
      const map={
        '[data-fraction-status]':selected('fraction').map(x=>x.label),
        '[data-start-fractions]':selected('fraction').map(x=>x.button),
        '[data-model-status]':selected('model').map(x=>x.label),
        '[data-start-model]':selected('model').map(x=>x.button),
        '[data-ortho-status]':selected('ortho').map(x=>x.label),
        '[data-start-ortho]':selected('ortho').map(x=>x.button),
        '.challenge-hub-card[data-challenge-state]':cards.filter(x=>x.card.dataset.challengeState).map(x=>x.card)
      };
      return map[selector]||[];
    }
  };
  const profile=()=>({name:'Perfil',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0});
  const initial={profiles:{p1:profile(),p2:profile()}};
  const p1=initial.profiles.p1;
  for(const round of ['A','B','C','D','E','F','G','H'])
    p1.history.push({type:'desafios_fracciones',roundId:round});
  for(const round of ['A','B'])
    p1.history.push({type:'desafios_modelo',blockId:'C',roundId:round});
  p1.history.push({type:'desafios_modelo',blockId:'P',roundId:'A'});
  p1.evidence.push({exerciseId:'MB26-P-B-01',correct:true,hintUsed:false});
  for(const round of ['A','B','C','D','E'])
    p1.history.push({type:'desafios_ortografia',orthographyBlockId:'J',roundId:round});
  for(const round of ['A','B'])
    p1.history.push({type:'desafios_ortografia',orthographyBlockId:'A',roundId:round});
  const localStorage={
    getItem:key=>key==='ingreso-belgrano-monserrat-v1'?JSON.stringify(initial):null,
    setItem(){},removeItem(){}
  };
  const window={addEventListener(){},INGRESO_ACCESS_MODE:'family'};
  const hook=[
    '  window.__challengeColorTest={',
    '    mode:m=>{activeMode=m;},',
    '    refresh:refreshChallengeIndicators,',
    '    profiles:()=>state.profiles',
    '  };',
    '  function startRecommended() {'
  ].join('\n');
  const marker='  function startRecommended() {';
  assert.ok(app.includes(marker));
  vm.runInNewContext(app.replace(marker,hook),{window,document,localStorage,console});
  return {cards,overview,tool:window.__challengeColorTest};
}

function get(t,type,key=null){
  const card=t.cards.find(x=>x.type===type&&x.key===key);
  assert.ok(card,'missing '+type+' '+key);
  return card;
}
test('completado, nuevo, en curso y pendiente se distinguen en un mismo perfil',()=>{
  const t=setup();t.tool.mode('p1');t.tool.refresh();
  assert.equal(get(t,'fraction').card.dataset.challengeState,'completed');
  assert.equal(get(t,'fraction').badge.textContent,'Completado');
  assert.equal(get(t,'fraction').button.disabled,true);
  const newCircle=get(t,'model','C');
  assert.equal(newCircle.card.dataset.challengeState,'new');
  assert.equal(newCircle.badge.textContent,'Nuevos desafíos');
  assert.match(newCircle.label.textContent,/2 de 4 circuitos completados/);
  assert.match(newCircle.button.textContent,/Hacer nuevos desafíos/);
  assert.equal(newCircle.button.disabled,false);
  const active=get(t,'model','P');
  assert.equal(active.card.dataset.challengeState,'active');
  assert.match(active.button.textContent,/Continuar circuito B/);
  assert.equal(get(t,'model','R').card.dataset.challengeState,'pending');
  assert.equal(get(t,'ortho','J').card.dataset.challengeState,'reinforce');
  assert.equal(get(t,'ortho','A').card.dataset.challengeState,'reinforce');
  assert.match(t.overview.textContent,/con desafíos nuevos/);
});

test('al sumar un ejercicio pendiente pasa a en curso; al terminar el nuevo circuito pasa a completado',()=>{
  const t=setup();t.tool.mode('p1');t.tool.refresh();
  t.tool.profiles().p1.evidence.push({exerciseId:'MB26-C-C-01',correct:false,hintUsed:true});
  t.tool.refresh();
  assert.equal(get(t,'model','C').card.dataset.challengeState,'active');
  t.tool.profiles().p1.history.push({type:'desafios_modelo',blockId:'C',roundId:'C'});
  t.tool.profiles().p1.history.push({type:'desafios_modelo',blockId:'C',roundId:'D'});
  t.tool.refresh();
  assert.equal(get(t,'model','C').card.dataset.challengeState,'completed');
  assert.equal(get(t,'model','C').button.disabled,true);
});

test('los estados son individuales y el modo juntas no revela historiales',()=>{
  const t=setup();t.tool.mode('p1');t.tool.refresh();
  assert.equal(get(t,'ortho','A').card.dataset.challengeState,'reinforce');
  t.tool.mode('p2');t.tool.refresh();
  assert.equal(get(t,'ortho','A').card.dataset.challengeState,'pending');
  assert.equal(get(t,'fraction').card.dataset.challengeState,'pending');
  t.tool.mode('together');t.tool.refresh();
  assert.ok(t.cards.every(x=>x.card.dataset.challengeState==='locked'));
  assert.ok(t.cards.every(x=>x.button.disabled));
  assert.match(t.overview.textContent,/perfil individual/);
});
