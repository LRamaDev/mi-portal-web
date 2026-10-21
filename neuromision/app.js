"use strict";

/* NeuroMisión v1.0 — juego autocontenido, sin cuentas ni datos en servidores. */
const STORAGE = "neuromision_v1_profiles";
const LAST = "neuromision_v1_last";
const MISSIONS = [
  {
    title:"El centro de control", label:"MISIÓN 01", icon:"🧠",
    description:"Explorá cómo el cerebro, la médula y los nervios trabajan juntos.",
    badge:"Explorador/a del sistema",
    tasks:[
      {type:"point",diagram:"human",target:"cerebro",q:"Localizá el cerebro en el esquema del sistema nervioso.",hint:"Buscá el órgano principal que está protegido por el cráneo.",note:"El cerebro recibe, procesa e integra información; participa en la memoria, el pensamiento y los movimientos voluntarios."},
      {type:"point",diagram:"human",target:"medula",q:"¿Dónde está la médula espinal?",hint:"Está protegida por la columna vertebral y comunica encéfalo y cuerpo.",note:"La médula espinal transmite mensajes entre el encéfalo y el cuerpo. También participa en respuestas reflejas rápidas."},
      {type:"point",diagram:"human",target:"nervios",q:"Señalá los nervios que conectan el sistema nervioso central con distintas zonas del cuerpo.",hint:"Son las ramificaciones que salen hacia brazos, piernas y otras partes.",note:"Los nervios forman parte del sistema nervioso periférico: conectan el sistema nervioso central con el resto del cuerpo."},
      {type:"point",diagram:"human",target:"cerebelo",q:"Encontrá el cerebelo.",hint:"Está en la parte posterior e inferior del encéfalo.",note:"El cerebelo ayuda a coordinar los movimientos y mantener el equilibrio y la postura."},
      {type:"choice",q:"¿Qué estructuras forman el sistema nervioso central?",options:["Encéfalo y médula espinal","Nervios de los brazos y las piernas","Ojos, oídos y nariz","Músculos y huesos"],answer:0,hint:"Pensá qué estructuras están protegidas por el cráneo y la columna.",note:"El sistema nervioso central está formado por el encéfalo y la médula espinal. Los nervios pertenecen al sistema nervioso periférico."}
    ]
  },
  {
    title:"Construí la neurona",label:"MISIÓN 02",icon:"⚡",
    description:"Identificá sus partes y seguí el mensaje de una neurona.",
    badge:"Especialista neuronal",
    tasks:[
      {type:"point",diagram:"neuron",target:"dendritas",q:"Tocá las dendritas de esta neurona.",hint:"Son las ramificaciones que reciben señales de otras células.",note:"Las dendritas reciben información y la llevan hacia el cuerpo celular."},
      {type:"point",diagram:"neuron",target:"soma",q:"¿Cuál es el cuerpo celular o soma?",hint:"Es la parte más ancha donde se encuentra el núcleo.",note:"El cuerpo celular contiene el núcleo y participa en el funcionamiento de la neurona."},
      {type:"point",diagram:"neuron",target:"axon",q:"Señalá el axón.",hint:"Es una prolongación larga que conduce el impulso hacia otras células.",note:"El axón conduce el impulso nervioso desde el cuerpo celular hacia sus terminaciones."},
      {type:"point",diagram:"neuron",target:"mielina",q:"Encontrá la vaina de mielina.",hint:"Son segmentos que recubren partes del axón.",note:"La mielina aísla el axón y permite que los impulsos se transmitan más rápidamente en muchas neuronas."},
      {type:"point",diagram:"neuron",target:"terminales",q:"¿Dónde están las terminales del axón?",hint:"Mirá el extremo que se divide en pequeñas ramificaciones.",note:"En las terminales del axón, la neurona puede transmitir señales a otras células mediante la sinapsis."},
      {type:"order",q:"Ordená el recorrido general de una señal a través de una neurona.",steps:["Dendritas: reciben la señal","Cuerpo celular: integra información","Axón: conduce el impulso","Terminales: transmiten la señal"],start:[2,0,3,1],hint:"Empezá por las ramificaciones receptoras y terminá donde se transmite la señal a otra célula.",note:"En el esquema escolar simplificado, la información llega por las dendritas, pasa por el soma y viaja por el axón hasta sus terminales."}
    ]
  },
  {
    title:"Detectives de estímulos",label:"MISIÓN 03",icon:"👀",
    description:"Descubrí qué receptores captan la información del ambiente.",
    badge:"Detector/a sensorial",
    tasks:[
      {type:"pair",q:"Uní cada estímulo con el órgano o receptor que puede detectarlo.",left:["Luz de una linterna","Sonido de una campana","Olor a pan recién hecho","Frío sobre la piel"],right:["Ojo: fotorreceptores","Oído: receptores auditivos","Nariz: receptores olfatorios","Piel: termorreceptores"],show:[2,0,3,1],hint:"Pensá qué sentido permite detectar cada cambio del ambiente.",note:"Los receptores sensoriales detectan estímulos como luz, sonidos, sustancias químicas y cambios de temperatura."},
      {type:"choice",q:"Una bicicleta toca bocina. ¿Qué actúa como estímulo?",options:["El sonido de la bocina","La oreja en sí misma","La médula espinal","El movimiento de las piernas"],answer:0,hint:"El estímulo es el cambio que un receptor puede detectar.",note:"El sonido de la bocina es un estímulo. Los receptores auditivos del oído lo detectan."},
      {type:"choice",q:"¿Qué receptores de la retina captan la luz?",options:["Fotorreceptores","Termorreceptores","Receptores olfatorios","Receptores gustativos"],answer:0,hint:"Su nombre se relaciona con la luz.",note:"Los fotorreceptores de la retina transforman la luz en señales que el sistema nervioso puede procesar."},
      {type:"choice",q:"Si tocás una botella muy fría, ¿qué información registran los termorreceptores de tu piel?",options:["La temperatura","El color de la botella","El olor de la botella","El sonido de una voz"],answer:0,hint:"Los termorreceptores responden a cambios térmicos.",note:"Los termorreceptores detectan temperaturas y cambios de temperatura. Otros receptores detectan presión y estímulos potencialmente dañinos."},
      {type:"choice",q:"¿Qué afirmación describe mejor la relación entre estímulo y receptor?",options:["El estímulo es un cambio; el receptor lo detecta","El receptor es el cambio; el estímulo responde","Todos los receptores detectan lo mismo","Solo existen estímulos que vemos"],answer:0,hint:"Diferenciá lo que ocurre en el ambiente de la estructura que lo percibe.",note:"Un estímulo es un cambio interno o externo detectable; el receptor sensorial especializado puede captarlo."}
    ]
  },
  {
    title:"El camino del mensaje",label:"MISIÓN 04",icon:"🔁",
    description:"Reconstruí una respuesta refleja y una acción voluntaria.",
    badge:"Piloto/a de circuitos",
    tasks:[
      {type:"order",q:"Tocás algo muy caliente. Ordená el circuito reflejo simplificado.",steps:["El calor activa receptores en la piel","Una neurona sensitiva lleva la señal a la médula","La médula integra la señal mediante conexiones nerviosas","Una neurona motora envía la orden","Los músculos retiran la mano"],start:[3,0,4,1,2],hint:"Primero aparece el estímulo; luego la señal entra al sistema nervioso y finalmente sale hacia el músculo.",note:"En un reflejo de retirada, la médula espinal puede coordinar una respuesta rápida. El encéfalo también recibe información sobre lo ocurrido."},
      {type:"choice",q:"¿Por qué un reflejo de retirada puede ser muy rápido?",options:["Porque circuitos de la médula pueden iniciar la respuesta","Porque el músculo piensa por sí solo","Porque no interviene ningún nervio","Porque nunca llega información al encéfalo"],answer:0,hint:"Recordá que no todas las respuestas necesitan esperar una decisión consciente.",note:"Los reflejos usan circuitos nerviosos rápidos. Eso no significa que el encéfalo quede aislado: también recibe la información."},
      {type:"choice",q:"En el reflejo de retirar la mano, ¿cuál es el efector?",options:["Los músculos que mueven la mano y el brazo","El objeto caliente","La luz del ambiente","Los receptores de la piel"],answer:0,hint:"El efector realiza físicamente la respuesta.",note:"Un efector puede ser un músculo o una glándula. Aquí los músculos producen el movimiento de retirada."},
      {type:"order",q:"Querés levantar un lápiz de forma voluntaria. Ordená estas etapas simplificadas.",steps:["Decidís levantar el lápiz","Áreas motoras del encéfalo envían órdenes","Los mensajes llegan por vías nerviosas motoras","Los músculos de la mano se contraen"],start:[2,3,0,1],hint:"La intención aparece antes de la orden motora y del movimiento.",note:"Los movimientos voluntarios requieren procesamiento en el encéfalo y señales hacia músculos por vías motoras."},
      {type:"choice",q:"¿Qué diferencia principal hay entre una acción voluntaria y un reflejo de retirada?",options:["La voluntaria se decide conscientemente; el reflejo es automático","La voluntaria no usa nervios","El reflejo siempre necesita primero una decisión consciente","Ninguna de las dos usa músculos"],answer:0,hint:"Pensá en decidir levantar un objeto frente a retirar rápidamente una mano.",note:"En una acción voluntaria hay intención consciente. Una respuesta refleja es automática y puede comenzar por circuitos medulares."}
    ]
  },
  {
    title:"La gran NeuroMisión",label:"MISIÓN 05",icon:"🏆",
    description:"Combiná todo lo aprendido para resolver situaciones de la vida real.",
    badge:"Maestro/a de NeuroMisión",
    tasks:[
      {type:"choice",q:"Ves venir una pelota hacia vos y levantás las manos para atajarla. ¿Qué secuencia tiene sentido?",options:["Ojos → sistema nervioso → músculos","Músculos → ojos → pelota","Cerebelo → pelota → ojos solamente","Nariz → músculos → ojos"],answer:0,hint:"Primero se capta información y después se produce una respuesta.",note:"Los receptores visuales captan luz; el sistema nervioso procesa información y coordina órdenes que llegan a los músculos."},
      {type:"point",diagram:"neuron",target:"dendritas",q:"Una neurona recibe señales de otras neuronas. ¿Qué estructura identificás?",hint:"Buscá las ramificaciones receptoras.",note:"Las dendritas son estructuras que suelen recibir señales de otras neuronas."},
      {type:"pair",q:"Desafío mixto: relacioná cada estructura con su función principal.",left:["Cerebelo","Axón","Médula espinal","Fotorreceptores"],right:["Coordinar movimientos y equilibrio","Conducir impulsos nerviosos","Transmitir señales y participar en reflejos","Captar luz"],show:[3,1,0,2],hint:"Una se relaciona con la luz; otra con equilibrio; otra con señales en la neurona; otra con la columna.",note:"Cada estructura cumple una función distinta y se integra con las demás en el sistema nervioso."},
      {type:"order",q:"Al oír tu nombre, girás la cabeza. Ordená la explicación simplificada.",steps:["El sonido llega al oído","Los receptores auditivos generan señales","El sistema nervioso procesa la información","Se envían órdenes motoras y girás la cabeza"],start:[2,0,3,1],hint:"De la señal sonora pasamos a su recepción, interpretación y respuesta.",note:"El sistema nervioso integra la información sensorial y puede producir una respuesta motora."},
      {type:"choice",q:"¿Qué parte NO pertenece al sistema nervioso central?",options:["Los nervios periféricos","El cerebro","El cerebelo","La médula espinal"],answer:0,hint:"Pensá qué elementos conectan las regiones centrales con el resto del organismo.",note:"Los nervios periféricos pertenecen al sistema nervioso periférico. El cerebro, el cerebelo y la médula espinal son estructuras del central."},
      {type:"choice",q:"Una persona huele humo y se aleja del lugar. ¿Cuál es la explicación más completa?",options:["Receptores olfatorios detectan sustancias y el sistema nervioso organiza una respuesta","Los músculos detectan el olor sin receptores","La médula crea el olor","El cerebro no participa en ningún momento"],answer:0,hint:"Uní receptor, información nerviosa y respuesta.",note:"Los receptores olfatorios responden a sustancias químicas. La información se procesa y puede motivar una conducta, como alejarse."}
    ]
  }
];

