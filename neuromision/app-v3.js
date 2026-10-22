"use strict";
/* NeuroMisión v3.0: ilustraciones WebP y mapa panorámico responsive.
 * Mantiene exclusivamente el almacenamiento oficial neuromision_v1_profiles.
 * No incluye desbloqueo de beta ni laboratorio de prueba.
 */
"use strict";
/* Escenarios ilustrados — prototipo experimental v2.1.
 * No modifica la versión publicada ni comparte sus datos de juego.
 */
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

"use strict";
/* NeuroMisión beta v2.2: ilustración WebP + zonas poligonales táctiles.
 * El dibujo es una imagen raster; las áreas interactivas son botones HTML transparentes.
 * Los porcentajes se refieren a cada imagen exportada (495 × 450 y 517 × 448).
 * Sin números, iconos o marcadores dibujados sobre órganos.
 */
const PICTURE_ZONES={
 human:{
  width:495,height:450,
  image:"./assets/body-interactive.webp",
  alt:"Ilustración del cuerpo humano con encéfalo, médula espinal y ramificaciones nerviosas.",
  zones:[
   {id:"cerebro",label:"Cerebro",x:26,y:1,w:17,h:17,shape:"polygon(18% 18%,45% 0%,76% 5%,100% 30%,90% 67%,65% 95%,18% 96%,0% 65%)",z:3},
   {id:"cerebelo",label:"Cerebelo",x:75.5,y:23.4,w:17.5,h:13,shape:"polygon(14% 11%,85% 0%,100% 49%,84% 86%,27% 100%,0% 59%)",z:4},
   {id:"medula",label:"Médula espinal",x:34.5,y:25.8,w:9.4,h:50,shape:"polygon(26% 0%,76% 0%,63% 100%,34% 100%)",z:2},
   {id:"nervios",label:"Nervios periféricos en el brazo izquierdo",x:7.5,y:32.5,w:25,h:50,shape:"polygon(68% 0%,93% 7%,74% 35%,55% 64%,24% 97%,0% 92%,32% 57%,43% 29%)",z:1},
   {id:"nervios",label:"Nervios periféricos en el brazo derecho",x:49,y:32.5,w:23,h:49,shape:"polygon(0% 0%,23% 0%,51% 43%,100% 91%,73% 99%,29% 60%,14% 32%)",z:1},
   {id:"nervios",label:"Nervios periféricos en las piernas",x:21,y:64,w:35,h:35,shape:"polygon(0% 0%,18% 0%,34% 100%,10% 100%,0% 38%,62% 0%,86% 0%,100% 100%,75% 100%,66% 36%)",z:1}
  ]
 },
 neuron:{
  width:517,height:448,
  image:"./assets/neuron-interactive.webp",
  alt:"Ilustración completa de una neurona con ramificaciones, soma, núcleo, axón, mielina y terminales.",
  zones:[
   {id:"dendritas",label:"Dendritas",x:0,y:0,w:28,h:99,shape:"polygon(0% 0%,80% 0%,100% 28%,70% 38%,72% 55%,92% 100%,38% 100%,22% 78%,0% 69%)",z:1},
   {id:"soma",label:"Cuerpo celular o soma",x:14.5,y:30,w:31,h:37,shape:"polygon(8% 12%,50% 0%,86% 15%,100% 41%,87% 84%,52% 100%,13% 86%,0% 49%)",z:2},
   {id:"nucleo",label:"Núcleo",x:18.4,y:35.5,w:12.2,h:17,shape:"polygon(13% 22%,48% 0%,83% 17%,100% 54%,83% 86%,45% 100%,0% 75%,0% 40%)",z:5},
   {id:"axon",label:"Axón sin recubrimiento",x:72.5,y:62.5,w:13.2,h:11.5,shape:"polygon(0% 29%,90% 10%,100% 55%,12% 97%)",z:3},
   {id:"mielina",label:"Vainas de mielina",x:40.5,y:45.5,w:33.5,h:29.8,shape:"polygon(0% 2%,31% 0%,44% 38%,69% 38%,84% 57%,100% 65%,100% 100%,72% 98%,45% 71%,25% 67%)",z:4},
   {id:"terminales",label:"Terminales del axón",x:77,y:31.5,w:23,h:67,shape:"polygon(49% 0%,100% 0%,100% 100%,12% 100%,26% 71%,0% 52%,24% 36%)",z:2}
  ]
 }
};
// Agregar el núcleo sin alargar la misión ni aumentar el banco: sustituimos
// una pregunta repetida sobre las terminales por otra sobre el núcleo.
const nucleusTask=MISSION_BANKS[1].find(function(t){return t.id==="m1-e16"&&t.type==="point";});
if(nucleusTask){
 nucleusTask.target="nucleo";
 nucleusTask.q="Tocá el núcleo de la neurona.";
 nucleusTask.hint="Buscá la estructura redondeada que está dentro del cuerpo celular.";
 nucleusTask.note="El núcleo contiene el material genético de la neurona y está dentro del soma.";
}
const fallbackTaskContent=taskContent;
taskContent=function(t){
 if(t.type!=="point" || !PICTURE_ZONES[t.diagram])return fallbackTaskContent(t);
 const map=PICTURE_ZONES[t.diagram];
 const interactive=map.zones.map(function(z){
  const css="--x:"+z.x+"%;--y:"+z.y+"%;--w:"+z.w+"%;--h:"+z.h+
   "%;--shape:"+z.shape+";z-index:"+z.z+";";
  return '<button type="button" class="hotspot image-hit" data-action="point" data-answer="'+z.id+
   '" aria-label="Seleccionar '+escapeHtml(z.label)+'" style="'+css+'"></button>';
 }).join("");
 return '<p class="instruction">TOCÁ DIRECTAMENTE LA PARTE DEL DIBUJO QUE CORRESPONDA</p>'+
   '<div class="picture-scroll" tabindex="0" aria-label="Ilustración interactiva; deslizá hacia los costados si es necesario">'+
   '<div class="picture-board '+t.diagram+'" style="aspect-ratio:'+map.width+'/'+map.height+'">'+
   '<img src="'+map.image+'" alt="'+escapeHtml(map.alt)+'" width="'+map.width+'" height="'+map.height+'" loading="eager" draggable="false">'+interactive+
   '</div></div>'+
   '<p class="picture-help">👆 Tocá el órgano o estructura sobre la propia ilustración. No hay puntos numerados.</p>';
};
// Detectar errores de carga de la imagen (para no dejar una actividad invisible).
game.addEventListener("error",function(event){
 const target=event.target;
 if(target && target.tagName==="IMG" && target.closest(".picture-board")){
  const area=target.closest(".play-panel");
  if(area)area.insertAdjacentHTML("beforeend",
   '<p class="image-load-error" role="alert">No se pudo cargar la ilustración. Revisá la conexión o recargá esta página.</p>');
 }
},true);

