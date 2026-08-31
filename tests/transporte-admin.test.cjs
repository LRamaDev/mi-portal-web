'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
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

test('sube ocho blobs y crea una sola rama al finalizar',async()=>{
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
    return {ok:true,status:200,json:async()=>payload};
  };
  const entries=A.classifyFiles(files()).entries,result=await A.upload({token:'test-token',entries,fetchFn});
  assert.equal(calls.filter(call=>call.url.endsWith('/git/blobs')).length,8);
  assert.equal(calls.filter(call=>call.url.endsWith('/git/refs')).length,1);
  const treeCall=calls.find(call=>call.url.endsWith('/git/trees')&&call.init.method==='POST'),tree=JSON.parse(treeCall.init.body).tree;
  assert.equal(tree.filter(item=>item.sha&&item.path.endsWith('.pdf')).length,8);assert.ok(tree.some(item=>item.path.endsWith('anterior.pdf')&&item.sha===null));
  assert.match(result.branch,/^actualizacion\/carga-web-/);
});
