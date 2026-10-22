"use strict";
/*
 * NeuroMisión v3.1 — mapa genuinamente vertical para móvil.
 * No altera misiones, desbloqueos ni el almacenamiento de v1/v3.
 * En PC se sigue usando el panorama horizontal v3.0.
 */
const MOBILE31_MAP_IMAGE="./assets/neuro-world-mobile-v31.webp?v=3.1";
const MOBILE31_STOPS=[
  {x:51,y:18.4,icon:"🏙️",className:"city"},
  {x:52,y:37.0,icon:"⚡",className:"neuron"},
  {x:48,y:55.4,icon:"🌿",className:"forest"},
  {x:51,y:73.4,icon:"🔁",className:"reflex"},
  {x:50,y:92.3,icon:"🏰",className:"tower"}
];
const renderMapBeforeMobile31=renderMap;
renderMap=function(){
  renderMapBeforeMobile31();
  const desktopMap=game.querySelector(".map25-viewport");
  if(!desktopMap)return;
  const cards=MOBILE31_STOPS.map(function(stop,i){
    const status=map25Status(i);
    const allowed=missionIsOpen(i);
    const displayStatus=!allowed?"🔒 Bloqueada":status.css==="done"?"✓ Completada":
      status.css==="active"&&record.active&&record.active.mission===i?"▶ En curso":
      status.css==="active"?"✦ Siguiente":"Disponible";
    return '<button type="button" class="map31-destination '+stop.className+' '+(allowed?status.css:"locked")+
      '" style="--place-x:'+stop.x+'%;--place-y:'+stop.y+'%;" data-action="preview-mission" data-index="'+i+
      '" '+(allowed?'':'disabled')+' aria-label="'+escapeHtml(LAND_NAMES[i])+', '+displayStatus+'">'+
      '<span class="map31-symbol" aria-hidden="true">'+stop.icon+'</span>'+
      '<span class="map31-copy"><strong>'+escapeHtml(LAND_NAMES[i])+'</strong><small>'+displayStatus+'</small></span>'+
      (allowed?'<span class="map31-chevron" aria-hidden="true">›</span>':'')+
      '</button>';
  }).join("");
  desktopMap.insertAdjacentHTML("afterend",
    '<section class="map31-mobile" aria-label="Mapa vertical de las cinco tierras de NeuroMisión">'+
    '<p class="map31-intro">🗺️ Tu recorrido comienza arriba. Deslizá hacia abajo para conocer las cinco tierras.</p>'+
    '<div class="map31-picture">'+
    '<img class="map31-art" src="'+MOBILE31_MAP_IMAGE+
    '" alt="Mapa vertical de cinco islas conectadas por puentes: Ciudad Central, Valle de la Neurona, Bosque Sensorial, Ruta de los Reflejos y Torre Final, desde arriba hacia abajo." '+
    'width="768" height="1152" loading="eager" decoding="async" draggable="false">'+
    cards+
    '</div>'+
    '<p class="map31-end">🏰 Llegaste a la Torre Final. ¡Cada tierra conquistada te acerca a tu meta!</p>'+
    '</section>');
};
// Si la imagen falla, los botones de las tierras y la navegación alternativa
// permanecen visibles para no bloquear la aplicación.
game.addEventListener("error",function(event){
 const img=event.target;
 if(!img||!img.classList||!img.classList.contains("map31-art"))return;
 const wrapper=img.closest(".map31-picture");
 if(wrapper&&!wrapper.querySelector(".map31-image-error")){
   wrapper.insertAdjacentHTML("afterbegin",
    '<p class="map31-image-error" role="alert">No se pudo cargar el paisaje, pero podés entrar a las misiones tocando sus nombres.</p>');
 }
},true);
