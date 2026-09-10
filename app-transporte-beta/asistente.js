(function () {
  'use strict';
  var initialized=false;
  var $=function(id){return document.getElementById(id);};
  var esc=function(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var DAYS={'1':'lunes','2':'martes','3':'miércoles','4':'jueves','5':'viernes','6':'sábado','7':'domingo'};
  var STEP_TITLES={1:'Elegí dónde subís',2:'Elegí dónde bajás',3:'Confirmá el día',4:'Elegí el horario'};
  var MAX_LOCATION_DISTANCE_KM=50;

  function currentMinutes(){
    var values=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'America/Argentina/Cordoba'}).formatToParts(new Date()),parts={};
    values.forEach(function(item){parts[item.type]=item.value;});
    return Number(parts.hour)*60+Number(parts.minute);
  }
  function formatMinute(minute){return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');}
  function parseTime(value){if(!/^\d{2}:\d{2}$/.test(value||''))return null;var parts=value.split(':').map(Number);return parts[0]*60+parts[1];}
  function optionLabel(id,fallback){var element=$(id),option=element.options[element.selectedIndex];return option&&option.value?option.textContent:fallback;}
  function optionHTML(place){return '<option value="'+esc(place.id)+'">'+esc(place.label)+'</option>';}
  function capital(value){return value?value.charAt(0).toUpperCase()+value.slice(1):'';}
  function setStatus(message,error,tone){
    var status=$('assistant-status'),row=status.parentNode;
    status.textContent=message;
    status.className='assistant-status'+(error?' error':'')+(tone?' '+tone:'');
    if(row)row.className='assistant-status-row'+(error?' error':'')+(tone?' '+tone:'');
  }
  function setLocationBusy(busy){
    var button=$('assistant-location'),label=button&&button.querySelector('[data-location-label]');
    if(!button)return;
    button.disabled=Boolean(busy);button.setAttribute('aria-busy',String(Boolean(busy)));
    if(label)label.textContent=busy?'Buscando ubicación…':'Usar mi ubicación';
  }
  function distanceText(kilometers){
    return kilometers<1?Math.max(10,Math.round(kilometers*1000/10)*10)+' m':kilometers.toLocaleString('es-AR',{maximumFractionDigits:1})+' km';
  }
  function clearResults(){var results=$('assistant-results');results.innerHTML='';results.className='assistant-results';}

  function timeSummary(){
    var mode=$('assistant-time-mode').value;
    if(mode==='after')return 'A partir de las '+($('assistant-time').value||'--:--');
    if(mode==='last')return 'Último servicio';
    return 'Cualquier horario';
  }
  function updateSummary(){
    var origin=$('assistant-origin').value,destination=$('assistant-destination').value,ready=Boolean(origin&&destination);
    $('assistant-summary-origin').textContent=optionLabel('assistant-origin','Sin elegir');
    $('assistant-summary-destination').textContent=optionLabel('assistant-destination','Sin elegir');
    $('assistant-summary-day').textContent=capital(DAYS[$('assistant-day').value]||'');
    $('assistant-summary-time').textContent=timeSummary();
    $('assistant-summary-submit').disabled=!ready;
    $('assistant-summary-submit').textContent=ready?'Buscar con estos datos':'Completá origen y destino';
    $('assistant-swap').disabled=!ready;
    $('assistant-swap').hidden=!ready;
    $('assistant-preview').classList.toggle('is-ready',ready);
  }
  function updateProgress(step,complete){
    step=Math.max(1,Math.min(4,Number(step)||1));
    $('assistant-progress-label').textContent=complete?'Consulta completa':'Paso '+step+' de 4';
    $('assistant-progress-title').textContent=complete?'Resultados listos':STEP_TITLES[step];
    $('assistant-progress').setAttribute('aria-valuenow',String(step));
    $('assistant-progress-fill').style.width=(complete?100:step*25)+'%';
    Array.from(document.querySelectorAll('[data-assistant-step]')).forEach(function(card){
      var number=Number(card.getAttribute('data-assistant-step'));
      card.classList.remove('is-active','is-complete','is-pending');
      if(complete||number<step)card.classList.add('is-complete');
      else if(number===step){card.classList.add('is-active');card.setAttribute('aria-current','step');}
      else card.classList.add('is-pending');
      if(number!==step)card.removeAttribute('aria-current');
    });
  }
  function fieldStep(preferred){
    if(!$('assistant-origin').value)return 1;
    if(!$('assistant-destination').value)return 2;
    return preferred||3;
  }

  function populateOrigins(preserve){
    var select=$('assistant-origin'),places=window.TransportSearch.listOrigins($('assistant-day').value),old=preserve?select.value:'';
    select.innerHTML='<option value="">Elegí el origen</option>'+places.map(optionHTML).join('');
    select.value=old;
  }
  function populateDestinations(preserve){
    var select=$('assistant-destination'),origin=$('assistant-origin').value,old=preserve?select.value:'';
    if(!origin){select.disabled=true;select.innerHTML='<option value="">Primero elegí el origen</option>';return;}
    var places=window.TransportSearch.listDestinations(origin,$('assistant-day').value);
    select.disabled=false;select.innerHTML='<option value="">Elegí el destino</option>'+places.map(optionHTML).join('');select.value=old;
  }
  function syncTimeMode(){
    var after=$('assistant-time-mode').value==='after',wrap=$('assistant-time-wrap'),input=$('assistant-time');
    wrap.hidden=!after;input.disabled=!after;updateSummary();
  }
  function swapRoute(){
    var origin=$('assistant-origin'),destination=$('assistant-destination'),day=$('assistant-day').value;
    var oldOrigin=origin.value,oldDestination=destination.value,api=window.TransportSearch;
    if(!oldOrigin||!oldDestination){setStatus('Elegí primero el origen y el destino.',true);return;}
    var reverseOrigin=api.listOrigins(day).some(function(place){return place.id===oldDestination;});
    var reverseDestination=reverseOrigin&&api.listDestinations(oldDestination,day).some(function(place){return place.id===oldOrigin;});
    if(!reverseDestination){
      setStatus('No encontramos un servicio directo de vuelta entre esas localidades para el '+DAYS[day]+'. Probá otro día o usá la búsqueda avanzada.',true);
      return;
    }
    origin.value=oldDestination;populateDestinations(false);destination.value=oldOrigin;
    clearResults();updateSummary();updateProgress(4,false);runQuery();
  }
  function resultHTML(journey,index){
    return '<article class="assistant-service" style="--result-index:'+index+'"><div class="assistant-service-time"><strong>'+esc(journey.boarding)+'</strong><span>'+esc(journey.estimatedBoarding?'Paso estimado':'Salida publicada')+'</span></div><div class="assistant-service-main"><h4>'+esc(journey.originLabel)+' <span aria-hidden="true">→</span> '+esc(journey.destinationLabel)+'</h4><p>'+esc(journey.company)+' · '+esc(journey.line)+'</p><div class="assistant-service-meta"><span>'+esc(journey.direction)+'</span><span>Llegada '+esc(journey.arrival)+'</span><span>'+esc(journey.duration)+'</span></div></div><button type="button" data-assistant-open="'+esc(journey.key)+'">Ver recorrido <span aria-hidden="true">→</span></button></article>';
  }
  function request(){
    var mode=$('assistant-time-mode').value,after=mode==='after'?parseTime($('assistant-time').value):null;
    return {origin:$('assistant-origin').value,destination:$('assistant-destination').value,day:$('assistant-day').value,after:after,order:mode==='last'?'last':'',limit:mode==='last'?1:5};
  }
  function runQuery(){
    var api=window.TransportSearch,input=request();
    if(!input.origin){setStatus('Elegí la localidad donde subís.',true);clearResults();updateProgress(1,false);return;}
    if(!input.destination){setStatus('Elegí la localidad donde bajás.',true);clearResults();updateProgress(2,false);return;}
    if(input.origin===input.destination){setStatus('El origen y el destino deben ser distintos.',true);clearResults();updateProgress(2,false);return;}
    if($('assistant-time-mode').value==='after'&&input.after===null){setStatus('Indicá desde qué hora querés viajar.',true);clearResults();updateProgress(4,false);return;}
    clearResults();setStatus('Buscando coincidencias en los cronogramas publicados…',false,'searching');
    var results=api.query(input),origin=optionLabel('assistant-origin',''),destination=optionLabel('assistant-destination','');
    var timeText=$('assistant-time-mode').value==='after'?' a partir de las '+formatMinute(input.after):$('assistant-time-mode').value==='last'?' · último servicio':'';
    updateProgress(4,true);
    if(!results.total){
      setStatus('No encontramos servicios directos de '+origin+' a '+destination+' el '+DAYS[input.day]+timeText+'.',true);
      $('assistant-results').innerHTML='<div class="assistant-empty"><strong>No hay un servicio directo publicado para esa búsqueda.</strong><p>Probá otro día u horario, o revisá los filtros completos.</p></div>';
      return;
    }
    if($('assistant-time-mode').value==='last')setStatus('Listo: te mostramos el último servicio directo de '+origin+' a '+destination+' para el '+DAYS[input.day]+'.',false,'success');
    else setStatus('¡Listo! Encontramos '+results.total.toLocaleString('es-AR')+' servicio'+(results.total===1?'':'s')+' directo'+(results.total===1?'':'s')+' para el '+DAYS[input.day]+timeText+'.',false,'success');
    $('assistant-results').className='assistant-results has-results';
    $('assistant-results').innerHTML='<header class="assistant-results-title"><div><span>Opciones encontradas</span><strong>'+esc(origin)+' → '+esc(destination)+'</strong></div><b>'+results.total.toLocaleString('es-AR')+'</b></header>'+results.journeys.map(resultHTML).join('')+(results.total>results.journeys.length?'<button class="assistant-all" type="button" data-assistant-all>Ver los '+results.total.toLocaleString('es-AR')+' servicios en la búsqueda completa</button>':'');
    $('assistant-results').setAttribute('data-assistant-origin',input.origin);
    $('assistant-results').setAttribute('data-assistant-destination',input.destination);
    $('assistant-results').setAttribute('data-assistant-day',input.day);
  }
  function applySearch(key){
    var results=$('assistant-results'),api=window.TransportSearch;
    api.apply({origin:results.getAttribute('data-assistant-origin')||'',destination:results.getAttribute('data-assistant-destination')||'',day:results.getAttribute('data-assistant-day')||''});
    if(key)api.focus(key);
    var workspace=document.querySelector&&document.querySelector('.workspace'),reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(workspace&&workspace.scrollIntoView)workspace.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
  }
  function clear(){
    $('assistant-day').value=window.TransportSearch.today();$('assistant-time-mode').value='all';$('assistant-time').value='08:00';
    populateOrigins(false);populateDestinations(false);syncTimeMode();clearResults();updateSummary();updateProgress(1,false);setStatus('Empezá eligiendo la localidad de origen.');
  }
  function chooseDay(offset){
    var today=Number(window.TransportSearch.today()),day=((today-1+Number(offset))%7)+1;
    $('assistant-day').value=String(day);populateOrigins(true);populateDestinations(true);clearResults();updateSummary();updateProgress(fieldStep(4),false);
    setStatus(offset?'Perfecto, buscamos para mañana. Ahora confirmá el horario.':'Perfecto, buscamos para hoy. Ahora confirmá el horario.');
  }
  function useNow(){
    $('assistant-day').value=window.TransportSearch.today();populateOrigins(true);populateDestinations(true);
    $('assistant-time-mode').value='after';$('assistant-time').value=formatMinute(currentMinutes());syncTimeMode();clearResults();updateSummary();
    if($('assistant-origin').value&&$('assistant-destination').value)runQuery();
    else{updateProgress(fieldStep(),false);setStatus('Configuré hoy desde la hora actual. Ahora elegí origen y destino.');}
  }
  function useLocation(){
    if(typeof navigator==='undefined'||!navigator.geolocation){setStatus('Este dispositivo no permite consultar la ubicación. Elegí el origen manualmente.',true);return;}
    setLocationBusy(true);clearResults();setStatus('Buscando tu ubicación para sugerir la localidad de origen…',false,'searching');
    navigator.geolocation.getCurrentPosition(function(position){
      setLocationBusy(false);
      var nearest=window.TransportSearch.nearestOrigin(position.coords.latitude,position.coords.longitude,$('assistant-day').value);
      if(!nearest){setStatus('No encontramos una localidad con servicios y ubicación verificada. Elegí el origen manualmente.',true);return;}
      if(nearest.distanceKm>MAX_LOCATION_DISTANCE_KM){setStatus('La localidad con servicios más cercana está a más de '+MAX_LOCATION_DISTANCE_KM+' km. Para evitar una sugerencia incorrecta, elegí el origen manualmente.',true);return;}
      $('assistant-origin').value=nearest.id;populateDestinations(false);clearResults();updateSummary();updateProgress(2,false);
      setStatus('Tu ubicación está a aproximadamente '+distanceText(nearest.distanceKm)+' de '+nearest.label+'. La elegimos como origen; confirmá que sea correcta y elegí dónde bajás.',false,'success');
    },function(error){
      setLocationBusy(false);
      var messages={1:'No autorizaste el acceso a la ubicación. Podés elegir el origen manualmente.',2:'El dispositivo no pudo determinar tu ubicación. Probá nuevamente o elegí el origen manualmente.',3:'La ubicación tardó demasiado en responder. Probá nuevamente o elegí el origen manualmente.'};
      setStatus(messages[error&&error.code]||'No pudimos obtener tu ubicación. Elegí el origen manualmente.',true);
    },{enableHighAccuracy:true,timeout:12000,maximumAge:300000});
  }
  function init(){
    if(initialized||!window.TransportSearch)return;
    initialized=true;$('assistant-day').value=window.TransportSearch.today();populateOrigins(false);populateDestinations(false);syncTimeMode();updateSummary();updateProgress(1,false);
    $('assistant-form').addEventListener('submit',function(event){if(event.preventDefault)event.preventDefault();runQuery();});
    $('assistant-origin').addEventListener('change',function(){populateDestinations(false);clearResults();updateSummary();updateProgress(fieldStep(),false);setStatus($('assistant-origin').value?'Bien, ahora elegí la localidad donde bajás.':'Empezá eligiendo la localidad de origen.');});
    $('assistant-destination').addEventListener('change',function(){clearResults();updateSummary();updateProgress(fieldStep(),false);if($('assistant-destination').value)setStatus('Ya tenemos el recorrido. Confirmá el día y el horario.');});
    $('assistant-day').addEventListener('change',function(){populateOrigins(true);populateDestinations(true);clearResults();updateSummary();updateProgress(fieldStep(4),false);setStatus('Día actualizado. Elegí el horario y buscá los servicios.');});
    $('assistant-time-mode').addEventListener('change',function(){syncTimeMode();clearResults();updateProgress(fieldStep(4),false);});
    $('assistant-time').addEventListener('change',function(){updateSummary();clearResults();updateProgress(fieldStep(4),false);});
    Array.from(document.querySelectorAll('[data-assistant-day-offset]')).forEach(function(button){button.addEventListener('click',function(){chooseDay(Number(button.getAttribute('data-assistant-day-offset')));});});
    var locationButton=$('assistant-location');
    if(locationButton){locationButton.hidden=!(typeof navigator!=='undefined'&&navigator.geolocation);locationButton.addEventListener('click',useLocation);}
    $('assistant-now').addEventListener('click',useNow);$('assistant-clear').addEventListener('click',clear);$('assistant-swap').addEventListener('click',swapRoute);$('assistant-summary-submit').addEventListener('click',runQuery);
    $('assistant-results').addEventListener('click',function(event){
      var open=event.target.closest&&event.target.closest('[data-assistant-open]');if(open){applySearch(open.getAttribute('data-assistant-open'));return;}
      if(event.target.closest&&event.target.closest('[data-assistant-all]'))applySearch('');
    });
  }
  window.TransportAssistantInit=init;
  init();
}());
