(() => {
  'use strict';

  // V6.10: variantes originales para las habilidades matemáticas que tenían
  // menor cobertura. Complementan el banco sin reproducir exámenes oficiales.
  const EXTRA = [];
  const add = exercise => EXTRA.push(exercise);
  const input = (id, habilidad, dificultad, consigna, respuesta, pista, explicacion, alternativas = []) => add({
    id, area: 'matematica', habilidad, colegios: ['comun'], dificultad, tipo: 'input', consigna,
    respuesta: String(respuesta), alternativas, pista, explicacion, papel: true
  });
  const choice = (id, habilidad, dificultad, consigna, opciones, respuesta, pista, explicacion) => add({
    id, area: 'matematica', habilidad, colegios: ['comun'], dificultad, tipo: 'choice', consigna,
    opciones, respuesta, pista, explicacion, papel: false
  });

  // Concepto de fracción: representación, equivalencia y parte de una cantidad.
  choice('V610-M001','MAT-FR-CON',1,'Una pizza se divide en 6 porciones iguales y se comen 2. ¿Qué fracción representa la parte comida?',['2/6','6/2','4/6','2/4'],'2/6','El numerador cuenta las porciones tomadas y el denominador las porciones iguales del total.','Se comieron 2 de las 6 porciones: 2/6.');
  choice('V610-M002','MAT-FR-CON',2,'¿Cuál fracción representa exactamente la mitad de una figura dividida en 8 partes iguales?',['4/8','8/4','2/8','1/8'],'4/8','La mitad de 8 partes son 4 partes.','4 de 8 partes iguales representan una mitad.');
  input('V610-M003','MAT-FR-CON',2,'De 24 lápices, 3/4 son de colores. ¿Cuántos lápices de colores hay?','18','Primero calculá 1/4 de 24 y luego multiplicá por 3.','24÷4=6; 6×3=18.', ['18 lápices']);
  choice('V610-M004','MAT-FR-CON',3,'¿Qué fracción es equivalente a 6/9?',['2/3','3/2','6/3','9/6'],'2/3','Simplificá numerador y denominador dividiendo por el mismo número.','6/9 se simplifica dividiendo ambos términos por 3: 2/3.');

  // Múltiplos y divisores: reconocimiento y aplicación.
  choice('V610-M005','MAT-MULT',2,'¿Cuál es un múltiplo de 7?',['56','54','58','63,5'],'56','Probá si puede escribirse como 7 multiplicado por un número natural.','56=7×8.');
  input('V610-M006','MAT-MULT',2,'Escribí el menor múltiplo de 9 mayor que 70.','72','Listá múltiplos de 9 a partir de 63.','Después de 63 viene 72.', ['72']);
  choice('V610-M007','MAT-MULT',3,'¿Cuál número tiene exactamente a 4 y a 6 como divisores?',['48','50','54','58'],'48','Debe poder dividirse por 4 y también por 6 sin resto.','48÷4=12 y 48÷6=8.');
  input('V610-M008','MAT-MULT',3,'En una fila se pueden formar grupos de 8 estudiantes sin que sobre nadie. Si hay menos de 50 estudiantes, ¿cuál podría ser el total?','48','Buscá un múltiplo de 8 menor que 50.','48=8×6.', ['48 estudiantes']);

  // Problemas de varios pasos: cálculo con contexto y verificación.
  input('V610-M009','MAT-PROB',2,'Para una salida se alquilan 4 combis con 13 asientos cada una. Viajan 47 estudiantes. ¿Cuántos asientos quedan libres?','5','Calculá primero la cantidad total de asientos.','4×13=52; 52−47=5.', ['5 asientos']);
  input('V610-M010','MAT-PROB',3,'Una librería recibe 15 cajas con 18 cuadernos cada una. Vende 126 cuadernos. ¿Cuántos quedan?','144','Primero multiplicá cajas por cuadernos y después restá los vendidos.','15×18=270; 270−126=144.', ['144 cuadernos']);
  input('V610-M011','MAT-PROB',3,'En una colecta se juntan $48.600 entre 27 familias, en partes iguales. ¿Cuánto aporta cada familia?','1800','Dividí el total por la cantidad de familias.','48.600÷27=1.800.', ['1.800']);
  input('V610-M012','MAT-PROB',4,'Un club compra 9 redes a $12.750 cada una y paga con $125.000. ¿Cuánto dinero le sobra?','10250','Calculá el costo total y comparalo con el dinero disponible.','9×12.750=114.750; sobran 125.000−114.750=10.250.', ['10.250']);

  // Medidas de capacidad y tiempo: conversión y situaciones cotidianas.
  input('V610-M013','MAT-MED-CAP',2,'Convertí 3,75 litros a mililitros.','3750','1 litro equivale a 1.000 mililitros.','3,75×1.000=3.750 mL.', ['3.750']);
  input('V610-M014','MAT-MED-CAP',3,'Una receta usa 250 mL de leche por preparación. Con 2 litros de leche, ¿cuántas preparaciones completas se pueden hacer?','8','Convertí primero los litros a mililitros.','2 L=2.000 mL; 2.000÷250=8.', ['8 preparaciones']);
  input('V610-M015','MAT-MED-CAP',3,'Un bidón tiene 5 L. Se llenan botellas de 600 mL. ¿Cuántas botellas completas se llenan?','8','Convertí 5 L a 5.000 mL y dividí por 600.','5.000÷600 da 8 botellas completas y sobran 200 mL.', ['8 botellas']);
  input('V610-M016','MAT-MED-TIEMPO',2,'Una clase comienza a las 14:25 y dura 1 hora y 40 minutos. ¿A qué hora termina?','16:05','Sumá primero una hora y luego cuarenta minutos.','14:25+1:40=16:05.', ['16.05']);
  input('V610-M017','MAT-MED-TIEMPO',3,'Un micro sale a las 8:50 y llega a las 11:35. ¿Cuánto dura el viaje?','2:45','Contá de 8:50 a 9:50, de 9:50 a 10:50 y luego hasta 11:35.','El viaje dura 2 horas y 45 minutos.', ['2 h 45 min','2 horas 45 minutos','2.45']);
  input('V610-M018','MAT-MED-TIEMPO',3,'Una película dura 1 h 55 min y empieza a las 19:20. ¿A qué hora termina?','21:15','Al sumar 55 minutos a 20 minutos se completa una hora.','19:20+1:55=21:15.', ['21.15']);

  // Geometría: variar conceptos y sumar una entrada de menor dificultad.
  choice('V610-M019','MAT-ANG',1,'¿Cuál de estas medidas corresponde a un ángulo agudo?',['45°','90°','120°','180°'],'45°','Un ángulo agudo mide menos de 90°.','45° es menor que 90°.');
  choice('V610-M020','MAT-ANG',2,'Dos ángulos complementarios suman 90°. Si uno mide 35°, ¿cuánto mide el otro?',['55°','45°','65°','125°'],'55°','Restá la medida conocida a 90°.','90°−35°=55°.');
  choice('V610-M021','MAT-ANG',3,'Dos ángulos suplementarios suman 180°. Si uno mide 128°, ¿cuánto mide el otro?',['52°','42°','62°','308°'],'52°','Restá la medida conocida a 180°.','180°−128°=52°.');
  choice('V610-M022','MAT-TRI',2,'Un triángulo tiene sus tres lados de igual longitud. ¿Cómo se clasifica?',['Equilátero','Isósceles','Escaleno','Rectángulo'],'Equilátero','La clasificación por lados se fija en cuántos lados son iguales.','Un triángulo equilátero tiene sus tres lados iguales.');
  choice('V610-M023','MAT-TRI',3,'Un triángulo tiene dos lados iguales y uno distinto. ¿Cómo se clasifica?',['Isósceles','Equilátero','Escaleno','Obtusángulo'],'Isósceles','Pensá en la clasificación según sus lados.','Un triángulo isósceles tiene exactamente dos lados iguales.');
  input('V610-M024','MAT-TRI',3,'En un triángulo, dos ángulos miden 48° y 67°. ¿Cuánto mide el tercer ángulo?','65','La suma de los ángulos interiores de un triángulo es 180°.','180°−48°−67°=65°.', ['65°']);
  choice('V610-M025','MAT-CUAD',2,'¿Qué cuadrilátero tiene un solo par de lados paralelos?',['Trapecio','Cuadrado','Rombo','Rectángulo'],'Trapecio','Compará la cantidad de pares de lados paralelos.','El trapecio tiene un único par de lados paralelos.');
  choice('V610-M026','MAT-CUAD',3,'¿Cuál es una propiedad que comparten rectángulos y cuadrados?',['Tienen cuatro ángulos rectos','Tienen los cuatro lados iguales','Tienen un solo par de lados paralelos','No tienen diagonales'],'Tienen cuatro ángulos rectos','Buscá una propiedad verdadera para ambas figuras.','Rectángulo y cuadrado tienen cuatro ángulos de 90°.');
  input('V610-M027','MAT-CUAD',3,'Un rectángulo mide 9 cm de largo y 4 cm de ancho. ¿Cuál es su perímetro?','26','Sumá los cuatro lados o usá 2×(largo+ancho).','2×(9+4)=26 cm.', ['26 cm']);

  // Orden y comparación, y medidas de masa: las últimas coberturas del banco que seguían muy bajas.
  choice('V610-M028','MAT-NAT-ORD',1,'¿Cuál es el número menor?',['73.405','73.450','74.035','74.305'],'73.405','Compará primero las decenas de mil y luego las centenas y unidades.','73.405 es menor que los demás números.');
  choice('V610-M029','MAT-NAT-ORD',2,'¿Cuál número está más cerca de 80.000?',['79.980','79.200','80.750','81.100'],'79.980','Observá la diferencia de cada número con 80.000.','79.980 está a sólo 20 unidades de 80.000.');
  input('V610-M030','MAT-NAT-ORD',3,'Ordená de mayor a menor: 408.099, 480.009 y 408.909. Escribí primero el mayor.','480009','Compará las decenas de mil antes de mirar las cifras finales.','480.009 es mayor que los dos números que comienzan con 408.', ['480.009']);
  input('V610-M031','MAT-MED-MASA',2,'Convertí 2 kg 450 g a gramos.','2450','Cada kilogramo equivale a 1.000 gramos.','2 kg son 2.000 g; 2.000+450=2.450 g.', ['2.450']);
  input('V610-M032','MAT-MED-MASA',3,'Una bolsa tiene 1,5 kg de harina y otra tiene 750 g. ¿Cuántos gramos pesan en total?','2250','Convertí primero 1,5 kg a gramos.','1,5 kg=1.500 g; 1.500+750=2.250 g.', ['2.250']);
  input('V610-M033','MAT-MED-MASA',3,'Se envasan 6 paquetes de 250 g de yerba. ¿Cuántos kilogramos de yerba se envasan en total?','1,5','Multiplicá la cantidad de paquetes por los gramos y luego convertí a kilogramos.','6×250=1.500 g, que equivalen a 1,5 kg.', ['1.5','1,5 kg']);

  if (EXTRA.length !== 33) console.warn(`[Banco V6.10] Se esperaban 33 actividades y se generaron ${EXTRA.length}.`);

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function ingresoV610BankFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const isBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
    if (!isBank) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      data.version = 10;
      data.ejercicios = [...(data.ejercicios || []), ...EXTRA.filter(e => !existing.has(e.id))];
      return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: { 'Content-Type':'application/json; charset=utf-8' } });
    } catch (error) {
      console.error('[Banco V6.10] No se pudo ampliar el banco', error);
      return response;
    }
  };
})();
