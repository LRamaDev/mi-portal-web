(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TransportAdmin = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var OWNER = 'LRamaDev', REPOSITORY = 'mi-portal-web', BASE_BRANCH = 'main';
  var MAX_BYTES = 25 * 1024 * 1024;
  var FLOW_KEY = 'ersep-transporte-admin-flow-v2';
  var CORRIDORS = [
    { id:'ESTE-SUDESTE', file:'01-este-sudeste.pdf', match:function(n){return n.indexOf('ESTE')!==-1&&n.indexOf('SUDESTE')!==-1;} },
    { id:'NORESTE', file:'02-noreste.pdf', match:function(n){return n.indexOf('NORESTE')!==-1;} },
    { id:'NORTE', file:'03-norte.pdf', match:function(n){return n.indexOf('NORTE')!==-1&&n.indexOf('NORESTE')===-1;} },
    { id:'PUNILLA', file:'04-punilla.pdf', match:function(n){return n.indexOf('PUNILLA')!==-1;} },
    { id:'RUTA 5', file:'05-ruta-5.pdf', match:function(n){return /RUTA\s*5\b/.test(n);} },
    { id:'SIERRAS CHICAS', file:'06-sierras-chicas.pdf', match:function(n){return n.indexOf('SIERRAS CHICAS')!==-1;} },
    { id:'SUR', file:'07-sur.pdf', match:function(n){return /\bSUR\b/.test(n)&&n.indexOf('SUDESTE')===-1;} },
    { id:'TRASLASIERRA', file:'08-traslasierra.pdf', match:function(n){return n.indexOf('TRASLASIERRA')!==-1;} }
  ];
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
  }
  function classifyFiles(files) {
    var entries=[], errors=[], seen=new Set();
    Array.from(files || []).forEach(function(file){
      var name=normalize(file.name), matches=CORRIDORS.filter(function(c){return c.match(name);});
      if(!/\.PDF$/i.test(file.name||''))errors.push((file.name||'Archivo')+': no es PDF.');
      else if(file.size>MAX_BYTES)errors.push(file.name+': supera 25 MB.');
      else if(matches.length!==1)errors.push(file.name+': no se pudo reconocer un único corredor.');
      else if(seen.has(matches[0].id))errors.push(file.name+': el corredor '+matches[0].id+' está repetido.');
      else{seen.add(matches[0].id);entries.push({corridor:matches[0].id,target:matches[0].file,file:file});}
    });
    CORRIDORS.forEach(function(c){if(!seen.has(c.id))errors.push('Falta el PDF de '+c.id+'.');});
    if(Array.from(files||[]).length!==8)errors.unshift('Debés elegir exactamente ocho PDF.');
    entries.sort(function(a,b){return a.target.localeCompare(b.target);});
    return {ok:errors.length===0,entries:entries,errors:Array.from(new Set(errors))};
  }
  function branchName(now) {
    now=now||new Date();
    function p(n){return String(n).padStart(2,'0');}
    return 'actualizacion/carga-web-'+now.getUTCFullYear()+p(now.getUTCMonth()+1)+p(now.getUTCDate())+'-'+p(now.getUTCHours())+p(now.getUTCMinutes())+p(now.getUTCSeconds());
  }
  function base64(buffer) {
    var bytes=new Uint8Array(buffer),binary='',step=0x8000;
    for(var i=0;i<bytes.length;i+=step)binary+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+step,bytes.length)));
    return btoa(binary);
  }
  function githubClient(token, fetchFn) {
    var api='https://api.github.com/repos/'+OWNER+'/'+REPOSITORY;
    fetchFn=fetchFn||fetch;
    async function request(path,init){
      init=init||{};
      init.headers=Object.assign({'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},init.headers||{});
      var response=await fetchFn(api+path,init),payload=null;
      if(response.status!==204){try{payload=await response.json();}catch(error){}}
      if(!response.ok)throw new Error((payload&&payload.message)||('GitHub respondió '+response.status));
      return payload;
    }
    return {request:request};
  }
  function compactPull(pull) {
    if(!pull)return null;
    return {number:pull.number,title:pull.title,html_url:pull.html_url,head:{ref:pull.head&&pull.head.ref,sha:pull.head&&pull.head.sha},base:{ref:pull.base&&pull.base.ref},created_at:pull.created_at,updated_at:pull.updated_at};
  }
  async function upload(options) {
    var token=options.token,entries=options.entries,fetchFn=options.fetchFn||fetch,onProgress=options.onProgress||function(){};
    var request=githubClient(token,fetchFn).request;
    onProgress(3,'Verificando la rama principal…');
    var ref=await request('/git/ref/heads/'+encodeURIComponent(BASE_BRANCH));
    var commit=await request('/git/commits/'+ref.object.sha);
    var tree=await request('/git/trees/'+commit.tree.sha+'?recursive=1');
    var oldPdfs=(tree.tree||[]).filter(function(item){return item.type==='blob'&&/^datos-fuente\/transporte\/[^/]+\.pdf$/i.test(item.path);});
    var blobs=[];
    for(var i=0;i<entries.length;i++){
      onProgress(8+Math.round(i/entries.length*60),'Subiendo '+entries[i].corridor+'…');
      var content=base64(await entries[i].file.arrayBuffer());
      var blob=await request('/git/blobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:content,encoding:'base64'})});
      blobs.push({path:'datos-fuente/transporte/'+entries[i].target,mode:'100644',type:'blob',sha:blob.sha});
    }
    onProgress(72,'Preparando una única actualización…');
    var deletions=oldPdfs.filter(function(old){return !blobs.some(function(item){return item.path===old.path;});}).map(function(old){return {path:old.path,mode:'100644',type:'blob',sha:null};});
    var newTree=await request('/git/trees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:commit.tree.sha,tree:deletions.concat(blobs)})});
    var newCommit=await request('/git/commits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Cargar los ocho cronogramas desde la app',tree:newTree.sha,parents:[ref.object.sha]})});
    var branch=branchName();
    onProgress(88,'Creando la rama de actualización…');
    await request('/git/refs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:'refs/heads/'+branch,sha:newCommit.sha})});
    onProgress(94,'Creando el Pull Request de carga…');
    var sourcePull=await request('/pulls',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Cargar los ocho cronogramas desde la app',head:branch,base:BASE_BRANCH,body:'Carga administrativa de los ocho PDF. Al fusionarla se inicia la extracción, validación y preparación de la publicación.'})});
    onProgress(100,'Los PDF están listos para la primera fusión.');
    return {branch:branch,commit:newCommit.sha,sourcePull:compactPull(sourcePull),actionsUrl:'https://github.com/'+OWNER+'/'+REPOSITORY+'/actions'};
  }
  async function mergePull(options) {
    var request=githubClient(options.token,options.fetchFn||fetch).request;
    var payload=await request('/pulls/'+options.number+'/merge',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:options.sha,merge_method:'merge',commit_title:options.title})});
    if(!payload||!payload.merged)throw new Error((payload&&payload.message)||'GitHub no pudo fusionar el Pull Request.');
    return payload;
  }
  function findPublicationPull(pulls,since) {
    var minimum=Number(since||0)-120000;
    return (pulls||[]).filter(function(pull){return pull&&pull.base&&pull.base.ref===BASE_BRANCH&&pull.head&&/^publicacion\/horarios-/.test(pull.head.ref||'')&&Date.parse(pull.updated_at||pull.created_at||0)>=minimum;}).sort(function(a,b){return Date.parse(b.updated_at||0)-Date.parse(a.updated_at||0);})[0]||null;
  }
  async function waitForPublication(options) {
    var request=githubClient(options.token,options.fetchFn||fetch).request;
    var attempts=options.attempts||90,intervalMs=options.intervalMs==null?10000:options.intervalMs;
    var sleep=options.sleep||function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
    for(var attempt=1;attempt<=attempts;attempt++){
      if(options.cancelled&&options.cancelled())return null;
      var pulls=await request('/pulls?state=open&base='+encodeURIComponent(BASE_BRANCH)+'&sort=updated&direction=desc&per_page=30');
      var found=findPublicationPull(pulls,options.since);
      if(found)return compactPull(found);
      if(options.onWait)options.onWait(attempt,attempts);
      if(attempt<attempts)await sleep(intervalMs);
    }
    return null;
  }
  function bind(doc) {
    doc=doc||document;
    var dialog=doc.getElementById('admin-dialog');
    if(!dialog)return;
    var files=doc.getElementById('admin-files'),token=doc.getElementById('admin-token'),form=doc.getElementById('admin-form'),list=doc.getElementById('admin-file-list'),status=doc.getElementById('admin-status'),progress=doc.getElementById('admin-progress'),submit=doc.getElementById('admin-upload'),result=doc.getElementById('admin-result');
    var flow=loadFlow(),session=0,busy=false,waiting=false;
    function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
    function loadFlow(){try{return JSON.parse(localStorage.getItem(FLOW_KEY)||'null');}catch(error){return null;}}
    function saveFlow(){try{if(flow)localStorage.setItem(FLOW_KEY,JSON.stringify(flow));else localStorage.removeItem(FLOW_KEY);}catch(error){}}
    function secret(){var value=token.value.trim();if(!value)throw new Error('Ingresá la clave de GitHub para continuar.');return value;}
    function setBusy(value){busy=value;submit.disabled=value;files.disabled=value;progress.hidden=!value;}
    function step(state,title,copy,pull,action,label){
      var cls=state==='done'?'done':state==='ready'?'ready':'waiting';
      return '<article class="admin-step '+cls+'"><span class="admin-step-mark" aria-hidden="true">'+(state==='done'?'✓':state==='ready'?'!':'…')+'</span><div><strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p>'+(pull?'<a href="'+esc(pull.html_url)+'" target="_blank" rel="noopener noreferrer">Abrir PR #'+esc(pull.number)+' en GitHub ↗</a>':'')+'</div>'+(action?'<button type="button" data-admin-action="'+esc(action)+'">'+esc(label)+'</button>':'')+'</article>';
    }
    function renderFlow(){
      if(!flow){result.hidden=true;result.innerHTML='';return;}
      var first=flow.sourceMergedAt?step('done','1. Carga de los PDF','Fusionada correctamente en main.',flow.sourcePull):step('ready','1. Carga de los PDF','Revisá el PR y fusioná los ocho archivos.',flow.sourcePull,'merge-source','Fusionar carga');
      var second;
      if(flow.publicationMergedAt)second=step('done','2. Publicación de horarios','Los horarios y el historial fueron fusionados.',flow.publicationPull);
      else if(flow.publicationPull)second=step('ready','2. Publicación de horarios','La extracción y la validación terminaron correctamente.',flow.publicationPull,'merge-publication','Fusionar y publicar');
      else if(flow.sourceMergedAt)second=step('waiting','2. Publicación de horarios','GitHub está extrayendo y validando los cronogramas.',null,'retry-publication','Buscar publicación');
      else second=step('waiting','2. Publicación de horarios','Se habilitará después de fusionar la carga.');
      result.innerHTML='<div class="admin-flow">'+first+second+'</div><p class="admin-flow-links"><a href="'+esc(flow.actionsUrl||('https://github.com/'+OWNER+'/'+REPOSITORY+'/actions'))+'" target="_blank" rel="noopener noreferrer">Ver procesamiento en GitHub ↗</a>'+(flow.publicationMergedAt?' · <a href="https://lramadev.github.io/mi-portal-web/app-transporte/index.html" target="_blank" rel="noopener noreferrer">Abrir la aplicación publicada ↗</a>':'')+'</p>';
      result.hidden=false;
    }
    function close(){if(busy&&!waiting)return;session++;waiting=false;setBusy(false);token.value='';dialog.close();}
    async function locatePublication(key,currentSession){
      waiting=true;setBusy(true);status.className='admin-status';status.textContent='GitHub está procesando los PDF. Esta etapa puede tardar unos minutos…';renderFlow();
      try{
        var pull=await waitForPublication({token:key,since:Date.parse(flow.sourceMergedAt),cancelled:function(){return currentSession!==session;},onWait:function(attempt){status.textContent='Validando los cronogramas… comprobación '+attempt+'.';}});
        if(currentSession!==session)return;
        if(pull){flow.publicationPull=pull;saveFlow();status.textContent='Validación terminada. Ya podés realizar la segunda fusión.';status.className='admin-status success';}
        else{status.textContent='La publicación todavía no está lista. Podés volver a buscarla desde este panel o revisar el procesamiento.';status.className='admin-status error';}
      }catch(error){if(currentSession===session){status.textContent='No se pudo consultar la publicación: '+error.message;status.className='admin-status error';}}
      finally{waiting=false;if(currentSession===session){setBusy(false);renderFlow();}}
    }
    doc.getElementById('admin-open').addEventListener('click',function(){status.textContent='';progress.hidden=true;flow=loadFlow();renderFlow();dialog.showModal();});
    doc.getElementById('admin-close').addEventListener('click',close);doc.getElementById('admin-cancel').addEventListener('click',close);
    files.addEventListener('change',function(){var check=classifyFiles(files.files);list.innerHTML=check.entries.map(function(entry){return '<div class="admin-file-row ok"><strong>'+esc(entry.corridor)+'</strong><span>'+esc(entry.file.name)+'</span></div>';}).join('')+check.errors.map(function(error){return '<div class="error">'+esc(error)+'</div>';}).join('');});
    form.addEventListener('submit',async function(event){
      event.preventDefault();var check=classifyFiles(files.files),key=token.value.trim();
      if(!check.ok){status.textContent=check.errors[0];status.className='admin-status error';return;}
      if(!key){status.textContent='Ingresá la clave de acceso de GitHub.';status.className='admin-status error';return;}
      flow=null;saveFlow();renderFlow();setBusy(true);progress.value=0;status.className='admin-status';
      try{var done=await upload({token:key,entries:check.entries,onProgress:function(value,message){progress.value=value;status.textContent=message;}});flow={branch:done.branch,commit:done.commit,sourcePull:done.sourcePull,actionsUrl:done.actionsUrl,createdAt:new Date().toISOString()};saveFlow();status.textContent='Los ocho PDF quedaron cargados. Completá ahora la primera fusión.';status.className='admin-status success';renderFlow();}
      catch(error){status.textContent='No se pudo completar la carga: '+error.message;status.className='admin-status error';}
      finally{setBusy(false);}
    });
    result.addEventListener('click',async function(event){
      var button=event.target.closest('[data-admin-action]');if(!button||busy)return;
      try{
        var key=secret(),action=button.dataset.adminAction;
        if(action==='merge-source'){
          if(typeof confirm==='function'&&!confirm('¿Fusionar los ocho PDF e iniciar la validación?'))return;
          setBusy(true);status.textContent='Fusionando la carga de PDF…';status.className='admin-status';
          await mergePull({token:key,number:flow.sourcePull.number,sha:flow.sourcePull.head.sha,title:'Incorporar cronogramas para su procesamiento'});
          flow.sourceMergedAt=new Date().toISOString();saveFlow();renderFlow();setBusy(false);await locatePublication(key,session);
        }else if(action==='retry-publication')await locatePublication(key,session);
        else if(action==='merge-publication'){
          if(typeof confirm==='function'&&!confirm('¿Publicar los horarios validados y actualizar el historial?'))return;
          setBusy(true);status.textContent='Fusionando los horarios validados…';status.className='admin-status';
          await mergePull({token:key,number:flow.publicationPull.number,sha:flow.publicationPull.head.sha,title:'Publicar horarios e historial validados'});
          flow.publicationMergedAt=new Date().toISOString();saveFlow();token.value='';status.textContent='Actualización terminada. GitHub Pages puede demorar unos minutos en reflejarla.';status.className='admin-status success';renderFlow();
        }
      }catch(error){status.textContent='No se pudo continuar: '+error.message;status.className='admin-status error';}
      finally{setBusy(false);}
    });
    renderFlow();
  }
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',function(){bind(document);});
  return {OWNER:OWNER,REPOSITORY:REPOSITORY,CORRIDORS:CORRIDORS,normalize:normalize,classifyFiles:classifyFiles,branchName:branchName,compactPull:compactPull,githubClient:githubClient,upload:upload,mergePull:mergePull,findPublicationPull:findPublicationPull,waitForPublication:waitForPublication,bind:bind};
}));