"use strict";
/* NeuroMisión beta 2.3 — tres mundos ilustrados como imágenes táctiles sin números.
   Extensión no destructiva: mantiene IDs de actividades y guardado local v2.1 beta.
   Las posiciones se expresan en porcentajes sobre la imagen WebP real.
*/
const SCENE_IMAGES={
  2:{path:"./assets/sensory-interactive.webp",width:494,height:439,
    alt:"Bosque luminoso con sol, ave cantando, flores, naranja y hielo, estímulos de los sentidos.",
    zones:[
      {id:"sol",label:"El sol, estímulo luminoso",x:7,y:1,w:24,h:26,z:3,shape:"polygon(35% 2%,62% 0%,91% 18%,100% 49%,87% 84%,55% 100%,17% 88%,0% 57%,12% 22%)"},
      {id:"ave",label:"Ave que canta, estímulo sonoro",x:67.5,y:5,w:29,h:24,z:3,shape:"polygon(15% 42%,46% 0%,87% 12%,100% 52%,81% 90%,33% 97%,0% 76%)"},
      {id:"flor",label:"Flores aromáticas",x:72,y:33,w:28,h:30,z:3,shape:"polygon(30% 0%,78% 0%,100% 23%,100% 92%,41% 100%,0% 68%,0% 25%)"},
      {id:"hielo",label:"Cubitos de hielo, estímulo frío",x:79,y:72,w:21,h:27,z:4,shape:"polygon(13% 0%,88% 0%,100% 21%,100% 100%,0% 100%,0% 17%)"},
      {id:"naranja",label:"Media naranja para el gusto",x:61,y:65,w:18,h:17,z:5,shape:"polygon(11% 12%,59% 0%,100% 32%,96% 80%,40% 100%,0% 69%)"}
    ]},
  3:{path:"./assets/reflex-interactive.webp",width:680,height:368,
    alt:"Niño retira la mano de una taza caliente. Se ve piel, vía sensitiva, médula espinal, vía motora y músculo.",
    zones:[
      {id:"taza",label:"Taza caliente, fuente del estímulo",x:0,y:58,w:22,h:28,z:3,shape:"polygon(13% 0%,85% 0%,99% 47%,86% 100%,23% 100%,0% 74%)"},
      {id:"receptor",label:"Piel de la mano que detecta calor",x:10.5,y:31,w:23,h:26,z:5,shape:"polygon(22% 0%,64% 0%,100% 34%,94% 92%,33% 100%,0% 60%)"},
      {id:"sensitiva",label:"Vía sensitiva azul hacia la médula",x:38,y:28,w:35,h:19,z:2,shape:"polygon(0% 54%,20% 18%,52% 24%,80% 0%,100% 0%,93% 42%,67% 58%,40% 74%,0% 100%)"},
      {id:"medula_reflejo",label:"Médula espinal, estructura del sistema nervioso central",x:74,y:12,w:20,h:34,z:5,shape:"polygon(0% 20%,23% 0%,77% 0%,100% 20%,98% 72%,78% 100%,13% 100%,0% 73%)"},
      {id:"musculo",label:"Músculo del brazo, efector del movimiento",x:54,y:48,w:27,h:35,z:4,shape:"polygon(3% 0%,66% 15%,100% 45%,100% 99%,63% 100%,0% 47%)"}
    ]},
  4:{path:"./assets/final-interactive.webp",width:680,height:367,
    alt:"Niña ve y ataja una pelota. La ilustración muestra ojo, cerebro y músculos del brazo.",
    zones:[
      {id:"pelota",label:"Pelota, estímulo visual",x:77,y:0,w:23,h:36,z:4,shape:"polygon(20% 0%,79% 0%,100% 25%,100% 79%,81% 100%,19% 100%,0% 76%,0% 25%)"},
      {id:"ojo",label:"Ojo, órgano receptor de la luz",x:25.5,y:11,w:8,h:13,z:5,shape:"polygon(10% 8%,61% 0%,100% 39%,86% 90%,22% 100%,0% 59%)"},
      {id:"cerebro_final",label:"Cerebro dentro de la cabeza",x:8,y:0,w:18,h:24,z:3,shape:"polygon(10% 28%,34% 0%,78% 0%,100% 38%,95% 87%,42% 100%,0% 70%)"},
      {id:"brazo",label:"Músculos del brazo, ejecutan el movimiento",x:32,y:36,w:35,h:24,z:4,shape:"polygon(0% 41%,32% 22%,86% 0%,100% 16%,75% 67%,20% 100%,0% 85%)"}
    ]}
};
for(const [miStr,scene] of Object.entries(SCENE_IMAGES)){
  PICTURE_ZONES[{2:"sensory",3:"reflex",4:"final"}[Number(miStr)]]={
    width:scene.width,height:scene.height,image:scene.path,alt:scene.alt,zones:scene.zones
  };
}
// Se reciclan preguntas existentes: no aumenta el banco (76) ni las rondas (27).
// La identificación visual se incorpora con el mismo ID original para mantener partidas guardadas.
const SCENE_QUESTIONS=[
  [2,"m2-e03","sensory","sol","Tocá la fuente de luz que puede estimular los fotorreceptores.","Los fotorreceptores de la retina responden a la luz.","La luz que llega a los ojos es captada por fotorreceptores de la retina."],
  [2,"m2-e04","sensory","hielo","Señalá el elemento que puede producir una sensación de frío.","Pensá en qué objeto suele tener una temperatura muy baja.","Los termorreceptores de la piel contribuyen a detectar cambios de temperatura."],
  [2,"m2-e06","sensory","flor","Tocá algo que pueda desprender un aroma.","Los receptores olfatorios permiten percibir sustancias odorantes.","Las flores pueden liberar moléculas que estimulan receptores olfatorios."],
  [2,"m2-e07","sensory","ave","Tocá el animal que puede emitir un canto y generar un estímulo sonoro.","Buscá qué animal aparece cantando.","El canto de un ave es un estímulo auditivo detectado por el oído."],
  [2,"m2-e08","sensory","naranja","Tocá el alimento que, al comerlo, puede generar estímulos gustativos.","Buscá una fruta partida sobre el tronco.","Los receptores gustativos detectan sustancias químicas disueltas en la saliva."],
  [3,"m3-e02","reflex","medula_reflejo","¿Qué estructura del sistema nervioso central participa en el reflejo ilustrado?","Buscá la sección del sistema nervioso ubicada a la derecha.","En un reflejo de retirada, circuitos de la médula espinal participan en la respuesta rápida."],
  [3,"m3-e03","reflex","musculo","Tocá el músculo que actúa como efector para retirar el brazo.","El efector hace el movimiento, no detecta el calor.","Los músculos reciben órdenes motoras y generan el movimiento de retirada."],
  [3,"m3-e06","reflex","taza","¿Qué objeto de la escena representa la fuente del estímulo caliente?","Mirá qué está sobre la mesa y desprende vapor.","Una superficie muy caliente puede activar receptores que participan en respuestas protectoras."],
  [3,"m3-e07","reflex","sensitiva","Tocá el recorrido azul por el que la información sensitiva va hacia la médula.","Observá la línea azul que comunica la mano con el sistema nervioso central.","La vía sensitiva conduce información desde los receptores hacia el sistema nervioso central."],
  [3,"m3-e08","reflex","receptor","Tocá la zona de la piel de la mano donde se detecta el estímulo.","Buscá la mano próxima al objeto caliente.","Los receptores en la piel detectan estímulos físicos y participan en el inicio del circuito reflejo."],
  [4,"m4-e01","final","pelota","¿Cuál es el estímulo visual que recibe la jugadora? Tocálo.","Es el objeto que se acerca y cuya luz llega a sus ojos.","La pelota es el objeto observado; la luz reflejada hacia los ojos constituye el estímulo visual."],
  [4,"m4-e05","final","cerebro_final","Tocá la estructura central que interviene en procesar la información visual.","Está dentro del cráneo, detrás de la frente.","El cerebro participa en la percepción y planificación de movimientos voluntarios."],
  [4,"m4-e07","final","ojo","Tocá el órgano sensorial que permite ver venir la pelota.","Buscá el ojo de la jugadora.","Los fotorreceptores de la retina transforman la luz en señales nerviosas."],
  [4,"m4-e09","final","brazo","Tocá el músculo del brazo que participa en el movimiento de atajar la pelota.","El movimiento se ejecuta mediante músculos, no mediante el estímulo.","Los músculos son efectores que responden a órdenes motoras del sistema nervioso."]
];
SCENE_QUESTIONS.forEach(function(row){
  const [mission,id,diagram,target,q,hint,note]=row;
  const task=MISSION_BANKS[mission].find(function(t){return t.id===id;});
  if(!task)throw new Error("Actividad no encontrada: "+id);
  Object.assign(task,{type:"point",diagram,target,q,hint,note});
});
// En la pantalla previa y como pequeño detalle visual de cada desafío:
// una imagen WebP en lugar del mapa SVG recortado para las tierras 3, 4 y 5.
const scenicOriginal=sceneArt;
sceneArt=function(i){
  const scene=SCENE_IMAGES[i];
  if(!scene)return scenicOriginal(i);
  return '<img class="raster-scene" src="'+scene.path+'" alt="" loading="lazy" draggable="false">';
};

