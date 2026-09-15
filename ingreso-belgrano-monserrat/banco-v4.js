(() => {
  'use strict';

  // Banco V4: actividades originales y variantes deterministas alineadas a los
  // programas/modelos aportados por la familia. No copia consignas oficiales.
  const EXTRA = [];
  const add = exercise => EXTRA.push(exercise);
  const input = (id, habilidad, colegios, dificultad, consigna, respuesta, pista, explicacion, papel = false, alternativas = []) => add({
    id, area: 'matematica', habilidad, colegios, dificultad, tipo: 'input', consigna, respuesta, alternativas, pista, explicacion, papel
  });
  const choiceM = (id, habilidad, colegios, dificultad, consigna, opciones, respuesta, pista, explicacion, papel = false) => add({
    id, area: 'matematica', habilidad, colegios, dificultad, tipo: 'choice', consigna, opciones, respuesta, pista, explicacion, papel
  });
  const choiceL = (id, habilidad, colegios, dificultad, texto, consigna, opciones, respuesta, pista, explicacion) => add({
    id, area: 'lengua', habilidad, colegios, dificultad, tipo: 'choice', texto, consigna, opciones, respuesta, pista, explicacion
  });

  // MATEMÁTICA — números naturales, divisibilidad y resolución de problemas.
  [
    ['V4-M001','8.736 ÷ 8','1092','Dividí y comprobá multiplicando por 8.','8.736 ÷ 8 = 1.092.'],
    ['V4-M002','4.208 × 36','151488','Separá 36 en 30 + 6.','4.208×30=126.240 y 4.208×6=25.248; total 151.488.'],
    ['V4-M003','96.305 − 47.868','48437','Alineá las cifras por valor posicional.','96.305−47.868=48.437.'],
    ['V4-M004','7.425 + 18.906 + 3.689','30020','Sumá de a dos y verificá el orden de magnitud.','7.425+18.906+3.689=30.020.'],
    ['V4-M005','54.432 ÷ 24','2268','Podés dividir primero por 6 y luego por 4.','54.432÷24=2.268.'],
    ['V4-M006','6.305 × 48','302640','Separá 48 en 50−2.','6.305×50−6.305×2=315.250−12.610=302.640.']
  ].forEach((r, i) => input(r[0],'MAT-NAT-OPS',['comun'], i < 2 ? 2 : 3, `Calculá ${r[1]}.`,r[2],r[3],r[4],true,[Number(r[2]).toLocaleString('es-AR') ]));

  choiceM('V4-M007','MAT-NAT-INV',['comun'],3,'Si 384 × 27 = 10.368, ¿qué operación permite comprobar el resultado?',['10.368 ÷ 27 = 384','10.368 + 27 = 384','10.368 − 384 = 27','384 ÷ 27 = 10.368'],'10.368 ÷ 27 = 384','Usá la operación inversa de la multiplicación.','La división permite comprobar una multiplicación.');
  choiceM('V4-M008','MAT-NAT-ORD',['comun'],2,'¿Cuál es el mayor número?',['507.090','570.009','507.900','570.090'],'570.090','Compará primero las centenas de mil y luego las decenas de mil.','570.090 es mayor que las otras opciones.');

  [
    ['V4-M009','MAT-MCD',36,60,84,12,'Buscá el mayor divisor común de los tres números.'],
    ['V4-M010','MAT-MCD',45,75,105,15,'Descomponé o listá divisores comunes.'],
    ['V4-M011','MAT-MCM',8,12,20,120,'Buscá el primer múltiplo común a los tres.'],
    ['V4-M012','MAT-MCM',9,15,18,90,'Podés usar descomposición en factores primos.']
  ].forEach(r => input(r[0],r[1],['comun'],3,`${r[1]==='MAT-MCD'?'Calculá el MCD':'Calculá el MCM'} de ${r[2]}, ${r[3]} y ${r[4]}.`,String(r[5]),r[6],`${r[1]==='MAT-MCD'?'El MCD':'El MCM'} es ${r[5]}.`,true));

  choiceM('V4-M013','MAT-DIV',['comun'],3,'¿Cuál de estos números es divisible por 2, 3 y 5 a la vez?',['1.230','1.225','1.232','1.235'],'1.230','Debe ser par, terminar en 0 o 5 y tener suma de cifras múltiplo de 3.','1.230 cumple los tres criterios.');
  choiceM('V4-M014','MAT-PRIM',['comun'],3,'¿Cuál número es primo?',['51','57','59','63'],'59','Probá divisibilidad por 2, 3, 5 y 7.','59 no tiene divisores distintos de 1 y 59.');
  choiceM('V4-M015','MAT-MULT',['comun'],2,'¿Cuál es un divisor de 84?',['5','6','11','13'],'6','Probá cuál divide a 84 sin resto.','84÷6=14.');
  input('V4-M016','MAT-PROB',['comun'],3,'Una biblioteca recibió 18 cajas con 24 libros cada una y luego prestó 157 libros. ¿Cuántos libros quedaron?','275','Primero calculá cuántos libros llegaron en total.','18×24=432; 432−157=275.',true);
  input('V4-M017','MAT-PROB',['comun'],4,'Un club compra 7 pelotas a $18.450 cada una y paga con $150.000. ¿Cuánto recibe de vuelto?','20850','Calculá primero el costo total.','7×18.450=129.150; 150.000−129.150=20.850.',true,['20.850']);

  // MATEMÁTICA — fracciones y decimales.
  choiceM('V4-M018','MAT-FR-CON',['comun'],2,'¿Cuál fracción representa cinco partes tomadas de ocho partes iguales?',['5/8','8/5','3/8','5/3'],'5/8','El numerador indica las partes tomadas y el denominador el total de partes iguales.','La fracción es 5/8.');
  choiceM('V4-M019','MAT-FR-CON',['comun'],3,'¿Cuál de estas fracciones es impropia?',['3/7','5/9','11/8','4/10'],'11/8','En una fracción impropia el numerador es mayor que el denominador.','11 es mayor que 8.');
  input('V4-M020','MAT-FR-EQ',['comun'],2,'Completá: 3/5 = __/20. Escribí solo el numerador.','12','El denominador se multiplicó por 4. Hacé lo mismo con el numerador.','3×4=12.');
  input('V4-M021','MAT-FR-EQ',['comun'],3,'Simplificá 42/56 hasta una fracción irreducible.','3/4','Dividí numerador y denominador por su MCD.','El MCD es 14: 42/56 = 3/4.',true);
  choiceM('V4-M022','MAT-FR-ORD',['comun'],3,'¿Cuál es la mayor fracción?',['5/8','2/3','7/12','3/5'],'2/3','Podés compararlas usando productos cruzados o un denominador común.','2/3≈0,667 es la mayor.');
  choiceM('V4-M023','MAT-FR-ORD',['comun'],4,'Ordená de mayor a menor: 7/10, 5/6 y 3/4.',['5/6 > 3/4 > 7/10','3/4 > 5/6 > 7/10','7/10 > 3/4 > 5/6','5/6 > 7/10 > 3/4'],'5/6 > 3/4 > 7/10','Compará sus valores o llevá a denominador común.','5/6≈0,833; 3/4=0,75; 7/10=0,7.',true);
  input('V4-M024','MAT-FR-PROB',['comun'],3,'De 96 figuritas, 5/8 son de animales. ¿Cuántas figuritas de animales hay?','60','Calculá primero 1/8 de 96.','96÷8=12 y 12×5=60.',true);
  input('V4-M025','MAT-FR-PROB',['comun'],4,'Un libro tiene 240 páginas. El lunes se leyó 1/4 y el martes 2/5 del total. ¿Cuántas páginas faltan leer?','84','Calculá lo leído cada día sobre el total y restá.','Se leen 60+96=156; faltan 240−156=84.',true);
  input('V4-M026','MAT-FR-OPS',['monserrat'],3,'Calculá 3/4 + 5/12. Escribí el resultado irreducible.','7/6','Usá denominador común 12.','9/12+5/12=14/12=7/6.',true);
  input('V4-M027','MAT-FR-OPS',['monserrat'],4,'Calculá 7/9 × 3/14. Escribí el resultado irreducible.','1/6','Simplificá antes de multiplicar.','7/14=1/2 y 3/9=1/3; resulta 1/6.',true);
  input('V4-M028','MAT-FR-OPS',['monserrat'],4,'Calculá 5/8 ÷ 15/16.','2/3','Dividir por una fracción equivale a multiplicar por su inversa.','5/8×16/15=80/120=2/3.',true);
  input('V4-M029','MAT-FR-DEC',['monserrat'],3,'Convertí 7/20 a número decimal.','0,35','Buscá un denominador 100 o realizá la división.','7/20=35/100=0,35.',false,['0.35']);
  input('V4-M030','MAT-FR-DEC',['monserrat'],3,'Escribí 0,625 como fracción irreducible.','5/8','0,625 son 625 milésimos; simplificá.','625/1000=5/8.',true);

  [
    ['V4-M031','14,75 + 8,6','23,35',['23.35']],
    ['V4-M032','32,4 − 7,85','24,55',['24.55']],
    ['V4-M033','6,25 × 4','25',[]],
    ['V4-M034','18,9 ÷ 7','2,7',['2.7']],
    ['V4-M035','4,08 × 12','48,96',['48.96']],
    ['V4-M036','75,6 ÷ 18','4,2',['4.2']]
  ].forEach((r,i)=>input(r[0],'MAT-DEC-OPS',['comun'],i<2?2:3,`Calculá ${r[1]}.`,r[2],'Alineá la coma o planteá la operación de manera ordenada.',`El resultado es ${r[2]}.`,true,r[3]));

  // MATEMÁTICA — magnitudes, geometría y contenidos específicos.
  input('V4-M037','MAT-MED-LONG',['comun'],3,'Convertí 3,45 km a metros. Escribí solo el número.','3450','1 km = 1.000 m.','3,45×1.000=3.450 m.',false,['3.450']);
  input('V4-M038','MAT-MED-LONG',['comun'],3,'Una cinta mide 2 m 35 cm. ¿Cuántos centímetros mide en total?','235','Convertí los metros a centímetros y sumá.','2 m=200 cm; total 235 cm.');
  input('V4-M039','MAT-MED-CAP',['monserrat'],3,'Convertí 4,2 litros a mililitros.','4200','1 L = 1.000 mL.','4,2×1.000=4.200 mL.',false,['4.200']);
  input('V4-M040','MAT-MED-MASA',['monserrat'],3,'Una bolsa pesa 3 kg 250 g. ¿Cuántos gramos pesa?','3250','Convertí los kilogramos a gramos y sumá.','3.000+250=3.250 g.',false,['3.250']);
  input('V4-M041','MAT-MED-TIEMPO',['monserrat'],3,'Una película comienza a las 17:45 y dura 2 h 35 min. ¿A qué hora termina?','20:20','Sumá primero 2 horas y luego 35 minutos.','17:45+2:35=20:20.',true,['20.20']);
  input('V4-M042','MAT-PROP',['belgrano'],3,'Si 4 cuadernos cuestan $7.200, ¿cuánto cuestan 7 cuadernos al mismo precio unitario?','12600','Hallá primero el precio de un cuaderno.','7.200÷4=1.800; 1.800×7=12.600.',true,['12.600']);
  input('V4-M043','MAT-PROP',['belgrano'],4,'Una máquina llena 18 botellas en 6 minutos a ritmo constante. ¿Cuántas llena en 25 minutos?','75','Calculá cuántas llena por minuto.','18÷6=3; 3×25=75.',true);
  choiceM('V4-M044','MAT-ANG',['comun'],2,'Un ángulo de 37° es…',['agudo','recto','obtuso','llano'],'agudo','Los ángulos agudos miden menos de 90°.','37° es agudo.');
  input('V4-M045','MAT-ANG-CS',['comun'],3,'¿Cuánto mide el complemento de un ángulo de 64°?','26','Los complementarios suman 90°.','90−64=26°.');
  input('V4-M046','MAT-SEX',['belgrano'],3,'Calculá 48° 35′ + 27° 40′. Escribí el resultado como grados y minutos.','76°15′','Sumá minutos; si superan 60, convertí 60′ en 1°.','35′+40′=75′=1°15′; total 76°15′.',true,['76° 15′','76°15']);
  choiceM('V4-M047','MAT-GEO-ESP',['monserrat'],3,'¿Qué recta corta un segmento en su punto medio formando 90°?',['Mediatriz','Bisectriz','Secante','Paralela'],'Mediatriz','Pensá en la construcción que divide un segmento en dos partes iguales y perpendiculares.','Es la mediatriz.');
  choiceM('V4-M048','MAT-TRI',['comun'],3,'Un triángulo con lados 7 cm, 7 cm y 10 cm es…',['isósceles','equilátero','escaleno','rectángulo'],'isósceles','Tiene dos lados iguales.','Dos lados de 7 cm lo hacen isósceles.');
  choiceM('V4-M049','MAT-CUAD',['comun'],3,'¿Qué cuadrilátero tiene dos pares de lados opuestos paralelos y cuatro ángulos rectos?',['Rectángulo','Trapecio','Romboide sin ángulos rectos','Trapezoide'],'Rectángulo','Buscá el que combina paralelismo y cuatro ángulos rectos.','Es el rectángulo.');
  choiceM('V4-M050','MAT-POL',['belgrano'],2,'¿Cómo se llama un polígono de 8 lados?',['Octógono','Hexágono','Heptágono','Decágono'],'Octógono','Recordá los nombres según cantidad de lados.','Un polígono de 8 lados es un octógono.');
  input('V4-M051','MAT-PER',['comun'],3,'Un rectángulo mide 13 cm de largo y 8 cm de ancho. ¿Cuál es su perímetro?','42','Sumá dos largos y dos anchos.','2×13+2×8=42 cm.',true);
  input('V4-M052','MAT-PER',['comun'],4,'Una figura está formada por un cuadrado de lado 6 cm y un triángulo equilátero de lado 6 cm pegado a uno de sus lados. ¿Cuál es el perímetro exterior?','30','El lado compartido queda adentro y no se cuenta.','Quedan 3 lados del cuadrado y 2 del triángulo: 5×6=30 cm.',true);
  input('V4-M053','MAT-CIRC',['monserrat'],3,'Calculá la longitud de una circunferencia de diámetro 20 cm usando π=3,14.','62,8','Usá longitud = π × diámetro.','3,14×20=62,8 cm.',true,['62.8']);
  input('V4-M054','MAT-CIRC',['monserrat'],4,'Una rueda de diámetro 70 cm da 15 vueltas. Usando π=22/7, ¿qué distancia recorre en centímetros?','3300','Calculá primero la longitud de una vuelta.','Una vuelta mide 220 cm; 220×15=3.300 cm.',true,['3.300']);
  input('V4-M055','MAT-ROM',['monserrat'],2,'Escribí 94 en números romanos.','XCIV','90 es XC y 4 es IV.','94 = XCIV.');
  input('V4-M056','MAT-COMB',['monserrat'],4,'Resolvé: 72 ÷ (6 + 3) + 5 × 4.','28','Primero paréntesis; después división y multiplicación; al final sumá.','72÷9=8 y 5×4=20; total 28.',true);
  input('V4-M057','MAT-POT',['monserrat'],3,'Calculá 3³ + 4².','43','Resolvé primero las potencias.','27+16=43.');
  choiceM('V4-M058','MAT-SEC',['monserrat'],3,'¿Qué número sigue? 5, 9, 17, 33, …',['65','49','66','64'],'65','Cada término duplica el anterior y resta 1.','33×2−1=65.');
  choiceM('V4-M059','MAT-GRAF',['monserrat'],3,'En una encuesta: fútbol 18 votos, básquet 12, vóley 15 y natación 9. ¿Cuántos votos más tuvo fútbol que natación?',['9','6','3','27'],'9','Restá las dos frecuencias.','18−9=9.');
  input('V4-M060','MAT-NAT-POS',['monserrat'],3,'En el número 4.582.731, ¿qué valor representa la cifra 8?','80000','Ubicá la cifra 8 según su posición.','Está en la posición de decenas de mil: vale 80.000.',false,['80.000']);

  // LENGUA — comprensión, discurso, cohesión y literatura.
  const texts = [
    ['V4-L001','LEN-COMP-LIT','El vivero municipal entrega árboles los viernes de 9 a 13. Para retirarlos hay que presentar un comprobante de domicilio.','¿Qué se necesita para retirar un árbol?',['Un comprobante de domicilio','Una foto carnet','Una autorización escolar','Un recibo de compra'],'Un comprobante de domicilio','Buscá la condición que aparece explícitamente.','El texto exige un comprobante de domicilio.'],
    ['V4-L002','LEN-COMP-LIT','La excursión partirá a las 7:30 desde la escuela y regresará aproximadamente a las 18. Cada estudiante debe llevar agua y una vianda.','¿A qué hora está prevista la salida?',['7:30','18:00','8:30','17:30'],'7:30','La hora aparece en la primera oración.','La salida está prevista a las 7:30.'],
    ['V4-L003','LEN-COMP-INF','Martina miró el cielo oscuro, guardó rápidamente los cuadernos de la mesa del patio y cerró todas las ventanas.','¿Qué es razonable inferir?',['Se aproxima una tormenta','Es de madrugada','Va a salir de viaje','Perdió sus cuadernos'],'Se aproxima una tormenta','Relacioná el cielo oscuro con sus acciones.','Cerrar ventanas y guardar cosas del patio sugiere que se aproxima una tormenta.'],
    ['V4-L004','LEN-COMP-INF','Tomás dejó el plato intacto y dijo que prefería acostarse temprano. Durante la tarde había estado estornudando y se sentía cansado.','¿Qué inferencia está mejor apoyada?',['No se siente bien','No le gusta ese plato','Tiene que estudiar','Está enojado'],'No se siente bien','Usá todas las pistas, no una sola.','Estornudos, cansancio y falta de apetito indican que probablemente no se siente bien.'],
    ['V4-L005','LEN-COMP-INF','La plaza estaba llena de charcos. Lucía sacó del bolso un paraguas todavía mojado antes de entrar a su casa.','¿Qué ocurrió probablemente poco antes?',['Había llovido','Había nevado','Había mucho viento','Había granizo necesariamente'],'Había llovido','Los charcos y el paraguas mojado son pistas.','Es razonable inferir que había llovido.']
  ];
  texts.forEach(r=>choiceL(r[0],r[1],['comun'],r[1]==='LEN-COMP-LIT'?2:3,r[2],r[3],r[4],r[5],r[6],r[7]));

  choiceL('V4-L006','LEN-FUNC',['comun'],3,'“No olvides apagar la luz al salir.”','¿Qué función del lenguaje predomina?',['Apelativa','Poética','Referencial','Metalingüística'],'Apelativa','La frase intenta producir una conducta en el receptor.','Predomina la función apelativa.');
  choiceL('V4-L007','LEN-FUNC',['comun'],3,'“La palabra «árbol» es un sustantivo común.”','¿Qué función del lenguaje predomina?',['Metalingüística','Apelativa','Poética','Emotiva'],'Metalingüística','El mensaje habla sobre el propio lenguaje.','Es metalingüística porque explica una palabra y su categoría.');
  choiceL('V4-L008','LEN-TRAMA',['comun'],3,'“El hornero mide cerca de veinte centímetros, tiene plumaje pardo y construye un nido de barro con forma de horno.”','¿Qué trama predomina?',['Descriptiva','Narrativa','Instructiva','Dialogal'],'Descriptiva','Se presentan rasgos de un ser.','Predomina la descripción.');
  choiceL('V4-L009','LEN-PARAT',['belgrano'],3,'En una nota periodística aparecen un título grande, una foto y un texto breve debajo de la foto.','¿Cómo se llama el texto que acompaña a la imagen?',['Epígrafe','Índice','Subrayado','Conector'],'Epígrafe','Es un paratexto que explica o contextualiza una imagen.','Se llama epígrafe.');
  choiceL('V4-L010','LEN-CIRC-COM',['belgrano'],3,'Una directora envía un correo a las familias para informar un cambio de horario.','¿Quién es el emisor?',['La directora','Las familias','El horario','El correo'],'La directora','El emisor produce el mensaje.','La directora es quien envía la información.');
  choiceL('V4-L011','LEN-CON',['comun'],3,'“La ruta estaba cortada; ___, el colectivo tomó un camino alternativo.”','Elegí el conector adecuado.',['por eso','sin embargo','aunque','mientras'],'por eso','La segunda idea es consecuencia de la primera.','«Por eso» expresa consecuencia.');
  choiceL('V4-L012','LEN-CON',['comun'],3,'“Quería ir a la plaza; ___, empezó a llover.”','Elegí el conector adecuado.',['sin embargo','por eso','entonces','además'],'sin embargo','Hay una oposición entre el deseo y lo que ocurre.','«Sin embargo» expresa contraste.');
  choiceL('V4-L013','LEN-REF',['belgrano'],4,'“Sofía encontró una tortuga en el jardín. El animal estaba escondido bajo unas hojas.”','¿Qué expresión retoma “El animal”?',['una tortuga','Sofía','el jardín','unas hojas'],'una tortuga','Buscá el antecedente compatible en significado.','«El animal» sustituye a «una tortuga».');
  choiceL('V4-L014','LEN-SEM',['comun'],3,'','¿Cuál es un sinónimo adecuado de “rápido” en “un corredor rápido”?',['veloz','pesado','lento','quieto'],'veloz','Buscá una palabra de significado semejante.','«Veloz» es sinónimo de «rápido».');
  choiceL('V4-L015','LEN-SEM',['comun'],3,'','¿Cuál es el antónimo de “escaso”?',['abundante','pequeño','raro','breve'],'abundante','Buscá el significado opuesto.','«Abundante» se opone a «escaso».');
  choiceL('V4-L016','LEN-HIPER',['belgrano'],3,'','¿Cuál es el hiperónimo de “rosa, jazmín y tulipán”?',['flor','jardín','perfume','planta verde'],'flor','El hiperónimo nombra la clase general.','Rosa, jazmín y tulipán son tipos de flor.');
  choiceL('V4-L017','LEN-NARR',['comun'],3,'“Al principio el perro no quería acercarse al arroyo. De pronto oyó un gemido del otro lado y cruzó corriendo. Finalmente encontró a un cachorro atrapado entre ramas.”','¿Cuál es la complicación?',['Oye un gemido y debe cruzar para averiguar qué ocurre','El perro no quiere acercarse','Encuentra al cachorro','El arroyo existe'],'Oye un gemido y debe cruzar para averiguar qué ocurre','La complicación introduce el problema que pone en marcha la acción.','El gemido y la necesidad de cruzar desencadenan el conflicto.');
  choiceL('V4-L018','LEN-NARR',['comun'],3,'“Yo no sabía que esa llave abriría una puerta escondida. Cuando la giré, el muro comenzó a moverse.”','¿Qué tipo de narrador aparece?',['Primera persona','Tercera persona omnisciente','Segunda persona','Narrador objetivo sin participación'],'Primera persona','Observá los pronombres y verbos: «yo», «sabía», «giré».','El narrador participa y habla en primera persona.');
  choiceL('V4-L019','LEN-REC-LIT',['comun'],3,'“El viento golpeaba la ventana como un puño impaciente.”','¿Qué recurso aparece?',['Comparación','Onomatopeya','Definición','Hipérbaton'],'Comparación','La palabra «como» vincula dos elementos.','Se compara el golpe del viento con un puño.');
  choiceL('V4-L020','LEN-REC-LIT',['comun'],3,'“La ciudad despertó bostezando bajo la lluvia.”','¿Qué recurso aparece?',['Personificación','Comparación','Enumeración','Definición'],'Personificación','Se atribuye una acción humana a algo no humano.','La ciudad recibe la acción humana de bostezar.');
  choiceL('V4-L021','LEN-REC-MON',['monserrat'],3,'“¡Crash! La rama cayó sobre el techo.”','¿Qué recurso expresivo aparece?',['Onomatopeya','Comparación','Personificación','Sinónimo'],'Onomatopeya','La palabra imita un sonido.','«Crash» reproduce un ruido.');
  choiceL('V4-L022','LEN-REC-MON',['monserrat'],3,'“El perfume dulce de los jazmines llenó el patio.”','¿Qué imagen sensorial predomina?',['Olfativa','Visual','Auditiva','Táctil'],'Olfativa','Identificá el sentido al que se refiere «perfume».','Predomina una imagen olfativa.');

  // LENGUA — gramática y sintaxis.
  choiceL('V4-L023','LEN-SUST',['comun'],3,'','¿Cuál es un sustantivo colectivo?',['enjambre','abeja','miel','volar'],'enjambre','Un colectivo nombra un conjunto en singular.','«Enjambre» nombra un conjunto de abejas.');
  choiceL('V4-L024','LEN-SUST',['comun'],3,'','¿Cuál es un sustantivo abstracto?',['valentía','mesa','perro','montaña'],'valentía','Los abstractos nombran cualidades, sentimientos o ideas.','«Valentía» es abstracto.');
  choiceL('V4-L025','LEN-ADJ',['comun'],3,'“Las montañas nevadas parecían enormes.”','¿Qué palabra funciona como adjetivo calificativo de “montañas”?',['nevadas','montañas','parecían','las'],'nevadas','El adjetivo expresa una cualidad del sustantivo.','«Nevadas» califica a «montañas».');
  choiceL('V4-L026','LEN-ADJ',['comun'],3,'','¿Cuál opción presenta concordancia correcta?',['las flores amarillas','la flores amarilla','los flores amarillas','las flor amarillo'],'las flores amarillas','Artículo, sustantivo y adjetivo deben concordar en género y número.','«las flores amarillas» concuerda correctamente.');
  choiceL('V4-L027','LEN-ART',['comun'],2,'','¿Cuál es un artículo indefinido?',['una','la','los','el'],'una','Los indefinidos son un, una, unos, unas.','«Una» es artículo indefinido.');
  choiceL('V4-L028','LEN-VERB',['comun'],3,'','¿Qué verbo está en pretérito perfecto compuesto?',['he leído','leí','leía','leeré'],'he leído','Se forma con «haber» en presente + participio.','«He leído» es pretérito perfecto compuesto.');
  choiceL('V4-L029','LEN-VERB',['comun'],4,'','¿Cuál oración está en futuro perfecto?',['Para mañana habremos terminado.','Mañana terminaremos.','Ayer terminamos.','Habíamos terminado antes.'],'Para mañana habremos terminado.','Buscá «haber» en futuro + participio.','«Habremos terminado» es futuro perfecto.');
  choiceL('V4-L030','LEN-SUJ-PRED',['monserrat'],3,'“Los pájaros del parque cantan al amanecer.”','¿Cuál es el núcleo del sujeto?',['pájaros','parque','cantan','amanecer'],'pájaros','El sujeto es «Los pájaros del parque».','El núcleo del sujeto es «pájaros».');
  choiceL('V4-L031','LEN-SUJ-PRED',['monserrat'],4,'“Mi hermana y sus amigas prepararon la merienda.”','¿Cómo se clasifica el sujeto?',['Sujeto expreso compuesto','Sujeto expreso simple','Sujeto tácito','Oración unimembre'],'Sujeto expreso compuesto','Tiene dos núcleos: «hermana» y «amigas».','Es un sujeto expreso compuesto.');
  choiceL('V4-L032','LEN-UNI-BI',['belgrano'],3,'','¿Cuál oración es unimembre?',['Hay viento fuerte.','Los chicos corren.','Mi hermana cocina.','El tren llegó.'],'Hay viento fuerte.','Las impersonales con «hay» no se separan en sujeto y predicado.','«Hay viento fuerte» es unimembre.');
  choiceL('V4-L033','LEN-UNI-BI',['belgrano'],3,'','¿Cuál oración es bimembre?',['Llueve mucho.','Buenas noches.','Las campanas sonaron temprano.','Hay dos entradas.'],'Las campanas sonaron temprano.','Debe poder reconocerse sujeto y predicado.','«Las campanas» es sujeto y «sonaron temprano» predicado.');
  choiceL('V4-L034','LEN-SUJ-PRED',['monserrat'],4,'“En el patio juegan los chicos del curso.”','¿Con qué palabra concuerda el verbo “juegan”?',['chicos','patio','curso','en'],'chicos','Buscá el núcleo del sujeto aunque aparezca después del verbo.','El verbo concuerda con «chicos».');

  // LENGUA — ortografía y puntuación.
  choiceL('V4-L035','LEN-ACENT',['comun'],3,'','¿Cuál palabra es grave y lleva tilde correctamente?',['árbol','canción','pared','camión'],'árbol','Las graves llevan tilde cuando no terminan en n, s o vocal.','«Árbol» es grave terminada en consonante distinta de n o s.');
  choiceL('V4-L036','LEN-ACENT',['comun'],3,'','¿Cuál palabra es aguda?',['reloj','árbol','música','lápiz'],'reloj','La sílaba tónica está al final.','re-LOJ es aguda.');
  choiceL('V4-L037','LEN-DIAC',['comun'],3,'','Elegí la oración correctamente tildada.',['Él trajo el libro para mí.','El trajo él libro para mi.','Él trajo él libro para mi.','El trajo el libro para mí.'],'Él trajo el libro para mí.','Los pronombres «él» y «mí» llevan tilde diacrítica.','La primera opción usa correctamente las tildes diacríticas.');
  choiceL('V4-L038','LEN-DIAC',['comun'],3,'','Completá: “No ___ si mañana vendrá”.',['sé','se','sí','si'],'sé','El verbo «saber» en primera persona lleva tilde.','La forma correcta es «sé».');
  choiceL('V4-L039','LEN-DIP-HIA',['monserrat'],3,'','¿Cuál palabra contiene hiato?',['país','cuidado','tierra','ruido'],'país','La tilde sobre la vocal cerrada rompe el diptongo.','pa-ís tiene hiato.');
  choiceL('V4-L040','LEN-DIP-HIA',['monserrat'],3,'','¿Cuál palabra contiene diptongo?',['ciudad','poeta','maíz','baúl'],'ciudad','Buscá dos vocales que se pronuncien en la misma sílaba.','ciu-dad contiene diptongo.');
  choiceL('V4-L041','LEN-BV',['comun'],3,'','¿Cuál palabra está bien escrita?',['biblioteca','vivlioteca','bivlioteca','bibloteca'],'biblioteca','Recordá la grafía de esta palabra frecuente.','Se escribe «biblioteca».');
  choiceL('V4-L042','LEN-BV',['comun'],3,'','¿Cuál opción completa correctamente “tu__o” en “Ayer ___ una reunión”?',['tuvo','tubo','tubó','tubo'],'tuvo','Es una forma del verbo «tener».','La forma verbal correcta es «tuvo».');
  choiceL('V4-L043','LEN-CSZ',['comun'],3,'','¿Cuál palabra está bien escrita?',['decisión','desición','desisión','dezisión'],'decisión','Prestá atención a la terminación -sión.','Se escribe «decisión».');
  choiceL('V4-L044','LEN-CSZ',['comun'],3,'','¿Cuál palabra está bien escrita?',['capacidad','capasidad','capazidad','capacidaz'],'capacidad','La terminación -cidad se escribe con c.','Se escribe «capacidad».');
  choiceL('V4-L045','LEN-GJ',['comun'],3,'','¿Cuál palabra está bien escrita?',['viaje','viage','biaje','biage'],'viaje','Las palabras terminadas en -aje suelen escribirse con j.','Se escribe «viaje».');
  choiceL('V4-L046','LEN-GJ',['comun'],3,'','¿Cuál palabra está bien escrita?',['proteger','protejer','protejér','protteger'],'proteger','La terminación -ger se escribe con g en este verbo.','Se escribe «proteger».');
  choiceL('V4-L047','LEN-H',['comun'],3,'','¿Cuál palabra está bien escrita?',['hervir','ervir','herbir','erbir'],'hervir','Recordá la h inicial de la familia de «hervor».','Se escribe «hervir».');
  choiceL('V4-L048','LEN-H',['comun'],3,'','¿Cuál opción completa correctamente “___ubo una sorpresa”?',['Hubo','Ubo','Huvo','uvo'],'Hubo','Es una forma impersonal del verbo «haber».','La forma correcta es «Hubo».');
  choiceL('V4-L049','LEN-RR',['monserrat'],3,'','¿Cuál palabra está escrita correctamente?',['alrededor','alrrededor','arededor','alrededorr'],'alrededor','La r fuerte no siempre se escribe rr.','La forma correcta es «alrededor».');
  choiceL('V4-L050','LEN-RR',['monserrat'],3,'','¿Cuál palabra necesita “rr”?',['carreta','careta','caricia','coral'],'carreta','Entre vocales, el sonido fuerte se representa con rr.','«Carreta» lleva rr.');
  choiceL('V4-L051','LEN-PARON',['belgrano'],3,'','Elegí la palabra adecuada: “El científico decidió ___ una nueva hipótesis”.',['formular','formolar','fornular','formullar'],'formular','Prestá atención a palabras de sonido parecido o grafía cercana.','La forma correcta es «formular».');
  choiceL('V4-L052','LEN-PUNT',['comun'],3,'','¿Cuál oración usa correctamente la coma en una enumeración?',['Compramos pan, queso, frutas y agua.','Compramos, pan queso frutas y agua.','Compramos pan queso, frutas y agua.','Compramos pan queso frutas, y agua.'],'Compramos pan, queso, frutas y agua.','La coma separa los elementos de una enumeración, salvo el último unido por «y».','La primera opción puntúa correctamente.');
  choiceL('V4-L053','LEN-PUNT',['comun'],3,'','¿Cuál oración usa correctamente los dos puntos?',['Trajo lo necesario: cuaderno, lápiz y regla.','Trajo: lo necesario cuaderno lápiz y regla.','Trajo lo: necesario, cuaderno y lápiz.','Trajo lo necesario cuaderno: lápiz y regla.'],'Trajo lo necesario: cuaderno, lápiz y regla.','Los dos puntos pueden anunciar una enumeración.','La primera opción es correcta.');
  choiceL('V4-L054','LEN-PYC',['monserrat'],4,'','¿Cuál oración usa correctamente el punto y coma?',['Ana eligió Matemática; Pedro, Lengua; y Luz, Ciencias.','Ana; eligió Matemática, Pedro Lengua.','Ana eligió; Matemática Pedro, Lengua.','Ana eligió Matemática,; Pedro Lengua.'],'Ana eligió Matemática; Pedro, Lengua; y Luz, Ciencias.','El punto y coma puede separar miembros complejos o paralelos.','La primera opción organiza correctamente los tres miembros.');

  // LENGUA — producción y revisión (Monserrat).
  add({id:'V4-L055',area:'lengua',habilidad:'LEN-PROD',colegios:['monserrat'],dificultad:3,tipo:'selfcheck',consigna:'En tu cuaderno, escribí entre 10 y 12 renglones a partir de esta situación: “Cuando abrió la mochila, encontró un sobre que no había guardado allí…”. Desarrollá una complicación y una resolución, sin diálogo.',criterios:['Escribí entre 10 y 12 renglones','Agregué un título','La historia mantiene coherencia con el inicio','Desarrollé una complicación','Incluí una resolución','Usé al menos un recurso expresivo','Evité repeticiones innecesarias','Revisé ortografía y concordancia'],pista:'Pensá primero qué contiene el sobre, qué problema genera y cómo se resuelve.',explicacion:'La revisión trabaja los criterios centrales de producción narrativa de Monserrat.',papel:true});
  add({id:'V4-L056',area:'lengua',habilidad:'LEN-PROD',colegios:['monserrat'],dificultad:4,tipo:'selfcheck',consigna:'En tu cuaderno, escribí entre 12 y 15 renglones: “El ascensor se detuvo entre dos pisos y, de pronto, las luces se apagaron…”. Debe haber complicación y resolución. No uses diálogo.',criterios:['Escribí entre 12 y 15 renglones','Agregué un título adecuado','Respeté la situación inicial','Desarrollé claramente el nudo','La resolución cierra el conflicto','Incluí una imagen sensorial o comparación','Reemplacé repeticiones con sinónimos o pronombres','Revisé verbos, concordancia y ortografía'],pista:'Planificá inicio, nudo y resolución antes de redactar.',explicacion:'La actividad entrena estructura narrativa, recursos expresivos y corrección lingüística.',papel:true});
  add({id:'V4-L057',area:'lengua',habilidad:'LEN-REV',colegios:['monserrat'],dificultad:3,tipo:'selfcheck',consigna:'Revisá una producción que hayas escrito hoy y hacé una segunda versión corregida en el cuaderno.',criterios:['Eliminé repeticiones innecesarias','Corregí errores de concordancia','Revisé tildes y grafías','Revisé mayúsculas y signos de puntuación','Comprobé que la complicación y la resolución se entiendan','Mejoré al menos una oración para que sea más clara'],pista:'Leé el texto en voz baja y revisalo por partes.',explicacion:'La reescritura permite separar la planificación de la corrección final.',papel:true});
  add({id:'V4-L058',area:'lengua',habilidad:'LEN-REV',colegios:['monserrat'],dificultad:4,tipo:'selfcheck',consigna:'Tomá una narración breve propia y prepará una versión “modo ingreso”: clara, prolija y sin repeticiones evitables.',criterios:['El título corresponde al contenido','La letra y presentación son uniformes','No mezclé tiempos verbales sin motivo','El sujeto y el verbo concuerdan','Usé conectores adecuados','Revisé ortografía completa','El final resuelve el conflicto narrativo'],pista:'Usá la lista como una corrección final antes de dar el texto por terminado.',explicacion:'La revisión integra presentación, morfosintaxis, cohesión y ortografía.',papel:true});

  // Más variantes específicas para dar profundidad al diagnóstico adaptativo.
  choiceL('V4-L059','LEN-ACENT',['comun'],4,'','¿Cuál grupo está formado solo por palabras esdrújulas?',['música, brújula, teléfono','canción, árbol, teléfono','pared, reloj, compás','lápiz, césped, camión'],'música, brújula, teléfono','Las esdrújulas llevan el acento en la antepenúltima sílaba.','Las tres palabras del primer grupo son esdrújulas.');
  choiceL('V4-L060','LEN-VERB',['comun'],4,'“Cuando llegamos, ellos ya habían terminado la tarea.”','¿En qué tiempo está “habían terminado”?',['Pretérito pluscuamperfecto','Pretérito perfecto simple','Futuro perfecto','Presente'],'Pretérito pluscuamperfecto','Se forma con «haber» en imperfecto + participio.','«Habían terminado» es pretérito pluscuamperfecto.');

  // Intercepta el banco ya ampliado por config.js y agrega V4 sin tocar los datos base.
  const previousFetch = window.fetch.bind(window);
  window.fetch = async function bancoV4Fetch(inputArg, init) {
    const url = typeof inputArg === 'string' ? inputArg : (inputArg?.url || '');
    const isBaseBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
    if (!isBaseBank) return previousFetch(inputArg, init);
    const response = await previousFetch(inputArg, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const current = data.ejercicios || [];
      const ids = new Set(current.map(e => e.id));
      data.version = 4;
      data.ejercicios = [...current, ...EXTRA.filter(e => !ids.has(e.id))];
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('[Ingreso V4] No se pudo ampliar el banco', error);
      return response;
    }
  };

  window.INGRESO_BANCO_V4 = { count: EXTRA.length };
})();
