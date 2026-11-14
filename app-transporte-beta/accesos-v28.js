/* ERSeP Viaja v28 — accesos rápidos. No modifica el motor de horarios.
   Las búsquedas favoritas se guardan solo en este navegador, nunca en un servidor. */
(function () {
  'use strict';

  var KEY='ersep-viaja-favoritos-v1', MAX=12;
  var active=null, lastButton=null;
  var $=function(id){return document.getElementById(id);};
  function elt(tag,className,text) {
    var node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function message(text,type){
    var note=elt('p','quick-message'+(type?' '+type:''),text);
    $('quick-panel-content').prepend(note);
    return note;
  }
  function normalize(item){
    if(!item||typeof item!=='object')return null;
    var origin=String(item.origin||''),destination=String(item.destination||'');
    var day=String(item.day||''),mode=String(item.mode||'all');
    var time=String(item.time||'08:00');
    var originLabel=String(item.originLabel||''),destinationLabel=String(item.destinationLabel||'');
    if(!origin||!destination||origin===destination||origin.length>150||destination.length>150||!(/^[1-7]$/).test(day))return null;
    if(['all','after','last'].indexOf(mode)<0)mode='all';
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))time='08:00';
    return {origin:origin,destination:destination,day:day,mode:mode,time:time,
      originLabel:originLabel.slice(0,150)||origin,destinationLabel:destinationLabel.slice(0,150)||destination};
  }
  function favorites(){
    try {
      var data=JSON.parse(window.localStorage.getItem(KEY)||'[]');
      if(!Array.isArray(data))return [];
      return data.map(normalize).filter(Boolean).slice(0,MAX);
    } catch(error){return [];}
  }
  function persist(items){
    try {window.localStorage.setItem(KEY,JSON.stringify(items.slice(0,MAX)));return true;}
    catch(error){return false;}
  }
  function selectedText(select){return select&&select.selectedOptions&&select.selectedOptions[0]?select.selectedOptions[0].textContent:'';}
  function currentTravel(){
    var origin=$('assistant-origin'),destination=$('assistant-destination');
    var day=$('assistant-day'),mode=$('assistant-time-mode'),time=$('assistant-time');
    if(!origin.value||!destination.value||origin.value===destination.value)return null;
    return normalize({origin:origin.value,destination:destination.value,day:day.value,
      mode:mode.value,time:time.value,originLabel:selectedText(origin),destinationLabel:selectedText(destination)});
  }
  function identity(item){return [item.origin,item.destination,item.day,item.mode,item.time].join('|');}
  function change(node,value){
    node.value=value;
    node.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function restore(item){
    var day=$('assistant-day'),origin=$('assistant-origin'),destination=$('assistant-destination');
    change(day,item.day);
    if(!Array.from(origin.options).some(function(o){return o.value===item.origin;})){
      message('La localidad de origen ya no está disponible para ese día. Revisá los cronogramas actuales.','warning');return;
    }
    change(origin,item.origin);
    if(!Array.from(destination.options).some(function(o){return o.value===item.destination;})){
      message('Ese destino ya no está disponible desde el origen guardado. Revisá tu viaje.','warning');return;
    }
    change(destination,item.destination);
    change($('assistant-time-mode'),item.mode);
    if(item.mode==='after')change($('assistant-time'),item.time);
    closePanel(false);
    var form=$('assistant-form');
    if(form.requestSubmit)form.requestSubmit();
    else form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
  }
  function renderFavorites(){
    var panel=$('quick-panel-content');panel.replaceChildren();
    var instructions=elt('p','quick-description','Guardá los trayectos que consultás seguido. Se conservan solo en este dispositivo.');
    panel.appendChild(instructions);
    var save=elt('button','quick-primary','☆ Guardar mi búsqueda actual');
    save.type='button';
    save.addEventListener('click',function(){
      var trip=currentTravel();
      if(!trip){message('Elegí origen y destino antes de guardar la búsqueda.','warning');return;}
      var all=favorites().filter(function(item){return identity(item)!==identity(trip);});
      all.unshift(trip);
      if(!persist(all)){message('No pudimos guardar esta búsqueda en el navegador. Revisá si permite guardar datos.','warning');return;}
      renderFavorites();
      message('Búsqueda guardada en este dispositivo.','success');
    });
    panel.appendChild(save);
    var all=favorites();
    if(!all.length){panel.appendChild(elt('p','quick-empty','Todavía no tenés búsquedas favoritas.'));return;}
    var days={1:'lunes',2:'martes',3:'miércoles',4:'jueves',5:'viernes',6:'sábado',7:'domingo'};
    var list=elt('ul','favorite-list');
    all.forEach(function(item){
      var row=elt('li','favorite-item');
      var description=elt('div','favorite-description');
      description.appendChild(elt('strong','',item.originLabel+' → '+item.destinationLabel));
      var timing=item.mode==='last'?' · último servicio':item.mode==='after'?' · desde las '+item.time:' · todos los horarios';
      description.appendChild(elt('span','',days[item.day]+timing));
      row.appendChild(description);
      var actions=elt('div','favorite-actions');
      var use=elt('button','favorite-open','Consultar');use.type='button';
      use.addEventListener('click',function(){restore(item);});
      var remove=elt('button','favorite-remove','Quitar');remove.type='button';
      remove.setAttribute('aria-label','Quitar búsqueda '+item.originLabel+' a '+item.destinationLabel);
      remove.addEventListener('click',function(){
        if(!persist(favorites().filter(function(x){return identity(x)!==identity(item);}))){
          message('No pudimos quitar esta búsqueda del almacenamiento.','warning');return;
        }
        renderFavorites();
      });
      actions.appendChild(use);actions.appendChild(remove);row.appendChild(actions);list.appendChild(row);
    });
    panel.appendChild(list);
  }
  function renderAlerts(){
    var panel=$('quick-panel-content');panel.replaceChildren();
    panel.appendChild(elt('p','quick-description',
      'Este buscador consulta horarios publicados. Todavía no cuenta con alertas verificadas de demoras, cancelaciones o cortes de servicio en tiempo real.'));
    panel.appendChild(elt('p','quick-description',
      'La ausencia de un aviso aquí no significa que el colectivo esté circulando normalmente.'));
    var link=elt('a','quick-link','Consultas y reclamos en ERSeP ↗');
    link.href='https://ersep.cba.gov.ar/usuariosnopresencial/';
    link.target='_blank';link.rel='noopener noreferrer';panel.appendChild(link);
  }
  function renderInfo(){
    var panel=$('quick-panel-content');panel.replaceChildren();
    var points=[
      ['¿De dónde salen los horarios?','De los cronogramas publicados por la Secretaría de Transporte de la Provincia de Córdoba.'],
      ['¿Qué significa “paso estimado”?','En localidades intermedias, la hora de paso es orientativa y no equivale a una salida publicada desde cabecera.'],
      ['¿El mapa muestra el colectivo en vivo?','No. Los recorridos son orientativos; no se hace seguimiento de las unidades en tiempo real.'],
      ['¿Puedo reclamar?','Sí. Podés ingresar una consulta o reclamo mediante los canales oficiales del ERSeP.']
    ];
    points.forEach(function(point){
      var block=elt('div','info-item');
      block.appendChild(elt('strong','',point[0]));
      block.appendChild(elt('p','',point[1]));
      panel.appendChild(block);
    });
    var link=elt('a','quick-link','Ir a consultas y reclamos del ERSeP ↗');
    link.href='https://ersep.cba.gov.ar/usuariosnopresencial/';
    link.target='_blank';link.rel='noopener noreferrer';panel.appendChild(link);
  }
  function closePanel(focus){
    var panel=$('quick-panel');
    panel.hidden=true;active=null;
    document.querySelectorAll('[data-shortcut]').forEach(function(button){button.setAttribute('aria-expanded','false');button.classList.remove('is-selected');});
    if(focus!==false&&lastButton)lastButton.focus();
  }
  function openPanel(name,button){
    var panel=$('quick-panel');
    if(!panel.hidden&&active===name){closePanel(true);return;}
    active=name;lastButton=button;panel.hidden=false;
    var titles={favorites:'Mis búsquedas favoritas',alerts:'Alertas de servicio',info:'Información útil'};
    $('quick-panel-title').textContent=titles[name];
    if(name==='favorites')renderFavorites();
    else if(name==='alerts')renderAlerts();
    else renderInfo();
    document.querySelectorAll('[data-shortcut]').forEach(function(other){
      var selected=other===button;
      other.classList.toggle('is-selected',selected);
      other.setAttribute('aria-expanded',String(selected));
    });
    panel.scrollIntoView({behavior:'auto',block:'nearest'});
    panel.focus({preventScroll:true});
  }
  function init(){
    if(!$('quick-panel')||!$('assistant-form'))return;
    document.querySelectorAll('[data-shortcut]').forEach(function(button){
      button.addEventListener('click',function(){openPanel(button.getAttribute('data-shortcut'),button);});
    });
    $('quick-panel-close').addEventListener('click',function(){closePanel(true);});
    $('quick-panel').addEventListener('keydown',function(event){if(event.key==='Escape')closePanel(true);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
}());