"use strict";
/* NeuroMisión beta v2.5 — mapa panorámico adaptable a escritorio y celular.
   La imagen es WebP (no SVG). Sus letreros ilustrados forman parte del fondo;
   los estados y las zonas de acceso son controles HTML dinámicos y accesibles.
   No se cambia ninguna función pedagógica ni el guardado por nombre.
*/
const MAP25_IMAGE="./assets/neuro-world-map-v25.webp";
const MAP25_STOPS=[
 {x:24.9,y:30.5,w:25,h:49,sx:26.1,sy:44.4,theme:"city"},
 {x:52.6,y:30.4,w:25,h:53,sx:51.6,sy:47.7,theme:"neuron"},
 {x:81.8,y:25.2,w:26,h:47,sx:82.4,sy:40.5,theme:"forest"},
 {x:43.6,y:73.6,w:28,h:49,sx:44.4,sy:92.6,theme:"reflex"},
 {x:77.6,y:72.9,w:25,h:50,sx:78.4,sy:92.9,theme:"tower"}
];
// sx/sy centro de la insignia de estado, x/y centro del destino, w/h zona.
let map25ScrollLeft=null;
let map25ScrollOwner="";
function map25UpdateTravel(){
 const viewport=game.querySelector(".map-scroll-v25");
 if(!viewport)return;
 const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth);
 const arrows=game.querySelectorAll(".map25-arrow");
 if(arrows && arrows.length>=2){
  arrows[0].disabled=max<3||viewport.scrollLeft<=3;
  arrows[1].disabled=max<3||viewport.scrollLeft>=max-3;
 }
 const thumb=game.querySelector(".map25-overview-thumb");
 if(thumb && viewport.scrollWidth>0){
  const width=Math.min(100,100*viewport.clientWidth/viewport.scrollWidth);
  thumb.style.width=width+"%";
  thumb.style.left=Math.min(100-width,100*viewport.scrollLeft/viewport.scrollWidth)+"%";
 }
 const hint=game.querySelector(".map25-pan-hint");
 if(hint){
  hint.textContent=max<3?"Elegí una tierra del mapa":viewport.scrollLeft<max*.15?
   "Deslizá para descubrir más tierras →":viewport.scrollLeft>max*.86?
   "← Volvé para recorrer otras tierras":"← Seguí explorando el mapa →";
 }
}
// Cambiar únicamente el ancho del contenedor cuando el mapa está a la vista.
const map25OriginalSetScreen=setScreen;
setScreen=function(html){
  if(document.body&&document.body.classList){
    document.body.classList.toggle("neuro-map-mode",html.includes('class="map25-screen"'));
  }
  map25OriginalSetScreen(html);
};
function map25Status(i){
 const finished=!!record.completed[i];
 const active=!!(record.active&&record.active.mission===i);
 const suggested=MISSIONS.findIndex(function(_,n){return !record.completed[n]});
 if(finished)return {label:"Completada",symbol:"✓",css:"done"};
 if(active)return {label:"En curso",symbol:"▶",css:"active"};
 if(!missionIsOpen(i))return {label:"Bloqueada",symbol:"🔒",css:"locked"};
 if(i===suggested)return {label:"Siguiente",symbol:"✦",css:"active"};
 return {label:"Disponible",symbol:"✦",css:"ready"};
}
renderMap=function(){
 mode="map";
 // Cada jugador empieza con su propia posición del mapa, no la del perfil anterior.
 const owner=(player||"").trim().toLocaleLowerCase("es");
 if(owner!==map25ScrollOwner){map25ScrollOwner=owner;map25ScrollLeft=null;}
 const completed=MISSIONS.filter(function(_,i){return !!record.completed[i];}).length;
 const points=totalScore();
 const percent=Math.round(completed/MISSIONS.length*100);
 const markers=MAP25_STOPS.map(function(stop,i){
  const status=map25Status(i);
  const open=missionIsOpen(i);
  return '<button type="button" class="world-place place-'+i+' '+status.css+
   '" data-action="preview-mission" data-index="'+i+'" '+(open?'':'disabled')+
   ' style="--place-x:'+stop.x+'%;--place-y:'+stop.y+'%;--place-w:'+stop.w+'%;--place-h:'+stop.h+'%;"'+
   ' aria-label="'+escapeHtml(LAND_NAMES[i])+'; '+status.label+'. Abrir territorio">'+
   '<span class="sr-only">'+escapeHtml(LAND_NAMES[i])+' — '+status.label+'</span></button>'+
   '<span class="world-state world-state-'+i+' '+status.css+'" aria-hidden="true"'+
   ' style="--state-x:'+stop.sx+'%;--state-y:'+stop.sy+'%;">'+
   '<span>'+status.symbol+'</span> '+status.label+'</span>';
 }).join("");
 const nav=MAP25_STOPS.map(function(stop,i){
  const status=map25Status(i);
  return '<button type="button" class="map25-chip '+status.css+'" data-action="preview-mission" data-index="'+i+'" '+
   (missionIsOpen(i)?'':'disabled')+' aria-label="Ir a '+escapeHtml(LAND_NAMES[i])+', '+status.label+'">'+
   '<span class="map25-chip-icon" aria-hidden="true">'+LAND_ICONS[i]+'</span>'+
   '<span class="map25-chip-label">'+escapeHtml(LAND_NAMES[i])+'<small>'+status.label+'</small></span></button>';
 }).join("");
 setScreen('<div class="map25-screen">'+
  '<div class="map25-header"><div><span class="kicker">UN MUNDO POR DESCUBRIR</span>'+
  '<h2>¡Hola, '+escapeHtml(player)+'! <span aria-hidden="true">✦</span></h2>'+
  '<p>Recorré las cinco tierras y elegí tu próxima aventura.</p></div>'+
  '<div class="map25-score"><span class="map25-score-value">✦ '+points+'</span><small>CHISPAS GANADAS</small></div></div>'+
  '<div class="map25-progress"><div class="map25-progress-meta"><strong>Tu aventura</strong>'+
  '<span>'+completed+' de 5 tierras conquistadas</span></div>'+
  '<div class="map25-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="'+completed+
  '" aria-label="Tierras completadas"><span style="width:'+percent+'%"></span></div></div>'+
  '<section class="map25-viewport" aria-label="Mapa panorámico interactivo de NeuroMisión">'+
  '<div class="map-scroll-v25" tabindex="0" aria-label="Mapa horizontal con cinco tierras; deslizá para recorrerlo">'+
  '<div class="map25-panorama">'+
  '<img class="map25-landscape" src="'+MAP25_IMAGE+'" alt="Cinco islas de aventura conectadas por puentes y un camino luminoso: ciudad cerebral, valle de la neurona, bosque sensorial, ruta de los reflejos y torre final." width="1536" height="448" draggable="false" decoding="async">'+
  markers+'</div></div>'+
  '<div class="map25-navrail"><button class="map25-arrow" type="button" data-action="map25-pan" data-direction="-1" aria-label="Mover mapa hacia la izquierda">‹</button>'+
  '<span class="map25-pan-hint">↔ Deslizá el mapa para explorar las cinco tierras</span>'+
  '<button class="map25-arrow" type="button" data-action="map25-pan" data-direction="1" aria-label="Mover mapa hacia la derecha">›</button></div>'+
  '<div class="map25-overview" aria-hidden="true"><span class="map25-overview-thumb"></span></div>'+ 
  '</section>'+
  '<div class="map25-footer"><div class="map25-menu" aria-label="Acceso directo a cada tierra">'+nav+'</div>'+
  '<div class="map25-footer-actions"><span>🏅 Completá cada tierra para desbloquear la siguiente.</span>'+
  '<button type="button" class="soft-btn mini-btn" data-action="switch">Cambiar jugador/a</button></div>'+
  '</div></div>');
 // Restaurar la posición al volver del juego, o centrar la primera tierra en móvil.
 const viewport=game.querySelector(".map-scroll-v25");
 const world=game.querySelector(".map25-panorama");
 if(viewport&&world){
  if(map25ScrollLeft===null){
   // Centrar el desafío en curso o el próximo sin completar al comenzar.
   const active=record.active && Number.isInteger(record.active.mission)?record.active.mission:-1;
   const next=MISSIONS.findIndex(function(_,i){return !record.completed[i];});
   const focus=active>=0?active:(next>=0?next:0);
   viewport.scrollLeft=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,
      world.clientWidth*MAP25_STOPS[focus].x/100-viewport.clientWidth/2));
  }else viewport.scrollLeft=map25ScrollLeft;
  map25UpdateTravel();
 }
};
game.addEventListener("scroll",function(event){
 const el=event.target;
 if(el&&el.classList&&el.classList.contains("map-scroll-v25")){
  map25ScrollLeft=el.scrollLeft;
  map25UpdateTravel();
 }
},true);
game.addEventListener("click",function(event){
 const control=event.target.closest("button[data-action='map25-pan']");
 if(!control||control.disabled)return;
 const viewport=game.querySelector(".map-scroll-v25");
 if(!viewport)return;
 const dir=Number(control.dataset.direction)||1;
 const next=Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,
             viewport.scrollLeft+viewport.clientWidth*.72*dir));
 if(typeof viewport.scrollTo==="function")viewport.scrollTo({left:next,behavior:"smooth"});
 else viewport.scrollLeft=next;
 map25ScrollLeft=next;
 map25UpdateTravel();
});
if(typeof window!=="undefined"){
 window.addEventListener("resize",function(){if(mode==="map")map25UpdateTravel();});
}
game.addEventListener("error",function(event){
 const img=event.target;
 if(!img || !img.classList || !img.classList.contains("map25-landscape"))return;
 const map=game.querySelector(".map25-panorama");
 if(!map || map.querySelector(".map25-load-error"))return;
 map.insertAdjacentHTML("beforeend",
   '<p class="map25-load-error" role="alert">No se pudo cargar el paisaje, pero podés abrir cada misión desde los accesos de abajo.</p>');
},true);
// La versión oficial mantiene el desbloqueo progresivo de las cinco misiones.


/* Pantallas de bienvenida y misión: ilustraciones raster, sin antiguos SVG decorativos. */
const v3SceneArt=sceneArt;
sceneArt=function(i){
 if(i===0)return '<img class="raster-scene" src="./assets/body-interactive.webp" alt="" loading="lazy" draggable="false">';
 if(i===1)return '<img class="raster-scene" src="./assets/neuron-interactive.webp" alt="" loading="lazy" draggable="false">';
 return v3SceneArt(i);
};
const v3Welcome=renderWelcome;
renderWelcome=function(){
 v3Welcome();
 const art=game.querySelector(".home-art");
 if(art)art.innerHTML=
   '<img class="welcome-v3-image" src="./assets/neuro-world-map-v25.webp" alt="" loading="eager" decoding="async">'+
   '<div class="callout">🌎 UN UNIVERSO POR DESCUBRIR</div>';
};
renderWelcome();