const game = document.getElementById("game");
const sessionStatus = document.getElementById("session-status");
const announcer = document.getElementById("announcer");
let profiles = loadJson(STORAGE,{});
let player = "";
let record = null;
let mode = "welcome";
let missionIndex = 0;
let taskIndex = 0;
let score = 0;
let tries = 0;
let answered = false;
let sequence = [];
let pairLeft = -1;
let paired = [];
let feedbackMessage = "";

function loadJson(key,fallback){
  try { const value=JSON.parse(localStorage.getItem(key)); return value && typeof value==="object" ? value : fallback; }
  catch(e){ return fallback; }
}
function setStore(key,value){
  try { localStorage.setItem(key,typeof value==="string"?value:JSON.stringify(value)); } catch(e) { /* privacidad: el juego sigue funcionando si no hay almacenamiento */ }
}
function getStore(key){
  try { return localStorage.getItem(key) || ""; } catch(e){ return ""; }
}
function escapeHtml(v){
  return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});
}
function say(message){ announcer.textContent=message; }
function save(){
  if(!player || !record)return;
  profiles[player.toLowerCase()]=record;
  setStore(STORAGE,profiles);
  setStore(LAST,player);
}
function updateStatus(){
  sessionStatus.textContent=player ? player+" · "+totalScore()+" puntos" : "¡Bienvenidos!";
}
function totalScore(){
  if(!record || !record.best)return 0;
  return Object.values(record.best).reduce(function(sum,n){ return sum+(Number(n)||0);},0);
}
function setScreen(content){
  game.innerHTML=content;
  updateStatus();
}
function renderWelcome(){
  mode="welcome";
  player="";
  record=null;
  updateStatus();
  const savedNames=Object.keys(profiles).slice(0,6).map(function(key){return profiles[key].name || key;});
  setScreen('<div class="home-grid"><div>'+
    '<span class="kicker">NUEVA AVENTURA DESBLOQUEADA</span>'+
    '<div class="mission-head" style="text-align:left;margin:0"><h2>¿Listo/a para activar tus neuronas?</h2>'+
    '<p>Entrá con un apodo para guardar tus avances en este dispositivo. Podés usar el mismo juego con distintos perfiles.</p></div>'+
    '<form id="welcome-form"><label class="form-label" for="nickname">¿Cómo querés que te llamemos?</label>'+
    '<input class="nick-field" type="text" id="nickname" name="nickname" maxlength="22" autocomplete="off" placeholder="Tu apodo" required>'+
    '<p class="field-note">Sin contraseñas, sin rankings públicos y sin compartir datos.</p>'+
    '<button class="primary-btn large-btn" type="submit">Comenzar la aventura <span aria-hidden="true">→</span></button></form>'+
    (savedNames.length ? '<div class="form-label">Continuar con un perfil de este navegador</div><div class="choose-profile">'+savedNames.map(function(name){return '<button type="button" class="profile-pill" data-action="profile" data-name="'+escapeHtml(name)+'">'+escapeHtml(name)+'</button>';}).join("")+'</div>':"")+
    '</div><div class="home-art" aria-hidden="true"><div class="orbit"></div><div class="orbit two"></div><span class="spark s1"></span><span class="spark s2"></span><div class="brain-hero">🧠</div><div class="callout">MODO CURIOSIDAD: ACTIVADO ⚡</div></div></div>');
  document.getElementById("nickname").value=getStore(LAST);
}
function selectPlayer(name){
  const clean=String(name).trim().replace(/\s+/g," ").slice(0,22);
  if(!clean){say("Escribí un apodo para continuar.");return;}
  player=clean;
  const key=player.toLowerCase();
  record=profiles[key] && typeof profiles[key]==="object" ? profiles[key] : {name:player,completed:{},best:{},active:null};
  record.name=player;
  record.completed=record.completed || {};
  record.best=record.best || {};
  save();
  renderMap();
  say("¡Hola, "+player+"! Ya podés elegir una misión.");
}
function missionIsOpen(i){return i===0 || Boolean(record && record.completed && record.completed[i-1]);}
function renderMap(){
  mode="map";
  const finished=MISSIONS.filter(function(m,i){return !!record.completed[i];}).length;
  const percent=Math.round(finished/MISSIONS.length*100);
  const cards=MISSIONS.map(function(m,i){
    const done=Boolean(record.completed[i]);
    const open=missionIsOpen(i);
    const active=record.active && record.active.mission===i && !done;
    const points=record.best[i] || 0;
    return '<article class="mission-card '+(done?"completed":open?"unlocked":"locked")+'">'+
      '<span class="mission-badge">'+m.label+'</span><span class="mission-glyph" aria-hidden="true">'+m.icon+'</span>'+
      '<h3>'+escapeHtml(m.title)+'</h3><p>'+escapeHtml(m.description)+'</p>'+
      '<div class="card-foot"><span class="card-status '+(open?"":"locked-state")+'">'+
      (done?"✓ Completa · "+points+" pts":open?(active?"● En curso":"Disponible"):"🔒 Bloqueada")+'</span>'+
      '<button type="button" class="'+(open?"secondary-btn":"soft-btn")+' mini-btn" data-action="mission" data-index="'+i+'" '+(open?"":"disabled")+'>'+
      (done?"Repetir":active?"Continuar":open?"Jugar":"Cerrada")+'</button></div></article>';
  }).join("");
  setScreen('<div class="map-top"><div><span class="kicker">PANEL DE MISIONES</span>'+
    '<h2>¡Hola, '+escapeHtml(player)+'! <span aria-hidden="true">👋</span></h2><p>Elegí una misión. Cada desafío desbloquea el siguiente.</p></div>'+
    '<div class="score-stack"><span class="total-points">★ '+totalScore()+'</span><small>PUNTOS ACUMULADOS</small><small>'+finished+' / 5 MISIONES</small></div></div>'+
    '<div class="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'" aria-label="Misiones completadas"><span style="width:'+percent+'%"></span></div>'+
    '<div class="missions-grid">'+cards+'</div>'+
    '<div class="map-actions"><span class="map-tip">💡 Sin límite de tiempo. Los errores son parte del aprendizaje.</span>'+
    '<button type="button" class="soft-btn mini-btn" data-action="switch">Cambiar de perfil</button></div>');
}
function startMission(i){
  if(!missionIsOpen(i))return;
  missionIndex=i;
  const active=record.active;
  if(active && active.mission===i && !record.completed[i]){
    taskIndex=Math.max(0,Math.min(MISSIONS[i].tasks.length,Number(active.task)||0));
    score=Number(active.points)||0;
  } else {
    taskIndex=0;score=0;
    record.active={mission:i,task:0,points:0};
    save();
  }
  tries=0;answered=false;resetTaskState();
  if(taskIndex>=MISSIONS[i].tasks.length) completeMission();
  else renderTask();
}
function resetTaskState(){
  pairLeft=-1;
  paired=[];
  feedbackMessage="";
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  sequence=t && t.type==="order" ? t.start.slice() : [];
}
const humanSvg='<svg viewBox="0 0 540 345" role="img" aria-label="Esquema ilustrado del sistema nervioso humano sin etiquetas">'+
  '<defs><linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#356e87"/><stop offset="1" stop-color="#1c4962"/></linearGradient></defs>'+
  '<g fill="none" stroke="#7db6c9" stroke-opacity=".19"><circle cx="270" cy="170" r="144"/><circle cx="270" cy="170" r="112"/><path d="M40 170H500M270 12V333"/></g>'+
  '<path d="M270 23c-29 0-49 23-49 53 0 22 11 38 22 46l-15 20-49 18c-15 5-25 16-30 30l-27 72 25 9 37-65 19-6 8 94 18 44h26l15-91 14 91h26l19-44 8-94 19 6 36 65 26-9-27-72c-5-14-15-25-30-30l-49-18-15-20c12-8 23-24 23-46 0-30-20-53-49-53Z" fill="url(#sil)" stroke="#8ccbdd" stroke-width="2"/>'+
  '<path d="M240 67c-6-15 11-30 24-23 11-12 27-7 33 4 15 0 19 13 14 21 5 12-2 22-14 23-7 12-20 8-28 6-14 9-31-3-29-16-7-7-6-12 0-15Z" fill="#e4acf2" stroke="#f2d1ff" stroke-width="2"/>'+
  '<path d="M263 46c-7 12 8 12 4 25m21-22c-7 9 4 12 0 22m-39-2c11-3 12 10 11 17m33-12c-8 0-14 6-14 13" fill="none" stroke="#8d65b5" stroke-width="2"/>'+
  '<ellipse cx="293" cy="101" rx="17" ry="10" fill="#d6fa83" stroke="#efffc9" stroke-width="2"/>'+
  '<path d="M270 112V262" stroke="#ffda8b" stroke-width="8" stroke-linecap="round"/>'+
  '<g stroke="#6dede0" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M270 142L220 166 184 192M270 155L320 166 358 192M270 179L215 212 164 240M270 189L322 210 374 239M270 221L233 270 222 305M270 221L308 270 318 305"/></g>'+
  '<g fill="#6dede0"><circle cx="184" cy="192" r="4"/><circle cx="358" cy="192" r="4"/><circle cx="164" cy="240" r="4"/><circle cx="374" cy="239" r="4"/></g></svg>';
