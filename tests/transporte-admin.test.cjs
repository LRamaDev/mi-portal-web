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


test('selecciona solo la ejecución del commit fusionado, no otra del repositorio',()=>{
  const runs=[
    {id:5,event:'push',head_branch:'main',head_sha:'otro-commit',created_at:'2026-11-12T17:20:00Z'},
    {id:4,event:'push',head_branch:'main',head_sha:'commit-carga',created_at:'2026-11-12T17:17:23Z'}
  ];
  const result=A.findRelevantRun(runs,{sourceMergeSha:'commit-carga',sourceMergedAt:'2026-11-12T17:17:20Z'});
  assert.equal(result.id,4);
  assert.equal(A.findRelevantRun(runs,{sourceMergeSha:'inexistente'}),null);
});

test('tras reintento detecta la nueva ejecución manual sin confundirla con el fallo anterior',()=>{
  const runs=[
    {id:4,event:'push',head_branch:'main',head_sha:'original',created_at:'2026-11-12T17:17:23Z'},
    {id:6,event:'workflow_dispatch',head_branch:'main',head_sha:'main-actual',created_at:'2026-11-12T18:00:03Z'}
  ];
  assert.equal(A.findRelevantRun(runs,{sourceMergeSha:'original',retryRequestedAt:'2026-11-12T18:00:00Z'}).id,6);
  assert.equal(A.findRelevantRun(runs,{sourceMergeSha:'original',retryRequestedAt:'2026-11-12T18:10:00Z'}),null);
});

test('identifica archivo, corredor, página y motivo sin duplicar errores del log',()=>{
  const log="2026-11-12T17:17:45Z ERROR: Quedaron 2 filas sin interpretar:\n"+
    "2026-11-12T17:17:45Z - 07-sur.pdf · página 4: días no reconocidos: 'LUNES, VIERNES, SÁBADO Y DOMINGO'\n"+
    "2026-11-12T17:17:45Z - 07-sur.pdf · página 8: días no reconocidos: 'LUNES, VIERNES, SÁBADO Y DOMINGO'\n"+
    "2026-11-12T17:17:45Z - 07-sur.pdf · página 4: días no reconocidos: 'LUNES, VIERNES, SÁBADO Y DOMINGO'\n";
  const details=A.parseFailureDetails(log);
  assert.equal(details.length,2);
  assert.deepEqual(details.map(x=>[x.file,x.corridor,x.page]),[['07-sur.pdf','SUR',4],['07-sur.pdf','SUR',8]]);
  assert.match(details[0].reason,/días no reconocidos/);
});

test('informa fallo sin esperar un PR, leyendo anotaciones de Actions',async()=>{
  const run={id:99,name:'Actualizar horarios interurbanos',event:'push',head_branch:'main',head_sha:'commit-carga',status:'completed',conclusion:'failure',created_at:'2026-11-12T17:17:23Z',html_url:'https://github.test/run/99'};
  const fetchFn=async(url)=>{
    let data;
    if(url.includes('/workflows/actualizar-horarios.yml/runs?'))data={workflow_runs:[run]};
    else if(url.includes('/actions/runs/99/jobs?'))data={jobs:[{id:500,conclusion:'failure',check_run_url:'https://api.github.com/repos/LRamaDev/mi-portal-web/check-runs/12345'}]};
    else if(url.includes('/check-runs/12345/annotations'))data=[{title:'Fila de cronograma sin interpretar',message:'07-sur.pdf · página 4: días no reconocidos: texto nuevo'}];
    else throw Error('Solicitud inesperada: '+url);
    return {ok:true,status:200,json:async()=>data};
  };
  const state=await A.inspectProcessing({token:'test',fetchFn,flow:{sourceMergeSha:'commit-carga'}});
  assert.equal(state.kind,'failed');assert.equal(state.run.id,99);assert.equal(state.errors[0].corridor,'SUR');
  assert.equal(state.errors[0].page,4);
});

test('solo habilita publicación cuando existe PR de la ejecución exitosa',async()=>{
  const flow={sourceMergeSha:'commit',sourceMergedAt:'2026-11-12T17:00:00Z'};
  const fetchFn=async(url)=>{
    const payload=url.includes('/workflows/actualizar-horarios.yml/runs?')?{workflow_runs:[
      {id:3,event:'push',head_branch:'main',head_sha:'commit',status:'completed',conclusion:'success',created_at:'2026-11-12T17:00:03Z'}
    ]}:url.includes('/pulls?')?[{number:146,created_at:'2026-11-12T17:01:00Z',updated_at:'2026-11-12T17:01:03Z',head:{ref:'publicacion/horarios-2026-11-06',sha:'publicacion'},base:{ref:'main'},html_url:'https://github.test/pull/146'}]:[];
    return {ok:true,status:200,json:async()=>payload};
  };
  const state=await A.inspectProcessing({token:'test',fetchFn,flow});
  assert.equal(state.kind,'ready');assert.equal(state.pull.number,146);
});

