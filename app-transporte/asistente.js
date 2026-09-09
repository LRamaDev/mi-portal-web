(function () {
  'use strict';
  var initialized=false;
  var $=function(id){return document.getElementById(id);};
  var esc=function(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  var DAYS={'1':'lunes','2':'martes','3':'miércoles','4':'jueves','5':'viernes','6':'sábado','7':'domingo'};

  function currentMinutes(){
    var values=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'America/Argentina/Cordoba'}).formatToParts(new Date()),parts={};
    values.forEach(function(item){parts[item.type]=item.value;});
    return Number(parts.hour)*60+Number(parts.minute);
  }
  function formatMinute(minute){return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');}
  function parseTime(value){if(!/^\d{2}:\d{2}$/.test(value||''))return null;var parts=value.split(':').map(Number);return parts[0]*60+parts[1];}
  function optionLabel(id){var element=$(id),option=element.options[element.selectedIndex];return option?option.textContent:'';}
  function optionHTML(place){return '<option value="'+esc(place.id)+'">'+esc(place.label)+'</option>';}
  function setStatus(message,error){var status=$('assistant-status');status.textContent=message;status.className='assistant-status'+(error?' error':'');}
  function clearResults(){$('assistant-results').innerHTML='';}

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
    wrap.hidden=!after;input.disabled=!after;
  }
  function resultHTML(journey){
    return '<article class="assistant-service"><div><strong>'+esc(journey.boarding)+'</strong><span>'+esc(journey.estimatedBoarding?'Paso estimado':'Salida publicada')+'</span></div><div><h4>'+esc(journey.originLabel)+' → '+esc(journey.destinationLabel)+'</h4><p>'+esc(journey.company)+' · '+esc(journey.line)+' · '+esc(journey.direction)+'</p><small>Llegada '+esc(journey.arrival)+' · '+esc(journey.duration)+'</small></div><button type="button" data-assistant-open="'+esc(journey.key)+'">Ver recorrido</button></article>';
  }
  function request(){
    var mode=$('assistant-time-mode').value,after=mode==='after'?parseTime($('assistant-time').value):null;
    return {origin:$('assistant-origin').value,destination:$('assistant-destination').value,day:$('assistant-day').value,after:after,order:mode==='last'?'last':'',limit:mode==='last'?1:5};
  }
  function runQuery(){
    var api=window.TransportSearch,input=request();
    if(!input.origin){setStatus('Elegí la localidad donde subís.',true);clearResults();return;}
    if(!input.destination){setStatus('Elegí la localidad donde bajás.',true);clearResults();return;}
    if(input.origin===input.destination){setStatus('El origen y el destino deben ser distintos.',true);clearResults();return;}
    if($('assistant-time-mode').value==='after'&&input.after===null){setStatus('Indicá desde qué hora querés viajar.',true);clearResults();return;}
    var results=api.query(input),origin=optionLabel('assistant-origin'),destination=optionLabel('assistant-destination');
    var timeText=$('assistant-time-mode').value==='after'?' desde las '+formatMinute(input.after):$('assistant-time-mode').value==='last'?' · último servicio':'';
    if(!results.total){
      setStatus('No encontramos servicios directos de '+origin+' a '+destination+' el '+DAYS[input.day]+timeText+'.',true);
      $('assistant-results').innerHTML='<div class="assistant-empty"><strong>No hay un servicio directo publicado para esa búsqueda.</strong><p>Probá otro día u horario, o revisá los filtros completos.</p></div>';
      return;
    }
    if($('assistant-time-mode').value==='last')setStatus('Te mostramos el último servicio directo de '+origin+' a '+destination+' para el '+DAYS[input.day]+'.');
    else setStatus('Encontramos '+results.total.toLocaleString('es-AR')+' servicio'+(results.total===1?'':'s')+' directo'+(results.total===1?'':'s')+' para el '+DAYS[input.day]+timeText+'.');
    $('assistant-results').innerHTML=results.journeys.map(resultHTML).join('')+(results.total>results.journeys.length?'<button class="assistant-all" type="button" data-assistant-all>Ver los '+results.total.toLocaleString('es-AR')+' servicios en la búsqueda completa</button>':'');
    $('assistant-results').setAttribute('data-assistant-origin',input.origin);
    $('assistant-results').setAttribute('data-assistant-destination',input.destination);
    $('assistant-results').setAttribute('data-assistant-day',input.day);
  }
  function applySearch(key){
    var results=$('assistant-results'),api=window.TransportSearch;
    api.apply({origin:results.getAttribute('data-assistant-origin')||'',destination:results.getAttribute('data-assistant-destination')||'',day:results.getAttribute('data-assistant-day')||''});
    if(key)api.focus(key);
    var workspace=document.querySelector&&document.querySelector('.workspace');
    if(workspace&&workspace.scrollIntoView)workspace.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function clear(){
    $('assistant-day').value=window.TransportSearch.today();$('assistant-time-mode').value='all';$('assistant-time').value='08:00';
    populateOrigins(false);populateDestinations(false);syncTimeMode();clearResults();setStatus('Empezá eligiendo la localidad de origen.');
  }
  function useNow(){
    $('assistant-day').value=window.TransportSearch.today();populateOrigins(true);populateDestinations(true);
    $('assistant-time-mode').value='after';$('assistant-time').value=formatMinute(currentMinutes());syncTimeMode();
    if($('assistant-origin').value&&$('assistant-destination').value)runQuery();
    else setStatus('Se configuró hoy desde la hora actual. Ahora elegí origen y destino.');
  }
  function init(){
    if(initialized||!window.TransportSearch)return;
    initialized=true;$('assistant-day').value=window.TransportSearch.today();populateOrigins(false);populateDestinations(false);syncTimeMode();
    $('assistant-form').addEventListener('submit',function(event){if(event.preventDefault)event.preventDefault();runQuery();});
    $('assistant-origin').addEventListener('change',function(){populateDestinations(false);clearResults();setStatus($('assistant-origin').value?'Ahora elegí la localidad de destino.':'Empezá eligiendo la localidad de origen.');});
    $('assistant-destination').addEventListener('change',function(){clearResults();if($('assistant-destination').value)setStatus('Elegí el día y el horario, y buscá los servicios.');});
    $('assistant-day').addEventListener('change',function(){populateOrigins(true);populateDestinations(true);clearResults();});
    $('assistant-time-mode').addEventListener('change',syncTimeMode);
    $('assistant-now').addEventListener('click',useNow);$('assistant-clear').addEventListener('click',clear);
    $('assistant-results').addEventListener('click',function(event){
      var open=event.target.closest&&event.target.closest('[data-assistant-open]');if(open){applySearch(open.getAttribute('data-assistant-open'));return;}
      if(event.target.closest&&event.target.closest('[data-assistant-all]'))applySearch('');
    });
  }
  window.TransportAssistantInit=init;
  init();
}());
