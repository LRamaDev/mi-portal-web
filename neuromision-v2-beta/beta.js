"use strict";
/* Escenarios ilustrados — prototipo experimental v2.1.
 * No modifica la versión publicada ni comparte sus datos de juego.
 */
const BETA_STORAGE="neuromision_beta_v21_profiles";
const BETA_LAST="neuromision_beta_v21_last";
profiles=loadJson(BETA_STORAGE,{});
save=function(){
  if(!player || !record)return;
  profiles[player.toLowerCase()]=record;
  setStore(BETA_STORAGE,profiles);
  setStore(BETA_LAST,player);
};
const LAND_WINDOWS=[
  [22,57,274,198],
  [343,55,305,176],
  [700,93,275,183],
  [167,331,276,209],
  [661,329,296,216]
];
function sceneArt(i){
  const coords=LAND_WINDOWS[i] || LAND_WINDOWS[0];
  return NEURO_WORLD_MAP_SVG
    .replace('viewBox="0 0 1100 650"','viewBox="'+coords.join(" ")+'"')
    .replace('class="neuro-world-art"','class="neuro-world-art scene-art-svg"')
    .replace('role="img"','aria-hidden="true"');
}
function landState(i){
  const finished=!!record.completed[i];
  const available=missionIsOpen(i);
  const active=record.active && record.active.mission===i;
  return {finished,available,active,word:active?"Continuar":finished?"Completada":available?"Explorar":"Bloqueada"};
}
renderMap=function(){
  mode="map";
  const completed=MISSIONS.filter(function(m,i){return !!record.completed[i];}).length;
  const percent=Math.round(100*completed/MISSIONS.length);
  const landmarks=MISSIONS.map(function(m,i){
    const state=landState(i);
    return '<button type="button" class="land-marker node-'+i+
      (state.finished?' completed':'')+(state.active?' active':'')+
      '" data-action="preview-mission" data-index="'+i+'" '+(state.available?'':'disabled')+
      ' aria-label="'+escapeHtml(LAND_NAMES[i])+': '+state.word+'">'+
      '<span class="marker-orb" aria-hidden="true">'+(state.finished?'✓':i+1)+'</span>'+
      '<span class="marker-name">'+escapeHtml(LAND_NAMES[i])+'</span>'+
      '<span class="marker-state">'+state.word+'</span></button>';
  }).join("");
  const nav=MISSIONS.map(function(m,i){
    const state=landState(i);
    return '<button class="world-chip '+(state.finished?'chip-done':'')+
      '" data-action="preview-mission" data-index="'+i+'" '+(state.available?'':'disabled')+
      ' aria-label="'+escapeHtml(LAND_NAMES[i])+', '+state.word+'"><span aria-hidden="true">'+LAND_ICONS[i]+'</span>'+
      '<span>'+escapeHtml(LAND_NAMES[i])+'<small>'+state.word+'</small></span></button>';
  }).join("");
  setScreen('<div class="map-top"><div><span class="kicker">TU MUNDO POR DESCUBRIR</span>'+
    '<h2>¡Hola, '+escapeHtml(player)+'! ✨</h2><p>Elegí un destino en el mapa. Las tierras ya conquistadas se pueden volver a visitar.</p></div>'+
    '<div class="score-stack"><span class="total-points">✦ '+totalScore()+'</span>'+
    '<small>CHISPAS</small><small>'+completed+' DE 5 TIERRAS</small></div></div>'+
    '<div class="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'" aria-label="Tierras completadas"><span style="width:'+percent+'%"></span></div>'+
    '<div class="map-sky beta-map"><div class="map-scroll" tabindex="0" aria-label="Mapa ilustrado; desplazá horizontalmente para conocer todas las tierras">'+
    '<div class="adventure-world">'+NEURO_WORLD_MAP_SVG+landmarks+'</div></div>'+
    '<div class="map-caption">🗺️ Tocá un marcador del mapa. En celular podés deslizarlo a los costados.</div></div>'+
    '<div class="world-quick-nav" aria-label="Accesos a las cinco tierras">'+nav+'</div>'+
    '<div class="map-actions"><span class="map-tip">🎲 Cinco o seis desafíos por tierra, elegidos de un banco más grande.</span>'+
    '<button type="button" class="soft-btn mini-btn" data-action="switch">Cambiar jugador/a</button></div>');
};
showMissionPreview=function(i){
  if(!missionIsOpen(i))return;
  mode="preview";
  const theme=LAND_GRADIENTS[i],m=MISSIONS[i];
  const continuing=record.active&&record.active.mission===i;
  setScreen('<section class="mission-splash" style="--land-color:'+LAND_COLORS[i]+';--scene-a:'+theme[0]+';--scene-b:'+theme[1]+'">'+
    '<div class="splash-art">'+sceneArt(i)+'<span class="splash-number">TIERRA '+(i+1)+' / 5</span></div>'+
    '<div class="splash-info"><span class="kicker">UNA NUEVA AVENTURA TE ESPERA</span>'+
    '<h2>'+escapeHtml(m.title)+'</h2>'+
    '<p>'+escapeHtml(m.description)+'</p>'+
    '<div class="mission-traits"><span>✦ '+ROUND_LENGTHS[i]+' retos por partida</span>'+
    '<span>🎲 Combinaciones distintas</span><span>💡 Pistas disponibles</span></div>'+
    '<div class="splash-actions"><button type="button" class="soft-btn" data-action="map">← Volver al mapa</button>'+
    '<button type="button" class="primary-btn" data-action="launch-mission" data-index="'+i+'">'+(continuing?'Continuar aventura':'¡Explorar esta tierra!')+' →</button></div>'+
    '</div></section>');
};
renderTask=function(){
  mode="play";answered=false;
  const m=MISSIONS[missionIndex],t=m.tasks[taskIndex];
  if(!t){completeMission();return;}
  const progress=m.tasks.map(function(_,i){return '<span class="'+(i<taskIndex?'passed':i===taskIndex?'current':'')+'"></span>';}).join('');
  setScreen('<div class="mission-meta"><span class="step-tag">'+escapeHtml(m.title)+
    ' · DESAFÍO '+(taskIndex+1)+' / '+m.tasks.length+'</span>'+
    '<div class="mission-nav"><span class="step-tag">✦ '+score+' chispas</span>'+
    '<button type="button" class="soft-btn mini-btn" data-action="map">← Mapa</button></div></div>'+
    '<div class="tracker" aria-hidden="true">'+progress+'</div>'+
    '<div class="focus-layout" style="--land-color:'+LAND_COLORS[missionIndex]+'">'+
    '<div class="focus-question"><span class="quest-label">TU CONSIGNA</span><h2>'+escapeHtml(t.q)+'</h2></div>'+
    '<div class="focus-land" aria-hidden="true">'+sceneArt(missionIndex)+'</div></div>'+
    '<div class="play-panel">'+taskContent(t)+'</div><div id="task-feedback" aria-live="polite"></div>');
};
// La lógica, las actividades y las reglas de progreso se reutilizan sin cambios.
renderWelcome();
