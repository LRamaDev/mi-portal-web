(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(null);
  else root.TransportHistory = factory(root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  var DAYS = {1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado',7:'Domingo'};
  var DIRECTIONS = {I:'Ida',V:'Vuelta'};
  var FIELDS = ['origin','destination','corridor','line','direction','company'];

  function selectPublication(index, isoDate) {
    if (!index || !isoDate) return null;
    return (index.publications || []).filter(function (item) {
      return item.valid_from <= isoDate && (!item.valid_until || isoDate <= item.valid_until);
    }).pop() || null;
  }
  function weekday(isoDate) {
    var value = new Date(isoDate + 'T12:00:00Z').getUTCDay();
    return value || 7;
  }
  function csvCell(value) { return '"' + String(value == null ? '' : value).replace(/"/g,'""') + '"'; }
  function csv(rows) { return rows.map(function(row){return row.map(csvCell).join(',');}).join('\r\n')+'\r\n'; }
  if (!root || !root.document) return {selectPublication:selectPublication,weekday:weekday,csv:csv};

  var document = root.document;
  var $ = function(id){return document.getElementById(id);};
  var esc = function(value){return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var state = {index:null,entry:null,bundle:null,engine:null,results:[],report:null,cache:new Map(),activated:false,bound:false};

  function dateText(iso) {
    return iso ? new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(iso+'T00:00:00Z')) : 'Sin fecha';
  }
  function todayIso() {
    var parts = new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Argentina/Cordoba'}).formatToParts(new Date());
    var values={};parts.forEach(function(part){values[part.type]=part.value;});return values.year+'-'+values.month+'-'+values.day;
  }
  function getJSON(path) { return root.fetch(path,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error('No se pudo abrir '+path);return response.json();}); }
  function hex(buffer) { return Array.from(new Uint8Array(buffer)).map(function(value){return value.toString(16).padStart(2,'0');}).join(''); }
  function getGzipJSON(path, expectedHash) {
    if (!root.DecompressionStream) return Promise.reject(new Error('Este navegador no puede abrir respaldos históricos comprimidos. Actualizalo para continuar.'));
    return root.fetch(path,{cache:'no-store'}).then(function(response){
      if(!response.ok)throw new Error('No se pudo abrir el respaldo histórico.');
      return response.arrayBuffer();
    }).then(function(buffer){
      var verify = root.crypto && root.crypto.subtle && expectedHash ? root.crypto.subtle.digest('SHA-256',buffer).then(function(digest){if(hex(digest)!==expectedHash)throw new Error('El respaldo histórico no supera el control de integridad.');}) : Promise.resolve();
      return verify.then(function(){
        var stream = new root.Blob([buffer]).stream().pipeThrough(new root.DecompressionStream('gzip'));
        return new root.Response(stream).json();
      });
    });
  }
  function optionText(id,fallback){var el=$(id),option=el&&el.options[el.selectedIndex];return option&&option.value?option.textContent:fallback;}
  function placeLabel(id){return state.engine ? state.engine.label(id) : id;}
  function clock(minutes){return root.TransportRoutes.clock(minutes).time;}
  function filters(){
    var result={search:$('history-search').value.trim(),day:String(weekday($('history-date').value))};
    FIELDS.forEach(function(field){result[field]=$('history-'+field).value;});
    return result;
  }
  function hasCriteria(){var values=filters();return Boolean(values.search||FIELDS.some(function(field){return values[field];}));}
  function updateOptions(){
    if(!state.engine)return;
    var current=filters(),first={origin:'Todos',destination:'Todos',corridor:'Todos',line:'Todas',direction:'Ambos',company:'Todas'};
    FIELDS.forEach(function(field){
      var el=$('history-'+field),old=el.value,oldLabel=el.options[el.selectedIndex]?el.options[el.selectedIndex].textContent:old;
      var values=state.engine.facet(field,current),labels=field==='direction'?DIRECTIONS:null;
      function label(value){return field==='origin'||field==='destination'?placeLabel(value):labels?labels[value]:value;}
      values.sort(function(a,b){return label(a).localeCompare(label(b),'es');});
      el.innerHTML='<option value="">'+first[field]+'</option>'+values.map(function(value){return '<option value="'+esc(value)+'">'+esc(label(value))+'</option>';}).join('');
      if(old&&values.indexOf(old)===-1)el.insertAdjacentHTML('beforeend','<option value="'+esc(old)+'" disabled>'+esc(oldLabel)+' · sin coincidencias</option>');
      el.value=old;
    });
  }
  function serviceCard(journey){
    var service=journey.service,days=journey.days.map(function(day){return DAYS[day];}).join(', ');
    return '<article class="history-service"><div class="history-service-time"><strong>'+esc(clock(journey.boarding))+'</strong><span>'+(journey.estimatedBoarding?'Paso estimado':'Salida publicada')+'</span></div><div><h4>'+esc(placeLabel(journey.origin))+' → '+esc(placeLabel(journey.destination))+'</h4><p><strong>'+esc(service.company)+'</strong> · '+esc(service.line)+' · '+esc(DIRECTIONS[service.direction])+'</p><p>'+esc(days)+' · Destino final: '+esc(placeLabel(journey.model.stops[journey.model.stops.length-1].place_id))+'</p><small>Fuente: '+esc(service.source_file)+' · página '+esc(service.source_page)+'</small></div></article>';
  }
  function render(){
    var container=$('history-results'),status=$('history-result-status');
    if(!state.engine){$('history-result-count').textContent='0';container.innerHTML='';return;}
    if(!hasCriteria()){
      state.results=[];$('history-result-count').textContent='0';status.className='history-result-status';status.textContent='Completá al menos un dato del servicio para realizar la verificación.';container.innerHTML='';return;
    }
    state.results=state.engine.query(filters());
    $('history-result-count').textContent=state.results.length.toLocaleString('es-AR');
    var selectedDate=$('history-date').value;
    if(state.results.length){
      status.className='history-result-status success';
      status.textContent='Sí: se encontraron '+state.results.length.toLocaleString('es-AR')+' servicios programados para el '+dateText(selectedDate)+'.';
      container.innerHTML=state.results.slice(0,200).map(serviceCard).join('')+(state.results.length>200?'<p class="history-limit">Se muestran los primeros 200 resultados. Precisá los filtros.</p>':'');
    }else{
      status.className='history-result-status empty';
      status.textContent='No aparece ningún servicio para esa fecha y combinación dentro del cronograma histórico disponible.';
      container.innerHTML='<div class="empty-state"><strong>Sin coincidencias.</strong><p>Revisá los datos ingresados antes de emitir una constancia.</p></div>';
    }
  }
  function validity(entry){return 'Publicación del '+dateText(entry.publication_date)+' · '+entry.services.toLocaleString('es-AR')+' servicios · aplicable desde '+dateText(entry.valid_from)+(entry.valid_until?' hasta '+dateText(entry.valid_until):' hasta la próxima actualización')+'.';}
  function loadSnapshot(entry){
    if(state.cache.has(entry.publication_date))return Promise.resolve(state.cache.get(entry.publication_date));
    return getGzipJSON('data/historico/'+entry.snapshot,entry.snapshot_sha256).then(function(bundle){state.cache.set(entry.publication_date,bundle);return bundle;});
  }
  function loadForDate(){
    var selected=$('history-date').value,status=$('history-publication-status');
    if(!selected){status.textContent='Elegí una fecha.';return Promise.resolve();}
    if(selected>todayIso()){status.textContent='La consulta histórica no admite fechas futuras.';state.engine=null;render();return Promise.resolve();}
    var entry=selectPublication(state.index,selected);
    if(!entry){status.textContent='No hay cronogramas históricos disponibles para esa fecha.';state.engine=null;render();return Promise.resolve();}
    status.textContent='Abriendo '+validity(entry);
    return loadSnapshot(entry).then(function(bundle){
      state.entry=entry;state.bundle=bundle;state.engine=root.TransportRoutes.create(bundle.schedule,bundle.locations,bundle.routes);
      updateOptions();render();status.textContent=validity(entry);
    }).catch(function(error){state.engine=null;render();status.textContent=error.message;});
  }
  function resetFilters(){
    $('history-search').value='';FIELDS.forEach(function(field){$('history-'+field).value='';});updateOptions();render();
  }
  function printHeader(title,subtitle,count){return '<header class="print-head"><img class="print-logo" src="assets/logo-ersep.png" alt="ERSeP"><div><h1>'+esc(title)+'</h1><p><strong>'+esc(subtitle)+'</strong></p><p>'+count.toLocaleString('es-AR')+' registros incluidos</p></div></header>';}
  function printHistory(){
    var status=$('history-export-status');
    if(!state.results.length){status.textContent='No hay servicios para imprimir.';status.className='export-status error';return;}
    var rows=state.results.slice(0,500).map(function(journey){var service=journey.service;return '<tr><td>'+esc(clock(journey.boarding))+'</td><td>'+esc(placeLabel(journey.origin))+' → '+esc(placeLabel(journey.destination))+'</td><td>'+esc(service.company)+'</td><td>'+esc(service.line)+'</td><td>'+esc(DIRECTIONS[service.direction])+'</td><td>'+esc(service.source_file)+' · pág. '+esc(service.source_page)+'</td></tr>';}).join('');
    $('print-sheet').innerHTML=printHeader('Constancia de consulta histórica','Fecha verificada: '+dateText($('history-date').value)+' · Publicación utilizada: '+dateText(state.entry.publication_date),state.results.length)+'<section class="print-meta"><div><span>Origen</span><strong>'+esc(optionText('history-origin','Todos'))+'</strong></div><div><span>Destino</span><strong>'+esc(optionText('history-destination','Todos'))+'</strong></div><div><span>Empresa</span><strong>'+esc(optionText('history-company','Todas'))+'</strong></div><div><span>Línea</span><strong>'+esc(optionText('history-line','Todas'))+'</strong></div></section><table class="print-table"><thead><tr><th>Hora</th><th>Trayecto</th><th>Empresa</th><th>Línea</th><th>Sentido</th><th>Fuente</th></tr></thead><tbody>'+rows+'</tbody></table><p class="print-note">El resultado acredita que el servicio figuraba en el cronograma disponible para esa fecha. No acredita que la unidad haya circulado efectivamente. Los pasos intermedios son orientativos.</p>';
    status.textContent='Se abrió la impresión. Elegí una impresora o “Guardar como PDF”.';status.className='export-status';root.print();
  }
  function changeRows(report){
    var rows=[];
    report.modified.forEach(function(item){var before=item.before,after=item.after;rows.push(['Modificado',after.corridor,after.line,DIRECTIONS[after.direction]||after.direction,after.service_days_text,before.time,after.time,after.company,before.source_file,before.source_page,after.source_file,after.source_page]);});
    report.removed.forEach(function(item){rows.push(['Eliminado',item.corridor,item.line,DIRECTIONS[item.direction]||item.direction,item.service_days_text,item.time,'',item.company,item.source_file,item.source_page,'','']);});
    report.added.forEach(function(item){rows.push(['Agregado',item.corridor,item.line,DIRECTIONS[item.direction]||item.direction,item.service_days_text,'',item.time,item.company,'','',item.source_file,item.source_page]);});
    return rows;
  }
  function changeTable(title,items,kind){
    if(!items.length)return '<section class="change-group"><h4>'+title+'</h4><p>Ninguno.</p></section>';
    var rows=items.slice(0,100).map(function(item){var before=kind==='modified'?item.before:item,after=kind==='modified'?item.after:item;return '<tr><td>'+esc(after.corridor)+'</td><td>'+esc(after.line)+'</td><td>'+esc(DIRECTIONS[after.direction]||after.direction)+'</td><td>'+esc(after.service_days_text)+'</td><td>'+esc(kind==='added'?'—':before.time)+'</td><td>'+esc(kind==='removed'?'—':after.time)+'</td><td>'+esc(after.company)+'</td></tr>';}).join('');
    return '<section class="change-group"><h4>'+title+'</h4><div class="inspection-table-wrap"><table class="inspection-table change-table"><thead><tr><th>Corredor</th><th>Línea</th><th>Sentido</th><th>Días</th><th>Anterior</th><th>Nuevo</th><th>Empresa</th></tr></thead><tbody>'+rows+'</tbody></table></div></section>';
  }
  function renderReport(report){
    state.report=report;var summary=report.summary;
    $('change-summary').innerHTML='<div><span>Sin cambios</span><strong>'+summary.unchanged.toLocaleString('es-AR')+'</strong></div><div><span>Modificados</span><strong>'+summary.modified.toLocaleString('es-AR')+'</strong></div><div><span>Agregados</span><strong>'+summary.added.toLocaleString('es-AR')+'</strong></div><div><span>Eliminados</span><strong>'+summary.removed.toLocaleString('es-AR')+'</strong></div>';
    $('change-details').innerHTML=changeTable('Horarios modificados',report.modified,'modified')+changeTable('Servicios eliminados',report.removed,'removed')+changeTable('Servicios agregados',report.added,'added');
  }
  function loadReport(){
    var entry=(state.index.publications||[]).find(function(item){return item.publication_date===$('change-publication').value;});
    if(!entry||!entry.changes){state.report=null;$('change-summary').innerHTML='<p>Esta publicación funciona como base inicial y no posee comparación anterior.</p>';$('change-details').innerHTML='';return Promise.resolve();}
    return getJSON('data/historico/'+entry.changes).then(renderReport).catch(function(error){$('change-summary').innerHTML='<p>'+esc(error.message)+'</p>';});
  }
  function printChanges(){
    var status=$('change-export-status');if(!state.report){status.textContent='Elegí una publicación con informe.';status.className='export-status error';return;}
    var rows=changeRows(state.report).map(function(row){return '<tr>'+row.slice(0,8).map(function(cell){return '<td>'+esc(cell)+'</td>';}).join('')+'</tr>';}).join('');
    var summary=state.report.summary;
    $('print-sheet').innerHTML=printHeader('Informe de actualización de horarios','Publicación '+dateText(state.report.publication_date),summary.modified+summary.added+summary.removed)+'<section class="print-meta"><div><span>Servicios anteriores</span><strong>'+summary.previous_services.toLocaleString('es-AR')+'</strong></div><div><span>Servicios actuales</span><strong>'+summary.current_services.toLocaleString('es-AR')+'</strong></div><div><span>Sin cambios</span><strong>'+summary.unchanged.toLocaleString('es-AR')+'</strong></div><div><span>Modificados / agregados / eliminados</span><strong>'+summary.modified+' / '+summary.added+' / '+summary.removed+'</strong></div></section><table class="print-table"><thead><tr><th>Estado</th><th>Corredor</th><th>Línea</th><th>Sentido</th><th>Días</th><th>Anterior</th><th>Nuevo</th><th>Empresa</th></tr></thead><tbody>'+rows+'</tbody></table><p class="print-note">Comparación automática entre las publicaciones del '+dateText(state.report.previous_publication_date)+' y '+dateText(state.report.publication_date)+'.</p>';
    status.textContent='Se abrió la impresión del informe.';status.className='export-status';root.print();
  }
  function downloadChanges(){
    var status=$('change-export-status');if(!state.report){status.textContent='Elegí una publicación con informe.';status.className='export-status error';return;}
    var rows=[['Estado','Corredor','Línea','Sentido','Días','Horario anterior','Horario nuevo','Empresa','PDF anterior','Página anterior','PDF nuevo','Página nueva']].concat(changeRows(state.report));
    var blob=new root.Blob(['\ufeff'+csv(rows)],{type:'text/csv;charset=utf-8'}),url=root.URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='ERSeP-cambios-horarios-'+state.report.publication_date+'.csv';link.click();root.URL.revokeObjectURL(url);status.textContent='Informe CSV descargado.';status.className='export-status';
  }
  function populateIndex(){
    var publications=state.index.publications||[];$('history-date').min=state.index.first_available_date||'';$('history-date').max=todayIso();if(!$('history-date').value)$('history-date').value=todayIso();
    $('history-coverage').textContent='Cobertura desde '+dateText(state.index.first_available_date)+' · '+publications.length+' publicaciones preservadas.';
    var withReports=publications.filter(function(item){return item.changes;}).slice().reverse();
    $('change-publication').innerHTML='<option value="">Elegir</option>'+withReports.map(function(item){return '<option value="'+esc(item.publication_date)+'">'+esc(dateText(item.publication_date))+'</option>';}).join('');
    if(withReports.length){$('change-publication').value=withReports[0].publication_date;loadReport();}
    return loadForDate();
  }
  function activate(){
    state.activated=true;if(state.index)return loadForDate();
    return getJSON('data/historico/indice.json').then(function(index){if(index.schema_version!==1)throw new Error('El índice histórico no es compatible.');state.index=index;return populateIndex();}).catch(function(error){$('history-coverage').textContent='No se pudo cargar el historial.';$('history-publication-status').textContent=error.message;});
  }
  function bind(){
    if(state.bound)return;state.bound=true;var timer;
    $('history-date').addEventListener('change',loadForDate);
    $('history-search').addEventListener('input',function(){root.clearTimeout(timer);timer=root.setTimeout(function(){updateOptions();render();},160);});
    FIELDS.forEach(function(field){$('history-'+field).addEventListener('change',function(){updateOptions();render();});});
    $('history-reset').addEventListener('click',resetFilters);$('history-print').addEventListener('click',printHistory);
    $('change-publication').addEventListener('change',loadReport);$('change-print').addEventListener('click',printChanges);$('change-csv').addEventListener('click',downloadChanges);
  }
  bind();
  return {activate:activate,selectPublication:selectPublication,weekday:weekday,csv:csv};
}));
