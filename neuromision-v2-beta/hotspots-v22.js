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
