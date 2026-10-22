"use strict";
/* NeuroMisión v2.4 BETA: todas las tierras abiertas para probar precisión táctil.
 * Solo está cargado en neuromision-v2-beta/, nunca en neuromision/ oficial.
 * Las pruebas de imagen NO alteran puntajes, insignias o partidas guardadas.
 */
const TOUCH_BETA_MAPS=["human","neuron","sensory","reflex","final"];
let touchTestMission=-1;
let touchedZoneCount=0;
const missionIsOpenOriginal=missionIsOpen;
missionIsOpen=function(i){
  return Number.isInteger(i) && i>=0 && i<MISSIONS.length;
};
const renderMapBeforeTouch=renderMap;
renderMap=function(){
  renderMapBeforeTouch();
  const caption=game.querySelector(".map-caption");
  if(caption)caption.textContent="🔓 Las cinco tierras están desbloqueadas en esta beta para comprobar la precisión táctil.";
  const tip=game.querySelector(".map-tip");
  if(tip)tip.textContent="🧪 Modo beta: entrá directamente a cualquier tierra y elegí «Probar imagen táctil». No necesitás superar las anteriores.";
};
const showMissionPreviewBeforeTouch=showMissionPreview;
showMissionPreview=function(i){
  if(!missionIsOpen(i))return;
  showMissionPreviewBeforeTouch(i);
  const actions=game.querySelector(".splash-actions");
  if(actions){
    actions.insertAdjacentHTML("beforeend",
      '<button type="button" class="secondary-btn touch-test-launch" data-action="touch-test-start" data-index="'+i+'">'+
      '👆 Probar imagen táctil</button>');
  }
};
function renderTouchTest(i){
  if(!missionIsOpen(i))return;
  touchTestMission=i;
  touchedZoneCount=0;
  mode="touch-test";
  const diagram=TOUCH_BETA_MAPS[i];
  const cfg=PICTURE_ZONES[diagram];
  if(!cfg){renderMap();return;}
  // Reutilizamos exactamente la imagen, las áreas y el tamaño del juego,
  // pero el modo de prueba nunca marca una respuesta como correcta/incorrecta.
  const interactive=taskContent({type:"point",diagram:diagram})
    .replaceAll('data-action="point"','data-action="touch-probe"')
    .replace("TOCÁ DIRECTAMENTE LA PARTE DEL DIBUJO QUE CORRESPONDA",
             "TOCÁ CUALQUIER PARTE DE LA IMAGEN PARA VER QUÉ ZONA SE DETECTA");
  setScreen('<section class="touch-lab" aria-label="Prueba de precisión táctil">'+
    '<div class="touch-lab-top"><div><span class="kicker">🧪 LABORATORIO DE PRUEBA · SIN PUNTOS</span>'+
    '<h2>Probá la imagen de '+escapeHtml(LAND_NAMES[i])+'</h2>'+
    '<p>Tocá directamente distintas partes de la ilustración. Debajo verás qué parte reconoce el juego. Podés repetir todas las veces que quieras.</p></div>'+
    '<button type="button" class="soft-btn mini-btn" data-action="touch-test-back" data-index="'+i+'">← Volver a la tierra</button></div>'+
    '<div class="play-panel touch-lab-picture">'+interactive+'</div>'+
    '<div class="touch-detection" id="touch-detection" role="status" aria-live="polite">'+
    '<span class="touch-detection-icon" aria-hidden="true">👆</span>'+
    '<div><strong>Todavía no tocaste ninguna zona</strong><p>Probá con un órgano, objeto o estructura del dibujo.</p></div></div>'+
    '<p class="touch-disclaimer">Esta pantalla es únicamente de prueba: no suma puntos, no modifica tus avances y no exige completar ninguna misión.</p>'+
    '<div class="touch-lab-actions"><button type="button" class="secondary-btn" data-action="touch-test-back" data-index="'+i+'">Volver a '+escapeHtml(LAND_NAMES[i])+'</button>'+
    '<button type="button" class="soft-btn" data-action="touch-test-retry">Volver a probar</button></div>'+
    '</section>');
}
game.addEventListener("click",function(event){
  const btn=event.target.closest("button[data-action]");
  if(!btn || btn.disabled)return;
  const action=btn.dataset.action;
  if(action==="touch-test-start"){
    renderTouchTest(Number(btn.dataset.index));
    return;
  }
  if(action==="touch-test-back"){
    showMissionPreview(Number(btn.dataset.index));
    return;
  }
  if(action==="touch-test-retry"){
    renderTouchTest(touchTestMission);
    return;
  }
  if(action!=="touch-probe" || mode!=="touch-test")return;
  const diagram=TOUCH_BETA_MAPS[touchTestMission];
  const cfg=PICTURE_ZONES[diagram];
  const recognized=btn.dataset.answer;
  const match=cfg && cfg.zones.find(function(z){return z.id===recognized;});
  if(!match)return;
  // Solo resaltamos la zona seleccionada; no reusamos markAnswer(), para evitar guardados.
  game.querySelectorAll(".image-hit").forEach(function(el){el.classList.remove("correct","wrong");});
  btn.classList.add("correct");
  touchedZoneCount++;
  const readout=document.getElementById("touch-detection");
  if(readout){
    readout.innerHTML='<span class="touch-detection-icon" aria-hidden="true">✓</span>'+
      '<div><strong>Detectó: '+escapeHtml(match.label)+'</strong>'+
      '<p>Compará la zona iluminada con el lugar que tocaste. Si no coincide, probá alrededor de sus bordes.</p></div>';
  }
  say("Zona detectada: "+match.label);
});
// Vuelve a dibujar la portada beta tras cargar la opción de prueba.
// No se reinician ni se borran los perfiles de este dispositivo.
renderWelcome();
