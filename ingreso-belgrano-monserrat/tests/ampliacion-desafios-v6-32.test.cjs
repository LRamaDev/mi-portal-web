'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const file=x=>fs.readFileSync(path.join(root,x),'utf8');
const bank=JSON.parse(file('data/desafios-modelo.json'));
const ortho=JSON.parse(file('data/desafios-ortografia.json'));
const engine=file('desafios-fracciones.js');
const app=file('app.js');
const html=file('index.html');

test('la ampliación tiene 28 ejercicios nuevos de Matemática y 42 adicionales de Ortografía',()=>{
  for(const block of ['C','F'])for(const round of ['A','B']){
    assert.equal(bank.blocks[block].rounds[round].length,7,block+round);
  }
  for(const block of ['J','A','T'])for(const round of ['C','D']){
    assert.equal(ortho.blocks[block][round].length,7,block+round);
  }
  const model=Object.values(bank.blocks).flatMap(b=>Object.values(b.rounds).flat());
  const language=Object.values(ortho.blocks).flatMap(b=>['A','B','C','D'].flatMap(k=>b[k]||[]));
  assert.equal(model.length,98);assert.equal(language.length,126);
  assert.equal(new Set([...model,...language].map(x=>x.id)).size,224);
  const skill={C:'MAT-CIRC',F:'MAT-FR-ORD'};
  for(const block of ['C','F'])for(const round of ['A','B'])for(const task of bank.blocks[block].rounds[round]){
    assert.equal(task.skill,skill[block],task.id);
    assert.equal(task.hints.length,2,task.id);
    assert.equal(task.steps.length,3,task.id);
    if(task.kind==='circle-number'){
      const diameter=task.givenKind==='radio'?task.given*2:task.given;
      const calculated=task.ask==='radio'?diameter/2:task.ask==='diametro'?diameter:Math.round(diameter*3.14*100)/100;
      assert.equal(calculated,task.expected,task.id);
    }
    if(task.kind==='fraction-compare'){
      const a=task.left,b=task.right;
      const cmp=Math.sign(a[0]*b[1]-b[0]*a[1]);
      assert.equal(cmp<0?'<':cmp>0?'>':'=',task.expected,task.id);
    }
    if(task.kind==='fraction-order'){
      const numbers=task.fractions.map(f=>f[0]/f[1]);
      const order=[...numbers.keys()].sort((x,y)=>numbers[y]-numbers[x]);
      assert.deepEqual(order,task.expected,task.id);
    }
  }
});

function engineMock(){
  const nodes=new Map();
  function node(key){
    if(!nodes.has(key))nodes.set(key,{
      value:'',hidden:false,disabled:false,innerHTML:'',textContent:'',onclick:null,dataset:{},
      addEventListener(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}}
    });
    return nodes.get(key);
  }
  const dialog={open:false,showModal(){this.open=true},close(){this.open=false},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return []}};
  const document={
    getElementById:id=>id==='fraction-challenge-dialog'?dialog:
      id==='fraction-challenge-content'?surface:node(id),
    querySelector:q=>q==='meta[name="app-version"]'?{content:'6.33.0'}:null
  };
  const sources={'./data/desafios-modelo.json':bank,'./data/desafios-ortografia.json':ortho,
    './data/desafios-fracciones.json':JSON.parse(file('data/desafios-fracciones.json'))};
  const fetch=async uri=>({ok:Boolean(sources[String(uri).split('?')[0]]),
    json:async()=>sources[String(uri).split('?')[0]]});
  const anchor='  window.IngresoFractionChallenges={open,close};';
  assert.ok(engine.includes(anchor));
  const testing=[
    '  window.IngresoFractionChallenges={open,close};',
    '  window.__expandedTest={',
    '    evaluate:(index,choice,selection,value)=>{',
    '      session.index=index;session.choice=choice;session.selection=new Set(selection||[]);',
    "      app.querySelector('#fraction-ans1').value=String(value??'');",
    '      return evaluate(session.tasks[index]);',
    '    },',
    '    render:index=>{session.index=index;showTask();return app.innerHTML;}',
    '  };'
  ].join('\n');
  const window={};
  vm.runInNewContext(engine.replace(anchor,testing),{window,document,fetch,Date,console});
  return {window,dialog,surface,node};
}
const cparts=['centro','radio','diametro','cuerda','arco','circunferencia'];
function answer(t){
  if(t.kind==='circle-pick'){
    const right=cparts.indexOf(t.target);return [[right,[],null],[(right+1)%6,[],null]];
  }
  if(t.kind==='circle-number')return [
    [null,[],String(t.expected).replace('.',',')],
    [null,[],String(t.expected+1)]
  ];
  if(t.kind==='fraction-compare'){
    const signs=['<','>','='],right=signs.indexOf(t.expected);
    return [[right,[],null],[(right+1)%3,[],null]];
  }
  if(t.kind==='fraction-order')return [
    [null,t.expected,null],
    [null,[...t.expected].reverse(),null]
  ];
  if(t.kind==='fraction-between'){
    const [a,b]=t.lower,[c,d]=t.upper;
    return [[null,[],String(a*d+c*b)+'/'+(2*b*d)],[null,[],a+'/'+b]];
  }
  throw new Error('Not handled '+t.kind);
}

