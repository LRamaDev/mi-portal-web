(() => {
  'use strict';

  // V6.17 · Banco derivado de la "Guía Integrada de Práctica y Solucionario
  // Paso a Paso · Matemática y Lengua · Ingreso 2026 · Manuel Belgrano".
  // Se conserva la correspondencia con los ejercicios fuente y se explicitan
  // los ajustes realizados cuando la guía presenta una ambigüedad o inconsistencia.
  const SOURCE = 'Guía Integrada Resuelta · Manuel Belgrano · Ingreso 2026';
  const EXTRA = [];
  const base = (id, area, habilidad, dificultad, tipo, consigna, respuesta, pista, explicacion, fuenteEjercicio, extra={}) => ({
    id, area, habilidad, colegios:['belgrano'], dificultad, tipo, consigna, respuesta, pista, explicacion,
    fuente: SOURCE, fuenteEjercicio, papel: area === 'matematica', ...extra
  });
  const input = (...args) => EXTRA.push(base(...args.slice(0,4),'input',...args.slice(4)));
  const choice = (id, area, habilidad, dificultad, consigna, opciones, respuesta, pista, explicacion, fuenteEjercicio, extra={}) =>
    EXTRA.push(base(id,area,habilidad,dificultad,'choice',consigna,respuesta,pista,explicacion,fuenteEjercicio,{opciones,...extra}));

  // MATEMÁTICA · Ejercicios 1–50
  input('BEL26-001','matematica','MAT-POT',3,
    'Calculá la diferencia entre el número de lados de un eneágono y el de un cuadrilátero, elevada al cubo.',
    '125','Primero hallá 9 − 4 y después elevá el resultado al cubo.',
    'Un eneágono tiene 9 lados y un cuadrilátero 4: 9 − 4 = 5; luego 5³ = 125.',1,{alternativas:['125']});

  input('BEL26-002','matematica','MAT-COMB',3,
    'Calculá: 120 + 45 × 2 − (80 ÷ 4).',
    '190','Respetá la jerarquía: primero multiplicación y división.',
    '45 × 2 = 90 y 80 ÷ 4 = 20. Entonces 120 + 90 − 20 = 190.',2,{alternativas:['190']});

  input('BEL26-003','matematica','MAT-PRIM',3,
    '¿Cuál es el cociente entre el mayor número compuesto impar menor que 30 y el menor número primo impar?',
    '9','Identificá primero ambos números y recién después dividí.',
    'El mayor compuesto impar menor que 30 es 27 y el menor primo impar es 3. Entonces 27 ÷ 3 = 9.',3,
    {alternativas:['9'],ajusteFuente:'La guía alterna 28 y 27 en la resolución. Se precisó “compuesto impar” para que la consigna tenga una única respuesta coherente.'});

  input('BEL26-004','matematica','MAT-DIV',3,
    'En el número 4.5A2, determiná el mayor valor posible de A para que el número sea divisible por 3.',
    '7','La suma de las cifras debe ser múltiplo de 3.',
    '4 + 5 + A + 2 = 11 + A. El mayor dígito que hace múltiplo de 3 a esa suma es 7: 11 + 7 = 18.',4,{alternativas:['7']});

  input('BEL26-005','matematica','MAT-MCM',3,
    'Woody pasa por un poste cada 6 segundos y Buzz cada 9 segundos. Si salen juntos, ¿a los cuántos segundos vuelven a coincidir?',
    '18','Buscá el mínimo común múltiplo de 6 y 9.',
    'm.c.m.(6,9) = 18, por eso vuelven a coincidir a los 18 segundos.',5,{alternativas:['18 segundos']});

  input('BEL26-006','matematica','MAT-MCD',3,
    'Con 48 chocolates y 72 gomitas se quieren armar la máxima cantidad de bolsitas iguales, sin que sobre nada. ¿Cuántas bolsitas se pueden armar?',
    '24','Buscá el divisor común mayor de 48 y 72.',
    'D.C.M.(48,72) = 24. Se pueden armar 24 bolsitas, cada una con 2 chocolates y 3 gomitas.',6,{alternativas:['24 bolsitas']});

  input('BEL26-007','matematica','MAT-PROB',2,
    'Se compran 15 frascos a $350 cada uno y se paga con $6.000. ¿Cuánto se recibe de vuelto?',
    '750','Calculá el costo total y restalo de 6.000.',
    '15 × 350 = 5.250; 6.000 − 5.250 = 750.',7,{alternativas:['$750','750 pesos']});

  input('BEL26-008','matematica','MAT-MULT',4,
    'El número 360 se descompone como 2³ × 3² × 5. ¿Cuántos divisores positivos tiene en total?',
    '24','Usá los exponentes de la factorización: sumales 1 y multiplicá.',
    '(3+1) × (2+1) × (1+1) = 4 × 3 × 2 = 24 divisores.',8,{alternativas:['24 divisores']});

  input('BEL26-009','matematica','MAT-COMB',4,
    'Calculá: √100 + 2³ × 5 − 3².',
    '41','Resolvé primero raíz y potencias, luego la multiplicación.',
    '√100 = 10, 2³ = 8 y 3² = 9. Entonces 10 + 8×5 − 9 = 41.',9,{alternativas:['41']});

  input('BEL26-010','matematica','MAT-PROP',3,
    'Ocho capas cuestan $9.600 en total. ¿Cuánto cuestan 12 capas iguales?',
    '14400','Hallá primero el precio de una capa.',
    '9.600 ÷ 8 = 1.200 por capa; 12 × 1.200 = 14.400.',10,{alternativas:['14.400','$14.400','14400']});

  input('BEL26-011','matematica','MAT-MCM',3,
    'Una luz verde se enciende cada 12 minutos y una roja cada 15. Si coincidieron a las 20:00, ¿a qué hora vuelven a coincidir?',
    '21:00','Calculá el m.c.m. de 12 y 15 y sumalo a las 20:00.',
    'm.c.m.(12,15) = 60 minutos. Una hora después de las 20:00 es 21:00.',11,{alternativas:['21:00 hs','21 hs','21']});

  input('BEL26-012','matematica','MAT-NAT-INV',3,
    'Si al triple de un número se le suman 14 y se obtiene 50, ¿cuál es ese número?',
    '12','Deshacé primero la suma de 14 y después el triple.',
    '3×X + 14 = 50; 3×X = 36; X = 12.',12,{alternativas:['12']});

  input('BEL26-013','matematica','MAT-DEC-OPS',2,
    'Un paquete pesa 0,125 kg. ¿Cuánto pesan 100 paquetes iguales?',
    '12,5','Multiplicar por 100 desplaza la coma dos lugares a la derecha.',
    '0,125 × 100 = 12,5 kg.',13,{alternativas:['12.5','12,5 kg','12.5 kg']});

  input('BEL26-014','matematica','MAT-DEC-OPS',2,
    'Se compran útiles por $12,50, $45,80 y $110,25. Si se paga con $200, ¿cuánto sobra?',
    '31,45','Sumá primero los tres precios.',
    '12,50 + 45,80 + 110,25 = 168,55; 200 − 168,55 = 31,45.',14,{alternativas:['31.45','$31,45','$31.45']});

  choice('BEL26-015','matematica','MAT-FR-EQ',2,
    '¿Qué fracción es equivalente a 3/4 y tiene denominador 20?',
    ['15/20','12/20','9/20','18/20'],'15/20',
    'Pensá por cuánto hay que multiplicar 4 para llegar a 20.',
    'Como 4 × 5 = 20, multiplicamos también el numerador: 3 × 5 = 15. Entonces 3/4 = 15/20.',15);

  choice('BEL26-016','matematica','MAT-FR-ORD',3,
    '¿Cuál es el orden correcto de menor a mayor para 2/5, 1/2 y 3/10?',
    ['3/10 < 2/5 < 1/2','2/5 < 3/10 < 1/2','1/2 < 2/5 < 3/10','3/10 < 1/2 < 2/5'],
    '3/10 < 2/5 < 1/2',
    'Llevá las tres fracciones a denominador 10.',
    '2/5 = 4/10, 1/2 = 5/10 y 3/10 = 3/10. Por eso 3/10 < 2/5 < 1/2.',16);

  input('BEL26-017','matematica','MAT-FR-PROB',3,
    'De 60 recuerdos, 2/5 son intensos. ¿Cuántos recuerdos no son intensos?',
    '36','Calculá 2/5 de 60 y restalo del total.',
    '2/5 de 60 = 24. Entonces 60 − 24 = 36.',17,{alternativas:['36 recuerdos']});

  input('BEL26-018','matematica','MAT-FR-OPS',3,
    'Tres cuartos de un terreno están sembrados y un tercio de esa zona se usa para pastoreo. ¿Qué fracción del terreno total se usa para pastoreo?',
    '1/4','“Un tercio de tres cuartos” se resuelve multiplicando.',
    '1/3 × 3/4 = 3/12 = 1/4.',18,{alternativas:['1/4 del terreno']});

  input('BEL26-019','matematica','MAT-FR-OPS',3,
    'Se consumió 1/6 de una tarta por la mañana y 2/3 por la tarde. ¿Qué fracción quedó sin comer?',
    '1/6','Sumá lo consumido y restalo de 1.',
    '1/6 + 2/3 = 1/6 + 4/6 = 5/6. Queda 1/6.',19,{alternativas:['1/6 de la tarta']});

  input('BEL26-020','matematica','MAT-DEC-OPS',3,
    'Se reparten 45,6 litros de jugo en 8 jarras iguales. ¿Cuántos litros recibe cada jarra?',
    '5,7','Dividí 45,6 por 8.',
    '45,6 ÷ 8 = 5,7 litros.',20,{alternativas:['5.7','5,7 litros','5.7 litros']});

  input('BEL26-021','matematica','MAT-FR-OPS',4,
    'Calculá y expresá en forma irreducible: 5/6 − 1/4 + 1/3.',
    '11/12','Usá denominador común 12.',
    '10/12 − 3/12 + 4/12 = 11/12.',21,{alternativas:['11/12']});

  input('BEL26-022','matematica','MAT-PROP',2,
    'En un grupo de 80 postulantes, el 25% aprobó con distinción. ¿Cuántos postulantes son?',
    '20','25% equivale a 1/4.',
    '25/100 = 1/4 y 1/4 de 80 = 20.',22,{alternativas:['20 postulantes']});

  input('BEL26-023','matematica','MAT-FR-PROB',3,
    'Si a la mitad de un número le sumo 1/4 y obtengo 3/4, ¿cuál es el número?',
    '1','Restá primero 1/4 y analizá qué número tiene como mitad 1/2.',
    '1/2×X + 1/4 = 3/4; 1/2×X = 1/2; por lo tanto X = 1.',23,{alternativas:['1']});

  input('BEL26-024','matematica','MAT-FR-DEC',3,
    'Expresá 7/8 como número decimal.',
    '0,875','Dividí 7 por 8.',
    '7 ÷ 8 = 0,875.',24,{alternativas:['0.875']});

  input('BEL26-025','matematica','MAT-FR-CON',3,
    'De 24 lápices, 6 son rojos, 8 azules y el resto verdes. ¿Qué fracción irreducible del total representan los verdes?',
    '5/12','Primero calculá cuántos lápices verdes hay.',
    '24 − 6 − 8 = 10. La fracción es 10/24, que simplificada da 5/12.',25,{alternativas:['5/12']});

  choice('BEL26-026','matematica','MAT-DEC-OPS',3,
    'Una factura de $3.420 se paga con $4.000. ¿Cuál de estas combinaciones forma exactamente el vuelto usando sólo billetes de $100 y $20?',
    ['5 billetes de $100 y 4 de $20','4 billetes de $100 y 4 de $20','5 billetes de $100 y 5 de $20','3 billetes de $100 y 8 de $20'],
    '5 billetes de $100 y 4 de $20',
    'Primero calculá el vuelto: 4.000 − 3.420.',
    'El vuelto es $580. 5×100 + 4×20 = 500 + 80 = 580. La guía también señala otras combinaciones posibles.',26);

  input('BEL26-027','matematica','MAT-FR-OPS',4,
    'Calculá: (1 − 1/3) × (2 + 1/2).',
    '5/3','Resolvé primero cada paréntesis.',
    '1 − 1/3 = 2/3 y 2 + 1/2 = 5/2. Luego 2/3 × 5/2 = 10/6 = 5/3.',27,{alternativas:['1 2/3','1⅔']});

  choice('BEL26-028','matematica','MAT-DEC-OPS',3,
    'Al redondear 14,867 a las décimas, ¿cuál es el valor redondeado y cuál es el error absoluto?',
    ['14,9 y 0,033','14,8 y 0,067','14,9 y 0,133','15,0 y 0,033'],
    '14,9 y 0,033',
    'Mirá la cifra de las centésimas y después restá el valor original al redondeado.',
    'La centésima es 6, por eso 14,867 se redondea a 14,9. El error es 14,900 − 14,867 = 0,033.',28);

  input('BEL26-029','matematica','MAT-FR-PROB',3,
    '¿Cuántas botellas de 3/4 de litro se pueden llenar con 15 litros?',
    '20','Dividí 15 por 3/4.',
    '15 ÷ 3/4 = 15 × 4/3 = 20.',29,{alternativas:['20 botellas']});

  input('BEL26-030','matematica','MAT-PROP',3,
    'El kilo de queso cuesta $4.800. ¿Cuánto cuestan 0,750 kg?',
    '3600','0,750 kg equivale a 3/4 de kilo.',
    '4.800 × 0,750 = 3.600.',30,{alternativas:['3.600','$3.600','3600']});

  input('BEL26-031','matematica','MAT-PROP',3,
    'Cuatro cuadernos cuestan $2.400. ¿Cuánto cuestan 9 cuadernos al mismo precio unitario?',
    '5400','Hallá el precio de un cuaderno.',
    '2.400 ÷ 4 = 600; 9 × 600 = 5.400.',31,{alternativas:['5.400','$5.400','5400']});

  input('BEL26-032','matematica','MAT-PROP',4,
    'Un automóvil consume 6 litros para recorrer 75 km. ¿Cuántos litros necesita para 250 km, manteniendo la misma proporción?',
    '20','Planteá una proporción directa.',
    '6/75 = X/250; X = 6×250÷75 = 20 litros.',32,{alternativas:['20 litros']});

  input('BEL26-033','matematica','MAT-PROP',3,
    'Para 8 personas se necesitan 300 g de harina. ¿Cuánta harina se necesita para 12 personas?',
    '450','Podés calcular la cantidad por persona o usar el factor 12/8.',
    '300 ÷ 8 = 37,5 g por persona; 37,5 × 12 = 450 g.',33,{alternativas:['450 g','450 gramos']});

  input('BEL26-034','matematica','MAT-PROP',3,
    'Y es directamente proporcional a X. Si X = 5 corresponde a Y = 18, ¿cuánto vale Y cuando X = 15?',
    '54','15 es el triple de 5.',
    'La constante es 18/5 = 3,6; 3,6 × 15 = 54.',34,{alternativas:['54']});

  input('BEL26-035','matematica','MAT-PROP',4,
    'En un mapa a escala 1:50.000, dos ciudades están separadas 4 cm. ¿Cuál es la distancia real en kilómetros?',
    '2','Multiplicá por 50.000 y luego convertí centímetros a kilómetros.',
    '4 × 50.000 = 200.000 cm = 2.000 m = 2 km.',35,{alternativas:['2 km','2 kilómetros']});

  choice('BEL26-036','matematica','MAT-PROP',4,
    'Se reparten $18.000 en forma directamente proporcional a las edades de dos hermanos de 8 y 10 años. ¿Cómo queda el reparto?',
    ['$8.000 y $10.000','$9.000 y $9.000','$7.000 y $11.000','$6.000 y $12.000'],
    '$8.000 y $10.000',
    'Sumá las edades y calculá cuánto corresponde por cada año.',
    '8 + 10 = 18; 18.000 ÷ 18 = 1.000 por año. Reciben 8.000 y 10.000.',36);

  input('BEL26-037','matematica','MAT-SEX',4,
    'Un ángulo mide 34° 25′ 40″. ¿Cuánto mide su complemento?',
    '55° 34′ 20″','Restalo de 90° y hacé los préstamos sexagesimales necesarios.',
    '90°00′00″ = 89°59′60″. Al restar 34°25′40″ queda 55°34′20″.',37,
    {alternativas:['55°34′20″','55° 34\' 20"','55 34 20']});

  input('BEL26-038','matematica','MAT-ANG-CS',3,
    'Dos ángulos opuestos por el vértice son suplementarios entre sí. ¿Cuánto mide cada uno?',
    '90','Los opuestos por el vértice son iguales y, además, suman 180°.',
    'Si α = β y α + β = 180°, entonces 2α = 180° y α = 90°.',38,{alternativas:['90°','90 grados']});

  choice('BEL26-039','matematica','MAT-POL',4,
    'Un polígono convexo tiene 9 lados. ¿Cómo se llama y cuánto suman sus ángulos interiores?',
    ['Eneágono; 1.260°','Octógono; 1.080°','Decágono; 1.440°','Eneágono; 1.080°'],
    'Eneágono; 1.260°',
    'Usá S = (n − 2) × 180° con n = 9.',
    'Un polígono de 9 lados es un eneágono. (9 − 2) × 180° = 1.260°.',39);

  choice('BEL26-040','matematica','MAT-TRI',3,
    'Un triángulo tiene ángulos de 48° y 62°. ¿Cuánto mide el tercero y cómo se clasifica según sus ángulos?',
    ['70°; acutángulo','70°; rectángulo','80°; acutángulo','70°; obtusángulo'],
    '70°; acutángulo',
    'Los tres ángulos interiores suman 180°.',
    '180° − 48° − 62° = 70°. Los tres son menores que 90°, por eso es acutángulo.',40);

  input('BEL26-041','matematica','MAT-TRI',3,
    'En un triángulo isósceles, el ángulo desigual mide 40°. ¿Cuánto mide cada uno de los otros dos ángulos?',
    '70','Restá 40° a 180° y dividí el resto por 2.',
    '180° − 40° = 140°; 140° ÷ 2 = 70°.',41,{alternativas:['70°','70 grados']});

  input('BEL26-042','matematica','MAT-PER',3,
    'Un rectángulo tiene perímetro 64 m y largo 20 m. ¿Cuánto mide el ancho?',
    '12','Usá P = 2×largo + 2×ancho.',
    '64 = 40 + 2×ancho; 24 = 2×ancho; ancho = 12 m.',42,{alternativas:['12 m','12 metros']});

  input('BEL26-043','matematica','MAT-PER',2,
    'Un cuadrado tiene lado de 5,4 cm. ¿Cuál es su perímetro?',
    '21,6','Multiplicá el lado por 4.',
    'P = 4 × 5,4 = 21,6 cm.',43,{alternativas:['21.6','21,6 cm','21.6 cm']});

  input('BEL26-044','matematica','MAT-PER',3,
    'Un cuadrado de 10 cm de lado tiene adosado externamente, sobre uno de sus lados, un triángulo equilátero también de lado 10 cm. ¿Cuál es el perímetro de la figura resultante?',
    '50','El lado compartido queda en el interior y no forma parte del contorno.',
    'Quedan 3 lados exteriores del cuadrado y 2 del triángulo: 5 × 10 = 50 cm.',44,{alternativas:['50 cm']});

  choice('BEL26-045','matematica','MAT-CUAD',3,
    '¿Qué cuadrilátero tiene dos pares de lados paralelos, cuatro lados congruentes y ningún ángulo recto?',
    ['Rombo','Cuadrado','Rectángulo','Trapecio'],'Rombo',
    'Cuatro lados iguales puede describir un rombo o un cuadrado; descartá el que tiene ángulos rectos.',
    'Como no tiene ángulos rectos, se trata de un rombo.',45);

  input('BEL26-046','matematica','MAT-MED-LONG',3,
    'Convertí y sumá en metros: 3,5 km + 450 m + 2.500 cm.',
    '3975','Convertí primero kilómetros y centímetros a metros.',
    '3,5 km = 3.500 m y 2.500 cm = 25 m. Total: 3.500 + 450 + 25 = 3.975 m.',46,
    {alternativas:['3.975','3975 m','3.975 m']});

  choice('BEL26-047','matematica','MAT-TRI',4,
    'En un triángulo rectángulo, uno de los ángulos agudos mide el doble que el otro. ¿Cuánto miden?',
    ['30° y 60°','20° y 70°','45° y 45°','40° y 80°'],'30° y 60°',
    'Los dos ángulos agudos de un triángulo rectángulo suman 90°.',
    'Si miden α y 2α, entonces 3α = 90°; α = 30° y el otro mide 60°.',47);

  input('BEL26-048','matematica','MAT-PER',3,
    'Un trapecio isósceles tiene bases de 18 cm y 10 cm, y cada lado no paralelo mide 7 cm. ¿Cuál es su perímetro?',
    '42','Sumá los cuatro lados.',
    '18 + 10 + 7 + 7 = 42 cm.',48,{alternativas:['42 cm']});

  input('BEL26-049','matematica','MAT-PER',4,
    'Dos rectángulos congruentes de 12 cm por 5 cm se colocan perpendiculares y se superponen exactamente en un cuadrado de 5 cm por 5 cm, formando una L. ¿Cuál es el perímetro exterior?',
    '48','Dibujá la L y recorré sólo el contorno exterior.',
    'Los tramos exteriores miden 12 + 5 + 7 + 7 + 5 + 12 = 48 cm.',49,
    {alternativas:['48 cm'],ajusteFuente:'La guía indica 46 cm con una descripción geométrica insuficiente y una suma de segmentos inconsistente. Se explicitó la superposición 5×5 y se corrigió el perímetro a 48 cm.'});

  input('BEL26-050','matematica','MAT-PER',4,
    'Se cerca con 3 pasadas de alambre un hexágono regular de 8,5 m de lado. Si el metro de alambre cuesta $150, ¿cuál es el costo total?',
    '22950','Calculá primero el perímetro, luego las 3 pasadas y finalmente el costo.',
    'Perímetro: 6×8,5 = 51 m. Tres pasadas: 153 m. Costo: 153×150 = 22.950.',50,
    {alternativas:['22.950','$22.950','22950']});

  // LENGUA Y LITERATURA · Ejercicios 51–64
  const TEXTO_FICCIONAL = 'El abuelo Celestino observó con paciencia cómo la tecnología invadía su granja. Un tractor autónomo araba el trigo mientras las gallinas usaban pulseras inteligentes para medir sus pasos. El viejo granjero sonrió con astucia y pensó que la tradición y la modernidad podían convivir en armonía.';
  const TEXTO_NOTICIA = 'Mendoza, 12 de Mayo. Científicos del CONICET desarrollaron un sistema de riego automatizado con energía solar. El dispositivo analiza la humedad del suelo y optimiza el uso del agua en zonas áridas.';

  choice('BEL26-051','lengua','LEN-CSZ',3,
    '¿Qué opción completa correctamente estas palabras? produ...ía / cru...ido / pa...iencia / pre...aleció',
    ['producía / crujido / paciencia / prevaleció','produsía / cruzido / pasiencia / prebaleció','produzía / crugido / paciensia / prevaleció','producía / crusido / pasiencia / prebaleció'],
    'producía / crujido / paciencia / prevaleció',
    'Revisá cada palabra completa, no sólo una regla.',
    'Las formas correctas son producía, crujido, paciencia y prevaleció.',51,
    {ajusteFuente:'La consigna original restringe las letras posibles a c/s/z/b/v, pero “crujido” requiere j. La actividad se reformuló para evaluar la escritura correcta completa.'});

  choice('BEL26-052','lengua','LEN-TRAMA',3,
    '¿Qué combinación describe mejor el texto del abuelo Celestino?',
    ['Trama narrativa y función poética/literaria','Trama argumentativa y función apelativa','Trama instructiva y función fática','Trama descriptiva pura y función metalingüística'],
    'Trama narrativa y función poética/literaria',
    'Pensá qué hace el texto: relata hechos ficcionales y construye una escena.',
    'El texto presenta personajes y una secuencia de hechos; por su carácter ficcional y expresivo predomina la función poética/literaria.',52,{texto:TEXTO_FICCIONAL});

  choice('BEL26-053','lengua','LEN-COMP-INF',4,
    '¿Qué permite inferir la expresión “sonrió con astucia” frente a la modernización de la granja?',
    ['Que comprendió que tradición y tecnología podían convivir','Que decidió abandonar la granja','Que rechazó toda tecnología','Que no entendía lo que ocurría'],
    'Que comprendió que tradición y tecnología podían convivir',
    'Buscá una idea que no esté dicha de forma literal, pero se desprenda del cierre.',
    'La reflexión final muestra una actitud adaptativa: Celestino entiende que puede incorporar tecnología sin abandonar la tradición.',53,{texto:TEXTO_FICCIONAL});

  choice('BEL26-054','lengua','LEN-NARR',3,
    '¿Cuál es el orden cronológico correcto de estos sucesos: a) Celestino reflexiona; b) las gallinas usan pulseras; c) Celestino observa la granja; d) el tractor ara?',
    ['c → d → b → a','d → c → a → b','b → d → c → a','c → b → a → d'],
    'c → d → b → a',
    'Seguí el orden en que aparecen los hechos en el texto.',
    'Primero observa la granja, luego aparece el tractor, después las gallinas con pulseras y finalmente la reflexión.',54,{texto:TEXTO_FICCIONAL});

  choice('BEL26-055','lengua','LEN-REC-LIT',3,
    'En “El tractor avanzaba fiero como un toro embravecido”, ¿qué recurso literario aparece?',
    ['Comparación o símil','Personificación','Onomatopeya','Hipérbaton'],
    'Comparación o símil',
    'Buscá un nexo explícito que relaciona dos elementos.',
    'El nexo “como” establece una comparación entre el tractor y un toro embravecido.',55);

  choice('BEL26-056','lengua','LEN-REF',3,
    'En “El abuelo Celestino observó con paciencia cómo la tecnología invadía su granja”, ¿a quién refiere “su”?',
    ['Al abuelo Celestino','A la tecnología','Al tractor','A las gallinas'],
    'Al abuelo Celestino',
    'Buscá quién es el poseedor de la granja en el contexto.',
    '“Su granja” refiere a la granja del abuelo Celestino.',56,{texto:TEXTO_FICCIONAL});

  choice('BEL26-057','lengua','LEN-CON',3,
    'En “El tractor araba solo, mientras las gallinas caminaban”, ¿qué relación expresa “mientras”?',
    ['Temporal de simultaneidad','Causal','Consecutiva','Adversativa'],
    'Temporal de simultaneidad',
    'Las dos acciones ocurren al mismo tiempo.',
    '“Mientras” conecta dos acciones simultáneas, por eso funciona como conector temporal.',57);

  choice('BEL26-058','lengua','LEN-PUNT',3,
    '¿Cuál afirmación es correcta sobre “Celestino” y los dos puntos?',
    ['Celestino lleva mayúscula por ser nombre propio; los dos puntos pueden introducir una aclaración, cita o enumeración.','Celestino lleva mayúscula por ser verbo; los dos puntos siempre cierran un texto.','Celestino lleva mayúscula por estar después de una coma; los dos puntos reemplazan cualquier punto.','Celestino lleva mayúscula por ser adjetivo; los dos puntos sólo se usan en diálogos.'],
    'Celestino lleva mayúscula por ser nombre propio; los dos puntos pueden introducir una aclaración, cita o enumeración.',
    'Separá las dos cuestiones: uso de mayúsculas y función de los dos puntos.',
    'Los nombres propios llevan mayúscula inicial. Los dos puntos pueden anunciar una aclaración, una cita o una enumeración.',58);

  choice('BEL26-059','lengua','LEN-FUNC',3,
    '¿Qué función del lenguaje predomina en esta noticia sobre un sistema de riego solar?',
    ['Referencial o informativa','Poética','Apelativa','Fática'],
    'Referencial o informativa',
    'La noticia busca comunicar hechos e información.',
    'Predomina la función referencial/informativa porque el texto presenta información sobre un desarrollo tecnológico.',59,{texto:TEXTO_NOTICIA});

  choice('BEL26-060','lengua','LEN-VERB',4,
    '¿Cuál análisis verbal es correcto para “desarrollaron”, “analiza” y “optimiza”?',
    ['desarrollaron: pretérito perfecto simple, 3.ª plural; analiza y optimiza: presente, 3.ª singular','desarrollaron: futuro, 1.ª plural; analiza y optimiza: pasado, 3.ª singular','los tres están en infinitivo','los tres están en presente, 1.ª singular'],
    'desarrollaron: pretérito perfecto simple, 3.ª plural; analiza y optimiza: presente, 3.ª singular',
    'Ubicá cada acción en el tiempo y reconocé quién la realiza.',
    '“Desarrollaron” está en pretérito perfecto simple, 3.ª persona plural. “Analiza” y “optimiza” están en presente, 3.ª singular.',60,{texto:TEXTO_NOTICIA});

  choice('BEL26-061','lengua','LEN-ADJ',3,
    'Clasificá semánticamente los adjetivos “solar”, “tres” y “nuestro”.',
    ['solar: calificativo; tres: numeral cardinal; nuestro: posesivo','solar: posesivo; tres: calificativo; nuestro: numeral','solar: gentilicio; tres: posesivo; nuestro: calificativo','los tres son calificativos'],
    'solar: calificativo; tres: numeral cardinal; nuestro: posesivo',
    'Pensá qué información aporta cada palabra: cualidad/tipo, cantidad o posesión.',
    '“Solar” califica o especifica un tipo de energía; “tres” expresa cantidad exacta; “nuestro” expresa posesión.',61,
    {ajusteFuente:'La guía presenta “tres” y “nuestro” como si fueran del texto periodístico de referencia, aunque no aparecen allí. Se convirtió en una consigna autónoma de clasificación.'});

  choice('BEL26-062','lengua','LEN-ACENT',3,
    '¿Cuál clasificación es correcta?',
    ['científicos y árida: esdrújulas con tilde; riego y Mendoza: graves sin tilde','científicos y árida: agudas; riego y Mendoza: esdrújulas','científicos: grave; árida: aguda; riego y Mendoza: esdrújulas','todas son agudas'],
    'científicos y árida: esdrújulas con tilde; riego y Mendoza: graves sin tilde',
    'Ubicá la sílaba tónica contando desde el final.',
    '“científicos” y “árida” son esdrújulas y siempre llevan tilde. “riego” y “Mendoza” son graves terminadas en vocal y no llevan tilde.',62);

  choice('BEL26-063','lengua','LEN-SUST',3,
    '¿Cuál clasificación es correcta para “CONICET”, “equipo” y “agua”?',
    ['CONICET: propio; equipo: común colectivo; agua: común concreto','CONICET: colectivo; equipo: propio; agua: abstracto','CONICET: común; equipo: abstracto; agua: propio','los tres son sustantivos propios'],
    'CONICET: propio; equipo: común colectivo; agua: común concreto',
    'Pensá si nombran una institución particular, un conjunto o una sustancia perceptible.',
    'CONICET funciona como nombre propio institucional; “equipo” puede nombrar un conjunto; “agua” es un sustantivo común concreto.',63);

  choice('BEL26-064','lengua','LEN-PARAT',3,
    '¿Qué grupo está formado sólo por paratextos frecuentes de una noticia periodística impresa?',
    ['Volanta, título, copete/bajada y fotografía con epígrafe','Sujeto, predicado, verbo y adjetivo','Introducción, nudo, desenlace y moraleja','Hipérbole, comparación, metáfora y personificación'],
    'Volanta, título, copete/bajada y fotografía con epígrafe',
    'Buscá elementos que acompañan y organizan visualmente la noticia.',
    'Entre los paratextos frecuentes aparecen la volanta, el título, el copete o bajada y la fotografía con epígrafe.',64,
    {ajusteFuente:'Se reemplazó “indispensables” por “frecuentes” para evitar presentar como obligatoria una estructura editorial que puede variar.'});

  if (EXTRA.length !== 64) console.warn(`[Banco V6.17] Se esperaban 64 actividades y se generaron ${EXTRA.length}.`);

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function ingresoV617BelgranoFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const isBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
    if (!isBank) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      data.version = 17;
      data.fuentes = [...new Set([...(data.fuentes || []), SOURCE])];
      data.ejercicios = [...(data.ejercicios || []), ...EXTRA.filter(e => !existing.has(e.id))];
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('[Banco V6.17] No se pudo incorporar la guía Belgrano 2026', error);
      return response;
    }
  };
})();