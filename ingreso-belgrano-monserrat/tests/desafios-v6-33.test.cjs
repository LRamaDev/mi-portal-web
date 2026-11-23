'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const model=JSON.parse(read('data/desafios-modelo.json'));
const orth=JSON.parse(read('data/desafios-ortografia.json'));
const engine=read('desafios-fracciones.js');
const app=read('app.js');
const html=read('index.html');
const appVersion=html.match(/app-version" content="(6\.\d+\.\d+)"/)?.[1];
const allMath=Object.values(model.blocks).flatMap(b=>Object.values(b.rounds).flat());
const allLang=Object.values(orth.blocks).flatMap(b=>['A','B','C','D','E','F'].flatMap(r=>b[r]||[]));

test('se agregan 70 ejercicios nuevos, todos diferentes, sin borrar las 168 actividades anteriores',()=>{
  assert.ok(allMath.length>=98);
  assert.ok(allLang.length>=140);
  assert.equal(new Set([...allMath,...allLang].map(t=>t.id)).size,allMath.length+allLang.length);
  const expectedCounts={C:{C:7},F:{C:7},D:{A:7,B:7},E:{A:7,B:7}};
  for(const [block,rounds] of Object.entries(expectedCounts)){
    for(const [round,n] of Object.entries(rounds)){
      const arr=model.blocks[block].rounds[round];assert.equal(arr.length,n,block+round);
      for(const t of arr) {
        assert.equal(t.block,block);assert.equal(t.round,round);
        assert.equal(t.hints.length,2);assert.equal(t.steps.length,3);
        assert.ok(['MAT-CIRC','MAT-FR-ORD','MAT-DEC-OPS','MAT-FR-DEC'].includes(t.skill));
      }
    }
  }
  for(const round of ['A','B']){
    const arr=orth.blocks.P[round];assert.equal(arr.length,7);
    for(const t of arr){assert.equal(t.kind,'orth-choice');assert.ok(t.options.includes(t.expected));
      assert.ok(['LEN-PUNT','LEN-SUJ-PRED'].includes(t.skill));}
  }
});
test('verificación independiente de resultados numéricos, de fracciones y comparaciones',()=>{
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  for(const t of allMath) {
    if(t.kind==='model-fraction'){
      const [n,d]=t.expected;
      assert.equal(gcd(n,d),1,t.id);
      // Cada decimal de estas tareas aparece en el título o la consigna.
      const decimal=Number((t.prompt.match(/\d+[,.]\d+/)||[])[0]?.replace(',','.'));
      assert.ok(Number.isFinite(decimal)&&Math.abs(n/d-decimal)<1e-8,t.id);
    }
    if(t.kind==='circle-number'){
      const d=t.givenKind==='radio'?t.given*2:t.given;
      const expected=t.ask==='radio'?d/2:t.ask==='diametro'?d:Number((d*3.14).toFixed(2));
      assert.equal(t.expected,expected,t.id);
    }
    if(t.kind==='fraction-compare'){
      const sign=Math.sign(t.left[0]*t.right[1]-t.right[0]*t.left[1]);
      assert.equal(t.expected,sign>0?'>':sign<0?'<':'=',t.id);
    }
    if(t.kind==='fraction-order'){
      const expected=[...t.fractions.keys()].sort((a,b)=>t.fractions[b][0]/t.fractions[b][1]-t.fractions[a][0]/t.fractions[a][1]);
      assert.deepEqual(t.expected,expected,t.id);
    }
  }
  const decimals=model.blocks.D.rounds.A.concat(model.blocks.D.rounds.B);
  assert.equal(decimals.length,14);
  assert.ok(decimals.every(t=>Number.isFinite(t.expected)));
});
function makeEngine(){
  const nodes=new Map();
  function node(id){if(!nodes.has(id))nodes.set(id,{
    value:'',textContent:'',innerHTML:'',disabled:false,hidden:false,onclick:null,dataset:{},
    addEventListener(){},setAttribute(){},classList:{toggle(){},add(){},remove(){}}
  });return nodes.get(id);}
  const dialog={open:false,showModal(){this.open=true},close(){this.open=false},addEventListener(){}};
  const surface={innerHTML:'',querySelector:node,querySelectorAll(){return []}};
  const document={
    getElementById:id=>id==='fraction-challenge-dialog'?dialog:id==='fraction-challenge-content'?surface:node(id),
    querySelector:sel=>sel==='meta[name="app-version"]'?{content:appVersion}:null
  };
  const sources={
    './data/desafios-modelo.json':model,
    './data/desafios-ortografia.json':orth,
    './data/desafios-fracciones.json':JSON.parse(read('data/desafios-fracciones.json'))
  };
  const fetch=async url=>({ok:Boolean(sources[String(url).split('?')[0]]),json:async()=>sources[String(url).split('?')[0]]});
  const marker='  window.IngresoFractionChallenges={open,close};';
  assert.ok(engine.includes(marker));
  const instrument=marker+'\n  window.__testing={'+
    'evaluate:(i,choice,selection,value)=>{session.index=i;session.choice=choice;session.selection=new Set(selection||[]);'+
    "app.querySelector('#fraction-ans1').value=String(value??'');return evaluate(session.tasks[i]);},"
    +'render:i=>{session.index=i;showTask();return app.innerHTML;}};';
  const window={};
  vm.runInNewContext(engine.replace(marker,instrument),{window,document,fetch,Date,console});
  return {window,dialog,surface};
}
function inputs(t){
  switch(t.kind){
    case 'model-decimal':return [[null,[],String(t.expected).replace('.',',')],[null,[],String(t.expected+1)]];
    case 'model-fraction':return [[null,[],t.expected.join('/')],[null,[],(t.expected[0]*2)+'/'+(t.expected[1]*2)]];
    case 'circle-number':return [[null,[],String(t.expected).replace('.',',')],[null,[],String(t.expected+1)]];
    case 'fraction-compare':{
      const options=['<','>','='],good=options.indexOf(t.expected);
      return [[good,[],null],[(good+1)%3,[],null]];
    }
    case 'fraction-order':return [[null,t.expected,null],[null,[...t.expected].reverse(),null]];
    case 'fraction-between':return [[null,[],t.lower[0]===2?'9/20':'4/5'],[null,[],t.lower.join('/')]];
    case 'orth-choice':return [[t.options.indexOf(t.expected),[],null],[(t.options.indexOf(t.expected)+1)%4,[],null]];
    case 'orth-fill':return [[null,[],t.expected],[null,[],'x']];
    case 'orth-diacritic-write':return [[null,[],t.expected],[null,[],t.alternate]];
    default:throw new Error('no sample for '+t.kind);
  }
}
test('el motor abre y corrige todos los 70 nuevos ejercicios',async()=>{
  const {window,dialog,surface}=makeEngine();let count=0;
  for(const [block,rounds] of [['C',['C']],['F',['C']],['D',['A','B']],['E',['A','B']]]){
    for(const round of rounds){
      await window.IngresoFractionChallenges.open({block,round});
      assert.equal(dialog.open,true,block+round);
      assert.match(surface.innerHTML,/Desafío 1 de 7/);
      for(let i=0;i<7;i++){
        const task=model.blocks[block].rounds[round][i];
        const [right,wrong]=inputs(task);
        const pass=window.__testing.evaluate(i,...right);
        assert.equal(pass.valid,true,task.id+' valid');
        assert.equal(pass.correct,true,task.id+' correct');
        const fail=window.__testing.evaluate(i,...wrong);
        assert.notEqual(fail.correct,true,task.id+' rejected incorrect');
        count++;
      }
      window.IngresoFractionChallenges.close();
    }
  }
  for(const [orthographyBlock,rounds] of [['P',['A','B']],['J',['E']],['T',['E']]])for(const round of rounds){
    await window.IngresoFractionChallenges.open({orthographyBlock,round});
    assert.equal(dialog.open,true,orthographyBlock+round);
    for(let i=0;i<7;i++){
      const task=orth.blocks[orthographyBlock][round][i],[right,wrong]=inputs(task);
      assert.equal(window.__testing.evaluate(i,...right).correct,true,task.id);
      assert.notEqual(window.__testing.evaluate(i,...wrong).correct,true,task.id);
      assert.match(window.__testing.render(i),orthographyBlock==='P'?/orthography-option/:/fraction-ans1/);
      count++;
    }
    window.IngresoFractionChallenges.close();
  }
  assert.equal(count,70);
});
test('versionado de PWA y tarjetas visibles, sin bloquear las anteriores',()=>{
  assert.ok(appVersion,'app version missing');
  assert.equal((html.match(/data-start-model=/g)||[]).length,6);
  assert.equal((html.match(/data-start-ortho=/g)||[]).length,7);
  for(const block of ['R','P','C','F','D','E'])assert.match(html,new RegExp('data-start-model="'+block+'"'));
  assert.match(html,/data-start-ortho="P"/);
  const sw=read('sw.js');
  assert.match(sw,/const CACHE='ingreso-bm-v\d+-\d+-[^']+';/);
  assert.ok(sw.includes("const VERSION='"+appVersion+"'"));
  assert.ok(sw.includes('desafios-modelo.json?v='+appVersion));
  assert.ok(sw.includes('desafios-ortografia.json?v='+appVersion));
  new vm.Script(engine);new vm.Script(app);new vm.Script(sw);
});
