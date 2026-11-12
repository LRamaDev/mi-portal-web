(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TransportAdmin = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var OWNER = 'LRamaDev', REPOSITORY = 'mi-portal-web', BASE_BRANCH = 'main';
  var MAX_BYTES = 25 * 1024 * 1024;
  var FLOW_KEY = 'ersep-transporte-admin-flow-v2';
  var WORKFLOW_FILE = 'actualizar-horarios.yml';
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
      init.headers=Object.assign({'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},token?{'Authorization':'Bearer '+token}:{},init.headers||{});
      var response=await fetchFn(api+path,init),payload=null;
      if(response.status!==204){try{payload=await response.json();}catch(error){}}
      if(!response.ok)throw new Error((payload&&payload.message)||('GitHub respondió '+response.status));
      return payload;
    }
    async function requestText(path){
      var headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
      if(token)headers.Authorization='Bearer '+token;
      var response=await fetchFn(api+path,{headers:headers});
      if(!response.ok)throw new Error('GitHub respondió '+response.status+' al consultar el registro.');
      return response.text();
    }
    return {request:request,requestText:requestText};
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
    if(newTree.sha===commit.tree.sha){
      onProgress(100,'Los ocho PDF ya coinciden con los archivos cargados en GitHub.');
      return {unchanged:true,actionsUrl:'https://github.com/'+OWNER+'/'+REPOSITORY+'/actions'};
    }
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

  function compactRun(run){
    if(!run)return null;
    return {id:run.id,html_url:run.html_url,status:run.status,conclusion:run.conclusion,created_at:run.created_at,event:run.event};
  }
  function findRelevantRun(runs,flow){
    flow=flow||{};
    var selected=(runs||[]).filter(function(run){
      return run&&run.head_branch===BASE_BRANCH&&(run.event==='push'||run.event==='workflow_dispatch');
    }).sort(function(a,b){return Date.parse(b.created_at||0)-Date.parse(a.created_at||0);});
    if(flow.retryRequestedAt){
      var retrySince=Date.parse(flow.retryRequestedAt)-30000;
      return selected.find(function(run){
        return run.event==='workflow_dispatch'&&Date.parse(run.created_at)>=retrySince;
      })||null;
    }
    if(flow.sourceMergeSha){
      return selected.find(function(run){return run.event==='push'&&run.head_sha===flow.sourceMergeSha;})||null;
    }
    var since=Date.parse(flow.sourceMergedAt||0);
    if(!Number.isFinite(since)||!since)return null;
    return selected.find(function(run){
      var created=Date.parse(run.created_at||0);
      return run.event==='push'&&created>=since-120000&&created<=since+600000;
    })||null;
  }
  function parseFailureDetails(value){
    var result=[],seen=new Set(),text=String(value||'');
    var pattern=/([0-9]{2}-[a-z0-9_-]+\.pdf)\s*·\s*página\s+(\d+):\s*([^\r\n]+)/gi,match;
    while((match=pattern.exec(text))&&result.length<12){
      var file=match[1].toLowerCase(),page=Number(match[2]),reason=match[3].replace(/\x1b\[[0-9;]*m/g,'').trim();
      var key=file+'|'+page+'|'+reason;
      if(!seen.has(key)){seen.add(key);result.push({file:file,page:page,corridor:(CORRIDORS.find(function(c){return c.file===file;})||{}).id||'No identificado',reason:reason.slice(0,250)});}
    }
    return result;
  }
  async function requestWithPublicFallback(client,token,fetchFn,path){
    try{return await client.request(path);}
    catch(error){
      if(!token)return Promise.reject(error);
      return githubClient('',fetchFn).request(path);
    }
  }
  async function readWorkflowErrors(options){
    var fetchFn=options.fetchFn||fetch,client=githubClient(options.token||'',fetchFn),data;
    try{data=await requestWithPublicFallback(client,options.token,fetchFn,'/actions/runs/'+options.run.id+'/jobs?per_page=30');}
    catch(error){return [];}
    var jobs=(data.jobs||[]).filter(function(job){return job.conclusion==='failure';}),errors=[];
    for(var i=0;i<jobs.length&&errors.length<12;i++){
      var job=jobs[i],checkId=String(job.check_run_url||'').match(/\/check-runs\/(\d+)/);
      if(checkId){
        try{
          var annotations=await requestWithPublicFallback(client,options.token,fetchFn,'/check-runs/'+checkId[1]+'/annotations?per_page=100');
          errors=errors.concat(parseFailureDetails((annotations||[]).map(function(a){return [a.title,a.message].join(': ');}).join('\n')));
        }catch(error){}
      }
      if(!errors.length){
        try{errors=errors.concat(parseFailureDetails(await client.requestText('/actions/jobs/'+job.id+'/logs')));}
        catch(error){try{errors=errors.concat(parseFailureDetails(await githubClient('',fetchFn).requestText('/actions/jobs/'+job.id+'/logs')));}catch(ignored){}}
      }
    }
    return errors.slice(0,12);
  }
  async function inspectProcessing(options){
    var fetchFn=options.fetchFn||fetch,token=options.token||'',client=githubClient(token,fetchFn),request=client.request;
    var runs=await requestWithPublicFallback(client,token,fetchFn,'/actions/workflows/'+WORKFLOW_FILE+'/runs?branch='+BASE_BRANCH+'&per_page=30');
    var run=findRelevantRun(runs.workflow_runs||[],options.flow),compact=compactRun(run);
    if(run&&run.conclusion==='failure'){
      return {kind:'failed',run:compact,errors:await readWorkflowErrors({token:token,fetchFn:fetchFn,run:run})};
    }
    if(run&&(run.status==='queued'||run.status==='in_progress'||run.status==='waiting'||run.status==='requested')){
      return {kind:'running',run:compact};
    }
    var pulls=await request('/pulls?state=open&base='+encodeURIComponent(BASE_BRANCH)+'&sort=updated&direction=desc&per_page=30');
    var after=Date.parse(options.flow.retryRequestedAt||options.flow.sourceMergedAt||0);
    var publication=findPublicationPull(pulls,after);
    if(publication&&(!options.flow.retryRequestedAt||run&&run.conclusion==='success')){
      return {kind:'ready',run:compact,pull:compactPull(publication)};
    }
    if(run&&run.conclusion==='success'){
      return {kind:'missing-pr',run:compact};
    }
    return {kind:'running',run:compact};
  }
  async function waitForProcessing(options){
    var attempts=options.attempts||36,intervalMs=options.intervalMs==null?5000:options.intervalMs;
    var sleep=options.sleep||function(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});};
    var state=null;
    for(var i=1;i<=attempts;i++){
      if(options.cancelled&&options.cancelled())return null;
      state=await inspectProcessing(options);
      if(options.onWait)options.onWait(i,attempts,state);
      if(state.kind!=='running')return state;
      if(i<attempts)await sleep(intervalMs);
    }
    return state;
  }
  async function retryProcessing(options){
    var request=githubClient(options.token,options.fetchFn||fetch).request;
    return request('/actions/workflows/'+WORKFLOW_FILE+'/dispatches',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ref:BASE_BRANCH,inputs:{source_branch:BASE_BRANCH}})
    });
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
      var cls=state==='done'?'done':state==='ready'?'ready':state==='error'?'error':'waiting';
      return '<article class="admin-step '+cls+'"><span class="admin-step-mark" aria-hidden="true">'+(state==='done'?'✓':state==='ready'?'!':'…')+'</span><div><strong>'+esc(title)+'</strong><p>'+esc(copy)+'</p>'+(pull?'<a href="'+esc(pull.html_url)+'" target="_blank" rel="noopener noreferrer">Abrir PR #'+esc(pull.number)+' en GitHub ↗</a>':'')+'</div>'+(action?'<button type="button" data-admin-action="'+esc(action)+'">'+esc(label)+'</button>':'')+'</article>';
    }
    function renderFlow(){
      if(!flow){result.hidden=true;result.innerHTML='';return;}
      var first=flow.sourceMergedAt?step('done','1. Carga de los PDF','Fusionada correctamente en main.',flow.sourcePull):step('ready','1. Carga de los PDF','Revisá el PR y fusioná los ocho archivos.',flow.sourcePull,'merge-source','Fusionar carga');
      var second,errorDetails='';
      if(flow.publicationMergedAt)second=step('done','2. Publicación de horarios','Los horarios y el historial fueron fusionados.',flow.publicationPull);
      else if(flow.publicationPull)second=step('ready','2. Publicación de horarios','La extracción y la validación terminaron correctamente.',flow.publicationPull,'merge-publication','Fusionar y publicar');
      else if(flow.processingState==='failed'){
        second=step('error','2. Procesamiento detenido','GitHub encontró un error. Los PDF siguen cargados; no se publicaron horarios incompletos.',null,'retry-processing','Reintentar sin subir PDF');
        var details=Array.isArray(flow.failureDetails)?flow.failureDetails:[];
        if(details.length)errorDetails='<div class="admin-error-details"><strong>Registros que requieren revisión</strong><ul>'+details.map(function(d){
          return '<li><strong>'+esc(d.corridor)+' · '+esc(d.file)+' · página '+esc(d.page)+'</strong><span>'+esc(d.reason)+'</span></li>';
        }).join('')+'</ul><p>Si el PDF contiene un formato nuevo, hay que adaptar el extractor antes de repetir el procesamiento.</p></div>';
        else errorDetails='<p class="admin-error-details">No se pudo obtener el detalle técnico. Abrí el registro de GitHub para conocer el motivo antes de reintentar.</p>';
      }else if(flow.processingState==='missing-pr')second=step('error','2. Falta el PR de publicación','GitHub terminó, pero no se encontró el segundo Pull Request. Revisá el registro antes de reintentar.',null,'retry-processing','Reintentar procesamiento');
      else if(flow.sourceMergedAt)second=step('waiting','2. Procesamiento de horarios','Consultá el estado real de GitHub para saber si sigue procesando o si ya terminó.',null,'check-status','Consultar estado');
      else second=step('waiting','2. Publicación de horarios','Se habilitará después de fusionar la carga.');
      var runLink=flow.processingRun&&flow.processingRun.html_url?'<a href="'+esc(flow.processingRun.html_url)+'" target="_blank" rel="noopener noreferrer">Ver ejecución de GitHub ↗</a> · ':'';
      result.innerHTML='<div class="admin-flow">'+first+second+errorDetails+'</div><p class="admin-flow-links">'+runLink+'<a href="'+esc(flow.actionsUrl||('https://github.com/'+OWNER+'/'+REPOSITORY+'/actions'))+'" target="_blank" rel="noopener noreferrer">Ver todos los procesamientos ↗</a>'+(flow.publicationMergedAt?' · <a href="https://lramadev.github.io/mi-portal-web/app-transporte/index.html" target="_blank" rel="noopener noreferrer">Abrir la aplicación publicada ↗</a>':'')+'</p>';
      result.hidden=false;
    }
    function close(){if(busy&&!waiting)return;session++;waiting=false;setBusy(false);token.value='';dialog.close();}
    async function locatePublication(key,currentSession,once){
      if(!flow||!flow.sourceMergedAt)return;
      waiting=true;setBusy(true);status.className='admin-status';status.textContent='Consultando el estado real del procesamiento en GitHub…';renderFlow();
      try{
        var state=await waitForProcessing({token:key,flow:flow,attempts:once?1:36,
          cancelled:function(){return currentSession!==session;},
          onWait:function(attempt,total,current){
            if(current.kind==='running')status.textContent=current.run?'GitHub está procesando los cronogramas. Comprobación '+attempt+'.':'Buscando el inicio del procesamiento en GitHub…';
          }});
        if(currentSession!==session||!state)return;
        if(state.run)flow.processingRun=state.run;
        if(state.kind==='ready'){
          flow.publicationPull=state.pull;flow.processingState='ready';flow.failureDetails=[];
          status.textContent='Validación terminada. Ya podés realizar la segunda fusión.';status.className='admin-status success';
        }else if(state.kind==='failed'){
          flow.processingState='failed';flow.failureDetails=state.errors||[];
          status.textContent=state.errors&&state.errors.length?'Procesamiento detenido: revisá el PDF y la página señalados más abajo.':'El procesamiento falló. Consultá el registro técnico antes de reintentar.';
          status.className='admin-status error';
        }else if(state.kind==='missing-pr'){
          flow.processingState='missing-pr';
          status.textContent='GitHub terminó correctamente, pero no se encontró un PR de publicación. Revisá la ejecución.';
          status.className='admin-status error';
        }else{
          flow.processingState='running';
          status.textContent=once?'GitHub todavía está procesando. Podés consultar nuevamente desde aquí.':'No se completó el procesamiento durante esta comprobación. Consultá nuevamente más tarde.';
        }
        saveFlow();
      }catch(error){
        if(currentSession===session){status.textContent='No se pudo consultar GitHub: '+error.message+'. Abrí el enlace al procesamiento o verificá los permisos de la clave.';status.className='admin-status error';}
      }finally{waiting=false;if(currentSession===session){setBusy(false);renderFlow();}}
    }
    doc.getElementById('admin-open').addEventListener('click',function(){status.textContent='';progress.hidden=true;flow=loadFlow();renderFlow();dialog.showModal();if(flow&&flow.sourceMergedAt&&!flow.publicationMergedAt&&!flow.publicationPull)locatePublication('',++session,true);});
    doc.getElementById('admin-close').addEventListener('click',close);doc.getElementById('admin-cancel').addEventListener('click',close);
    files.addEventListener('change',function(){var check=classifyFiles(files.files);list.innerHTML=check.entries.map(function(entry){return '<div class="admin-file-row ok"><strong>'+esc(entry.corridor)+'</strong><span>'+esc(entry.file.name)+'</span></div>';}).join('')+check.errors.map(function(error){return '<div class="error">'+esc(error)+'</div>';}).join('');});
    form.addEventListener('submit',async function(event){
      event.preventDefault();var check=classifyFiles(files.files),key=token.value.trim();
      if(!check.ok){status.textContent=check.errors[0];status.className='admin-status error';return;}
      if(!key){status.textContent='Ingresá la clave de acceso de GitHub.';status.className='admin-status error';return;}
      setBusy(true);progress.value=0;status.className='admin-status';
      try{
        var done=await upload({token:key,entries:check.entries,onProgress:function(value,message){progress.value=value;status.textContent=message;}});
        if(done.unchanged){
          status.textContent='Estos ocho PDF son idénticos a los ya cargados. No se creó un PR duplicado. Si hubo un error, usá la opción de reintento del procesamiento.';
          status.className='admin-status success';
        }else{
          flow={branch:done.branch,commit:done.commit,sourcePull:done.sourcePull,actionsUrl:done.actionsUrl,createdAt:new Date().toISOString()};
          saveFlow();status.textContent='Los ocho PDF quedaron cargados. Completá ahora la primera fusión.';status.className='admin-status success';
        }
        renderFlow();
      }
      catch(error){status.textContent='No se pudo completar la carga: '+error.message;status.className='admin-status error';}
      finally{setBusy(false);}
    });
    result.addEventListener('click',async function(event){
      var button=event.target.closest('[data-admin-action]');if(!button||busy)return;
      try{
        var action=button.dataset.adminAction,key=action==='check-status'?token.value.trim():secret();
        if(action==='merge-source'){
          if(typeof confirm==='function'&&!confirm('¿Fusionar los ocho PDF e iniciar la validación?'))return;
          setBusy(true);status.textContent='Fusionando la carga de PDF…';status.className='admin-status';
          var merged=await mergePull({token:key,number:flow.sourcePull.number,sha:flow.sourcePull.head.sha,title:'Incorporar cronogramas para su procesamiento'});
          flow.sourceMergedAt=new Date().toISOString();flow.sourceMergeSha=merged.sha;flow.retryRequestedAt=null;flow.processingState='running';flow.failureDetails=[];saveFlow();renderFlow();setBusy(false);await locatePublication(key,session);
        }else if(action==='check-status')await locatePublication(key,session,true);
        else if(action==='retry-processing'){
          if(typeof confirm==='function'&&!confirm('¿Volver a procesar los ocho PDF que ya están en GitHub, sin modificar ni publicar los horarios actuales?'))return;
          setBusy(true);status.textContent='Solicitando un nuevo procesamiento a GitHub…';status.className='admin-status';
          var requestedAt=new Date().toISOString();
          try{await retryProcessing({token:key});}
          catch(error){
            if(/403|permission|accessible by personal access token|forbidden/i.test(error.message))throw new Error('Tu clave necesita Actions: Read and write para reintentar. Podés ejecutar manualmente el workflow desde GitHub Actions.');
            throw error;
          }
          flow.retryRequestedAt=requestedAt;flow.processingState='running';flow.processingRun=null;flow.failureDetails=[];saveFlow();renderFlow();setBusy(false);
          await locatePublication(key,session);
        }
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
  return {OWNER:OWNER,REPOSITORY:REPOSITORY,CORRIDORS:CORRIDORS,normalize:normalize,classifyFiles:classifyFiles,branchName:branchName,compactPull:compactPull,githubClient:githubClient,upload:upload,mergePull:mergePull,findPublicationPull:findPublicationPull,waitForPublication:waitForPublication,findRelevantRun:findRelevantRun,parseFailureDetails:parseFailureDetails,readWorkflowErrors:readWorkflowErrors,inspectProcessing:inspectProcessing,waitForProcessing:waitForProcessing,retryProcessing:retryProcessing,bind:bind};
}));
