(function () {
  'use strict';
  var COLORS = { 'ESTE-SUDESTE':'#22c55e', 'NORESTE':'#06b6d4', 'NORTE':'#8b5cf6', 'PUNILLA':'#ec4899', 'RUTA 5':'#3b82f6', 'SIERRAS CHICAS':'#14b8a6', 'SUR':'#f59e0b', 'TRASLASIERRA':'#ef4444', 'MIXED':'#64748b' };
  var DAYS = { '1':'Lunes', '2':'Martes', '3':'Miércoles', '4':'Jueves', '5':'Viernes', '6':'Sábado', '7':'Domingo' };
  var DIRECTIONS = { I:'Ida', V:'Vuelta' };
  var FIELDS = ['origin','destination','corridor','line','direction','day','company','modality'];
  var state = { data:null, geo:null, routes:null, engine:null, map:null, layer:null, focus:null, animationId:null, results:[], routeError:false, mode:'users', inspectorDirections:new Set(['I','V']), inspectorAvailableDirections:['I','V'], inspectorAllDirections:true, inspectorCompanies:new Set(), inspectorAvailableCompanies:[], inspectorAllCompanies:true, inspectorLines:new Set(), inspectorAvailableLines:[], inspectorAllLines:true, inspectorRecords:[] };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var unique = function (xs) { return Array.from(new Set(xs)); };
  var R = window.TransportRoutes;
  function today() { return {Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'America/Argentina/Cordoba'}).format(new Date())]; }
  function date(iso) { return iso ? new Intl.DateTimeFormat('es-AR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(iso+'T00:00:00Z')) : 'Sin fecha'; }
  function duration(n) { if (!Number.isFinite(n)) return 'Sin estimación'; return (n >= 60 ? Math.floor(n / 60)+' h ' : '') + (n % 60 || n < 60 ? n % 60+' min' : ''); }
  function clockHTML(n) { var c=R.clock(n); return esc(c.time)+(c.dayOffset ? '<small class="day-offset">+'+c.dayOffset+' día'+(c.dayOffset === 1 ? '' : 's')+'</small>' : ''); }
  function clockText(n) { var c=R.clock(n); return c.time+(c.dayOffset ? ' (+'+c.dayOffset+' día'+(c.dayOffset === 1 ? '' : 's')+')' : ''); }
  function filters() { var f={search:$('filter-search').value.trim()}; FIELDS.forEach(function (k) { f[k]=$('filter-'+k).value; }); return f; }
  function placeLabel(id) { return state.engine.label(id); }
  function journeyName(j) { return placeLabel(j.origin)+' → '+placeLabel(j.destination); }
  function fullName(j) { var stops=j.model.stops; return placeLabel(stops[0].place_id)+' → '+placeLabel(stops[stops.length-1].place_id); }
  function serviceOrigin(j) { return placeLabel(j.model.stops[0].place_id); }
  function finalDestination(j) { return placeLabel(j.model.stops[j.model.stops.length-1].place_id); }
  function parseTime(value) { if(!/^\d{2}:\d{2}$/.test(value||''))return null;var p=value.split(':').map(Number);return p[0]*60+p[1]; }
  function updateOptions() {
    var f=filters(), first={origin:'Todas las localidades',destination:'Todas las localidades',corridor:'Todos',line:'Todas',direction:'Ambos',day:'Todos',company:'Todas',modality:'Todas'};
    FIELDS.forEach(function (field) {
      var el=$('filter-'+field), old=el.value, oldLabel=el.options[el.selectedIndex] ? el.options[el.selectedIndex].textContent : old;
      var values=state.engine.facet(field,f), labels=field==='day'?DAYS:field==='direction'?DIRECTIONS:null;
      function label(v) { return field==='origin'||field==='destination' ? placeLabel(v) : labels ? labels[v] : v; }
      values.sort(function(a,b){return field==='day'?Number(a)-Number(b):label(a).localeCompare(label(b),'es');});
      el.innerHTML='<option value="">'+first[field]+'</option>'+values.map(function(v){return '<option value="'+esc(v)+'">'+esc(label(v))+'</option>';}).join('');
      // Nunca borra una elección silenciosamente: una combinación imposible queda visible.
      if(old && values.indexOf(old)===-1) el.insertAdjacentHTML('beforeend','<option value="'+esc(old)+'" disabled>'+esc(oldLabel.replace(/ · sin coincidencias$/, ''))+' · sin coincidencias</option>');
      el.value=old;
    });
  }
  function stopAnimation() { if(state.animationId!==null) cancelAnimationFrame(state.animationId); state.animationId=null; }
  function curve(a,b) {
    var points=[],steps=22,dx=b.lon-a.lon,dy=b.lat-a.lat,lat=(a.lat+b.lat)/2+dx*.06,lon=(a.lon+b.lon)/2-dy*.06;
    for(var i=0;i<=steps;i++){var t=i/steps,u=1-t;points.push([u*u*a.lat+2*u*t*lat+t*t*b.lat,u*u*a.lon+2*u*t*lon+t*t*b.lon]);}
    return points;
  }
  function startArrow(points,color) {
    if(points.length<2)return;
    var icon=L.divIcon({className:'route-arrow-marker',html:'<span class="moving-arrow" style="--arrow-color:'+color+'">➤</span>',iconSize:[34,34],iconAnchor:[17,17]});
    var marker=L.marker(points[0],{interactive:false,zIndexOffset:1000,icon:icon}).addTo(state.layer);
    var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced){marker.setLatLng(points[Math.floor(points.length/2)]);return;}
    var cumulative=[0];
    for(var i=1;i<points.length;i++){var dx=(points[i][1]-points[i-1][1])*Math.cos(points[i][0]*Math.PI/180),dy=points[i][0]-points[i-1][0];cumulative.push(cumulative[i-1]+Math.sqrt(dx*dx+dy*dy));}
    var total=cumulative[cumulative.length-1],started=null;
    if(total===0)return;
    function tick(timestamp){
      if(started===null)started=timestamp;
      var distance=(((timestamp-started)%6500)/6500)*total,index=0;
      while(index<cumulative.length-2 && cumulative[index+1]<distance)index++;
      var a=points[index],b=points[index+1],span=cumulative[index+1]-cumulative[index],f=span?(distance-cumulative[index])/span:0;
      marker.setLatLng([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);
      var element=marker.getElement(),arrow=element&&element.querySelector('.moving-arrow');
      if(arrow){var pa=state.map.latLngToLayerPoint(a),pb=state.map.latLngToLayerPoint(b);arrow.style.transform='rotate('+Math.atan2(pb.y-pa.y,pb.x-pa.x)*180/Math.PI+'deg)';}
      state.animationId=requestAnimationFrame(tick);
    }
    state.animationId=requestAnimationFrame(tick);
  }
  function marker(place,color,label,active){
    return L.circleMarker([place.lat,place.lon],{radius:active?8:4.5,weight:active?3:1.5,color:active?'#fff':color,fillColor:color,fillOpacity:.9}).bindTooltip('<strong>'+esc(place.name)+'</strong><br>'+esc(label),{direction:'top'}).addTo(state.layer);
  }
  function renderMap(journeys,active){
    stopAnimation();
    var locations=new Map();
    journeys.forEach(function(j){j.model.stops.forEach(function(stop){var p=state.engine.places[stop.place_id];if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon))return;if(!locations.has(p.id))locations.set(p.id,{place:p,corridors:new Set()});locations.get(p.id).corridors.add(j.service.corridor);});});
    $('kpi-mapped').textContent=locations.size.toLocaleString('es-AR');
    if(!state.map){$('map-status').textContent='El mapa no está disponible. Podés consultar los horarios y la secuencia igualmente.';return;}
    state.layer.clearLayers();
    if(!active){
      var bounds=[];
      locations.forEach(function(v){var color=v.corridors.size>1?COLORS.MIXED:COLORS[Array.from(v.corridors)[0]];marker(v.place,color,'Localidad de subida o bajada',false);bounds.push([v.place.lat,v.place.lon]);});
      if(bounds.length)state.map.fitBounds(bounds,{padding:[25,25],maxZoom:10});
      else state.map.setView([-31.7,-64],7);
      $('map-status').textContent='Elegí un resultado para ver su secuencia. Al iniciar solo se muestran localidades.';
      return;
    }
    var coordinates=state.engine.coordinates(active),color=COLORS[active.service.corridor]||COLORS.MIXED,points=[],bounds=[],selectedMissing=0,totalMissing=0,previousLocated=null,selectedBridge=false;
    coordinates.forEach(function(p,i){
      if(!p){totalMissing++;if(i>=active.from && i<=active.to)selectedMissing++;return;}
      bounds.push([p.lat,p.lon]);
      var stop=active.model.stops[i],n=i===active.from?active.boarding:i===0?active.service.minutes:active.service.minutes+stop.arrival_offset;
      var label=(i===active.from?'Subida · ':i===active.to?'Bajada · ':'Paso '+(i+1)+' · ')+(Number.isFinite(stop.arrival_offset)?clockText(n)+(i===0?' · salida PDF':' · estimado'):'sin estimación');
      marker(p,color,label,i===active.from||i===active.to);
      if(previousLocated!==null){
        var previous=coordinates[previousLocated],selected=previousLocated>=active.from&&i<=active.to,gap=i-previousLocated>1,segment=curve(previous,p);
        L.polyline(segment,{color:color,weight:selected?4:2,opacity:selected?.85:.3,dashArray:gap?'2 12':selected?'4 8':'3 8',className:gap?'schematic-bridge':''}).addTo(state.layer);
        if(selected){points=points.concat(points.length?segment.slice(1):segment);if(gap)selectedBridge=true;}
      }
      previousLocated=i;
    });
    var endpointsLocated=Boolean(coordinates[active.from]&&coordinates[active.to]);
    if(endpointsLocated)startArrow(points,color);
    if(bounds.length)state.map.fitBounds(bounds,{padding:[40,40],maxZoom:12});
    if(!endpointsLocated)$('map-status').textContent='No se puede ubicar la flecha porque el origen o el destino seleccionado todavía no tiene coordenadas.';
    else if(selectedBridge)$('map-status').textContent='Mapa esquemático: '+selectedMissing+' localidades intermedias sin coordenadas se señalan mediante conectores punteados. La flecha orienta el recorrido; no representa calles ni un vehículo en vivo.';
    else if(totalMissing)$('map-status').textContent='Tu tramo está ubicado y puede animarse. El recorrido completo contiene '+totalMissing+' localidades pendientes fuera del tramo seleccionado.';
    else $('map-status').textContent=active.model.profile?'Recorrido en orden. Tu tramo aparece destacado; la flecha no representa un vehículo en vivo.':'Solo cabeceras: la flecha une los puntos disponibles; el detalle intermedio de esta variante todavía está pendiente.';
  }
  function serviceHTML(j){
    var s=j.service,active=state.focus===j.key,days=j.days.map(function(d){return DAYS[d];}).join(', ');
    return '<button class="service-item '+(active?'active':'')+'" type="button" data-journey="'+esc(j.key)+'" aria-pressed="'+active+'">'+
      '<span class="service-time"><b>'+clockHTML(j.boarding)+'</b><small>'+ (j.estimatedBoarding?'Paso estimado':'Salida PDF')+'</small></span><span class="service-copy">'+
      '<strong>'+esc(journeyName(j))+'</strong><small>'+esc(s.company)+' · <b>'+esc(DIRECTIONS[s.direction])+'</b><br>'+esc(days)+'</small>'+
      '<span class="trip-timing">Llegada: '+(j.arrival===null?'sin estimación':clockHTML(j.arrival)+' · estimada')+(j.duration!==null?' · '+esc(duration(j.duration)):'')+'</span>'+
      '<small class="published-source">Salida publicada: '+esc(s.time)+' · '+esc(serviceOrigin(j))+'</small><small class="final-destination">Destino final · cartel: '+esc(finalDestination(j))+'</small>'+
      '<span class="service-tags"><span>'+esc(s.modality)+'</span>'+(s.route?'<span class="route-tag">'+esc(s.route)+'</span>':'')+'<span class="'+(j.model.profile?'':'pending-tag')+'">'+(j.model.profile?j.model.stops.length+' localidades':'Intermedias pendientes')+'</span></span></span></button>';
  }
  function renderDetails(j){
    var el=$('journey-detail');el.hidden=!j;if(!j){el.innerHTML='';return;}
    var p=j.model.profile,s=j.service;
    var timeline=j.model.stops.map(function(stop,i){
      var selected=i>=j.from&&i<=j.to,place=state.engine.places[stop.place_id],number=i===j.from?j.boarding:Number.isFinite(stop.arrival_offset)?s.minutes+stop.arrival_offset:null;
      var title=i===j.from?'Subida':i===j.to?'Bajada':i===0?'Cabecera de salida':'Paso intermedio';
      var dwell=stop.departure_offset!==stop.arrival_offset && Number.isFinite(stop.departure_offset);
      var notes=p?(p.observations||[]).filter(function(o){return o.place_id===stop.place_id;}):[];
      return '<li class="'+(selected?'in-trip':'outside-trip')+'"><span class="stop-number">'+(i+1)+'</span><div><strong>'+esc(place.name)+'</strong><small>'+title+(place.lat===null?' · ubicación pendiente':'')+'</small>'+notes.map(function(o){return '<small class="stop-warning">Nota de base: '+esc(o.text)+'</small>';}).join('')+'</div><div class="stop-time">'+clockHTML(number)+'<small>'+(i===0?'Salida publicada':'Estimado')+(dwell?'<br>'+(i===j.from?'Llegada est. '+clockText(s.minutes+stop.arrival_offset):'Salida est. '+clockText(s.minutes+stop.departure_offset)):'')+'</small></div></li>';
    }).join('');
    el.innerHTML='<header><div><span class="eyebrow">Tu tramo · '+esc(DIRECTIONS[s.direction])+'</span><h3>'+esc(journeyName(j))+'</h3></div><button id="close-journey" type="button" class="reset-button" aria-label="Cerrar recorrido seleccionado">Cerrar</button></header>'+
      '<div class="journey-summary"><div><span>Subida '+(j.estimatedBoarding?'estimada':'publicada')+'</span><strong>'+clockHTML(j.boarding)+'</strong></div><div><span>Bajada estimada</span><strong>'+clockHTML(j.arrival)+'</strong></div><div><span>Tiempo estimado</span><strong>'+esc(duration(j.duration))+'</strong></div></div>'+
      '<p class="journey-description">'+esc(s.company)+' · '+esc(s.modality)+'<br>Recorrido completo: '+esc(fullName(j))+'<br><strong>Destino final · cartel: '+esc(finalDestination(j))+'</strong></p>'+
      (!p?'<p class="review-warning">No hay un recorrido intermedio vinculado con suficiente certeza para esta variante. Se conserva la salida publicada; no se calculan horas de llegada.</p>':'<p class="estimate-note">Los pasos se estiman sumando las demoras del recorrido a la salida del PDF. Pueden variar. La animación no mide la velocidad real.</p>')+
      '<ol class="stops-list">'+timeline+'</ol>'+
      (p&&p.notes.length?'<div class="review-warning"><strong>Observaciones de la base · para revisión</strong><ul>'+p.notes.map(function(n){return '<li>'+esc(n)+'</li>';}).join('')+'</ul><p>Se conservan como anotaciones, no se aplican automáticamente como restricciones de subida o bajada.</p></div>':'')+
      '<details class="source-details"><summary>Fuentes y referencia de salida</summary><p><strong>Salida PDF:</strong> '+esc(s.time)+' de '+esc(serviceOrigin(j))+' · <strong>Destino final:</strong> '+esc(finalDestination(j))+'. '+esc(s.service_days_text)+'.</p><p>'+esc(s.source_file)+' · página '+esc(s.source_page)+'</p>'+(p?'<p>Recorrido: '+esc(state.routes.source.filename)+' · hoja '+esc(p.source_sheet)+' · filas '+p.source_rows[0]+'–'+p.source_rows[p.source_rows.length-1]+'. La hora base del Excel no se utiliza como salida vigente.</p>':'')+'</details>';
  }
  function render(){
    var journeys=state.engine.query(filters());state.results=journeys;
    var active=journeys.find(function(j){return j.key===state.focus;});if(!active)state.focus=null;
    $('kpi-services').textContent=unique(journeys.map(function(j){return j.service.id;})).length.toLocaleString('es-AR');
    $('kpi-lines').textContent=unique(journeys.map(function(j){return j.service.line_id;})).length.toLocaleString('es-AR');
    $('kpi-companies').textContent=unique(journeys.map(function(j){return j.service.company;})).length.toLocaleString('es-AR');
    $('result-count').textContent=journeys.length.toLocaleString('es-AR');
    $('results').innerHTML=journeys.length?journeys.slice(0,200).map(serviceHTML).join('')+(journeys.length>200?'<div class="empty-state">Primeros 200 resultados. Usá los filtros para precisar el viaje.</div>':''):'<div class="empty-state"><strong>No encontramos viajes para esa combinación.</strong><p>Revisá el sentido y el día de subida. Algunos servicios todavía no tienen intermedias vinculadas; también podés buscarlos por línea o cabeceras.</p></div>';
    renderMap(journeys,active);renderDetails(active);
  }
  function changed(){state.focus=null;updateOptions();render();}
  function setSelect(id,values,first,labeler){
    var el=$(id),old=el.value;
    values=unique(values).sort(function(a,b){return (labeler?labeler(a):a).localeCompare(labeler?labeler(b):b,'es');});
    el.innerHTML='<option value="">'+first+'</option>'+values.map(function(v){return '<option value="'+esc(v)+'">'+esc(labeler?labeler(v):v)+'</option>';}).join('');
    el.value=values.indexOf(old)!==-1?old:'';
  }
  function modelStopsAt(model,location){return !location||model.stops.some(function(stop){return stop.place_id===location;});}
  function inspectorFacetModels(exclude){
    var corridor=$('inspector-corridor').value,location=$('inspector-locality').value;
    return state.engine.models.filter(function(model){
      if(exclude!=='corridor'&&corridor&&model.service.corridor!==corridor)return false;
      if(exclude!=='directions'){
        if(!state.inspectorAllDirections&&!state.inspectorDirections.size&&!exclude)return false;
        if(state.inspectorDirections.size&&!state.inspectorDirections.has(model.service.direction))return false;
      }
      if(exclude!=='companies'){
        if(!state.inspectorAllCompanies&&!state.inspectorCompanies.size&&!exclude)return false;
        if(state.inspectorCompanies.size&&!state.inspectorCompanies.has(model.service.company))return false;
      }
      return exclude==='locality'||modelStopsAt(model,location);
    });
  }
  function renderInspectorDirections(directions){
    $('inspector-directions').innerHTML=directions.length?directions.map(function(direction){return '<label class="direction-option"><input type="checkbox" data-inspector-direction="'+esc(direction)+'" '+(state.inspectorDirections.has(direction)?'checked':'')+'><span>'+esc(DIRECTIONS[direction]||direction)+'</span></label>';}).join(''):'<div class="line-empty">No hay sentidos para esta combinación.</div>';
  }
  function renderInspectorCompanies(companies){
    $('inspector-companies').innerHTML=companies.length?companies.map(function(company){return '<label class="company-option"><input type="checkbox" data-inspector-company="'+esc(company)+'" '+(state.inspectorCompanies.has(company)?'checked':'')+'><span>'+esc(company)+'</span></label>';}).join(''):'<div class="line-empty">No hay empresas para esta combinación.</div>';
  }
  function renderInspectorLines(lines){
    $('inspector-lines').innerHTML=lines.length?lines.map(function(line){return '<label class="line-option"><input type="checkbox" data-inspector-line="'+esc(line)+'" '+(state.inspectorLines.has(line)?'checked':'')+'><span>'+esc(line)+'</span></label>';}).join(''):'<div class="line-empty">No hay líneas para esta combinación.</div>';
  }
  function updateInspectorControls(){
    var directions=unique(inspectorFacetModels('directions').map(function(m){return m.service.direction;})).sort();
    if(state.inspectorAllDirections)state.inspectorDirections=new Set(directions);
    else state.inspectorDirections=new Set(directions.filter(function(direction){return state.inspectorDirections.has(direction);}));
    state.inspectorAvailableDirections=directions;renderInspectorDirections(directions);
    var companies=unique(inspectorFacetModels('companies').map(function(m){return m.service.company;})).sort(function(a,b){return a.localeCompare(b,'es');});
    if(state.inspectorAllCompanies)state.inspectorCompanies=new Set(companies);
    else state.inspectorCompanies=new Set(companies.filter(function(company){return state.inspectorCompanies.has(company);}));
    state.inspectorAvailableCompanies=companies;renderInspectorCompanies(companies);
    setSelect('inspector-corridor',inspectorFacetModels('corridor').map(function(m){return m.service.corridor;}),'Todos');
    var placeIds=[];
    inspectorFacetModels('locality').forEach(function(model){model.stops.forEach(function(stop){placeIds.push(stop.place_id);});});
    setSelect('inspector-locality',placeIds,'Elegir localidad',placeLabel);
    companies=unique(inspectorFacetModels('companies').map(function(m){return m.service.company;})).sort(function(a,b){return a.localeCompare(b,'es');});
    if(state.inspectorAllCompanies)state.inspectorCompanies=new Set(companies);
    else state.inspectorCompanies=new Set(companies.filter(function(company){return state.inspectorCompanies.has(company);}));
    state.inspectorAvailableCompanies=companies;renderInspectorCompanies(companies);
    var models=inspectorFacetModels();
    var lines=unique(models.map(function(m){return m.service.line;})).sort(function(a,b){return a.localeCompare(b,'es');});
    if(state.inspectorAllLines)state.inspectorLines=new Set(lines);
    else state.inspectorLines=new Set(lines.filter(function(line){return state.inspectorLines.has(line);}));
    state.inspectorAvailableLines=lines;
    renderInspectorLines(lines);
  }
  function inspectionRow(record){
    var s=record.service,kind=record.publishedAtControl?'Publicado':'Estimado';
    return '<tr><td><strong class="inspection-time">'+clockHTML(record.at)+'</strong><small>'+esc(record.days.map(function(d){return DAYS[d];}).join(', '))+'</small></td><td><span class="time-kind '+(record.publishedAtControl?'published':'')+'">'+kind+'</span></td><td><strong>'+esc(s.company)+'</strong><small>'+esc(s.line)+'</small></td><td>'+esc(DIRECTIONS[s.direction])+'<small>'+esc(s.modality)+'</small></td><td><strong>'+esc(placeLabel(record.finalDestination))+'</strong><small>Cartel del colectivo</small></td><td><strong>'+esc(s.time)+' · '+esc(placeLabel(record.origin))+'</strong><small>'+esc(s.source_file)+' · pág. '+esc(s.source_page)+'</small></td></tr>';
  }
  function renderInspector(){
    var locality=$('inspector-locality').value,tbody=$('inspector-results');
    state.inspectorRecords=[];
    if(!locality){$('inspector-count').textContent='0';tbody.innerHTML='<tr><td colspan="6">Elegí la localidad donde se realizará el control.</td></tr>';$('inspector-summary').textContent='Elegí una localidad para preparar el control.';return;}
    if(!state.inspectorDirections.size){$('inspector-count').textContent='0';tbody.innerHTML='<tr><td colspan="6">Seleccioná Ida, Vuelta o ambos sentidos.</td></tr>';$('inspector-summary').textContent='No hay sentidos seleccionados.';return;}
    if(!state.inspectorCompanies.size){$('inspector-count').textContent='0';tbody.innerHTML='<tr><td colspan="6">Seleccioná al menos una empresa.</td></tr>';$('inspector-summary').textContent='No hay empresas seleccionadas.';return;}
    if(!state.inspectorLines.size){$('inspector-count').textContent='0';tbody.innerHTML='<tr><td colspan="6">Seleccioná al menos una línea.</td></tr>';$('inspector-summary').textContent='No hay líneas seleccionadas.';return;}
    var records=state.engine.control({
      location:locality,
      corridor:$('inspector-corridor').value,
      directions:Array.from(state.inspectorDirections),
      companies:Array.from(state.inspectorCompanies),
      day:$('inspector-day').value,
      lines:Array.from(state.inspectorLines),
      fromMinute:parseTime($('inspector-from').value),
      toMinute:parseTime($('inspector-to').value)
    });
    state.inspectorRecords=records;
    $('inspector-count').textContent=records.length.toLocaleString('es-AR');
    tbody.innerHTML=records.length?records.slice(0,500).map(inspectionRow).join(''):'<tr><td colspan="6">No hay servicios con horario calculable para esta selección.</td></tr>';
    var base=$('inspector-delegation').value||'Base sin indicar',point=$('inspector-point').value.trim();
    var directionText=Array.from(state.inspectorDirections).sort().map(function(direction){return DIRECTIONS[direction];}).join(' + ');
    $('inspector-summary').textContent=base+' · Control en '+placeLabel(locality)+(point?' · '+point:'')+' · '+directionText+' · '+state.inspectorCompanies.size+' empresa'+(state.inspectorCompanies.size===1?'':'s')+' · '+state.inspectorLines.size+' línea'+(state.inspectorLines.size===1?'':'s')+' · '+records.length.toLocaleString('es-AR')+' servicios esperados'+(records.length>500?' (se muestran los primeros 500)':'')+'.';
  }
  function inspectorChanged(){updateInspectorControls();renderInspector();}
  function setMode(mode){
    state.mode=mode;var users=mode==='users',inspectors=mode==='inspectors',claims=mode==='claims';
    $('user-mode-panel').hidden=!users;$('inspector-mode-panel').hidden=!inspectors;$('claims-mode-panel').hidden=!claims;
    [['users',users],['inspectors',inspectors],['claims',claims]].forEach(function(item){var button=$('mode-'+item[0]);button.setAttribute('aria-pressed',String(item[1]));button.className='mode-button'+(item[1]?' active':'');});
    $('page-title').textContent=users?'¿Desde dónde y hasta dónde viajás?':inspectors?'Prepará un control de horarios':'Verificá el cronograma de una fecha';
    $('page-description').textContent=users?'Consultá salidas publicadas, localidades intermedias y tiempos estimados. Todos los filtros se combinan.':inspectors?'Elegí la base, el lugar del operativo, los sentidos y varias empresas y líneas para ordenar los servicios que deben pasar.':'Consultá qué servicios figuraban en la publicación disponible para la fecha del reclamo y revisá los cambios semanales.';
    if(users){if(state.map&&state.map.invalidateSize)state.map.invalidateSize();render();}
    else if(inspectors){stopAnimation();renderInspector();}
    else{stopAnimation();if(window.TransportHistory)window.TransportHistory.activate();}
  }
  function optionText(id,fallback){var el=$(id),option=el&&el.options[el.selectedIndex];return option&&option.value?option.textContent:fallback;}
  function exportDate(){return new Intl.DateTimeFormat('es-AR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Argentina/Cordoba'}).format(new Date());}
  function exportFileDate(){return new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'America/Argentina/Cordoba'}).format(new Date());}
  function showExportStatus(mode,message,error){var el=$(mode==='users'?'user-export-status':'inspector-export-status');el.textContent=message||'';el.className='export-status'+(error?' error':'');}
  function userExportPayload(){
    var journeys=state.results,origin=optionText('filter-origin','Todas las localidades'),destination=optionText('filter-destination','Todas las localidades');
    return {
      title:'Consulta de horarios interurbanos',kind:'Atención a usuarios',count:journeys.length,
      meta:[['Origen',origin],['Destino',destination],['Corredor',optionText('filter-corridor','Todos')],['Empresa',optionText('filter-company','Todas')],['Línea',optionText('filter-line','Todas')],['Día de subida',optionText('filter-day','Todos')]],
      columns:['Hora de subida','Trayecto consultado','Empresa y línea','Llegada estimada','Destino final · cartel'],
      rows:journeys.map(function(j){return [clockText(j.boarding)+(j.estimatedBoarding?' · estimado':' · publicado'),journeyName(j),j.service.company+'\n'+j.service.line,j.arrival===null?'Sin estimación':clockText(j.arrival)+' · '+duration(j.duration),finalDestination(j)];}),
      imageRows:journeys.map(function(j){return {time:clockText(j.boarding),primary:journeyName(j)+' · '+j.service.company,secondary:j.service.line+' · '+(j.estimatedBoarding?'Paso estimado':'Salida publicada'),tertiary:'Llega '+(j.arrival===null?'sin estimación':clockText(j.arrival))+' · Cartel: '+finalDestination(j)};}),
      note:'La salida de cabecera proviene del cronograma publicado. Los pasos y llegadas en localidades intermedias son estimados y pueden variar.'
    };
  }
  function inspectorExportPayload(){
    var locality=$('inspector-locality').value,base=$('inspector-delegation').value||'Sin indicar',point=$('inspector-point').value.trim()||'Sin indicar',records=state.inspectorRecords;
    return {
      title:'Planilla de control de horarios',kind:'Control de inspectores',count:records.length,
      meta:[['Base del equipo',base],['Lugar de control',locality?placeLabel(locality):'Sin indicar'],['Terminal o punto',point],['Corredor',optionText('inspector-corridor','Todos')],['Sentidos',Array.from(state.inspectorDirections).sort().map(function(direction){return DIRECTIONS[direction];}).join(' + ')||'Ninguno'],['Empresas',Array.from(state.inspectorCompanies).join(', ')||'Ninguna'],['Líneas',Array.from(state.inspectorLines).join(', ')||'Ninguna'],['Día',optionText('inspector-day','Todos')],['Franja',$('inspector-from').value+'–'+$('inspector-to').value]],
      columns:['Hora de control','Tipo','Empresa y línea','Sentido','Destino final · cartel','Salida publicada'],
      rows:records.map(function(record){var s=record.service;return [clockText(record.at)+'\n'+record.days.map(function(d){return DAYS[d];}).join(', '),record.publishedAtControl?'Publicado':'Estimado',s.company+'\n'+s.line,DIRECTIONS[s.direction]+' · '+s.modality,placeLabel(record.finalDestination),s.time+' · '+placeLabel(record.origin)];}),
      imageRows:records.map(function(record){var s=record.service;return {time:clockText(record.at),primary:s.company+' · '+s.line,secondary:(record.publishedAtControl?'Publicado':'Estimado')+' · '+DIRECTIONS[s.direction]+' · '+record.days.map(function(d){return DAYS[d];}).join(', '),tertiary:'Cartel: '+placeLabel(record.finalDestination)+' · Sale '+s.time+' de '+placeLabel(record.origin)};}),
      note:'Publicado indica una salida en la cabecera. Estimado indica el horario calculado de paso por una localidad intermedia; puede variar y no representa seguimiento en vivo.'
    };
  }
  function exportPayload(mode){return mode==='users'?userExportPayload():inspectorExportPayload();}
  function validateExport(mode,payload,limit,label){
    if(!payload.count){showExportStatus(mode,'No hay servicios para exportar con esta selección.',true);return false;}
    if(payload.count>limit){showExportStatus(mode,'La lista tiene '+payload.count.toLocaleString('es-AR')+' servicios. Aplicá más filtros hasta '+limit+' para generar '+label+'.',true);return false;}
    return true;
  }
  function buildPrintSheet(payload){
    var meta=payload.meta.map(function(item){return '<div><span>'+esc(item[0])+'</span><strong>'+esc(item[1])+'</strong></div>';}).join('');
    var head=payload.columns.map(function(column){return '<th>'+esc(column)+'</th>';}).join('');
    var rows=payload.rows.map(function(row){return '<tr>'+row.map(function(cell){return '<td>'+esc(cell).replace(/\n/g,'<br>')+'</td>';}).join('')+'</tr>';}).join('');
    $('print-sheet').innerHTML='<header class="print-head"><img class="print-logo" src="assets/logo-ersep.png" alt="ERSeP"><div><h1>'+esc(payload.title)+'</h1><p><strong>'+esc(payload.kind)+'</strong> · Generado el '+esc(exportDate())+'</p><p>'+payload.count.toLocaleString('es-AR')+' servicios incluidos</p></div></header><section class="print-meta">'+meta+'</section><table class="print-table"><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table><p class="print-note">'+esc(payload.note)+'</p>';
  }
  function printExport(mode){
    var payload=exportPayload(mode);if(!validateExport(mode,payload,500,'el PDF'))return;
    buildPrintSheet(payload);showExportStatus(mode,'Se abrió la impresión. Elegí una impresora o “Guardar como PDF”.',false);window.print();
  }
  function canvasText(ctx,text,x,y,maxWidth){
    text=String(text||'');if(ctx.measureText(text).width<=maxWidth){ctx.fillText(text,x,y);return;}
    while(text.length>1&&ctx.measureText(text+'…').width>maxWidth)text=text.slice(0,-1);
    ctx.fillText(text+'…',x,y);
  }
  function imageExport(mode){
    var payload=exportPayload(mode);if(!validateExport(mode,payload,50,'la imagen'))return;
    try{
      var width=1200,rowHeight=86,metaRows=Math.ceil(payload.meta.length/2),headerHeight=190+metaRows*34,height=headerHeight+payload.imageRows.length*rowHeight+90;
      var canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);var logo=$('export-logo-source');if(logo&&(logo.complete||logo.naturalWidth))ctx.drawImage(logo,35,18,220,146);
      ctx.fillStyle='#8e1027';ctx.font='700 31px Arial';ctx.fillText(payload.title,285,58);ctx.fillStyle='#222';ctx.font='700 19px Arial';ctx.fillText(payload.kind,285,91);ctx.fillStyle='#555';ctx.font='16px Arial';ctx.fillText('Generado el '+exportDate()+' · '+payload.count.toLocaleString('es-AR')+' servicios',285,121);
      ctx.fillStyle='#a6192e';ctx.fillRect(35,165,width-70,4);var metaY=196;ctx.font='13px Arial';
      payload.meta.forEach(function(item,index){var col=index%2,row=Math.floor(index/2),x=35+col*565,y=metaY+row*34;ctx.fillStyle='#777';ctx.font='700 11px Arial';ctx.fillText(item[0].toUpperCase(),x,y);ctx.fillStyle='#222';ctx.font='15px Arial';canvasText(ctx,item[1],x,y+18,535);});
      var startY=headerHeight;payload.imageRows.forEach(function(row,index){var y=startY+index*rowHeight;ctx.fillStyle=index%2?'#f5f7f8':'#fff';ctx.fillRect(35,y,width-70,rowHeight);ctx.fillStyle='#d4d9dc';ctx.fillRect(35,y+rowHeight-1,width-70,1);ctx.fillStyle='#8e1027';ctx.font='700 24px Arial';ctx.fillText(row.time,52,y+32);ctx.fillStyle='#111';ctx.font='700 16px Arial';canvasText(ctx,row.primary,175,y+25,950);ctx.fillStyle='#46515a';ctx.font='14px Arial';canvasText(ctx,row.secondary,175,y+48,950);ctx.fillStyle='#5d6870';ctx.font='13px Arial';canvasText(ctx,row.tertiary,175,y+69,950);});
      var noteY=height-58;ctx.fillStyle='#555';ctx.font='13px Arial';canvasText(ctx,payload.note,35,noteY,width-70);
      var link=document.createElement('a');link.href=canvas.toDataURL('image/png');link.download='ERSeP-'+(mode==='users'?'consulta':'control')+'-'+exportFileDate()+'.png';link.click();showExportStatus(mode,'Imagen descargada con '+payload.count.toLocaleString('es-AR')+' servicios.',false);
    }catch(error){showExportStatus(mode,'No se pudo generar la imagen en este navegador.',true);}
  }
  function bind(){
    var timer;
    $('filter-search').addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(changed,160);});
    FIELDS.forEach(function(f){$('filter-'+f).addEventListener('change',changed);});
    $('reset-filters').addEventListener('click',function(){clearTimeout(timer);$('filter-search').value='';FIELDS.forEach(function(f){$('filter-'+f).value='';});$('filter-day').value=String(today());changed();});
    $('results').addEventListener('click',function(event){var button=event.target.closest('[data-journey]');if(!button)return;var key=button.getAttribute('data-journey');state.focus=state.focus===key?null:key;render();});
    $('journey-detail').addEventListener('click',function(event){if(event.target.closest('#close-journey')){state.focus=null;render();}});
    $('mode-users').addEventListener('click',function(){setMode('users');});$('mode-inspectors').addEventListener('click',function(){setMode('inspectors');});$('mode-claims').addEventListener('click',function(){setMode('claims');});
    ['inspector-corridor','inspector-locality'].forEach(function(id){$(id).addEventListener('change',inspectorChanged);});
    ['inspector-day','inspector-from','inspector-to','inspector-delegation'].forEach(function(id){$(id).addEventListener('change',renderInspector);});
    $('inspector-point').addEventListener('input',renderInspector);
    $('inspector-directions').addEventListener('change',function(event){var direction=event.target.getAttribute('data-inspector-direction');if(!direction)return;if(event.target.checked)state.inspectorDirections.add(direction);else state.inspectorDirections.delete(direction);state.inspectorAllDirections=state.inspectorAvailableDirections.length>0&&state.inspectorAvailableDirections.every(function(value){return state.inspectorDirections.has(value);});updateInspectorControls();renderInspector();});
    $('inspector-directions-all').addEventListener('click',function(){state.inspectorAllDirections=true;state.inspectorDirections=new Set(state.inspectorAvailableDirections);updateInspectorControls();renderInspector();});
    $('inspector-directions-none').addEventListener('click',function(){state.inspectorAllDirections=false;state.inspectorDirections=new Set();updateInspectorControls();renderInspector();});
    $('inspector-companies').addEventListener('change',function(event){var company=event.target.getAttribute('data-inspector-company');if(!company)return;if(event.target.checked)state.inspectorCompanies.add(company);else state.inspectorCompanies.delete(company);state.inspectorAllCompanies=state.inspectorAvailableCompanies.length>0&&state.inspectorAvailableCompanies.every(function(value){return state.inspectorCompanies.has(value);});updateInspectorControls();renderInspector();});
    $('inspector-companies-all').addEventListener('click',function(){state.inspectorAllCompanies=true;state.inspectorCompanies=new Set(state.inspectorAvailableCompanies);updateInspectorControls();renderInspector();});
    $('inspector-companies-none').addEventListener('click',function(){state.inspectorAllCompanies=false;state.inspectorCompanies=new Set();updateInspectorControls();renderInspector();});
    $('inspector-lines').addEventListener('change',function(event){var line=event.target.getAttribute('data-inspector-line');if(!line)return;if(event.target.checked)state.inspectorLines.add(line);else state.inspectorLines.delete(line);state.inspectorAllLines=state.inspectorAvailableLines.length>0&&state.inspectorAvailableLines.every(function(value){return state.inspectorLines.has(value);});renderInspector();});
    $('inspector-lines-all').addEventListener('click',function(){state.inspectorAllLines=true;state.inspectorLines=new Set(state.inspectorAvailableLines);renderInspectorLines(state.inspectorAvailableLines);renderInspector();});
    $('inspector-lines-none').addEventListener('click',function(){state.inspectorAllLines=false;state.inspectorLines=new Set();renderInspectorLines(state.inspectorAvailableLines);renderInspector();});
    $('user-print').addEventListener('click',function(){printExport('users');});$('user-image').addEventListener('click',function(){imageExport('users');});
    $('inspector-print').addEventListener('click',function(){printExport('inspectors');});$('inspector-image').addEventListener('click',function(){imageExport('inspectors');});
    document.addEventListener('visibilitychange',function(){if(document.hidden)stopAnimation();else renderMap(state.results,state.results.find(function(j){return j.key===state.focus;}));});
  }
  function theme(){
    function label(){var light=document.documentElement.dataset.theme==='light';$('theme-icon').textContent=light?'☾':'☀';$('theme-label').textContent=light?'Modo oscuro':'Modo claro';$('theme-toggle').setAttribute('aria-pressed',String(light));}
    label();$('theme-toggle').addEventListener('click',function(){var next=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=next;try{localStorage.setItem('transport-theme',next);}catch(e){}label();});
  }
  function initMap(){
    if(!window.L){$('transport-map').innerHTML='<p class="empty-state">No se pudo cargar el mapa. Los horarios siguen disponibles.</p>';return;}
    state.map=L.map('transport-map',{scrollWheelZoom:true}).setView([-31.7,-64],7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(state.map);
    state.layer=L.layerGroup().addTo(state.map);
  }
  function sourceSummary(){
    var latest=state.data.sources.map(function(s){return s.publication_date;}).filter(Boolean).sort().pop();
    $('updated-date').textContent=date(latest);$('updated-detail').textContent=state.data.sources.length+' corredores · '+state.data.services.length.toLocaleString('es-AR')+' servicios';
    var coverage=state.engine.coverage;
    $('route-coverage').textContent=state.routeError?'Base de recorridos no disponible: se muestran salidas publicadas y cabeceras, sin estimaciones intermedias.':coverage.linked.toLocaleString('es-AR')+' de '+coverage.total.toLocaleString('es-AR')+' servicios tienen recorrido vinculado. Los restantes conservan sus salidas publicadas, con intermedias pendientes.';
    var located=state.routes&&state.routes.stats?state.routes.stats.geolocated_places:null,totalPlaces=state.routes&&state.routes.stats?state.routes.stats.places:null;
    $('quality-note').textContent='Datos oficiales semanales + base orientativa independiente.'+(located!==null?' '+located.toLocaleString('es-AR')+' de '+totalPlaces.toLocaleString('es-AR')+' puntos ya tienen coordenadas verificadas.':'')+' Las nuevas variantes quedan pendientes de vinculación; no se les asigna un recorrido por semejanza.';
    $('map-legend').innerHTML=state.data.corridors.map(function(c){return '<span><i class="dot" style="--dot-color:'+COLORS[c]+'"></i>'+esc(c)+'</span>';}).join('');
  }
  function getJSON(path){return fetch(path,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error(path);return response.json();});}
  theme();
  Promise.all([getJSON('data/horarios.json'),getJSON('data/cabeceras.json'),getJSON('data/recorridos.json').catch(function(){state.routeError=true;return null;})]).then(function(payloads){
    state.data=payloads[0];state.geo=payloads[1];state.routes=payloads[2];
    if(!R)throw new Error('Falta recorridos.js. Verificá que se hayan subido todos los archivos de la v8.');
    if(state.routes && state.routes.schema_version!==1){state.routes=null;state.routeError=true;}
    state.engine=R.create(state.data,state.geo,state.routes);initMap();$('filter-day').value=String(today());$('inspector-day').value=String(today());updateOptions();updateInspectorControls();bind();sourceSummary();render();renderInspector();
  }).catch(function(error){$('results').innerHTML='<div class="empty-state"><strong>No se pudo cargar la información.</strong><p>'+esc(error.message)+'</p></div>';$('updated-date').textContent='Error de carga';});
}());