const neuronSvg='<svg viewBox="0 0 660 300" role="img" aria-label="Esquema ilustrado de una neurona sin etiquetas">'+
  '<defs><linearGradient id="ner" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6fdbd5"/><stop offset="1" stop-color="#9b92d9"/></linearGradient></defs>'+
  '<g fill="none" stroke="#71adc7" stroke-opacity=".2"><path d="M0 150H660M330 0V300"/><circle cx="340" cy="150" r="100"/></g>'+
  '<g fill="none" stroke="#85e4d9" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M233 150L171 150 131 101 89 84M170 148 121 183 73 175M183 143 167 84 135 47M221 169 176 222 135 251M157 95 110 104 83 131M121 183 92 216"/></g>'+
  '<ellipse cx="252" cy="150" rx="66" ry="56" fill="url(#ner)" stroke="#d2fff9" stroke-width="3"/>'+
  '<ellipse cx="252" cy="150" rx="24" ry="24" fill="#344c7d" stroke="#eeefff" stroke-width="2"/>'+
  '<path d="M319 149H563" fill="none" stroke="#f8b9ae" stroke-width="12" stroke-linecap="round"/>'+
  '<g fill="#d6fa83" stroke="#d6fa83" stroke-width="2"><rect x="340" y="130" width="44" height="39" rx="19"/><rect x="398" y="130" width="44" height="39" rx="19"/><rect x="456" y="130" width="44" height="39" rx="19"/></g>'+
  '<g fill="none" stroke="#f8b9ae" stroke-width="8" stroke-linecap="round"><path d="M558 149L594 112 624 98M558 149L605 152 631 178M558 149L590 196 610 220"/></g>'+
  '<g fill="#ffddb7"><circle cx="625" cy="98" r="7"/><circle cx="632" cy="178" r="7"/><circle cx="611" cy="220" r="7"/></g></svg>';
