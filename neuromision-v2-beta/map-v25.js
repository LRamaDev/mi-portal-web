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
 if(i===suggested)return {label:"Siguiente",symbol:"✦",css:"active"};
 return {label:"Disponible",symbol:"✦",css:"ready"};
}
renderMap=function(){
 mode="map";
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
  '</section>'+
  '<div class="map25-footer"><div class="map25-menu" aria-label="Acceso directo a cada tierra">'+nav+'</div>'+
  '<div class="map25-footer-actions"><span>🧪 Beta: las cinco tierras están abiertas para probarlas.</span>'+
  '<button type="button" class="soft-btn mini-btn" data-action="switch">Cambiar jugador/a</button></div>'+
  '</div></div>');
 // Restaurar la posición al volver del juego, o centrar la primera tierra en móvil.
 const viewport=game.querySelector(".map-scroll-v25");
 const world=game.querySelector(".map25-panorama");
 if(viewport&&world){
  if(map25ScrollLeft===null){
   viewport.scrollLeft=Math.max(0,(world.clientWidth*MAP25_STOPS[0].x/100)-(viewport.clientWidth/2));
  }else viewport.scrollLeft=map25ScrollLeft;
 }
};
game.addEventListener("scroll",function(event){
 const el=event.target;
 if(el&&el.classList&&el.classList.contains("map-scroll-v25")){
  map25ScrollLeft=el.scrollLeft;
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
});
// La beta mantiene misión 1-5 desbloqueadas y laboratorio táctil de la v2.4.
renderWelcome();