test('reintenta el workflow sin subir PDF ni fusionar publicaciones',async()=>{
  const calls=[],fetchFn=async(url,init={})=>{calls.push({url,init});return {ok:true,status:204};};
  await A.retryProcessing({token:'test',fetchFn});
  assert.equal(calls.length,1);
  assert.match(calls[0].url,/\/actions\/workflows\/actualizar-horarios\.yml\/dispatches$/);
  assert.equal(calls[0].init.method,'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body),{ref:'main',inputs:{source_branch:'main'}});
});

test('evita crear PR duplicado si los ocho PDF son idénticos',async()=>{
  let blob=0;const calls=[];
  const fetchFn=async(url,init={})=>{
    calls.push({url,init});
    let payload={};
    if(url.includes('/git/ref/heads/'))payload={object:{sha:'base'}};
    else if(url.endsWith('/git/commits/base'))payload={tree:{sha:'oldtree'}};
    else if(url.includes('/git/trees/oldtree?'))payload={tree:[]};
    else if(url.endsWith('/git/blobs'))payload={sha:'blob-'+(++blob)};
    else if(url.endsWith('/git/trees'))payload={sha:'oldtree'};
    else throw Error('No debía crear commit/PR: '+url);
    return {ok:true,status:200,json:async()=>payload};
  };
  const result=await A.upload({token:'test',entries:A.classifyFiles(files()).entries,fetchFn});
  assert.equal(result.unchanged,true);
  assert.equal(calls.filter(c=>c.url.endsWith('/pulls')).length,0);
  assert.equal(calls.filter(c=>c.url.endsWith('/git/refs')).length,0);
});


test('recupera una carga o publicación fusionada directamente desde GitHub',async()=>{
  const urls=[];
  const fetchFn=async(url)=>{
    urls.push(url);
    if(url.endsWith('/pulls/143'))return {ok:true,status:200,json:async()=>({merged_at:'2026-11-12T17:17:20Z',merge_commit_sha:'commit-fusionado'})};
    if(url.endsWith('/pulls/146'))return {ok:true,status:200,json:async()=>({merged_at:'2026-11-12T19:00:00Z'})};
    throw Error('No esperado '+url);
  };
  const state=await A.syncFlowMerges({fetchFn,flow:{sourcePull:{number:143},publicationPull:{number:146}}});
  assert.equal(state.sourceMergedAt,'2026-11-12T17:17:20Z');
  assert.equal(state.sourceMergeSha,'commit-fusionado');
  assert.equal(state.publicationMergedAt,'2026-11-12T19:00:00Z');
  assert.equal(urls.length,2);
});

test('no muestra un PR viejo si todavía no se encontró una ejecución validada',async()=>{
  const flow={sourceMergeSha:'commit-pendiente',sourceMergedAt:'2026-11-12T17:00:00Z'};
  const fetchFn=async(url)=>{
    const payload=url.includes('/workflows/actualizar-horarios.yml/runs?')?{workflow_runs:[]}:url.includes('/pulls?')?[{number:146,created_at:'2026-11-12T17:01:00Z',updated_at:'2026-11-12T17:01:03Z',head:{ref:'publicacion/horarios-2026-11-06'},base:{ref:'main'}}]:[];
    return {ok:true,status:200,json:async()=>payload};
  };
  const state=await A.inspectProcessing({fetchFn,flow});
  assert.equal(state.kind,'running');
});

test('consulta GitHub públicamente si el token no tiene permiso de lectura de Actions',async()=>{
  const headers=[];
  const fetchFn=async(url,init={})=>{
    if(url.includes('/workflows/actualizar-horarios.yml/runs?')){
      headers.push(init.headers||{});
      if(init.headers&&init.headers.Authorization)return {ok:false,status:403,json:async()=>({message:'Resource not accessible by personal access token'})};
      return {ok:true,status:200,json:async()=>({workflow_runs:[{id:1,event:'push',head_branch:'main',head_sha:'sha1',status:'in_progress',created_at:'2026-11-12T17:00:05Z'}]})};
    }
    throw Error('No esperaba '+url);
  };
  const state=await A.inspectProcessing({token:'sin-actions-read',fetchFn,flow:{sourceMergeSha:'sha1'}});
  assert.equal(state.kind,'running');
  assert.equal(headers.length,2);
  assert.equal(headers[1].Authorization,undefined);
});