test('el motor abre y corrige 28 ejercicios nuevos, incluidos los decimales con coma',async()=>{
  const {window,dialog,surface}=engineMock();let checks=0;
  for(const block of ['C','F'])for(const round of ['A','B']){
    await window.IngresoFractionChallenges.open({block,round});
    assert.equal(dialog.open,true);
    assert.match(surface.innerHTML,/Desafío 1 de 7/);
    for(let i=0;i<7;i++){
      const t=bank.blocks[block].rounds[round][i],a=answer(t);
      const pass=window.__expandedTest.evaluate(i,...a[0]);
      assert.equal(pass.valid,true,t.id+' good incomplete');
      assert.equal(pass.correct,true,t.id+' good');
      const fail=window.__expandedTest.evaluate(i,...a[1]);
      assert.notEqual(fail.correct,true,t.id+' invalid accepted');
      if(t.kind==='circle-pick')assert.match(window.__expandedTest.render(i),/circle-pick-grid/);
      if(t.kind==='fraction-order')assert.match(window.__expandedTest.render(i),/data-fraction-cell/);
      checks++;
    }
    window.IngresoFractionChallenges.close();
  }
  assert.equal(checks,28);
});

test('versión, menú y datos en caché; mantienen los accesos previos',()=>{
  assert.equal((html.match(/data-start-model=/g)||[]).length,6);
  assert.equal((html.match(/data-start-ortho=/g)||[]).length,6);
  assert.equal((html.match(/data-start-fractions(?=[ >])/g)||[]).length,1);
  assert.match(html,/app-version" content="6\.32\.0"/);
  const sw=file('sw.js');
  assert.match(sw,/desafios-modelo\.json\?v=6\.32\.0/);
  assert.match(sw,/desafios-ortografia\.json\?v=6\.32\.0/);
  new vm.Script(engine);new vm.Script(app);new vm.Script(sw);
});

test('se conserva el módulo de fracciones y el de representaciones',async()=>{
  const {window,surface}=engineMock();
  await window.IngresoFractionChallenges.open({round:'A'});
  assert.match(surface.innerHTML,/Dos mosaicos circulares/);
  window.IngresoFractionChallenges.close();
  await window.IngresoFractionChallenges.open({block:'R',round:'A'});
  assert.match(surface.innerHTML,/Reconocer lo sombreado/);
  window.IngresoFractionChallenges.close();
});


test('al completar A/B en G/J y acentuación se habilita C, sin mezclar los perfiles',()=>{
  const listeners=new Map(),nodes=new Map();
  function node(k){
    if(!nodes.has(k))nodes.set(k,{
      textContent:'',title:'',disabled:false,dataset:{},
      addEventListener(){},classList:{add(){},remove(){},toggle(){}},
      hasAttribute(attr){return attr==='data-start-ortho'&&Boolean(this.dataset.startOrtho);}
    });
    return nodes.get(k);
  }
  const labels=['J','A','T','D','B'].map(k=>{const n=node('status'+k);n.dataset.orthoStatus=k;return n});
  const btns=['J','A','T','D','B'].map(k=>{const n=node('btn'+k);n.dataset.startOrtho=k;return n});
  const modelLabels=['R','P','C','F'].map(k=>{const n=node('mstatus'+k);n.dataset.modelStatus=k;return n});
  const modelBtns=['R','P','C','F'].map(k=>{const n=node('mbtn'+k);n.dataset.startModel=k;return n});
  const document={
    addEventListener(type,callback){
      if(!listeners.has(type))listeners.set(type,[]);
      listeners.get(type).push(callback);
    },
    querySelector:node,
    querySelectorAll(sel){
      if(sel==='[data-ortho-status]')return labels;
      if(sel==='[data-start-ortho]')return btns;
      if(sel==='[data-model-status]')return modelLabels;
      if(sel==='[data-start-model]')return modelBtns;
      return [];
    }
  };
  const makeProfile=()=>({name:'Perfil',history:[],evidence:[],progress:{},pendingEvidence:[],sessions:0});
  const initial={profiles:{p1:makeProfile(),p2:makeProfile()}};
  for(const round of ['A','B'])for(const block of ['J','A','T']){
    initial.profiles.p1.history.push({
      type:'desafios_ortografia',orthographyBlockId:block,roundId:round,at:1
    });
  }
  for(const round of ['A','B'])initial.profiles.p1.history.push({
    type:'desafios_ortografia',orthographyBlockId:'D',roundId:round,at:1
  });
  const localStorage={
    getItem:key=>key==='ingreso-belgrano-monserrat-v1'?JSON.stringify(initial):null,
    setItem(){},removeItem(){}
  };
  const opens=[];
  const window={
    addEventListener(){}, INGRESO_ACCESS_MODE:'family',
    IngresoFractionChallenges:{open:async args=>opens.push({
      block:args.block||null,orthographyBlock:args.orthographyBlock||null,
      round:args.round
    })}
  };
  const anchor='  function startRecommended() {';
  assert.ok(app.includes(anchor));
  const instrument=[
    '  window.__roundTest={',
    '    setMode:m=>{activeMode=m;},',
    '    model:renderModelEntries,',
    '    ortho:renderOrthographyEntries,',
    '    complete:(pid,b,r)=>state.profiles[pid].history.push({',
    "       type:'desafios_ortografia',orthographyBlockId:b,roundId:r,at:1",
    '    })',
    '  };',
    anchor
  ].join('\n');
  vm.runInNewContext(app.replace(anchor,instrument),{window,document,localStorage,console});
  const testApp=window.__roundTest;
  function click(btn){
    for(const callback of listeners.get('click')||[]){
      callback({target:{closest:()=>btn},preventDefault(){}});
    }
  }
  testApp.setMode('p1');testApp.ortho();testApp.model();
  for(const b of ['J','A','T']) {
    const btn=node('btn'+b);
    assert.equal(btn.disabled,false,b);
    click(btn);
    assert.equal(opens.at(-1).round,'C',b);
  }
  assert.equal(node('btnD').disabled,true,'Diptongo has only A/B');
  click(node('mbtnC'));assert.deepEqual(opens.at(-1),{
    block:'C',orthographyBlock:null,round:'A'
  });
  click(node('mbtnF'));assert.equal(opens.at(-1).round,'A');
  testApp.complete('p1','J','C');testApp.ortho();click(node('btnJ'));
  assert.equal(opens.at(-1).round,'D');
  testApp.setMode('p2');testApp.ortho();click(node('btnJ'));
  assert.equal(opens.at(-1).round,'A');
  testApp.setMode('together');testApp.ortho();testApp.model();
  assert.equal(btns.every(btn=>btn.disabled),true);
  assert.equal(modelBtns.every(btn=>btn.disabled),true);
});
