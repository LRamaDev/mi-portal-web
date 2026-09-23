(() => {
  'use strict';

  const EXTRA = [];
  const add = e => EXTRA.push(e);
  const mInput = (id, habilidad, colegios, dificultad, consigna, respuesta, pista, explicacion, papel = true, alternativas = []) => add({ id, area:'matematica', habilidad, colegios, dificultad, tipo:'input', consigna, respuesta:String(respuesta), alternativas, pista, explicacion, papel });
  const mChoice = (id, habilidad, colegios, dificultad, consigna, opciones, respuesta, pista, explicacion, papel = false) => add({ id, area:'matematica', habilidad, colegios, dificultad, tipo:'choice', consigna, opciones, respuesta, pista, explicacion, papel });
  const lChoice = (id, habilidad, colegios, dificultad, texto, consigna, opciones, respuesta, pista, explicacion) => add({ id, area:'lengua', habilidad, colegios, dificultad, tipo:'choice', texto, consigna, opciones, respuesta, pista, explicacion });
  const lSelf = (id, habilidad, consigna, criterios) => add({ id, area:'lengua', habilidad, colegios:['monserrat'], dificultad:4, tipo:'selfcheck', consigna, criterios, pista:'Revisá el texto en dos pasadas: primero sentido y organización; después ortografía y concordancia.', explicacion:'La actividad entrena revisión consciente de la producción escrita.', papel:true });

  // MATEMÁTICA — 40 actividades para ampliar habilidades menos representadas.
  mChoice('V6-M001','MAT-NAT-INV',['comun'],2,'Si 2.350 + 1.875 = 4.225, ¿qué cuenta permite comprobarlo?',['4.225 − 1.875 = 2.350','4.225 + 1.875 = 2.350','2.350 − 1.875 = 4.225','4.225 ÷ 1.875 = 2.350'],'4.225 − 1.875 = 2.350','La resta es la operación inversa de la suma.','Restar uno de los sumandos al total recupera el otro.');
  mChoice('V6-M002','MAT-NAT-INV',['comun'],3,'Si 144 × 25 = 3.600, ¿qué operación inversa permite hallar 144?',['3.600 ÷ 25','3.600 − 25','3.600 + 25','25 ÷ 3.600'],'3.600 ÷ 25','La división deshace una multiplicación.','3.600 ÷ 25 = 144.');
  mInput('V6-M003','MAT-NAT-INV',['comun'],3,'Un número multiplicado por 18 da 2.106. ¿Cuál es el número?','117','Usá la operación inversa: 2.106 ÷ 18.','2.106 ÷ 18 = 117.',true);
  mInput('V6-M004','MAT-NAT-INV',['comun'],4,'A un número se le suman 8.745 y se obtiene 31.620. ¿Cuál era el número?','22875','Deshacé la suma con una resta.','31.620 − 8.745 = 22.875.',true,['22.875']);

  mChoice('V6-M005','MAT-NAT-ORD',['comun'],2,'¿Cuál número está entre 498.900 y 499.100?',['498.750','499.020','499.300','500.001'],'499.020','Compará primero las centenas de mil y luego las últimas cifras.','499.020 es mayor que 498.900 y menor que 499.100.');
  mChoice('V6-M006','MAT-NAT-ORD',['comun'],3,'Ordená de menor a mayor.',['305.099 < 305.909 < 350.099','305.909 < 305.099 < 350.099','350.099 < 305.909 < 305.099','305.099 < 350.099 < 305.909'],'305.099 < 305.909 < 350.099','Compará cifra por cifra desde la izquierda.','Ese es el orden creciente correcto.');

  mChoice('V6-M007','MAT-NAT-POS',['monserrat'],2,'En 584.217, ¿qué valor representa el 8?',['80.000','8.000','800','80'],'80.000','Ubicá la cifra según su posición.','El 8 está en la posición de decenas de mil.');
  mChoice('V6-M008','MAT-NAT-POS',['monserrat'],3,'¿Qué número tiene 6 centenas de mil, 4 unidades de mil, 3 decenas y 9 unidades?',['604.039','640.039','604.309','600.439'],'604.039','Escribí cada cifra en su valor posicional.','600.000 + 4.000 + 30 + 9 = 604.039.');
  mInput('V6-M009','MAT-NAT-POS',['monserrat'],3,'¿Cuántas unidades vale el 7 en el número 1.472.650?','70000','El 7 está en las decenas de mil.','Vale 70.000 unidades.',false,['70.000']);
  mChoice('V6-M010','MAT-NAT-POS',['monserrat'],4,'¿Cuál descomposición corresponde a 903.406?',['900.000 + 3.000 + 400 + 6','900.000 + 30.000 + 400 + 6','900.000 + 3.000 + 40 + 6','90.000 + 3.000 + 400 + 6'],'900.000 + 3.000 + 400 + 6','Revisá qué posiciones tienen valor cero.','903.406 = 900.000 + 3.000 + 400 + 6.');

  mInput('V6-M011','MAT-ROM',['monserrat'],2,'Escribí 36 en números romanos.','XXXVI','30 es XXX y 6 es VI.','36 = XXXVI.',false,['xxxvi']);
  mInput('V6-M012','MAT-ROM',['monserrat'],4,'Convertí XCIV al sistema decimal.','94','XC representa 90 e IV representa 4.','XCIV = 94.');

  mInput('V6-M013','MAT-COMB',['monserrat'],3,'Resolvé: 54 ÷ 6 + 7 × 3.','30','Primero división y multiplicación; después suma.','54÷6=9 y 7×3=21; total 30.');
  mInput('V6-M014','MAT-COMB',['monserrat'],4,'Resolvé: 96 ÷ [4 × (8−2)] + 3².','13','Primero paréntesis y potencia.','4×6=24; 96÷24=4; 3²=9; total 13.');
  mInput('V6-M015','MAT-COMB',['monserrat'],4,'Resolvé: 5 × [18 − (24 ÷ 6)] + 2³.','78','Resolvé de adentro hacia afuera.','24÷6=4; 18−4=14; 5×14=70; 2³=8; total 78.');

  mInput('V6-M016','MAT-POT',['monserrat'],2,'Calculá 4³.','64','Multiplicá 4 por sí mismo tres veces.','4³=4×4×4=64.');
  mInput('V6-M017','MAT-POT',['monserrat'],3,'Calculá 2⁶ + 5².','89','Calculá cada potencia por separado.','2⁶=64 y 5²=25; total 89.');
  mChoice('V6-M018','MAT-POT',['monserrat'],4,'¿Cuál expresión vale 81?',['3⁴','9³','2⁷','4³'],'3⁴','Calculá las potencias o reconocé productos repetidos.','3⁴=81.');

  mInput('V6-M019','MAT-SEC',['monserrat'],2,'Completá la secuencia: 7, 12, 17, 22, __.','27','Observá cuánto aumenta cada término.','La secuencia suma 5 cada vez.');
  mInput('V6-M020','MAT-SEC',['monserrat'],3,'Completá: 3, 6, 12, 24, __.','48','Buscá una regla multiplicativa.','Cada término duplica al anterior.');
  mInput('V6-M021','MAT-SEC',['monserrat'],3,'Completá: 2, 5, 10, 17, 26, __.','37','Mirá las diferencias: 3, 5, 7, 9…','La siguiente diferencia es 11; 26+11=37.');
  mChoice('V6-M022','MAT-SEC',['monserrat'],4,'Una figura usa 4 fósforos en el paso 1, 7 en el paso 2 y 10 en el paso 3. Si continúa la misma regla, ¿cuántos usa el paso 6?',['16','17','18','19'],'19','La cantidad aumenta de 3 en 3.','4,7,10,13,16,19.');

  mChoice('V6-M023','MAT-MULT',['comun'],2,'¿Cuál es múltiplo de 18?',['72','74','76','78'],'72','Un múltiplo se obtiene multiplicando el número por un natural.','18×4=72.');
  mChoice('V6-M024','MAT-MULT',['comun'],3,'¿Cuál número es divisor de 126?',['8','9','11','16'],'9','Probá cuál divide sin resto.','126÷9=14.');
  mChoice('V6-M025','MAT-DIV',['comun'],3,'¿Cuál es divisible por 8?',['2.312','2.314','2.318','2.322'],'2.312','Para 8, revisá si las tres últimas cifras forman un múltiplo de 8.','312÷8=39.');
  mChoice('V6-M026','MAT-DIV',['comun'],4,'¿Cuál es divisible por 3, por 4 y por 5?',['2.340','2.350','2.360','2.370'],'2.340','Debe terminar en 0, tener suma de cifras múltiplo de 3 y sus dos últimas cifras ser múltiplo de 4.','2.340 cumple las tres condiciones.');

  mChoice('V6-M027','MAT-GEO-ESP',['monserrat'],2,'¿Qué nombre recibe la semirrecta que divide un ángulo en dos ángulos iguales?',['Bisectriz','Mediatriz','Secante','Paralela'],'Bisectriz','Pensá en la construcción que parte un ángulo en dos partes iguales.','Es la bisectriz.');
  mChoice('V6-M028','MAT-GEO-ESP',['monserrat'],3,'Dos rectas que nunca se cortan y mantienen siempre la misma distancia son…',['paralelas','perpendiculares','secantes','coincidentes'],'paralelas','Imaginá dos líneas que avanzan juntas sin encontrarse.','Son paralelas.');
  mChoice('V6-M029','MAT-GEO-ESP',['monserrat'],3,'Si dos rectas se cortan formando cuatro ángulos rectos, son…',['perpendiculares','paralelas','oblicuas','coincidentes'],'perpendiculares','Los 90° son la pista clave.','Son rectas perpendiculares.');
  mChoice('V6-M030','MAT-GEO-ESP',['monserrat'],4,'¿Cuál afirmación sobre la mediatriz de un segmento es correcta?',['Pasa por el punto medio y es perpendicular al segmento','Divide un ángulo en dos partes iguales','Siempre es paralela al segmento','Une necesariamente sus extremos'],'Pasa por el punto medio y es perpendicular al segmento','Recordá sus dos propiedades principales.','La mediatriz pasa por el punto medio y forma 90° con el segmento.');

  mChoice('V6-M031','MAT-POL',['belgrano'],2,'Un polígono de 8 lados se llama…',['octógono','heptágono','eneágono','decágono'],'octógono','Relacioná el prefijo octo- con ocho.','Tiene ocho lados: octógono.');
  mChoice('V6-M032','MAT-POL',['belgrano'],3,'¿Cuántos lados tiene un dodecágono?',['10','11','12','14'],'12','El prefijo dodeca- indica doce.','Un dodecágono tiene 12 lados.');

  mChoice('V6-M033','MAT-ANG',['comun'],2,'Un ángulo de 121° es…',['obtuso','agudo','recto','llano'],'obtuso','Está entre 90° y 180°.','121° es obtuso.');
  mChoice('V6-M034','MAT-ANG',['comun'],3,'¿Cuál de estos ángulos es llano?',['180°','90°','45°','270°'],'180°','El ángulo llano forma una línea recta.','Mide 180°.');

  mChoice('V6-M035','MAT-TRI',['comun'],3,'Un triángulo tiene ángulos de 90°, 55° y 35°. Según sus ángulos es…',['rectángulo','acutángulo','obtusángulo','equilátero'],'rectángulo','Tiene un ángulo recto.','Por tener un ángulo de 90° es rectángulo.');
  mChoice('V6-M036','MAT-CUAD',['comun'],3,'¿Qué cuadrilátero tiene cuatro lados iguales y cuatro ángulos rectos?',['Cuadrado','Rombo','Rectángulo','Trapecio'],'Cuadrado','Debe cumplir ambas condiciones al mismo tiempo.','Es el cuadrado.');

  mChoice('V6-M037','MAT-GRAF',['monserrat'],2,'En una tabla, A=14, B=9, C=17 y D=12. ¿Cuál categoría tiene el menor valor?',['A','B','C','D'],'B','Compará los cuatro números.','9 es el menor valor.');
  mInput('V6-M038','MAT-GRAF',['monserrat'],3,'En un gráfico de barras se registran 12, 18, 15 y 25 libros leídos en cuatro meses. ¿Cuántos libros se leyeron en total?','70','Sumá los cuatro valores.','12+18+15+25=70.',true);

  mInput('V6-M039','MAT-PROP',['belgrano'],3,'Cinco botellas iguales contienen en total 7,5 litros. ¿Cuántos litros contienen 8 botellas?','12','Calculá primero cuánto contiene una botella.','7,5÷5=1,5 L; 1,5×8=12 L.',true,['12,0','12.0']);
  mInput('V6-M040','MAT-PROP',['belgrano'],4,'Para imprimir 240 folletos se usan 6 paquetes iguales de papel. ¿Cuántos folletos pueden imprimirse con 15 paquetes al mismo rendimiento?','600','Hallá cuántos folletos corresponden a un paquete y multiplicá por 15.','240÷6=40; 40×15=600.',true);

  // LENGUA — 40 actividades para ampliar habilidades menos representadas.
  lChoice('V6-L001','LEN-FUNC',['comun'],2,'Cuidemos el agua: cerrá la canilla mientras te cepillás los dientes.','¿Qué función del lenguaje predomina?',['Apelativa','Poética','Metalingüística','Fática'],'Apelativa','El mensaje busca que el receptor haga algo.','Predomina la función apelativa.');
  lChoice('V6-L002','LEN-FUNC',['comun'],3,'La palabra «rápidamente» es un adverbio formado a partir del adjetivo «rápido».','¿Qué función predomina?',['Metalingüística','Apelativa','Poética','Emotiva'],'Metalingüística','El lenguaje se usa para hablar del propio lenguaje.','Es una explicación sobre una palabra.');
  lChoice('V6-L003','LEN-FUNC',['comun'],3,'El agua hierve a 100 °C al nivel del mar.','¿Qué función predomina?',['Referencial','Poética','Apelativa','Fática'],'Referencial','Se transmite información sobre la realidad.','Predomina la función referencial.');

  lChoice('V6-L004','LEN-TRAMA',['comun'],2,'Primero lavá la fruta. Luego cortala en trozos y, por último, colocala en el recipiente.','¿Qué trama predomina?',['Instructiva','Narrativa','Argumentativa','Dialogal'],'Instructiva','El texto organiza pasos para realizar una acción.','Es una secuencia de instrucciones.');
  lChoice('V6-L005','LEN-TRAMA',['comun'],3,'El yaguareté posee pelaje amarillo con manchas negras y un cuerpo robusto.','¿Qué trama predomina?',['Descriptiva','Narrativa','Instructiva','Conversacional'],'Descriptiva','El texto enumera características.','Predomina la descripción.');
  lChoice('V6-L006','LEN-TRAMA',['comun'],3,'Ayer salimos temprano, cruzamos el río y llegamos al refugio antes de que anocheciera.','¿Qué trama predomina?',['Narrativa','Descriptiva','Instructiva','Expositiva'],'Narrativa','Hay acciones organizadas en el tiempo.','Predomina la narración.');

  lChoice('V6-L007','LEN-PARAT',['belgrano'],2,'Título: «Un hallazgo bajo el hielo». Bajada: «Investigadores encontraron restos de un animal prehistórico en excelente estado».','¿Qué función cumple la bajada?',['Amplía y anticipa información del título','Indica quién imprimió el texto','Reemplaza el cuerpo de la noticia','Señala únicamente la fecha'],'Amplía y anticipa información del título','Pensá qué aporta antes de leer el cuerpo.','La bajada agrega datos que orientan la lectura.');
  lChoice('V6-L008','LEN-PARAT',['belgrano'],3,'En una nota aparece una fotografía acompañada por el texto: «El equipo durante la excavación».','¿Cómo se llama ese texto breve?',['Epígrafe','Título','Índice','Glosario'],'Epígrafe','Acompaña y explica una imagen.','Es un epígrafe.');
  lChoice('V6-L009','LEN-PARAT',['belgrano'],3,'Un texto tiene título, subtítulos e imágenes con epígrafes.','¿Para qué sirven en conjunto esos elementos?',['Organizan y anticipan información','Cambian el tema principal','Eliminan la necesidad de leer','Indican sólo la opinión del autor'],'Organizan y anticipan información','Pensá en cómo guían al lector.','Los paratextos ayudan a organizar y anticipar el contenido.');

  lChoice('V6-L010','LEN-CIRC-COM',['belgrano'],2,'Una directora anuncia por altavoz: «La reunión comienza a las 18».','¿Quién es el emisor?',['La directora','El altavoz','La reunión','Las 18'],'La directora','El emisor produce el mensaje.','La directora emite el anuncio.');
  lChoice('V6-L011','LEN-CIRC-COM',['belgrano'],3,'Un estudiante envía un correo a su profesora para consultar una fecha.','¿Cuál es el canal?',['El correo electrónico','La profesora','La fecha','El estudiante'],'El correo electrónico','El canal es el medio por el que circula el mensaje.','El medio es el correo electrónico.');
  lChoice('V6-L012','LEN-CIRC-COM',['belgrano'],3,'Un cartel rojo con una mano levantada indica que está prohibido avanzar.','¿Qué tipo de comunicación aparece principalmente?',['No verbal','Verbal oral','Verbal escrita','Metalingüística'],'No verbal','No depende de palabras para transmitir la indicación.','El símbolo comunica visualmente sin palabras.');
  lChoice('V6-L013','LEN-CIRC-COM',['belgrano'],4,'En una videollamada con mala conexión, el sonido se corta y parte del mensaje no llega.','¿Qué elemento del circuito comunicacional está siendo afectado directamente?',['El canal','El emisor','El referente','El código'],'El canal','Pensá en el medio físico o tecnológico de transmisión.','La falla está en el canal de comunicación.');

  lChoice('V6-L014','LEN-SEM',['comun'],2,'El sendero era angosto.','¿Cuál es un sinónimo adecuado de «angosto»?',['estrecho','lejano','oscuro','áspero'],'estrecho','Buscá una palabra de significado semejante.','«Estrecho» es sinónimo de «angosto».');
  lChoice('V6-L015','LEN-SEM',['comun'],2,'La respuesta fue breve.','¿Cuál es el antónimo de «breve»?',['extensa','clara','precisa','correcta'],'extensa','Buscá el significado opuesto.','«Extensa» se opone a «breve».');
  lChoice('V6-L016','LEN-SEM',['comun'],3,'El científico observó cuidadosamente la muestra.','¿Qué palabra puede reemplazar «cuidadosamente» sin cambiar el sentido principal?',['atentamente','rápidamente','casualmente','ruidosamente'],'atentamente','Buscá una palabra que conserve la idea de atención.','«Atentamente» mantiene el sentido.');
  lChoice('V6-L017','LEN-SEM',['comun'],4,'El público recibió la noticia con entusiasmo.','¿Cuál opción expresa una idea opuesta a «entusiasmo» en ese contexto?',['desinterés','alegría','expectativa','emoción'],'desinterés','Buscá una actitud contraria al interés y la emoción.','«Desinterés» expresa la oposición más clara.');

  lChoice('V6-L018','LEN-HIPER',['belgrano'],2,'Perro, gato y caballo son…','¿Qué palabra funciona como hiperónimo?',['animales','mamíferos domésticos solamente','objetos','paisajes'],'animales','El hiperónimo incluye a todas las palabras del grupo.','«Animales» contiene a perro, gato y caballo.');
  lChoice('V6-L019','LEN-HIPER',['belgrano'],3,'Rosa, jazmín y margarita pertenecen al campo de las flores.','¿Cuál es el hiperónimo?',['flores','jardines','perfumes','colores'],'flores','Buscá la categoría general.','«Flores» incluye a las tres palabras.');
  lChoice('V6-L020','LEN-HIPER',['belgrano'],3,'¿Cuál es un hipónimo de «vehículo»?',['bicicleta','transporte','movimiento','camino'],'bicicleta','El hipónimo es un caso particular dentro de una categoría más general.','Una bicicleta es un tipo de vehículo.');

  lChoice('V6-L021','LEN-REC-MON',['monserrat'],2,'El viento silbaba entre las ramas: «fiuuu, fiuuu».','¿Qué recurso aparece?',['Onomatopeya','Comparación','Hipérbole','Definición'],'Onomatopeya','El texto imita un sonido.','«Fiuuu» reproduce un sonido.');
  lChoice('V6-L022','LEN-REC-MON',['monserrat'],3,'El aroma tibio del pan recién horneado llenó la cocina.','¿Qué tipo de imagen sensorial predomina?',['Olfativa','Visual','Auditiva','Táctil'],'Olfativa','La pista principal es el aroma.','Predomina una imagen olfativa.');
  lChoice('V6-L023','LEN-REC-MON',['monserrat'],3,'La piedra estaba helada y áspera bajo sus dedos.','¿Qué imagen sensorial predomina?',['Táctil','Auditiva','Gustativa','Visual'],'Táctil','Se describen sensaciones percibidas por el tacto.','«Helada» y «áspera» remiten al tacto.');
  lChoice('V6-L024','LEN-REC-MON',['monserrat'],4,'—No vuelvas tarde —dijo su abuela—. La tormenta está cerca.','¿Qué recurso narrativo aparece?',['Diálogo','Onomatopeya','Comparación','Enumeración'],'Diálogo','Hay palabras pronunciadas directamente por un personaje.','Es un diálogo directo.');

  lChoice('V6-L025','LEN-ART',['comun'],2,'___ montaña se veía desde lejos.','Elegí el artículo adecuado.',['La','El','Los','Unos'],'La','Debe concordar en género y número con «montaña».','«La montaña» presenta concordancia correcta.');
  lChoice('V6-L026','LEN-ART',['comun'],3,'En «Aquellas casas antiguas siguen en pie», ¿qué palabra funciona como determinante?',['Aquellas','casas','antiguas','siguen'],'Aquellas','El determinante acompaña al sustantivo y lo precisa.','«Aquellas» determina a «casas».');
  lChoice('V6-L027','LEN-ART',['comun'],3,'¿Cuál oración presenta concordancia correcta entre determinante y sustantivo?',['Esos árboles altos','Esa árboles altos','Esas árbol alto','Ese casas antiguas'],'Esos árboles altos','Revisá género y número.','«Esos» concuerda con «árboles» en masculino plural.');

  lChoice('V6-L028','LEN-DIAC',['comun'],2,'¿Cuál opción completa correctamente? «___ sabés la respuesta, decímela».',['Si','Sí','Sì','Se'],'Si','Sin tilde, «si» introduce una condición.','Aquí funciona como conjunción condicional.');
  lChoice('V6-L029','LEN-DIAC',['comun'],3,'¿Cuál oración usa correctamente la tilde diacrítica?',['Él trajo el cuaderno.','El trajo él cuaderno.','Tu trajiste tú cuaderno.','Mi hermana dijo que mí llama.'],'Él trajo el cuaderno.','El pronombre personal «él» lleva tilde; el artículo «el» no.','La primera oración distingue correctamente pronombre y artículo.');
  lChoice('V6-L030','LEN-DIAC',['comun'],3,'Completá: «Quiero saber ___ llegaste tarde».',['por qué','porque','porqué','por que'],'por qué','En una pregunta indirecta se usa «por qué».','La forma correcta es «por qué».');
  lChoice('V6-L031','LEN-DIAC',['comun'],4,'¿Cuál oración está correctamente escrita?',['Aún no llegó, pero sé que vendrá.','Aun no llegó, pero se que vendrá.','Aún no llego, pero se que vendrá.','Aun no llegó, pero sé que vendra.'],'Aún no llegó, pero sé que vendrá.','«Aún» equivale a todavía; «sé» es del verbo saber.','La primera opción coloca correctamente las tildes.');

  lChoice('V6-L032','LEN-H',['comun'],2,'¿Cuál palabra está correctamente escrita?',['hormiga','ormiga','hormigga','horimga'],'hormiga','Recordá la grafía convencional de la palabra.','Se escribe «hormiga».');
  lChoice('V6-L033','LEN-H',['comun'],3,'¿Cuál oración está correctamente escrita?',['Había huellas húmedas en el suelo.','Abía huellas úmedas en el suelo.','Había uellas húmedas en el suelo.','Avía huellas húmedas en el suelo.'],'Había huellas húmedas en el suelo.','Revisá las palabras con h inicial y el verbo haber.','La primera opción es la correcta.');
  lChoice('V6-L034','LEN-H',['comun'],3,'¿Cuál palabra pertenece a la misma familia que «hielo» y conserva la h?',['helado','elado','yelado','ielado'],'helado','Pensá en palabras de la misma familia léxica.','«Helado» pertenece a la familia de «hielo».');

  lChoice('V6-L035','LEN-RR',['monserrat'],3,'¿Cuál palabra está correctamente escrita?',['alrededor','alrrededor','arrededor','alrededorrr'],'alrededor','La r fuerte no siempre se escribe con rr; revisá su posición.','La forma correcta es «alrededor».');
  lChoice('V6-L036','LEN-RR',['monserrat'],4,'¿Cuál oración está correctamente escrita?',['El perro corrió alrededor del carro.','El pero corrió alrrededor del caro.','El perro corió alrededor del carro.','El perro corrió alrrededor del carro.'],'El perro corrió alrededor del carro.','Revisá dónde corresponde r y dónde rr entre vocales.','La primera oración es correcta.');

  lChoice('V6-L037','LEN-PARON',['belgrano'],3,'Elegí la palabra correcta: «El jurado decidió ___ al participante por su desempeño».',['premiar','premiarse','permiar','preminar'],'premiar','Buscá la palabra que significa otorgar un premio.','La forma correcta es «premiar».');
  lChoice('V6-L038','LEN-PARON',['belgrano'],4,'¿Cuál oración usa correctamente «actitud» y no «aptitud»?',['Su actitud respetuosa mejoró el trabajo del grupo.','Su actitud para resolver ecuaciones era excelente.','Evaluaron su actitud física para la competencia.','La prueba medía su actitud matemática.'],'Su actitud respetuosa mejoró el trabajo del grupo.','«Actitud» es una manera de comportarse; «aptitud» es capacidad.','La primera oración usa correctamente «actitud».');

  lSelf('V6-L039','LEN-REV','Releé un texto narrativo que hayas escrito hoy. Marcá los criterios que realmente cumpliste después de corregirlo.',['Revisé que cada oración se entienda','Corregí concordancia entre sujeto y verbo','Revisé mayúsculas y signos de puntuación','Busqué repeticiones innecesarias','Controlé tildes y ortografía','Comprobé que la resolución cierre el conflicto']);
  lSelf('V6-L040','LEN-REV','Escribí entre 8 y 10 renglones sobre una situación inesperada y luego hacé una segunda versión corregida. Marcá los criterios cumplidos en la versión final.',['La segunda versión es más clara que la primera','El texto mantiene el mismo tiempo verbal','Evité repeticiones cercanas','Revisé conectores entre oraciones','Corregí ortografía y puntuación','El final se relaciona con el problema planteado']);

  if (EXTRA.length !== 80) console.warn(`[Ingreso V6] Se esperaban 80 actividades y se generaron ${EXTRA.length}.`);

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function ingresoV6Fetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const isBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
    if (!isBank) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      const additions = EXTRA.filter(e => !existing.has(e.id));
      data.version = 6;
      data.ejercicios = [...(data.ejercicios || []), ...additions];
      return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: { 'Content-Type':'application/json; charset=utf-8' } });
    } catch (error) {
      console.error('[Ingreso V6] No se pudo ampliar el banco', error);
      return response;
    }
  };
})();