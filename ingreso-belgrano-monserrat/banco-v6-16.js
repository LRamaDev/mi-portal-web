(() => {
  'use strict';

  // V6.16: banco de profundización. Suma variantes originales de dificultad 3 y 4
  // para que la progresión adaptativa pueda subir el desafío sin reciclar consignas.
  const EXTRA = [];
  const add = exercise => EXTRA.push(exercise);
  const choice = (id, area, habilidad, colegios, dificultad, consigna, opciones, respuesta, pista, explicacion) => add({
    id, area, habilidad, colegios, dificultad, tipo: 'choice', consigna, opciones, respuesta, pista, explicacion, papel: false
  });
  const input = (id, area, habilidad, colegios, dificultad, consigna, respuesta, pista, explicacion, alternativas = []) => add({
    id, area, habilidad, colegios, dificultad, tipo: 'input', consigna, respuesta: String(respuesta), alternativas, pista, explicacion, papel: true
  });
  const selfcheck = (id, habilidad, dificultad, consigna, criterios, pista, explicacion) => add({
    id, area: 'lengua', habilidad, colegios: ['monserrat'], dificultad, tipo: 'selfcheck',
    consigna, criterios, pista, explicacion, papel: true
  });

  // Matemática · 24 actividades de profundización.
  input('V616-M001','matematica','MAT-NAT-OPS',['comun'],3,'Una biblioteca recibió 18 cajas con 24 libros cada una y prestó 157 libros. ¿Cuántos libros quedaron?','275','Calculá primero cuántos libros llegaron en total.','18 × 24 = 432; 432 − 157 = 275.');
  input('V616-M002','matematica','MAT-NAT-OPS',['comun'],4,'En un torneo se venden 36 entradas por fila durante 18 filas. Si 127 personas no asistieron, ¿cuántas ocuparon su lugar?','521','Multiplicá las filas por las entradas y luego restá las ausencias.','36 × 18 = 648; 648 − 127 = 521.');
  choice('V616-M003','matematica','MAT-NAT-INV',['comun'],3,'Si 47 × 26 = 1.222, ¿qué cuenta permite comprobar el resultado usando la operación inversa?',['1.222 ÷ 26 = 47','1.222 + 26 = 1.248','1.222 − 47 = 1.175','47 ÷ 26 = 1,8...'],'1.222 ÷ 26 = 47','La división es la operación inversa de la multiplicación.','Dividir el producto por uno de los factores debe devolver el otro factor.');
  input('V616-M004','matematica','MAT-COMB',['monserrat'],4,'Resolvé: 180 − (24 ÷ 6 + 7 × 8).','120','Resolvé primero las operaciones dentro del paréntesis.','24 ÷ 6 = 4 y 7 × 8 = 56; 180 − 60 = 120.');
  choice('V616-M005','matematica','MAT-POT',['monserrat'],3,'¿Cuál es el valor de 3⁴?',['81','12','64','27'],'81','Multiplicá cuatro veces el 3 por sí mismo.','3 × 3 × 3 × 3 = 81.');
  input('V616-M006','matematica','MAT-SEC',['monserrat'],4,'Continuá la secuencia: 2, 5, 11, 23, __.','47','Observá qué operación transforma cada término en el siguiente.','Cada término se obtiene multiplicando por 2 y sumando 1: 23 × 2 + 1 = 47.');
  input('V616-M007','matematica','MAT-MCM',['comun'],3,'¿Cuál es el mínimo común múltiplo de 12 y 18?','36','Listá múltiplos de ambos hasta encontrar el primero que coincida.','36 es el menor número positivo divisible por 12 y por 18.');
  input('V616-M008','matematica','MAT-MCD',['comun'],3,'¿Cuál es el mayor divisor común de 48 y 72?','24','Buscá los divisores comunes y elegí el mayor.','24 divide exactamente a 48 y a 72.');
  choice('V616-M009','matematica','MAT-FR-EQ',['comun'],3,'¿Cuál fracción es equivalente a 15/25?',['3/5','5/3','6/10','10/15'],'3/5','Simplificá numerador y denominador por 5.','15/25 = 3/5.');
  choice('V616-M010','matematica','MAT-FR-ORD',['comun'],3,'¿Cuál es la fracción mayor?',['5/6','7/9','3/4','4/5'],'5/6','Podés comparar convirtiendo a un mismo denominador o a decimal.','5/6 ≈ 0,833, mayor que 4/5 = 0,8; 7/9 ≈ 0,778 y 3/4 = 0,75.');
  input('V616-M011','matematica','MAT-FR-OPS',['monserrat'],4,'Calculá 3/4 + 5/8. Escribí el resultado como fracción.','11/8','Convertí 3/4 a octavos.','3/4 = 6/8; 6/8 + 5/8 = 11/8.', ['1 3/8','1,375']);
  input('V616-M012','matematica','MAT-FR-PROB',['comun'],4,'Un libro tiene 80 páginas. El primer día se leen 3/5 y el segundo día la mitad de lo que queda. ¿Cuántas páginas quedan sin leer?','16','Calculá primero 3/5 de 80 y después trabajá con el resto.','Se leen 48 páginas; quedan 32. La mitad de 32 es 16, por lo que quedan 16 sin leer.', ['16 páginas']);
  input('V616-M013','matematica','MAT-DEC-OPS',['comun'],3,'Calculá 18,75 − 6,4 + 2,35.','14,7','Alineá las comas decimales.','18,75 − 6,40 = 12,35; 12,35 + 2,35 = 14,70.', ['14,70','14.7']);
  input('V616-M014','matematica','MAT-MED-LONG',['comun'],4,'Una soga mide 2,75 m. Se agregan 85 cm y luego se cortan 1,20 m. ¿Cuántos centímetros quedan?','240','Convertí todas las medidas a centímetros.','275 + 85 − 120 = 240 cm.', ['240 cm']);
  input('V616-M015','matematica','MAT-MED-MASA',['monserrat'],4,'Se reparten 3,5 kg de alimento en 7 bolsas iguales. ¿Cuántos gramos recibe cada bolsa?','500','Convertí 3,5 kg a gramos antes de dividir.','3,5 kg = 3.500 g; 3.500 ÷ 7 = 500 g.', ['500 g']);
  input('V616-M016','matematica','MAT-MED-CAP',['monserrat'],4,'Con 4,5 litros de jugo se llenan vasos de 300 mL. ¿Cuántos vasos completos se llenan?','15','Pasá litros a mililitros.','4,5 L = 4.500 mL; 4.500 ÷ 300 = 15.');
  input('V616-M017','matematica','MAT-MED-TIEMPO',['monserrat'],4,'Una actividad empieza a las 13:48 y dura 2 h 37 min. ¿A qué hora termina?','16:25','Sumá primero las horas y después los minutos, reagrupando si pasás de 60.','13:48 + 2:37 = 16:25.', ['16.25']);
  input('V616-M018','matematica','MAT-PROP',['belgrano'],4,'Si 6 cuadernos cuestan $5.400 al mismo precio cada uno, ¿cuánto cuestan 9 cuadernos?','8100','Calculá el precio de un cuaderno y multiplicá por 9.','5.400 ÷ 6 = 900; 900 × 9 = 8.100.', ['8.100','$8100','$8.100']);
  choice('V616-M019','matematica','MAT-GEO-ESP',['monserrat'],3,'Dos rectas se cortan formando cuatro ángulos rectos. ¿Cómo son esas rectas?',['Perpendiculares','Paralelas','Coincidentes','Oblicuas sin ángulo recto'],'Perpendiculares','Recordá qué ocurre cuando se cruzan a 90°.','Las rectas perpendiculares forman ángulos rectos.');
  input('V616-M020','matematica','MAT-PER',['comun'],4,'Un alambre forma un rectángulo de 14 cm por 9 cm. Con el mismo alambre se forma un cuadrado. ¿Cuánto mide cada lado del cuadrado?','11,5','Primero calculá el perímetro del rectángulo y dividilo por 4.','2 × (14 + 9) = 46 cm; 46 ÷ 4 = 11,5 cm.', ['11.5','11,5 cm']);
  input('V616-M021','matematica','MAT-CIRC',['monserrat'],4,'Una circunferencia tiene radio 6,5 cm. Usando π = 3,14, ¿cuánto mide aproximadamente su longitud?','40,82','El diámetro es el doble del radio y la longitud es π × diámetro.','Diámetro = 13 cm; 3,14 × 13 = 40,82 cm.', ['40.82','40,82 cm']);
  choice('V616-M022','matematica','MAT-GRAF',['monserrat'],4,'Un gráfico registra 12, 18, 15 y 21 puntos en cuatro jornadas. ¿Cuál es el promedio de puntos por jornada?',['16,5','15','18','66'],'16,5','Sumá los cuatro valores y dividí por 4.','12 + 18 + 15 + 21 = 66; 66 ÷ 4 = 16,5.');
  input('V616-M023','matematica','MAT-PROB',['comun'],4,'Para una excursión hay 8 colectivos de 42 lugares. Viajan 287 personas. ¿Cuántos lugares quedan libres?','49','Calculá la capacidad total y restá la cantidad de viajeros.','8 × 42 = 336; 336 − 287 = 49.', ['49 lugares']);
  input('V616-M024','matematica','MAT-SEX',['belgrano'],4,'Calculá 72° 15′ − 38° 47′.','33°28′','Como 15′ es menor que 47′, pedí prestado 1° = 60′.','71° 75′ − 38° 47′ = 33° 28′.', ['33° 28′','33 grados 28 minutos']);

  // Lengua · 24 actividades de profundización.
  choice('V616-L001','lengua','LEN-COMP-LIT',['comun'],3,'«El tren salió a las siete y llegó a destino dos horas después». ¿A qué hora llegó?',['A las nueve','A las ocho','A las diez','No se puede saber'],'A las nueve','La información está expresada de manera directa.','Si salió a las siete y tardó dos horas, llegó a las nueve.');
  choice('V616-L002','lengua','LEN-COMP-INF',['comun'],4,'«Mara entró con el pelo mojado, cerró el paraguas y dejó las botas junto a la puerta». ¿Qué se puede inferir?',['Afuera estaba lloviendo','Había nevado dentro de la casa','Mara venía de nadar necesariamente','El paraguas estaba roto'],'Afuera estaba lloviendo','Relacioná varias pistas del texto sin agregar datos que no aparecen.','El pelo mojado, el paraguas y las botas permiten inferir que llovía.');
  choice('V616-L003','lengua','LEN-FUNC',['comun'],3,'En el cartel «Apagá la luz al salir», ¿qué función del lenguaje predomina?',['Apelativa','Poética','Metalingüística','Fática'],'Apelativa','El mensaje busca que el receptor haga algo.','Predomina la función apelativa porque intenta provocar una acción.');
  choice('V616-L004','lengua','LEN-TRAMA',['comun'],4,'Un texto explica cómo se produce un eclipse mediante definiciones y relaciones de causa. ¿Qué trama predomina?',['Expositiva','Narrativa','Conversacional','Poética'],'Expositiva','Pensá si el propósito principal es contar hechos o explicar un tema.','La trama expositiva organiza información para explicar.');
  choice('V616-L005','lengua','LEN-PARAT',['belgrano'],3,'En una noticia, ¿qué función cumple principalmente el título?',['Anticipar el tema principal','Reemplazar todo el cuerpo de la noticia','Indicar siempre la opinión del lector','Mostrar únicamente la fecha'],'Anticipar el tema principal','El título orienta antes de leer el desarrollo.','El título funciona como paratexto y anticipa el contenido central.');
  choice('V616-L006','lengua','LEN-CIRC-COM',['belgrano'],3,'En «La directora envió un mensaje a las familias por correo electrónico», ¿quién es el emisor?',['La directora','Las familias','El correo electrónico','El mensaje'],'La directora','El emisor es quien produce y envía el mensaje.','La directora es quien comunica la información.');
  choice('V616-L007','lengua','LEN-CON',['comun'],4,'Completá: «El camino estaba cortado; ___, tomamos una ruta alternativa».',['por eso','sin embargo','además','aunque'],'por eso','La segunda acción es consecuencia de la primera.','Por eso introduce una consecuencia.');
  choice('V616-L008','lengua','LEN-REF',['belgrano'],4,'«Tomás dejó las llaves sobre la mesa. Después las guardó en el cajón». ¿A qué se refiere «las»?',['A las llaves','A la mesa','A Tomás','Al cajón'],'A las llaves','Buscá un antecedente femenino plural.','El pronombre las reemplaza a las llaves.');
  choice('V616-L009','lengua','LEN-SEM',['comun'],3,'En «El pasillo estaba oscuro», ¿cuál es el antónimo más adecuado de «oscuro»?',['luminoso','estrecho','silencioso','largo'],'luminoso','Buscá una palabra de significado opuesto en el mismo rasgo.','Luminoso se opone a oscuro.');
  choice('V616-L010','lengua','LEN-HIPER',['belgrano'],3,'¿Cuál es el hiperónimo de «rosa, jazmín y clavel»?',['flores','plantas verdes','jardines','perfumes'],'flores','El hiperónimo nombra la categoría que incluye a todas las palabras.','Rosa, jazmín y clavel son tipos de flores.');
  choice('V616-L011','lengua','LEN-NARR',['comun'],4,'«Abrí la ventana y vi que todos me esperaban en la vereda». ¿Qué tipo de narrador aparece?',['Narrador en primera persona','Narrador omnisciente en tercera persona','Narrador testigo en tercera persona','No hay narrador'],'Narrador en primera persona','Observá las formas verbales y los pronombres.','Abrí y me están en primera persona.');
  choice('V616-L012','lengua','LEN-REC-LIT',['comun'],3,'¿En cuál oración hay personificación?',['El viento golpeaba enojado las ventanas.','La ventana era de madera.','El viento soplaba a 40 km/h.','Cerraron todas las ventanas.'],'El viento golpeaba enojado las ventanas.','Buscá un rasgo o acción humana atribuida a algo no humano.','Se le atribuye al viento el enojo, una cualidad humana.');
  choice('V616-L013','lengua','LEN-REC-MON',['monserrat'],4,'En «¡crac!, la rama se quebró y un olor húmedo llenó el patio», ¿qué recursos aparecen?',['Onomatopeya e imagen olfativa','Comparación e imagen visual','Personificación y diálogo','Sólo descripción objetiva'],'Onomatopeya e imagen olfativa','Identificá el sonido escrito y la referencia a un olor.','«Crac» imita un sonido y «olor húmedo» construye una imagen olfativa.');
  choice('V616-L014','lengua','LEN-SUST',['comun'],3,'En «Una bandada cruzó el cielo», ¿cómo se clasifica «bandada»?',['Sustantivo colectivo','Sustantivo propio','Adjetivo calificativo','Verbo'],'Sustantivo colectivo','Nombra en singular un conjunto de seres.','Bandada nombra un conjunto de aves.');
  choice('V616-L015','lengua','LEN-ADJ',['comun'],4,'Completá correctamente: «El cuaderno y la carpeta quedaron ___ sobre la mesa».',['ordenados','ordenadas','ordenado','ordenada'],'ordenados','El adjetivo se refiere a dos sustantivos de distinto género.','Cuando el adjetivo abarca un sustantivo masculino y otro femenino, va en masculino plural.');
  choice('V616-L016','lengua','LEN-VERB',['comun'],4,'En «Cuando llegamos, ellos ya habían terminado», ¿qué forma verbal es compuesta?',['habían terminado','llegamos','terminado solamente','cuando'],'habían terminado','Las formas compuestas usan un auxiliar más un participio.','Habían terminado combina el auxiliar haber con el participio terminado.');
  choice('V616-L017','lengua','LEN-SUJ-PRED',['monserrat'],4,'En «Las alumnas del turno mañana resolvieron el problema», ¿cuál es el núcleo del sujeto?',['alumnas','turno','mañana','resolvieron'],'alumnas','Buscá el sustantivo principal del grupo sujeto.','El sujeto es «Las alumnas del turno mañana» y su núcleo es alumnas.');
  choice('V616-L018','lengua','LEN-UNI-BI',['belgrano'],4,'¿Cuál de estas oraciones es unimembre?',['Hace frío desde temprano.','Los chicos sienten frío.','La mañana está fría.','El viento enfría la plaza.'],'Hace frío desde temprano.','Buscá una construcción impersonal que no pueda dividirse en sujeto y predicado.','«Hace frío» es una construcción impersonal unimembre.');
  choice('V616-L019','lengua','LEN-ACENT',['comun'],4,'¿Cuál palabra es esdrújula?',['teléfono','reloj','pared','canción'],'teléfono','Ubicá la sílaba tónica contando desde el final.','Te-lé-fo-no tiene la sílaba tónica en la antepenúltima posición.');
  choice('V616-L020','lengua','LEN-DIAC',['comun'],3,'Completá: «___ sabés la respuesta, explicala con tus palabras».',['Si','Sí','Tú','Te'],'Si','Acá introduce una condición, no una afirmación.','La conjunción condicional si se escribe sin tilde.');
  choice('V616-L021','lengua','LEN-DIP-HIA',['monserrat'],4,'¿En cuál palabra hay hiato producido por una vocal cerrada tónica?',['reúne','ciudad','ruido','cuidado'],'reúne','La tilde sobre una vocal cerrada puede separar las vocales en sílabas distintas.','Re-ú-ne presenta hiato entre e y ú.');
  choice('V616-L022','lengua','LEN-H',['comun'],3,'Completá: «Ya he ___ la tarea».',['hecho','echo','eho','hechó'],'hecho','Es el participio del verbo hacer.','El participio de hacer es hecho, con h.');
  choice('V616-L023','lengua','LEN-PUNT',['comun'],4,'¿Cuál opción puntúa correctamente un vocativo y una enumeración?',['Lucía, traé lápices, regla y goma.','Lucía traé, lápices regla y goma.','Lucía traé lápices regla, y goma.','Lucía; traé lápices regla y goma.'],'Lucía, traé lápices, regla y goma.','El nombre de la persona llamada se separa con coma y los elementos de la lista también.','El vocativo «Lucía» lleva coma y la enumeración separa sus elementos con comas.');
  selfcheck('V616-L024','LEN-REV',4,'Escribí un párrafo breve de hasta cuatro oraciones sobre un imprevisto durante un viaje. Después revisalo y mejoralo antes de marcar los criterios.',['El párrafo presenta una situación clara','El sujeto y los verbos mantienen concordancia','Evitaste repeticiones innecesarias usando sustituciones o pronombres','Revisaste mayúsculas, tildes y signos de puntuación'],'Primero escribí; después hacé una segunda lectura sólo para corregir.','Revisar por etapas ayuda a detectar problemas de coherencia, concordancia y ortografía.');

  if (EXTRA.length !== 48) console.warn(`[Banco V6.16] Se esperaban 48 actividades y se generaron ${EXTRA.length}.`);

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function ingresoV616BankFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const isBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
    if (!isBank) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      data.version = 16;
      data.ejercicios = [...(data.ejercicios || []), ...EXTRA.filter(e => !existing.has(e.id))];
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('[Banco V6.16] No se pudo ampliar el banco', error);
      return response;
    }
  };
})();