'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../app-transporte/admin.js');

function files(){
  return ['Este Sudeste','Noreste','Norte','Punilla','Ruta 5','Sierras Chicas','Sur','Traslasierra'].map(name=>({name:'Cronograma '+name+'.pdf',size:1024,arrayBuffer:async()=>Buffer.from(name).buffer}));
}

test('reconoce exactamente un PDF por cada corredor',()=>{
  const result=A.classifyFiles(files());assert.equal(result.ok,true);assert.equal(result.entries.length,8);
  assert.deepEqual(result.entries.map(entry=>entry.target),['01-este-sudeste.pdf','02-noreste.pdf','03-norte.pdf','04-punilla.pdf','05-ruta-5.pdf','06-sierras-chicas.pdf','07-sur.pdf','08-traslasierra.pdf']);
});

test('rechaza faltantes, duplicados y archivos que no son PDF',()=>{
  assert.equal(A.classifyFiles(files().slice(0,7)).ok,false);
  const duplicate=files();duplicate[7]={...duplicate[7],name:'Otro Sur.pdf'};assert.match(A.classifyFiles(duplicate).errors.join(' '),/repetido|Falta/);
  const invalid=files();invalid[0]={...invalid[0],name:'Este Sudeste.docx'};assert.match(A.classifyFiles(invalid).errors.join(' '),/no es PDF/);
});

test('crea nombres de rama únicos y compatibles con el workflow',()=>{
  assert.equal(A.branchName(new Date('2026-08-31T12:34:56Z')),'actualizacion/carga-web-20260831-123456');
});

test('sube ocho blobs y crea el PR de carga al finalizar',async()=>{
  const calls=[];let blob=0;
  const fetchFn=async(url,init={})=>{
    calls.push({url,init});let payload={};
    if(url.includes('/git/ref/heads/'))payload={object:{sha:'base'}};
    else if(url.endsWith('/git/commits/base'))payload={tree:{sha:'oldtree'}};
    else if(url.includes('/git/trees/oldtree?'))payload={tree:[{path:'datos-fuente/transporte/anterior.pdf',type:'blob'}]};
    else if(url.endsWith('/git/blobs'))payload={sha:'blob-'+(++blob)};
    else if(url.endsWith('/git/trees'))payload={sha:'newtree'};
    else if(url.endsWith('/git/commits'))payload={sha:'newcommit'};
    else if(url.endsWith('/git/refs'))payload={ref:'ok'};
    else if(url.endsWith('/pulls'))payload={number:101,title:'Carga',html_url:'https://github.test/pull/101',head:{ref:'actualizacion/carga',sha:'newcommit'},base:{ref:'main'}};
    return {ok:true,status:200,json:async()=>payload};
  };
  const entries=A.classifyFiles(files()).entries,result=await A.upload({token:'test-token',entries,fetchFn});
  assert.equal(calls.filter(call=>call.url.endsWith('/git/blobs')).length,8);
  assert.equal(calls.filter(call=>call.url.endsWith('/git/refs')).length,1);
  assert.equal(calls.filter(call=>call.url.endsWith('/pulls')&&call.init.method==='POST').length,1);
  const treeCall=calls.find(call=>call.url.endsWith('/git/trees')&&call.init.method==='POST'),tree=JSON.parse(treeCall.init.body).tree;
  assert.equal(tree.filter(item=>item.sha&&item.path.endsWith('.pdf')).length,8);assert.ok(tree.some(item=>item.path.endsWith('anterior.pdf')&&item.sha===null));
  assert.match(result.branch,/^actualizacion\/carga-web-/);
  assert.equal(result.sourcePull.number,101);
});

test('fusiona un PR usando su número y SHA exactos',async()=>{
  const calls=[];
  const fetchFn=async(url,init={})=>{calls.push({url,init});return {ok:true,status:200,json:async()=>({merged:true,sha:'merge-sha'})};};
  const result=await A.mergePull({token:'test-token',number:101,sha:'head-sha',title:'Publicar',fetchFn});
  assert.equal(result.merged,true);
  assert.match(calls[0].url,/\/pulls\/101\/merge$/);
  assert.deepEqual(JSON.parse(calls[0].init.body),{sha:'head-sha',merge_method:'merge',commit_title:'Publicar'});
});

test('identifica solamente el PR de publicación posterior a la carga',()=>{
  const since=Date.parse('2026-09-18T16:00:00Z');
  const pulls=[
    {number:1,updated_at:'2026-09-18T15:00:00Z',head:{ref:'publicacion/horarios-2026-08-28'},base:{ref:'main'}},
    {number:2,updated_at:'2026-09-18T16:05:00Z',head:{ref:'mejora/interfaz'},base:{ref:'main'}},
    {number:3,updated_at:'2026-09-18T16:04:00Z',head:{ref:'publicacion/horarios-2026-09-18'},base:{ref:'main'}}
  ];
  assert.equal(A.findPublicationPull(pulls,since).number,3);
});

test('espera hasta que GitHub crea el PR validado',async()=>{
  let checks=0;
  const publication={number:202,title:'Publicar',html_url:'https://github.test/pull/202',created_at:'2026-09-18T16:01:00Z',updated_at:'2026-09-18T16:02:00Z',head:{ref:'publicacion/horarios-2026-09-18',sha:'publish-sha'},base:{ref:'main'}};
  const fetchFn=async()=>({ok:true,status:200,json:async()=>++checks===1?[]:[publication]});
  const result=await A.waitForPublication({token:'test-token',since:Date.parse('2026-09-18T16:00:00Z'),attempts:2,intervalMs:0,sleep:async()=>{},fetchFn});
  assert.equal(checks,2);
  assert.equal(result.number,202);
  assert.equal(result.head.ref,'publicacion/horarios-2026-09-18');
});

test('el workflow procesa los PDF recién después de entrar en main',()=>{
  const workflow=fs.readFileSync(path.join(__dirname,'../.github/workflows/actualizar-horarios.yml'),'utf8');
  assert.match(workflow,/push:\s*\n\s*branches:\s*\n\s*- main\s*\n\s*paths:/);
  assert.doesNotMatch(workflow,/branches:\s*\n\s*- ["']?actualizacion\/\*\*/);
});
