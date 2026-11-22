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
  assert.equal(model.length,56);assert.equal(language.length,112);
  assert.equal(new Set([...model,...language].map(x=>x.id)).size,168);
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
    querySelector:q=>q==='meta[name="app-version"]'?{content:'6.32.0'}:null
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
  assert.equal((html.match(/data-start-model=/g)||[]).length,4);
  assert.equal((html.match(/data-start-ortho=/g)||[]).length,5);
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
