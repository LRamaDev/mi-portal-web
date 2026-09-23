const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.join(__dirname,'ingreso-belgrano-monserrat');
const base=JSON.parse(fs.readFileSync(path.join(root,'data/ejercicios.json')));
const skills=JSON.parse(fs.readFileSync(path.join(root,'data/habilidades.json'))).habilidades;
const context={window:{fetch:async()=>new Response(JSON.stringify(base))},document:{addEventListener:()=>{}},Response,console};
vm.createContext(context);
for(const f of ['config.js','banco-v4.js','banco-v5.js','banco-v6.js','banco-v6-10.js','banco-v6-11.js','testeo.js']) if(fs.existsSync(path.join(root,f))) vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
context.window.fetch('./data/ejercicios.json').then(r=>r.json()).then(data=>{
const es=data.ejercicios, counts=new Map(skills.map(s=>[s.id,0]));
for(const e of es) counts.set(e.habilidad,(counts.get(e.habilidad)||0)+1);
const duplicated=es.map(e=>e.id).filter((id,i)=>es.findIndex(x=>x.id===id)!==i);
const invalid=es.filter(e=>
  !counts.has(e.habilidad)||
  e.area!==skills.find(s=>s.id===e.habilidad)?.area||
  !Array.isArray(e.colegios)||!e.colegios.length||
  !Number.isInteger(e.dificultad)||e.dificultad<1||e.dificultad>4||
  !String(e.consigna||'').trim()||!e.pista||!e.explicacion||
  e.tipo==='choice'&&(!Array.isArray(e.opciones)||e.opciones.length<3||!e.opciones.includes(e.respuesta)||new Set(e.opciones).size!==e.opciones.length)||
  e.tipo==='input'&&!String(e.respuesta??'').trim()||
  e.tipo==='selfcheck'&&(!Array.isArray(e.criterios)||e.criterios.length<4)
).map(e=>e.id);
const longWriting=es.filter(e=>e.tipo==='selfcheck' && /\d+\s*(?:a|-|y)\s*\d+\s*renglones/i.test(e.consigna)).map(e=>e.id);
console.log('Ejercicios activos:',es.length,'por tipo:',Object.fromEntries(['choice','input','selfcheck'].map(t=>[t,es.filter(e=>e.tipo===t).length])));
console.log('Cobertura mínima:', [...counts].sort((a,b)=>a[1]-b[1]).slice(0,10));
console.log('Duplicados:',duplicated,'incompletos:',invalid,'escritura larga:',longWriting);
if(duplicated.length||invalid.length||longWriting.length||es.length!==476) process.exitCode=1;
});