const markers={
  human:[{id:"cerebro",name:"Cerebro",x:48,y:18},{id:"cerebelo",name:"Cerebelo",x:57,y:30},{id:"medula",name:"Médula espinal",x:50,y:57},{id:"nervios",name:"Nervios periféricos",x:68,y:69}],
  neuron:[{id:"dendritas",name:"Dendritas",x:18,y:32},{id:"soma",name:"Cuerpo celular",x:36,y:57},{id:"axon",name:"Axón",x:76,y:62},{id:"mielina",name:"Mielina",x:64,y:37},{id:"terminales",name:"Terminales del axón",x:92,y:36}]
};
function taskContent(t){
  if(t.type==="point"){
    return '<p class="instruction">TOCÁ EL PUNTO QUE CORRESPONDA A LA CONSIGNA</p>'+
      '<div class="diagram-frame '+(t.diagram==="neuron"?"neuron":"")+'">'+(t.diagram==="human"?humanSvg:neuronSvg)+
      markers[t.diagram].map(function(m,i){return '<button type="button" class="hotspot" style="--x:'+m.x+'%;--y:'+m.y+'%" data-action="point" data-answer="'+m.id+'" aria-label="Seleccionar punto '+(i+1)+' del esquema" title="Punto '+(i+1)+'">'+(i+1)+'</button>';}).join("")+
      '</div><div class="diagram-legend"><span>✳ Elegí uno de los puntos numerados.</span><span>Podés volver a intentar si te equivocás.</span></div>';
  }
  if(t.type==="choice"){
    return '<p class="instruction">ELEGÍ LA RESPUESTA MÁS COMPLETA</p><div class="answers">'+
      t.options.map(function(option,i){return '<button type="button" class="choice" data-action="choice" data-index="'+i+'"><span aria-hidden="true">'+String.fromCharCode(65+i)+'</span>'+escapeHtml(option)+'</button>';}).join("")+'</div>';
  }
  if(t.type==="order"){
    return '<p class="instruction">CAMBIÁ EL ORDEN CON LAS FLECHAS Y DESPUÉS COMPROBÁ</p>'+
      '<ol class="order-list">'+sequence.map(function(id,pos){return '<li class="order-row"><span class="order-num">'+(pos+1)+'</span>'+
      '<span class="order-text">'+escapeHtml(t.steps[id])+'</span>'+
      '<span class="move-buttons">'+
      '<button type="button" aria-label="Subir '+escapeHtml(t.steps[id])+'" data-action="move" data-index="'+pos+'" data-delta="-1" '+(pos===0?"disabled":"")+'>↑</button>'+
      '<button type="button" aria-label="Bajar '+escapeHtml(t.steps[id])+'" data-action="move" data-index="'+pos+'" data-delta="1" '+(pos===sequence.length-1?"disabled":"")+'>↓</button>'+
      '</span></li>';}).join("")+'</ol><div class="check-row"><button class="primary-btn" type="button" data-action="check-order">Comprobar el recorrido ✓</button></div>';
  }
  if(t.type==="pair"){
    const ready=t.left.map(function(label,i){return '<button class="pair-tile '+(paired.includes(i)?"done":pairLeft===i?"picked":"")+'" type="button" data-action="pair" data-side="left" data-index="'+i+'" '+(paired.includes(i)?"disabled":"")+'>'+escapeHtml(label)+'</button>';}).join("");
    const right=t.show.map(function(i){return '<button class="pair-tile '+(paired.includes(i)?"done":"")+'" type="button" data-action="pair" data-side="right" data-index="'+i+'" '+(paired.includes(i)?"disabled":"")+'>'+escapeHtml(t.right[i])+'</button>';}).join("");
    return '<p class="instruction">ELEGÍ UN ELEMENTO A LA IZQUIERDA Y SU PAREJA A LA DERECHA</p>'+
      '<div class="pair-grid"><div class="pair-col"><h3>ESTÍMULO / ESTRUCTURA</h3>'+ready+'</div>'+
      '<div class="pair-col"><h3>RECEPTOR / FUNCIÓN</h3>'+right+'</div></div>'+
      '<div class="match-progress">'+paired.length+' de '+t.left.length+' conexiones correctas</div>';
  }
  return "";
}
function renderTask(){
  mode="play";
  answered=false;
  const mission=MISSIONS[missionIndex],t=mission.tasks[taskIndex];
  if(!t){completeMission();return;}
  const progress=mission.tasks.map(function(x,i){return '<span class="'+(i<taskIndex?"passed":i===taskIndex?"current":"")+'"></span>';}).join("");
  setScreen('<div class="mission-meta"><span class="step-tag">'+mission.label+' · PASO '+(taskIndex+1)+' / '+mission.tasks.length+'</span>'+
    '<div class="mission-nav"><span class="step-tag">★ '+score+' pts</span><button type="button" class="soft-btn mini-btn" data-action="map">← Misiones</button></div></div>'+
    '<div class="tracker" aria-hidden="true">'+progress+'</div>'+
    '<div class="mission-head"><span class="kicker">'+mission.icon+' '+escapeHtml(mission.title)+'</span>'+
    '<h2>'+escapeHtml(t.q)+'</h2></div>'+
    '<div class="play-panel">'+taskContent(t)+'</div><div id="task-feedback" aria-live="polite"></div>');
}
function showFeedback(ok,text){
  const zone=document.getElementById("task-feedback");
  if(!zone)return;
  zone.innerHTML='<div class="feedback '+(ok?"":"error")+'" role="status"><h3>'+(ok?"¡Muy bien! ⚡":"Todavía no. ¡Probá otra vez! 💡")+'</h3>'+
    '<p>'+escapeHtml(text)+'</p>'+
    (ok?'<div class="feedback-actions"><button type="button" class="primary-btn" data-action="next">'+
       (taskIndex===MISSIONS[missionIndex].tasks.length-1?"Completar misión":"Siguiente desafío →")+'</button></div>':"")+'</div>';
  if(ok){
    game.querySelectorAll(".hotspot,.choice,.pair-tile,.move-buttons button,[data-action='check-order']").forEach(function(el){el.disabled=true;});
  }
  say((ok?"Correcto. ":"Intentá otra vez. ")+text);
  zone.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function markAnswer(correct,element){
  if(answered)return;
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  if(correct){
    answered=true;
    const earned=tries===0?10:tries===1?7:4;
    score+=earned;
    if(element)element.classList.add("correct");
    record.active={mission:missionIndex,task:taskIndex+1,points:score};
    save();
    showFeedback(true,t.note+" +"+earned+" puntos.");
  } else {
    tries++;
    if(element)element.classList.add("wrong");
    showFeedback(false,t.hint);
  }
}
function choosePair(side,id){
  if(answered || paired.includes(id))return;
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  if(side==="left"){
    pairLeft=id;
    const selected=game.querySelectorAll(".pair-tile[data-side='left']");
    selected.forEach(function(el){el.classList.toggle("picked",Number(el.dataset.index)===id);});
    say("Ahora elegí la función o receptor correspondiente a la derecha.");
    return;
  }
  if(pairLeft<0){say("Elegí primero un elemento de la columna izquierda.");return;}
  if(pairLeft===id){
    paired.push(id);pairLeft=-1;
    if(paired.length===t.left.length){markAnswer(true);return;}
    renderTaskPreservingState();
    say("¡Conexión correcta! "+paired.length+" de "+t.left.length+".");
  } else {
    tries++;
    pairLeft=-1;
    renderTaskPreservingState();
    showFeedback(false,"Esa pareja no corresponde. "+t.hint);
  }
}
function renderTaskPreservingState(){
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  const area=game.querySelector(".play-panel");
  if(area)area.innerHTML=taskContent(t);
  const zone=document.getElementById("task-feedback");
  if(zone)zone.innerHTML="";
}
function moveRow(pos,delta){
  if(answered)return;
  const next=pos+delta;
  if(next<0 || next>=sequence.length)return;
  const value=sequence[pos];sequence[pos]=sequence[next];sequence[next]=value;
  renderTaskPreservingState();
  const button=game.querySelector('[data-action="move"][data-index="'+next+'"][data-delta="'+delta+'"]');
  if(button)button.focus();
}
function completeMission(){
  const m=MISSIONS[missionIndex];
  record.completed[missionIndex]=true;
  record.best[missionIndex]=Math.max(Number(record.best[missionIndex])||0,score);
  record.active=null;
  save();
  mode="complete";
  const grand=Object.keys(record.completed).filter(function(k){return record.completed[k];}).length===MISSIONS.length;
  setScreen('<div class="screen-head"><span class="kicker">MISIÓN '+(missionIndex+1)+' COMPLETADA</span>'+
    '<div class="result-icon" aria-hidden="true">'+(grand?"🏆":"🌟")+'</div>'+
    '<h2>'+(grand?"¡Terminaste toda la aventura!":"¡Circuito completado!")+'</h2>'+
    '<p>¡Gran trabajo, '+escapeHtml(player)+'! Exploraste '+escapeHtml(m.title.toLowerCase())+' y sumaste nuevos conocimientos.</p></div>'+
    '<div class="result-score">+'+score+' ★</div><p class="result-detail">Puntos de esta partida · mejor marca: '+record.best[missionIndex]+'</p>'+
    '<div class="completion-summary"><p>Insignia conseguida</p><div class="badge-row"><span class="earned-badge">✦ '+escapeHtml(m.badge)+'</span></div>'+
    '<p style="margin-top:13px">'+(grand?"Podés repetir las misiones para practicar y mejorar tu puntuación.":"Una nueva misión está lista para jugar.")+'</p></div>'+
    '<div class="result-actions"><button type="button" class="secondary-btn" data-action="map">Ver todas las misiones</button>'+
    (grand?"":'<button type="button" class="primary-btn" data-action="next-mission">Siguiente misión →</button>')+
    '</div>');
  say("¡Felicitaciones! Completaste "+m.title+".");
}
game.addEventListener("submit",function(event){
  if(event.target.id!=="welcome-form")return;
  event.preventDefault();
  selectPlayer(document.getElementById("nickname").value);
});
game.addEventListener("click",function(event){
  const button=event.target.closest("button[data-action]");
  if(!button || button.disabled)return;
  const action=button.dataset.action;
  if(action==="profile"){selectPlayer(button.dataset.name);return;}
  if(action==="switch"){renderWelcome();return;}
  if(action==="map"){renderMap();return;}
  if(action==="mission"){startMission(Number(button.dataset.index));return;}
  if(action==="next-mission"){
    const index=Math.min(MISSIONS.length-1,missionIndex+1);
    if(index===missionIndex){renderMap();return;}
    startMission(index);return;
  }
  if(mode!=="play" || answered)return;
  const t=MISSIONS[missionIndex].tasks[taskIndex];
  if(action==="point"){markAnswer(button.dataset.answer===t.target,button);return;}
  if(action==="choice"){markAnswer(Number(button.dataset.index)===t.answer,button);return;}
  if(action==="pair"){choosePair(button.dataset.side,Number(button.dataset.index));return;}
  if(action==="move"){moveRow(Number(button.dataset.index),Number(button.dataset.delta));return;}
  if(action==="check-order"){
    markAnswer(sequence.every(function(id,pos){return id===pos;}));
    return;
  }
  if(action==="next"){
    taskIndex++;
    tries=0;
    resetTaskState();
    renderTask();
  }
});
/* La navegación a la siguiente actividad es posible aun con la respuesta ya registrada. */
game.addEventListener("click",function(event){
  const b=event.target.closest('button[data-action="next"]');
  if(!b || !answered || mode!=="play")return;
  taskIndex++;
  tries=0;
  resetTaskState();
  renderTask();
});
renderWelcome();
