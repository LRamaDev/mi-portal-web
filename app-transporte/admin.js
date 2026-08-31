(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TransportAdmin = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var OWNER = 'LRamaDev', REPOSITORY = 'mi-portal-web', BASE_BRANCH = 'main';
  var MAX_BYTES = 25 * 1024 * 1024;
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
  async function upload(options) {
    var token=options.token,entries=options.entries,fetchFn=options.fetchFn||fetch,onProgress=options.onProgress||function(){};
    var api='https://api.github.com/repos/'+OWNER+'/'+REPOSITORY;
    async function request(path,init){
      init=init||{};init.headers=Object.assign({'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'},init.headers||{});
      var response=await fetchFn(api+path,init),payload=null;
      try{payload=await response.json();}catch(error){}
      if(!response.ok)throw new Error((payload&&payload.message)||('GitHub respondió '+response.status));
      return payload;
    }
    onProgress(3,'Verificando la rama principal…');
    var ref=await request('/git/ref/heads/'+encodeURIComponent(BASE_BRANCH));
    var commit=await request('/git/commits/'+ref.object.sha);
    var tree=await request('/git/trees/'+commit.tree.sha+'?recursive=1');
    var oldPdfs=(tree.tree||[]).filter(function(item){return item.type==='blob'&&/^datos-fuente\/transporte\/[^/]+\.pdf$/i.test(item.path);});
    var blobs=[];
    for(var i=0;i<entries.length;i++){
      onProgress(8+Math.round(i/entries.length*64),'Subiendo '+entries[i].corridor+'…');
      var content=base64(await entries[i].file.arrayBuffer());
      var blob=await request('/git/blobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:content,encoding:'base64'})});
      blobs.push({path:'datos-fuente/transporte/'+entries[i].target,mode:'100644',type:'blob',sha:blob.sha});
    }
    onProgress(76,'Preparando una única actualización…');
    var deletions=oldPdfs.filter(function(old){return !blobs.some(function(item){return item.path===old.path;});}).map(function(old){return {path:old.path,mode:'100644',type:'blob',sha:null};});
    var newTree=await request('/git/trees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({base_tree:commit.tree.sha,tree:deletions.concat(blobs)})});
    var newCommit=await request('/git/commits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Cargar los ocho cronogramas desde la app',tree:newTree.sha,parents:[ref.object.sha]})});
    var branch=branchName();
    onProgress(92,'Creando la rama de actualización…');
    await request('/git/refs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:'refs/heads/'+branch,sha:newCommit.sha})});
    onProgress(100,'Carga terminada. GitHub inició la validación automática.');
    return {branch:branch,commit:newCommit.sha,actionsUrl:'https://github.com/'+OWNER+'/'+REPOSITORY+'/actions',branchUrl:'https://github.com/'+OWNER+'/'+REPOSITORY+'/tree/'+branch};
  }
  function bind(doc) {
    doc=doc||document;
    var dialog=doc.getElementById('admin-dialog');
    if(!dialog)return;
    var files=doc.getElementById('admin-files'),token=doc.getElementById('admin-token'),form=doc.getElementById('admin-form'),list=doc.getElementById('admin-file-list'),status=doc.getElementById('admin-status'),progress=doc.getElementById('admin-progress'),submit=doc.getElementById('admin-upload'),result=doc.getElementById('admin-result');
    function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
    function close(){if(!submit.disabled)dialog.close();}
    doc.getElementById('admin-open').addEventListener('click',function(){status.textContent='';result.hidden=true;dialog.showModal();});
    doc.getElementById('admin-close').addEventListener('click',close);doc.getElementById('admin-cancel').addEventListener('click',close);
    files.addEventListener('change',function(){
      var check=classifyFiles(files.files);
      list.innerHTML=check.entries.map(function(entry){return '<div class="admin-file-row ok"><strong>'+esc(entry.corridor)+'</strong><span>'+esc(entry.file.name)+'</span></div>';}).join('')+check.errors.map(function(error){return '<div class="error">'+esc(error)+'</div>';}).join('');
    });
    form.addEventListener('submit',async function(event){
      event.preventDefault();var check=classifyFiles(files.files),secret=token.value.trim();result.hidden=true;
      if(!check.ok){status.textContent=check.errors[0];status.className='admin-status error';return;}
      if(!secret){status.textContent='Ingresá la clave de acceso de GitHub.';status.className='admin-status error';return;}
      submit.disabled=true;progress.hidden=false;progress.value=0;status.className='admin-status';
      try{
        var done=await upload({token:secret,entries:check.entries,onProgress:function(value,message){progress.value=value;status.textContent=message;}});
        status.className='admin-status success';
        result.innerHTML='<strong>Los ocho PDF quedaron cargados.</strong><p>Rama: <code>'+esc(done.branch)+'</code></p><p><a href="'+esc(done.actionsUrl)+'" target="_blank" rel="noopener noreferrer">Ver la validación automática</a> · <a href="'+esc(done.branchUrl)+'" target="_blank" rel="noopener noreferrer">Ver la rama</a></p>';
        result.hidden=false;
      }catch(error){status.textContent='No se pudo completar la carga: '+error.message;status.className='admin-status error';progress.hidden=true;}
      finally{token.value='';submit.disabled=false;}
    });
  }
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',function(){bind(document);});
  return {OWNER:OWNER,REPOSITORY:REPOSITORY,CORRIDORS:CORRIDORS,normalize:normalize,classifyFiles:classifyFiles,branchName:branchName,upload:upload,bind:bind};
}));
