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
