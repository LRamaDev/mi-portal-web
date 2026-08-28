(function () {
  'use strict';
  var COLORS = { 'ESTE-SUDESTE':'#22c55e', 'NORESTE':'#06b6d4', 'NORTE':'#8b5cf6', 'PUNILLA':'#ec4899', 'RUTA 5':'#3b82f6', 'SIERRAS CHICAS':'#14b8a6', 'SUR':'#f59e0b', 'TRASLASIERRA':'#ef4444', 'MIXED':'#64748b' };
  var DAYS = { '1':'Lunes', '2':'Martes', '3':'Miércoles', '4':'Jueves', '5':'Viernes', '6':'Sábado', '7':'Domingo' };
  var DIRECTIONS = { I:'Ida', V:'Vuelta' };
  var FIELDS = ['origin','destination','corridor','line','direction','day','company','modality'];
  var state = { data:null, geo:null, routes:null, engine:null, map:null, layer:null, focus:null, animationId:null, results:[], routeError:false };
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
    var coordinates=state.engine.coordinates(active),color=COLORS[active.service.corridor]||COLORS.MIXED,points=[],bounds=[],selectedMissing=0,totalMissing=0;
    coordinates.forEach(function(p,i){
      if(!p){totalMissing++;if(i>=active.from && i<=active.to)selectedMissing++;return;}
      bounds.push([p.lat,p.lon]);
      var stop=active.model.stops[i],n=i===active.from?active.boarding:i===0?active.service.minutes:active.service.minutes+stop.arrival_offset;
      var label=(i===active.from?'Subida · ':i===active.to?'Bajada · ':'Paso '+(i+1)+' · ')+(Number.isFinite(stop.arrival_offset)?clockText(n)+(i===0?' · salida PDF':' · estimado'):'sin estimación');
      marker(p,color,label,i===active.from||i===active.to);
      if(i===0 || !coordinates[i-1])return;
      var selected=i>active.from && i<=active.to,segment=curve(coordinates[i-1],p);
      L.polyline(segment,{color:color,weight:selected?4:2,opacity:selected ? .85 : .3,dashArray:selected?'4 8':'3 8'}).addTo(state.layer);
      if(selected)points=points.concat(points.length?segment.slice(1):segment);
    });
    // No saltar por encima de localidades sin ubicar: el trazado se interrumpe allí.
    if(!selectedMissing)startArrow(points,color);
    if(bounds.length)state.map.fitBounds(bounds,{padding:[40,40],maxZoom:12});
    $('map-status').textContent=totalMissing ? 'Mapa parcial: '+totalMissing+' localidades sin coordenadas; sus tramos no se dibujan.'+(selectedMissing?' La flecha se pausa porque tu tramo tiene puntos pendientes.':'') : active.model.profile ? 'Recorrido en orden. Tu tramo aparece destacado; la flecha no representa un vehículo en vivo.' : 'Solo cabeceras: el detalle intermedio de esta variante todavía está pendiente.';
  }
  function serviceHTML(j){
    var s=j.service,active=state.focus===j.key,days=j.days.map(function(d){return DAYS[d];}).join(', ');
    return '<button class="service-item '+(active?'active':'')+'" type="button" data-journey="'+esc(j.key)+'" aria-pressed="'+active+'">'+
      '<span class="service-time"><b>'+clockHTML(j.boarding)+'</b><small>'+ (j.estimatedBoarding?'Paso estimado':'Salida PDF')+'</small></span><span class="service-copy">'+
      '<strong>'+esc(journeyName(j))+'</strong><small>'+esc(s.company)+' · <b>'+esc(DIRECTIONS[s.direction])+'</b><br>'+esc(days)+'</small>'+
      '<span class="trip-timing">Llegada: '+(j.arrival===null?'sin estimación':clockHTML(j.arrival)+' · estimada')+(j.duration!==null?' · '+esc(duration(j.duration)):'')+'</span>'+
      '<small class="published-source">Salida publicada: '+esc(s.time)+' · '+esc(placeLabel(j.model.stops[0].place_id))+'</small>'+
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
      '<p class="journey-description">'+esc(s.company)+' · '+esc(s.modality)+'<br>Recorrido completo: '+esc(fullName(j))+'</p>'+
      (!p?'<p class="review-warning">No hay un recorrido intermedio vinculado con suficiente certeza para esta variante. Se conserva la salida publicada; no se calculan horas de llegada.</p>':'<p class="estimate-note">Los pasos se estiman sumando las demoras del recorrido a la salida del PDF. Pueden variar. La animación no mide la velocidad real.</p>')+
      '<ol class="stops-list">'+timeline+'</ol>'+
      (p&&p.notes.length?'<div class="review-warning"><strong>Observaciones de la base · para revisión</strong><ul>'+p.notes.map(function(n){return '<li>'+esc(n)+'</li>';}).join('')+'</ul><p>Se conservan como anotaciones, no se aplican automáticamente como restricciones de subida o bajada.</p></div>':'')+
      '<details class="source-details"><summary>Fuentes y referencia de salida</summary><p><strong>Salida PDF:</strong> '+esc(s.time)+' de '+esc(placeLabel(j.model.stops[0].place_id))+'. '+esc(s.service_days_text)+'.</p><p>'+esc(s.source_file)+' · página '+esc(s.source_page)+'</p>'+(p?'<p>Recorrido: '+esc(state.routes.source.filename)+' · hoja '+esc(p.source_sheet)+' · filas '+p.source_rows[0]+'–'+p.source_rows[p.source_rows.length-1]+'. La hora base del Excel no se utiliza como salida vigente.</p>':'')+'</details>';
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
  function bind(){
    var timer;
    $('filter-search').addEventListener('input',function(){clearTimeout(timer);timer=setTimeout(changed,160);});
    FIELDS.forEach(function(f){$('filter-'+f).addEventListener('change',changed);});
    $('reset-filters').addEventListener('click',function(){clearTimeout(timer);$('filter-search').value='';FIELDS.forEach(function(f){$('filter-'+f).value='';});$('filter-day').value=String(today());changed();});
    $('results').addEventListener('click',function(event){var button=event.target.closest('[data-journey]');if(!button)return;var key=button.getAttribute('data-journey');state.focus=state.focus===key?null:key;render();});
    $('journey-detail').addEventListener('click',function(event){if(event.target.closest('#close-journey')){state.focus=null;render();}});
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
    $('quality-note').textContent='Datos oficiales semanales + base orientativa independiente. Las nuevas variantes quedan pendientes de vinculación; no se les asigna un recorrido por semejanza.';
    $('map-legend').innerHTML=state.data.corridors.map(function(c){return '<span><i class="dot" style="--dot-color:'+COLORS[c]+'"></i>'+esc(c)+'</span>';}).join('');
  }
  function getJSON(path){return fetch(path,{cache:'no-store'}).then(function(response){if(!response.ok)throw new Error(path);return response.json();});}
  theme();
  Promise.all([getJSON('data/horarios.json'),getJSON('data/cabeceras.json'),getJSON('data/recorridos.json').catch(function(){state.routeError=true;return null;})]).then(function(payloads){
    state.data=payloads[0];state.geo=payloads[1];state.routes=payloads[2];
    if(!R)throw new Error('Falta recorridos.js. Verificá que se hayan subido todos los archivos de la v5.');
    if(state.routes && state.routes.schema_version!==1){state.routes=null;state.routeError=true;}
    state.engine=R.create(state.data,state.geo,state.routes);initMap();$('filter-day').value=String(today());updateOptions();bind();sourceSummary();render();
  }).catch(function(error){$('results').innerHTML='<div class="empty-state"><strong>No se pudo cargar la información.</strong><p>'+esc(error.message)+'</p></div>';$('updated-date').textContent='Error de carga';});
}());
