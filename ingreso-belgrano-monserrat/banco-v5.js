(() => {
  'use strict';

  const EXTRA = [];
  const add = e => EXTRA.push(e);
  const mInput = (id, habilidad, colegios, dificultad, consigna, respuesta, pista, explicacion, papel = true, alternativas = []) => add({ id, area:'matematica', habilidad, colegios, dificultad, tipo:'input', consigna, respuesta:String(respuesta), alternativas, pista, explicacion, papel });
  const mChoice = (id, habilidad, colegios, dificultad, consigna, opciones, respuesta, pista, explicacion, papel = false) => add({ id, area:'matematica', habilidad, colegios, dificultad, tipo:'choice', consigna, opciones, respuesta, pista, explicacion, papel });
  const lChoice = (id, habilidad, colegios, dificultad, texto, consigna, opciones, respuesta, pista, explicacion) => add({ id, area:'lengua', habilidad, colegios, dificultad, tipo:'choice', texto, consigna, opciones, respuesta, pista, explicacion });
  const lSelf = (id, consigna, criterios) => add({ id, area:'lengua', habilidad:'LEN-PROD', colegios:['monserrat'], dificultad:4, tipo:'selfcheck', consigna, criterios, pista:'Planificá inicio, complicación y resolución antes de escribir.', explicacion:'La revisión usa criterios de entrenamiento alineados al bloque de producción escrita.', papel:true });

  // 60 actividades de Matemática
  [
    ['V5-M001','9.408 + 27.695','37103'],['V5-M002','81.004 − 36.778','44226'],['V5-M003','3.275 × 42','137550'],
    ['V5-M004','68.544 ÷ 32','2142'],['V5-M005','7.506 × 19','142614'],['V5-M006','95.760 ÷ 24','3990'],
    ['V5-M007','48.395 + 7.608 + 936','56939'],['V5-M008','70.000 − 28.947','41053'],['V5-M009','2.408 × 35','84280'],
    ['V5-M010','43.680 ÷ 21','2080'],['V5-M011','6.125 × 64','392000'],['V5-M012','84.672 ÷ 48','1764']
  ].forEach((r,i)=>mInput(r[0],'MAT-NAT-OPS',['comun'],i<4?2:i<9?3:4,`Calculá ${r[1]}.`,r[2],'Resolvé ordenadamente y comprobá con la operación inversa.',`El resultado es ${Number(r[2]).toLocaleString('es-AR')}.`,true,[Number(r[2]).toLocaleString('es-AR')]));

  mChoice('V5-M013','MAT-DIV',['comun'],3,'¿Cuál es divisible por 4 y por 9?',['1.224','1.226','1.228','1.230'],'1.224','Para 4 mirá las dos últimas cifras; para 9 sumá las cifras.','24 es divisible por 4 y 1+2+2+4=9.');
  mChoice('V5-M014','MAT-DIV',['comun'],3,'¿Cuál es divisible por 6?',['742','744','745','748'],'744','Debe ser divisible por 2 y por 3.','744 es par y 7+4+4=15.');
  mChoice('V5-M015','MAT-PRIM',['comun'],3,'¿Cuál es primo?',['71','75','77','81'],'71','Probá divisibilidad por 2, 3, 5 y 7.','71 no tiene divisores propios.');
  mChoice('V5-M016','MAT-PRIM',['comun'],2,'¿Cuál es compuesto?',['29','31','37','39'],'39','Buscá si tiene divisores además de 1 y él mismo.','39=3×13.');
  mInput('V5-M017','MAT-MCD',['comun'],3,'Calculá el MCD de 54, 90 y 126.','18','Buscá el mayor divisor común.','El MCD es 18.');
  mInput('V5-M018','MAT-MCD',['comun'],4,'Tres sogas miden 72 m, 108 m y 180 m. Se cortan en tramos iguales lo más largos posible. ¿Cuánto mide cada tramo?','36','El largo buscado es el MCD.','MCD(72,108,180)=36.');
  mInput('V5-M019','MAT-MCM',['comun'],3,'Calculá el MCM de 14, 21 y 28.','84','Buscá el menor múltiplo común.','El MCM es 84.');
  mInput('V5-M020','MAT-MCM',['comun'],4,'Tres luces parpadean cada 6, 8 y 15 segundos. Si coinciden ahora, ¿en cuántos segundos vuelven a coincidir?','120','La coincidencia ocurre en el MCM.','MCM(6,8,15)=120.');

  [
    ['V5-M021','MAT-FR-EQ','4/6 = __/18','12','Multiplicá numerador y denominador por 3.'],
    ['V5-M022','MAT-FR-EQ','15/25 = __/5','3','Simplificá por 5.'],
    ['V5-M023','MAT-FR-ORD','¿Cuál es mayor: 7/9 o 5/6? Escribí la fracción mayor.','5/6','Compará productos cruzados: 7×6 y 5×9.'],
    ['V5-M024','MAT-FR-ORD','Ordená de menor a mayor: 1/2, 5/8, 3/4.','1/2<5/8<3/4','Llevá todo a octavos.'],
    ['V5-M025','MAT-FR-PROB','De 150 estudiantes, 2/5 viajan en colectivo. ¿Cuántos son?','60','Calculá 1/5 y multiplicá por 2.'],
    ['V5-M026','MAT-FR-PROB','Una botella de 2 litros está llena hasta 3/4. ¿Cuántos mililitros contiene?','1500','Calculá 3/4 de 2 L y convertí.'],
    ['V5-M027','MAT-FR-PROB','Un terreno tiene 360 m². Se usa 5/12 para jardín. ¿Cuántos m² quedan para otros usos?','210','Calculá primero la parte usada.'],
    ['V5-M028','MAT-FR-PROB','De un recorrido de 84 km se completó 3/7. ¿Cuántos km faltan?','48','Calculá lo realizado y restalo al total.'],
    ['V5-M029','MAT-FR-OPS','Calculá 7/8 + 5/12.','31/24','Usá denominador común 24.'],
    ['V5-M030','MAT-FR-OPS','Calculá 11/15 − 2/9.','23/45','Usá denominador común 45.'],
    ['V5-M031','MAT-FR-OPS','Calculá 9/10 × 5/12.','3/8','Simplificá antes de multiplicar.'],
    ['V5-M032','MAT-FR-OPS','Calculá 7/12 ÷ 14/9.','3/8','Multiplicá por la inversa.'],
    ['V5-M033','MAT-FR-DEC','Convertí 13/25 a decimal.','0,52','Llevá el denominador a 100.'],
    ['V5-M034','MAT-FR-DEC','Convertí 0,375 a fracción irreducible.','3/8','Escribí 375/1000 y simplificá.']
  ].forEach((r,i)=>mInput(r[0],r[1],r[1].includes('OPS')||r[1].includes('DEC')?['monserrat']:['comun'],i<2?2:i<8?3:4,r[2],r[3],r[4],`La respuesta correcta es ${r[3]}.`,true,r[3].includes(',')?[r[3].replace(',','.')]:[]));

  [
    ['V5-M035','18,4 + 7,65','26,05'],['V5-M036','42,8 − 19,375','23,425'],['V5-M037','3,75 × 16','60'],['V5-M038','27,3 ÷ 6','4,55'],
    ['V5-M039','0,84 × 25','21'],['V5-M040','91,2 ÷ 24','3,8'],['V5-M041','12,06 + 0,94 − 3,5','9,5'],['V5-M042','6,4 × 3,75','24']
  ].forEach((r,i)=>mInput(r[0],'MAT-DEC-OPS',['comun'],i<2?2:i<6?3:4,`Calculá ${r[1]}.`,r[2],'Ordená la cuenta respetando el valor posicional de la coma.',`El resultado es ${r[2]}.`,true,[r[2].replace(',','.')]));

  [
    ['V5-M043','MAT-MED-LONG',['comun'],'Convertí 5,08 km a metros.','5080'],
    ['V5-M044','MAT-MED-LONG',['comun'],'Convertí 2.460 cm a metros.','24,6'],
    ['V5-M045','MAT-MED-MASA',['monserrat'],'Convertí 4,35 kg a gramos.','4350'],
    ['V5-M046','MAT-MED-CAP',['monserrat'],'Convertí 2.750 mL a litros.','2,75'],
    ['V5-M047','MAT-MED-TIEMPO',['monserrat'],'Un viaje comienza a las 08:35 y dura 3 h 50 min. ¿A qué hora termina?','12:25'],
    ['V5-M048','MAT-PROP',['belgrano'],'Si 9 entradas cuestan $31.500, ¿cuánto cuestan 14 al mismo valor unitario?','49000']
  ].forEach((r,i)=>mInput(r[0],r[1],r[2],i<2?2:3,r[3],r[4],'Usá equivalencias de unidades o proporcionalidad directa.',`La respuesta correcta es ${r[4]}.`,true,[r[4].replace(',','.'), Number(String(r[4]).replace(',','.')).toLocaleString('es-AR')]));

  mInput('V5-M049','MAT-ANG-CS',['comun'],3,'Un ángulo mide 143°. ¿Cuánto mide su suplementario?','37','Los suplementarios suman 180°.','180−143=37°.');
  mInput('V5-M050','MAT-ANG-CS',['comun'],3,'Un ángulo mide 28°. ¿Cuánto mide su complementario?','62','Los complementarios suman 90°.','90−28=62°.');
  mChoice('V5-M051','MAT-TRI',['comun'],3,'Un triángulo tiene lados 5 cm, 8 cm y 9 cm. Según sus lados es…',['escaleno','isósceles','equilátero','rectángulo'],'escaleno','Los tres lados son distintos.','Es escaleno.');
  mChoice('V5-M052','MAT-CUAD',['comun'],3,'¿Qué figura tiene un solo par de lados opuestos paralelos?',['Trapecio','Rectángulo','Rombo','Cuadrado'],'Trapecio','Buscá la definición por paralelismo.','El trapecio tiene un par de lados paralelos.');
  mInput('V5-M053','MAT-PER',['comun'],3,'Un rectángulo mide 13 cm por 8 cm. ¿Cuál es su perímetro?','42','Sumá dos largos y dos anchos.','2×13+2×8=42 cm.');
  mInput('V5-M054','MAT-PER',['comun'],4,'Un patio rectangular de 18 m por 11 m tiene una entrada de 3 m donde no se coloca cerco. ¿Cuántos metros de cerco se necesitan?','55','Calculá el perímetro y descontá la entrada.','2×18+2×11=58; 58−3=55 m.');
  mInput('V5-M055','MAT-CIRC',['monserrat'],4,'Calculá la longitud de una circunferencia de diámetro 18 cm usando π=3,14.','56,52','Usá C=π×diámetro.','3,14×18=56,52 cm.',true,['56.52']);
  mChoice('V5-M056','MAT-GRAF',['monserrat'],3,'En un gráfico, lunes=12, martes=18, miércoles=15 y jueves=21. ¿Qué día tuvo el valor máximo?',['Lunes','Martes','Miércoles','Jueves'],'Jueves','Compará los cuatro valores.','21 es el mayor.');

  mInput('V5-M057','MAT-ROM',['monserrat'],3,'Escribí 74 en números romanos.','LXXIV','70=LXX y 4=IV.','74=LXXIV.',false,['lxxiv']);
  mInput('V5-M058','MAT-COMB',['monserrat'],4,'Resolvé: 72 ÷ [3 × (7−3)] + 5².','31','Primero paréntesis y potencia.','72÷12=6; 5²=25; total 31.');
  mInput('V5-M059','MAT-POT',['monserrat'],3,'Calculá 3⁴ + 2⁵.','113','Calculá cada potencia por separado.','3⁴=81 y 2⁵=32; total 113.');
  mInput('V5-M060','MAT-SEX',['belgrano'],4,'Calculá 92° 18′ − 37° 45′.','54°33′','Pedí 1°=60′ antes de restar los minutos.','91°78′−37°45′=54°33′.',true,['54° 33′','54°33']);

  // 60 actividades de Lengua
  const comp = [
    ['V5-L001','LEN-COMP-LIT','La feria abre a las 9 y cierra a las 14. Los sábados extiende su horario hasta las 16.','¿Hasta qué hora abre los sábados?',['14','15','16','17'],'16'],
    ['V5-L002','LEN-COMP-LIT','El tren salió a las 7:20 y llegó a destino a las 9:05.','¿A qué hora llegó?',['7:20','8:05','9:05','9:20'],'9:05'],
    ['V5-L003','LEN-COMP-LIT','Mara guardó las semillas en un frasco azul y dejó las herramientas en una caja roja.','¿Dónde guardó las semillas?',['Caja roja','Frasco azul','Bolsa verde','Cajón'],'Frasco azul'],
    ['V5-L004','LEN-COMP-LIT','La biblioteca presta hasta tres libros por persona durante siete días.','¿Cuántos libros puede retirar cada persona como máximo?',['2','3','5','7'],'3'],
    ['V5-L005','LEN-COMP-INF','Tomás miró el cielo oscuro, cerró las ventanas y entró la ropa del patio.','¿Qué es razonable inferir?',['Que se acercaba una tormenta','Que era mediodía','Que perdió una llave','Que iba a viajar'],'Que se acercaba una tormenta'],
    ['V5-L006','LEN-COMP-INF','Al abrir la mochila, Julia encontró migas y el envoltorio vacío del sándwich que había preparado.','¿Qué probablemente ocurrió?',['Alguien comió el sándwich','La mochila se mojó','Julia compró otro sándwich','El envoltorio era nuevo'],'Alguien comió el sándwich'],
    ['V5-L007','LEN-COMP-INF','El público se puso de pie apenas terminó la canción y comenzó a aplaudir durante varios minutos.','¿Qué se puede inferir?',['La presentación gustó mucho','La sala estaba vacía','La canción no terminó','El público se retiró antes'],'La presentación gustó mucho'],
    ['V5-L008','LEN-COMP-INF','Nicolás llegó con el pelo mojado, el paraguas cerrado y gotas en la campera.','¿Qué había ocurrido?',['Había llovido','Había nevado','Había corrido una carrera','Había cocinado'],'Había llovido'],
    ['V5-L009','LEN-FUNC','Cuidemos el agua: cerrá la canilla mientras te cepillás los dientes.','¿Qué función predomina?',['Apelativa','Poética','Metalingüística','Fática'],'Apelativa'],
    ['V5-L010','LEN-FUNC','La Tierra tarda aproximadamente 365 días en dar una vuelta alrededor del Sol.','¿Qué función predomina?',['Referencial','Apelativa','Poética','Emotiva'],'Referencial'],
    ['V5-L011','LEN-TRAMA','Primero mezclá la harina con el agua; luego amasá y dejá reposar veinte minutos.','¿Qué trama predomina?',['Instructiva','Narrativa','Argumentativa','Dialogal'],'Instructiva'],
    ['V5-L012','LEN-TRAMA','El zorro cruzó el bosque, encontró una huella y decidió seguirla hasta el río.','¿Qué trama predomina?',['Narrativa','Instructiva','Expositiva','Descriptiva técnica'],'Narrativa']
  ];
  comp.forEach(r=>lChoice(r[0],r[1],['comun'],r[1].includes('INF')?3:2,r[2],r[3],r[4],r[5],'Buscá la información explícita o las pistas del texto.',`La respuesta adecuada es «${r[5]}».`));

  const cohesion = [
    ['V5-L013','LEN-CON','No había dormido bien; ____, pudo concentrarse durante toda la clase.',['sin embargo','por eso','además','entonces'],'sin embargo'],
    ['V5-L014','LEN-CON','El sendero estaba mojado; ____, caminaron con cuidado.',['por eso','sin embargo','en cambio','aunque'],'por eso'],
    ['V5-L015','LEN-CON','Llevamos agua; ____, guardamos fruta y abrigo en la mochila.',['además','sin embargo','por eso','aunque'],'además'],
    ['V5-L016','LEN-REF','Camila llamó a Sofía porque ella tenía la información del horario. En este contexto, «ella» se refiere a…',['Sofía','Camila','el horario','la llamada'],'Sofía'],
    ['V5-L017','LEN-REF','Los pingüinos se agruparon cerca de la costa. Estas aves esperaban el regreso del resto de la colonia. «Estas aves» retoma…',['Los pingüinos','La costa','La colonia','El regreso'],'Los pingüinos'],
    ['V5-L018','LEN-SEM','Elegí un sinónimo de «rápido».',['veloz','pesado','lejano','oscuro'],'veloz'],
    ['V5-L019','LEN-SEM','Elegí un antónimo de «escaso».',['abundante','breve','delgado','temprano'],'abundante'],
    ['V5-L020','LEN-HIPER','¿Cuál es un hiperónimo de «rosa, jazmín y tulipán»?',['flores','árboles','frutos','semillas'],'flores'],
    ['V5-L021','LEN-HIPER','¿Cuál es un hipónimo de «ave»?',['gorrión','felino','reptil','mamífero'],'gorrión'],
    ['V5-L022','LEN-CON','Estudió con tiempo; ____, llegó tranquilo al examen.',['por eso','aunque','sin embargo','en cambio'],'por eso']
  ];
  cohesion.forEach((r,i)=>lChoice(r[0],r[1],r[1]==='LEN-HIPER'||r[1]==='LEN-REF'?['belgrano']:['comun'],i<3?3:2,'',r[2],r[3],r[4],'Pensá en la relación de significado o referencia.',`La opción correcta es «${r[4]}».`));

  const narr = [
    ['V5-L023','LEN-NARR','Cuando amaneció, Eva descubrió que el puente estaba cerrado. Buscó otro camino y llegó al pueblo antes del mediodía.','¿Cuál es la complicación?',['El puente estaba cerrado','Eva llegó al pueblo','Amaneció','Era mediodía'],'El puente estaba cerrado'],
    ['V5-L024','LEN-NARR','Lucas perdió el mapa en el bosque, siguió el sonido del río y finalmente encontró el campamento.','¿Cuál es la resolución?',['Encontró el campamento','Perdió el mapa','Entró al bosque','Escuchó el río'],'Encontró el campamento'],
    ['V5-L025','LEN-NARR','Yo no quería entrar a la casa abandonada, pero mis amigos insistieron.','¿Qué tipo de narrador aparece?',['Primera persona','Tercera persona omnisciente','Segunda persona','Narrador externo sin personaje'],'Primera persona'],
    ['V5-L026','LEN-NARR','Ana dejó la carta sobre la mesa. Nadie sabía que ya había tomado una decisión.','¿Qué elemento se destaca en «sobre la mesa»?',['Espacio','Tiempo','Narrador','Conflicto'],'Espacio'],
    ['V5-L027','LEN-REC-LIT','«El viento cantaba entre las ramas». ¿Qué recurso aparece?',['Personificación','Comparación','Definición','Hipérbaton'],'Personificación'],
    ['V5-L028','LEN-REC-LIT','«Sus ojos brillaban como dos faros». ¿Qué recurso aparece?',['Comparación','Personificación','Onomatopeya','Enumeración'],'Comparación'],
    ['V5-L029','LEN-REC-MON','«¡Pum! La puerta se cerró de golpe». ¿Qué recurso aparece?',['Onomatopeya','Comparación','Metáfora','Hipérbole'],'Onomatopeya'],
    ['V5-L030','LEN-REC-MON','«El aroma dulce del pan recién hecho llenó la cocina». ¿Qué recurso predomina?',['Imagen olfativa','Imagen visual','Onomatopeya','Diálogo'],'Imagen olfativa']
  ];
  narr.forEach((r,i)=>lChoice(r[0],r[1],r[1]==='LEN-REC-MON'?['monserrat']:['comun'],3,r[2],r[3],r[4],r[5],'Identificá la función del fragmento dentro del relato o el recurso usado.',`La respuesta correcta es «${r[5]}».`));

  const grammar = [
    ['V5-L031','LEN-SUST','¿Cuál palabra es un sustantivo abstracto?',['amistad','mesa','perro','ventana'],'amistad'],
    ['V5-L032','LEN-SUST','¿Cuál es un sustantivo propio?',['Córdoba','ciudad','río','montaña'],'Córdoba'],
    ['V5-L033','LEN-ADJ','En «las altas montañas nevadas», ¿cuál es un adjetivo?',['altas','montañas','las','y'],'altas'],
    ['V5-L034','LEN-ADJ','Elegí la opción con concordancia correcta.',['Las casas blancas','Las casa blanco','Los casas blancas','La casas blancos'],'Las casas blancas'],
    ['V5-L035','LEN-ART','¿Cuál es el artículo en «Una estrella iluminó el cielo»?',['Una','estrella','iluminó','cielo'],'Una'],
    ['V5-L036','LEN-VERB','¿Cuál verbo está en pretérito imperfecto?',['cantaba','cantó','cantará','ha cantado'],'cantaba'],
    ['V5-L037','LEN-VERB','¿Cuál forma verbal está en pretérito perfecto compuesto?',['he leído','leí','leía','leeré'],'he leído'],
    ['V5-L038','LEN-VERB','¿Cuál forma está en futuro simple?',['viajaremos','viajábamos','hemos viajado','viajaríamos'],'viajaremos'],
    ['V5-L039','LEN-SUJ-PRED','En «Los pequeños barcos cruzaron el lago», ¿cuál es el núcleo del sujeto?',['barcos','pequeños','cruzaron','lago'],'barcos'],
    ['V5-L040','LEN-UNI-BI','¿Cuál oración es unimembre?',['Llueve mucho.','Los chicos corren.','Mi hermana cocina.','El tren llegó.'],'Llueve mucho.']
  ];
  grammar.forEach((r,i)=>lChoice(r[0],r[1],r[1]==='LEN-SUJ-PRED'?['monserrat']:r[1]==='LEN-UNI-BI'?['belgrano']:['comun'],i>7?4:3,'',r[2],r[3],r[4],'Identificá la categoría o función pedida.',`La opción correcta es «${r[4]}».`));

  const ortho = [
    ['V5-L041','LEN-ACENT','¿Cuál palabra es aguda con tilde?',['canción','árbol','música','joven'],'canción'],
    ['V5-L042','LEN-ACENT','¿Cuál palabra es grave con tilde?',['árbol','reloj','compás','pared'],'árbol'],
    ['V5-L043','LEN-DIAC','Elegí la oración correcta.',['Él trajo el cuaderno.','El trajo él cuaderno.','Él trajo él cuaderno.','El trajo el cuaderno y él es artículo.'],'Él trajo el cuaderno.'],
    ['V5-L044','LEN-DIAC','Completá: «No sé ___ vendrá mañana».',['si','sí','sì','sy'],'si'],
    ['V5-L045','LEN-DIP-HIA','¿Cuál palabra contiene hiato?',['país','aire','cuidado','puerta'],'país'],
    ['V5-L046','LEN-BV','¿Cuál está escrita correctamente?',['volver','bolver','volber','bolber'],'volver'],
    ['V5-L047','LEN-CSZ','¿Cuál está escrita correctamente?',['decisión','desición','decisíon','dezisión'],'decisión'],
    ['V5-L048','LEN-GJ','¿Cuál está escrita correctamente?',['viaje','viage','biaje','biage'],'viaje'],
    ['V5-L049','LEN-H','¿Cuál está escrita correctamente?',['hervir','ervir','herbir','erbir'],'hervir'],
    ['V5-L050','LEN-RR','¿Cuál está escrita correctamente?',['alrededor','alrrededor','arrededor','alrededorr'],'alrededor'],
    ['V5-L051','LEN-PUNT','¿Cuál oración usa correctamente la coma?',['Antes de salir, cerró las ventanas.','Antes, de salir cerró las ventanas.','Antes de salir cerró, las ventanas.','Antes de, salir cerró las ventanas.'],'Antes de salir, cerró las ventanas.'],
    ['V5-L052','LEN-PYC','¿Cuál usa correctamente el punto y coma?',['Llegó temprano; sin embargo, tuvo que esperar.','Llegó; temprano sin embargo tuvo que esperar.','Llegó temprano,; sin embargo tuvo que esperar.','Llegó temprano sin; embargo tuvo que esperar.'],'Llegó temprano; sin embargo, tuvo que esperar.']
  ];
  ortho.forEach((r,i)=>lChoice(r[0],r[1],['LEN-DIP-HIA','LEN-RR','LEN-PYC'].includes(r[1])?['monserrat']:['comun'],i<5?3:2,'',r[2],r[3],r[4],'Revisá la regla ortográfica o de puntuación correspondiente.',`La forma correcta es «${r[4]}».`));

  const specific = [
    ['V5-L053','LEN-PARAT',['belgrano'],'En una nota periodística, ¿qué elemento resume el contenido debajo del título?',['Bajada','Predicado','Sujeto','Conector'],'Bajada'],
    ['V5-L054','LEN-CIRC-COM',['belgrano'],'En «La directora informa por correo el nuevo horario a las familias», ¿quién es el emisor?',['La directora','El correo','Las familias','El horario'],'La directora'],
    ['V5-L055','LEN-PARON',['belgrano'],'Elegí la oración correcta con «actitud/aptitud».',['Tiene aptitud para el dibujo.','Tiene actitud para el dibujo cuando hablamos de capacidad.','Su aptitud fue amable con todos.','La actitud significa habilidad técnica.'],'Tiene aptitud para el dibujo.'],
    ['V5-L056','LEN-REV',['monserrat'],'¿Qué revisión mejora más «La nena caminaban rápido»?',['La nena caminaba rápido.','La nena caminar rápido.','La nena caminaban rápida.','La nena rápido caminaban.'],'La nena caminaba rápido.']
  ];
  specific.forEach(r=>lChoice(r[0],r[1],r[2],3,'',r[3],r[4],r[5],'Aplicá el concepto específico del programa.',`La opción correcta es «${r[5]}».`));

  const criteria = ['Escribí entre 12 y 15 renglones','Agregué un título adecuado','Desarrollé una complicación clara','Incluí una resolución','Mantuve coherencia','Usé recursos expresivos','Evité repeticiones','Revisé ortografía y concordancia'];
  lSelf('V5-L057','En tu cuaderno, continuá en 12 a 15 renglones: «Cuando abrió el cajón encontró una llave que nunca había visto…». No uses diálogo.',criteria);
  lSelf('V5-L058','En tu cuaderno, escribí una narración de 12 a 15 renglones que empiece con: «El colectivo se detuvo en un lugar que no reconocía…». No uses diálogo.',criteria);
  lSelf('V5-L059','En tu cuaderno, narrá en 12 a 15 renglones qué ocurre después de: «El mensaje decía solamente: “buscá debajo del árbol más viejo”». Evitá desarrollar un diálogo.',criteria);
  lSelf('V5-L060','En tu cuaderno, escribí una narración de 12 a 15 renglones a partir de: «Durante el recreo apareció una caja cerrada en medio del patio…». No uses diálogo.',criteria);

  if (EXTRA.length !== 120) console.error(`[Banco V5] Se esperaban 120 actividades y hay ${EXTRA.length}.`);

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function ingresoBancoV5Fetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const isBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
    if (!isBank) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      const newItems = EXTRA.filter(e => !existing.has(e.id));
      data.version = 5;
      data.ejercicios = [...(data.ejercicios || []), ...newItems];
      return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: { 'Content-Type':'application/json; charset=utf-8' } });
    } catch (error) {
      console.error('[Banco V5] No se pudo ampliar el banco', error);
      return response;
    }
  };
})();