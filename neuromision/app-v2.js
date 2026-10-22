"use strict";
/* NeuroMisión v2 — capa modular de aventura, preserva motor v1 y sus datos locales. */
const ROUND_LENGTHS=[5,6,5,5,6];
const LAND_NAMES=["Ciudad Central","Valle de la Neurona","Bosque Sensorial","Ruta de los Reflejos","Torre Final"];
const LAND_ICONS=["🏙️","⚡","🌳","🔁","🏰"];
const LAND_COLORS=["#247eaf","#7963c0","#309b70","#d38451","#ab709d"];
const LAND_GRADIENTS=[
  ["#ccefff","#a6d3ef"],["#e7dcfc","#c6c4f4"],["#dff8d9","#a5ddb8"],
  ["#ffeed5","#ffc2a7"],["#fae2e6","#ecc7ec"]
];
MISSIONS.forEach(function(m,i){
  m.title=LAND_NAMES[i];
  m.tasks=m.tasks.concat(EXTRA_TASKS[i]);
  m.tasks.forEach(function(t,j){t.id="m"+i+"-e"+String(j+1).padStart(2,"0");});
});
const MISSION_BANKS=MISSIONS.map(function(m){return m.tasks.slice();});
let classifyOrder=[],classified=[];
function randomOrder(a){
  const out=a.slice();
  for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const v=out[j];out[j]=out[i];out[i]=v;}
  return out;
}
function chooseRound(i,previous){
  const bank=MISSION_BANKS[i];
  const omit=new Set(previous||[]);
  let pool=bank.filter(function(t){return !omit.has(t.id);});
  if(pool.length<ROUND_LENGTHS[i])pool=bank.slice();
  const chosen=[];
  // Ofrecer variedad de mecánicas en cada partida.
  const kinds=randomOrder([...new Set(pool.map(function(t){return t.type;}))]);
  kinds.forEach(function(kind){
    if(chosen.length>=ROUND_LENGTHS[i])return;
    const group=randomOrder(pool.filter(function(t){return t.type===kind;}));
    if(group.length)chosen.push(group[0]);
  });
  while(chosen.length<ROUND_LENGTHS[i]){
    const left=randomOrder(pool.filter(function(t){return !chosen.includes(t);}));
    const kindsCount={};
    chosen.forEach(function(t){kindsCount[t.type]=(kindsCount[t.type]||0)+1;});
    left.sort(function(a,b){return (kindsCount[a.type]||0)-(kindsCount[b.type]||0);});
    if(!left.length)break;
    chosen.push(left[0]);
  }
  return randomOrder(chosen).map(function(t){return t.id;});
}
function resolveRound(i,ids){
  return ids.map(function(id){return MISSION_BANKS[i].find(function(t){return t.id===id;});}).filter(Boolean);
}
renderWelcome=function(){
  mode="welcome";player="";record=null;updateStatus();
  setScreen('<div class="home-grid"><div>'+
    '<div class="home-eye" aria-hidden="true">⚡</div><span class="kicker">BIENVENIDO/A A UNA NUEVA AVENTURA</span>'+
    '<div class="mission-head" style="text-align:left;margin:0"><h2>¡Explorá el universo del sistema nervioso!</h2>'+
    '<p>Cinco tierras, muchas maneras de jugar y desafíos nuevos cada vez que regreses.</p></div>'+
    '<div class="home-highlights"><span>🗺️ 5 tierras</span><span>🎲 Partidas variables</span><span>🏅 Insignias</span></div>'+
    '<form id="welcome-form"><label class="form-label" for="nickname">¿Cuál es tu nombre?</label>'+
    '<input class="nick-field" type="text" id="nickname" name="nickname" maxlength="22" autocomplete="off" placeholder="Ingresá tu nombre" required>'+
    '<p class="field-note">Tus avances se guardan con ese nombre en este navegador, sin pedirte una cuenta.</p>'+
    '<button class="primary-btn large-btn" type="submit">¡Comenzar la aventura! →</button></form></div>'+
    '<div class="home-art" aria-hidden="true">'+NEURO_WORLD_MAP_SVG+
    '<div class="callout">🌎 UN UNIVERSO POR DESCUBRIR</div></div></div>');
};
renderMap=function(){
  mode="map";
  const completed=MISSIONS.filter(function(m,i){return !!record.completed[i];}).length;
  const nodes=MISSIONS.map(function(m,i){
    const done=!!record.completed[i],open=missionIsOpen(i);
    const continuing=record.active && record.active.mission===i;
    const status=continuing?"▶ Continuar":done?"✓ Superada":open?"✦ Explorar":"🔒 Bloqueada";
    return '<button type="button" class="land-node node-'+i+' '+(done?"done":continuing?"current":"")+
      '" data-action="preview-mission" data-index="'+i+'" aria-label="'+escapeHtml(LAND_NAMES[i])+': '+status+'" '+(open?"":"disabled")+'>'+
      '<span class="land-icon" aria-hidden="true">'+LAND_ICONS[i]+'</span>'+
      '<span class="land-title">'+escapeHtml(LAND_NAMES[i])+'</span>'+
      '<span class="land-tag">'+(i+1)+'/5</span><span class="land-status">'+status+'</span></button>';
  }).join("");
  const passport=MISSIONS.map(function(m,i){
    const done=!!record.completed[i],open=missionIsOpen(i);
    return '<div class="passport-item '+(done?"complete":open?"unlocked":"")+'">'+
      '<span class="passport-icon" aria-hidden="true">'+LAND_ICONS[i]+'</span>'+
      '<strong>'+escapeHtml(LAND_NAMES[i])+'<span style="display:block;font-weight:650;color:#56798a">'+(done?"✓ Superada":open?"Disponible":"Bloqueada")+'</span></strong></div>';
  }).join("");
  setScreen('<div class="map-top"><div><span class="kicker">MAPA DE NEUROMISIÓN</span>'+
    '<h2>¡Hola, '+escapeHtml(player)+'! ✨</h2><p>Elegí una tierra para explorar. Cada partida tiene desafíos diferentes.</p></div>'+
    '<div class="score-stack"><span class="total-points">✦ '+totalScore()+'</span><small>CHISPAS</small><small>'+completed+' / 5 TIERRAS</small></div></div>'+
    '<div class="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(completed/MISSIONS.length*100)+'" aria-label="Misiones completadas"><span style="width:'+Math.round(completed/MISSIONS.length*100)+'%"></span></div>'+
    '<div class="map-sky"><div class="map-scroll" tabindex="0" aria-label="Mapa de aventuras desplazable horizontalmente">'+
    '<div class="adventure-world">'+NEURO_WORLD_MAP_SVG+nodes+'</div></div>'+
    '<div class="map-caption">🗺️ Tocá una tierra para entrar. En celular, deslizá el mapa hacia los costados.</div></div>'+
    '<div class="map-passport">'+passport+'</div>'+
    '<div class="map-actions"><span class="map-tip">🌟 Podés repetir las tierras superadas: tu mejor puntuación se conserva.</span>'+
    '<button type="button" class="soft-btn mini-btn" data-action="switch">Cambiar jugador/a</button></div>');
};
function showMissionPreview(i){
  if(!missionIsOpen(i))return;
  mode="preview";
  const theme=LAND_GRADIENTS[i],m=MISSIONS[i];
  const continuing=record.active && record.active.mission===i;
  setScreen('<div class="mission-scene-card" style="--scene-a:'+theme[0]+';--scene-b:'+theme[1]+'">'+
    '<div class="mission-scene-art"><span class="big-icon" aria-hidden="true">'+LAND_ICONS[i]+'</span></div>'+
    '<span class="kicker" style="display:block;margin-top:22px">TIERRA '+(i+1)+' DE 5</span>'+
    '<h2>'+escapeHtml(m.title)+'</h2><p>'+escapeHtml(m.description)+'</p>'+
    '<div class="mission-traits"><span>🎯 '+ROUND_LENGTHS[i]+' desafíos</span><span>🎲 Combinación aleatoria</span><span>💡 Pistas</span></div>'+
    '<div class="result-actions"><button type="button" class="soft-btn" data-action="map">← Volver al mapa</button>'+
    '<button type="button" class="primary-btn" data-action="launch-mission" data-index="'+i+'">'+(continuing?"Continuar":"¡Comenzar!")+' →</button></div></div>');
}
startMission=function(i){
  if(!missionIsOpen(i))return;
  missionIndex=i;
  const old=record.active;
  if(old && old.mission===i){
    const ids=Array.isArray(old.ids) && old.ids.length===ROUND_LENGTHS[i] ?
      old.ids:MISSION_BANKS[i].slice(0,ROUND_LENGTHS[i]).map(function(t){return t.id;});
    MISSIONS[i].tasks=resolveRound(i,ids);
    taskIndex=Math.max(0,Math.min(MISSIONS[i].tasks.length,Number(old.task)||0));
    score=Number(old.points)||0;
    record.active={mission:i,task:taskIndex,points:score,ids};
  }else{
    const prev=(record.lastRound||{})[i]||[];
    const ids=chooseRound(i,prev);
    MISSIONS[i].tasks=resolveRound(i,ids);
    taskIndex=0;score=0;
    record.lastRound=record.lastRound||{};
    record.lastRound[i]=ids.slice();
    record.active={mission:i,task:0,points:0,ids};
  }
  save();
  tries=0;answered=false;resetTaskState();
  if(taskIndex>=MISSIONS[i].tasks.length)completeMission();
  else renderTask();
};
const resetTaskStateV1=resetTaskState;
resetTaskState=function(){
  resetTaskStateV1();
  classifyOrder=[];
  classified=[];
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  if(t && t.type==="classify")classifyOrder=randomOrder(t.items.map(function(_,i){return i;}));
  if(t && t.type==="order"){
    sequence=randomOrder(t.steps.map(function(_,i){return i;}));
    if(sequence.every(function(n,i){return n===i;}))sequence.reverse();
  }
};
const taskContentV1=taskContent;
taskContent=function(t){
  if(t.type==="point"){
    const older=taskContentV1(t);
    return older.replace(t.diagram==="human"?humanSvg:neuronSvg,
      t.diagram==="human"?NEURO_HUMAN_V2:NEURO_NEURON_V2);
  }
  if(t.type!=="classify")return taskContentV1(t);
  const current=t.items[classifyOrder[classified.length]];
  return '<p class="instruction">CLASIFICÁ CADA ELEMENTO EN SU LUGAR</p>'+
    '<div class="classify-board"><div class="classify-current"><small>ELEMENTO '+(classified.length+1)+' DE '+t.items.length+'</small>'+
    '<strong>'+escapeHtml(current[0])+'</strong></div>'+
    '<div class="classify-targets">'+t.buckets.map(function(bucket,i){return '<button type="button" class="classify-target" data-action="classify" data-index="'+i+'"><span aria-hidden="true">'+(i===0?"🔹":"🔸")+'</span>'+escapeHtml(bucket)+'</button>';}).join("")+'</div>'+
    '<p class="classify-progress">✓ '+classified.length+' de '+t.items.length+' clasificados</p></div>';
};
renderTask=function(){
  mode="play";answered=false;
  const m=MISSIONS[missionIndex],t=m.tasks[taskIndex];
  if(!t){completeMission();return;}
  const colors=LAND_GRADIENTS[missionIndex];
  const progress=m.tasks.map(function(x,i){return '<span class="'+(i<taskIndex?"passed":i===taskIndex?"current":"")+'"></span>';}).join("");
  setScreen('<div class="mission-meta"><span class="step-tag">'+escapeHtml(m.title)+' · DESAFÍO '+(taskIndex+1)+' / '+m.tasks.length+'</span>'+
    '<div class="mission-nav"><span class="step-tag">✦ '+score+' chispas</span>'+
    '<button type="button" class="soft-btn mini-btn" data-action="map">← Mapa</button></div></div>'+
    '<div class="tracker" aria-hidden="true">'+progress+'</div>'+
    '<div class="quest-scene" style="--scene-a:'+colors[0]+';--scene-b:'+colors[1]+'">'+
    '<span class="scene-name">TIERRA '+(missionIndex+1)+' · '+escapeHtml(m.title.toUpperCase())+'</span>'+
    '<span class="scene-cloud" aria-hidden="true"></span><span class="scene-cloud two" aria-hidden="true"></span>'+
    '<span class="scene-icon" aria-hidden="true">'+LAND_ICONS[missionIndex]+'</span></div>'+
    '<div class="quest-heading" style="--quest-accent:'+LAND_COLORS[missionIndex]+'">'+
    '<div class="quest-label">TU CONSIGNA</div><h2>'+escapeHtml(t.q)+'</h2></div>'+
    '<div class="play-panel">'+taskContent(t)+'</div><div id="task-feedback" aria-live="polite"></div>');
};
const markAnswerV1=markAnswer;
markAnswer=function(correct,element){
  if(answered)return;
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  const ids=record.active && record.active.ids;
  const errorCount=tries;
  markAnswerV1(correct,element);
  if(correct && answered){
    if(ids && record.active)record.active.ids=ids;
    record.practice=record.practice||{};
    const entry=record.practice[t.id]||{played:0,errors:0};
    record.practice[t.id]={played:entry.played+1,errors:entry.errors+errorCount};
    save();
  }
};
function chooseClassify(bucket){
  if(answered || mode!=="play")return;
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  if(!t || t.type!=="classify")return;
  const idx=classifyOrder[classified.length];
  if(idx===undefined)return;
  if(t.items[idx][1]===bucket){
    classified.push(idx);
    if(classified.length===t.items.length)markAnswer(true);
    else{renderTaskPreservingState();say("¡Bien! Clasificá el siguiente elemento.");}
  }else{
    tries++;
    showFeedback(false,t.hint);
  }
}
game.addEventListener("click",function(event){
  const button=event.target.closest("button[data-action]");
  if(!button || button.disabled)return;
  const action=button.dataset.action;
  if(action==="preview-mission")showMissionPreview(Number(button.dataset.index));
  if(action==="launch-mission")startMission(Number(button.dataset.index));
  if(action==="classify")chooseClassify(Number(button.dataset.index));
});
// Sustituye la portada anterior al terminar de cargar todos los recursos diferidos.
renderWelcome();
