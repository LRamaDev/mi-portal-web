(() => {
  'use strict';
  // Variantes breves, originales y con un único resultado verificable.
  const rows = [
    // Matemática: profundizar habilidades con poca cobertura.
    ['MAT-PRIM', 'comun', 2, '¿Cuál es primo?', ['37','39','51','57'], '37', 'Probá dividir por 2, 3 y 5.', '37 solo tiene como divisores a 1 y 37.'],
    ['MAT-PRIM', 'comun', 3, '¿Cuál es compuesto?', ['49','41','43','47'], '49', 'Un compuesto tiene más de dos divisores.', '49 = 7 × 7.'],
    ['MAT-MED-LONG', 'comun', 2, '¿Cuántos centímetros hay en 2,5 metros?', ['250','25','2.500','0,25'], '250', 'Cada metro contiene 100 centímetros.', '2,5 × 100 = 250 cm.'],
    ['MAT-MED-LONG', 'comun', 3, 'Una cinta mide 3 m 40 cm. Si se cortan 85 cm, ¿cuánto queda?', ['255 cm','325 cm','425 cm','240 cm'], '255 cm', 'Convertí primero todo a centímetros.', '340 − 85 = 255 cm.'],
    ['MAT-SEX', 'belgrano', 2, '¿Cuánto es 84° − 39°?', ['45°','55°','43°','123°'], '45°', 'Restá los grados.', '84 − 39 = 45°.'],
    ['MAT-SEX', 'belgrano', 3, '¿Cuánto es 35° 40′ + 18° 35′?', ['54° 15′','53° 75′','54° 05′','52° 15′'], '54° 15′', '60 minutos forman un grado.', '75′ = 1° 15′; el total es 54° 15′.'],
    ['MAT-POL', 'belgrano', 2, 'Un polígono de cinco lados se llama…', ['pentágono','hexágono','heptágono','octógono'], 'pentágono', 'Contá sus cinco lados.', 'Penta- indica cinco.'],
    ['MAT-POL', 'belgrano', 3, '¿Cuántas diagonales tiene un cuadrilátero?', ['2','1','3','4'], '2', 'Uní cada par de vértices no consecutivos.', 'El cuadrilátero tiene dos diagonales.'],
    ['MAT-CIRC', 'monserrat', 2, 'Una circunferencia tiene radio 4 cm. ¿Cuánto mide su diámetro?', ['8 cm','4 cm','12 cm','16 cm'], '8 cm', 'El diámetro equivale a dos radios.', '2 × 4 = 8 cm.'],
    ['MAT-CIRC', 'monserrat', 3, 'Si el diámetro es 10 cm y π = 3,14, ¿cuál es la longitud de la circunferencia?', ['31,4 cm','15,7 cm','62,8 cm','13,14 cm'], '31,4 cm', 'Longitud = π × diámetro.', '3,14 × 10 = 31,4 cm.'],
    ['MAT-ANG-CS', 'comun', 2, 'Un ángulo mide 68°. ¿Cuánto mide su complementario?', ['22°','112°','32°','158°'], '22°', 'Los complementarios suman 90°.', '90 − 68 = 22°.'],
    ['MAT-ANG-CS', 'comun', 3, 'Un ángulo mide 115°. ¿Cuánto mide su suplementario?', ['65°','75°','25°','245°'], '65°', 'Los suplementarios suman 180°.', '180 − 115 = 65°.'],
    ['MAT-GRAF', 'monserrat', 2, 'Una tabla registra lunes: 12, martes: 18, miércoles: 15 libros. ¿Qué día hubo más préstamos?', ['Martes','Lunes','Miércoles','Los tres igual'], 'Martes', 'Compará las cantidades.', '18 es la mayor cantidad.'],
    ['MAT-NAT-POS', 'monserrat', 2, 'En 706.214, ¿cuánto vale el 6?', ['6.000','600','60.000','6'], '6.000', 'Ubicá la cifra de los miles.', 'El 6 ocupa el lugar de las unidades de mil.'],
    ['MAT-FR-DEC', 'monserrat', 2, '¿Qué decimal equivale a 1/4?', ['0,25','0,4','0,75','1,4'], '0,25', 'Dividí 1 por 4.', '1/4 = 0,25.'],
    ['MAT-MED-CAP', 'comun', 2, '¿Cuántos mililitros hay en medio litro?', ['500','50','1.500','5.000'], '500', 'Un litro son 1.000 mL.', 'La mitad de 1.000 es 500 mL.'],
    ['MAT-MED-TIEMPO', 'comun', 2, 'Una actividad empieza 10:45 y dura 30 minutos. ¿Cuándo termina?', ['11:15','10:75','11:45','10:15'], '11:15', 'Sumá quince minutos hasta las 11 y otros quince.', 'Termina a las 11:15.'],
    ['MAT-GEO-ESP', 'comun', 2, '¿Cuántas caras tiene un cubo?', ['6','4','8','12'], '6', 'Pensá en un dado.', 'Un cubo tiene seis caras cuadradas.'],
    // Lengua: comprensión, gramática, ortografía y revisión en formatos breves.
    ['LEN-BV', 'comun', 2, '¿Cuál palabra está escrita correctamente?', ['biblioteca','vivlioteca','bivlioteca','bibloteca'], 'biblioteca', 'Recordá cómo se escribe el inicio biblio-.', 'Biblioteca se escribe con b al comienzo.'],
    ['LEN-BV', 'comun', 3, 'Completá: «Ayer ___ una reunión».', ['tuvo','tubo','tuvó','tubó'], 'tuvo', 'Es una forma del verbo tener.', 'El verbo tener en pasado se escribe tuvo.'],
    ['LEN-CSZ', 'comun', 2, '¿Cuál es el plural de «luz»?', ['luces','luzes','luses','luzs'], 'luces', 'La z cambia a c antes de -es.', 'Luz forma el plural luces.'],
    ['LEN-GJ', 'comun', 2, '¿Cuál opción completa «El ___ cruzó el puente»?', ['viajero','viagero','vijero','biagero'], 'viajero', 'La terminación -jero se escribe con j.', 'Viajero se escribe con j.'],
    ['LEN-PARON', 'belgrano', 2, 'Para indicar capacidad de dibujar, elegí la palabra correcta.', ['aptitud','actitud','altitud','exactitud'], 'aptitud', 'Aptitud significa capacidad.', 'Tiene aptitud para el dibujo.'],
    ['LEN-PYC', 'monserrat', 3, '¿Dónde corresponde el punto y coma?', ['Traje lápices, goma y regla; Ana, cuadernos y hojas.','Traje; lápices, goma y regla.','Traje lápices; goma y regla.','Traje lápices, goma; y regla.'], 'Traje lápices, goma y regla; Ana, cuadernos y hojas.', 'Separa dos grupos que ya tienen comas.', 'El punto y coma ayuda a separar dos enumeraciones.'],
    ['LEN-REF', 'belgrano', 2, '«Sofía perdió su gorra. La encontró bajo el banco». ¿Qué encontró?', ['La gorra','A Sofía','El banco','Una llave'], 'La gorra', 'El pronombre la reemplaza un nombre femenino singular.', 'La reemplaza a gorra.'],
    ['LEN-SUST', 'comun', 2, 'En «la alegría se contagia», ¿cuál es el sustantivo abstracto?', ['alegría','contagia','la','se'], 'alegría', 'Nombra un sentimiento.', 'Alegría es un sustantivo abstracto.'],
    ['LEN-ADJ', 'comun', 2, 'Completá: «Las mochilas son ___».', ['livianas','liviano','livianos','liviana'], 'livianas', 'Concordá género y número.', 'Mochilas es femenino plural: livianas.'],
    ['LEN-ART', 'comun', 2, '¿Cuál es el artículo en «Un pájaro cantó»?', ['Un','pájaro','cantó','No hay artículo'], 'Un', 'El artículo acompaña al sustantivo.', 'Un acompaña a pájaro.'],
    ['LEN-UNI-BI', 'belgrano', 2, '¿Cuál oración es unimembre?', ['Hay niebla.','La niebla cubrió el camino.','Los chicos caminaron.','La tarde terminó.'], 'Hay niebla.', 'No se puede separar en sujeto y predicado.', 'Hay niebla es una oración impersonal unimembre.'],
    ['LEN-UNI-BI', 'belgrano', 3, '¿Cuál oración es bimembre?', ['Las estrellas brillan.','Llueve mucho.','¡Qué sorpresa!','Hay viento.'], 'Las estrellas brillan.', 'Buscá sujeto y predicado.', 'Las estrellas es el sujeto y brillan el predicado.'],
    ['LEN-DIP-HIA', 'monserrat', 2, '¿En cuál palabra hay hiato?', ['país','cielo','puerta','causa'], 'país', 'Las vocales pertenecen a sílabas distintas.', 'Pa-ís tiene hiato.'],
    ['LEN-RR', 'monserrat', 2, 'Completá: «El ___ rojo estacionó».', ['carro','caro','carró','cárro'], 'carro', 'Entre vocales el sonido fuerte usa rr.', 'Carro se escribe con rr.'],
    ['LEN-PUNT', 'comun', 2, '¿Cuál oración separa correctamente dos ideas?', ['Llegó temprano. Esperó en la puerta.','Llegó temprano Esperó en la puerta.','Llegó. temprano esperó en la puerta.','Llegó temprano esperó. en la puerta.'], 'Llegó temprano. Esperó en la puerta.', 'El punto separa oraciones completas.', 'Hay dos oraciones y cada una comienza con mayúscula.'],
    ['LEN-REV', 'monserrat', 2, '¿Qué corrección evita la repetición en «Lola tomó el libro. Lola abrió el libro»?', ['Lola tomó el libro y lo abrió.','Lola tomó el libro. Lola abrió el libro.','Lola tomó y libro abrió.','Lola libro libro abrió.'], 'Lola tomó el libro y lo abrió.', 'Usá un pronombre para reemplazar libro.', 'Lo reemplaza a libro sin repetirlo.'],
    ['LEN-COMP-INF', 'comun', 2, '«Bruno guardó el paraguas mojado y se quitó las botas». ¿Qué pudo haber pasado?', ['Llovió','Nevó en el aula','Perdió el paraguas','Se fue a dormir'], 'Llovió', 'Relacioná dos pistas del texto.', 'El paraguas mojado y las botas sugieren lluvia.'],
    ['LEN-CON', 'comun', 2, '«Estaba cansada; ___, terminó la tarea». Elegí el conector.', ['sin embargo','por eso','porque','además'], 'sin embargo', 'La segunda parte contrasta con la primera.', 'Sin embargo introduce una oposición.'],
    ['LEN-VERB', 'comun', 2, '¿Cuál verbo está en pasado?', ['jugamos ayer','jugaremos mañana','jugaremos luego','jugá ahora'], 'jugamos ayer', 'La palabra ayer sitúa la acción antes del presente.', 'Jugamos ayer expresa una acción pasada.'],
    ['LEN-SUJ-PRED', 'monserrat', 2, 'En «Los perros del parque ladraron», ¿cuál es el núcleo del sujeto?', ['perros','parque','ladraron','Los'], 'perros', 'El núcleo es el sustantivo principal del sujeto.', 'Perros es el núcleo de Los perros del parque.'],
    ['LEN-PROD', 'monserrat', 2, 'En una sola oración, contá qué problema aparece cuando una niña encuentra una llave sin dueño.', null, null, 'Pensá qué quiere hacer con la llave y qué le impide lograrlo.', 'Una complicación cambia la situación inicial.'],
    ['LEN-PROD', 'monserrat', 3, 'Escribí un párrafo breve: una mascota desaparece y vuelve gracias a una pista. Incluí problema y resolución.', null, null, 'Podés usar tres oraciones: inicio, problema y solución.', 'Un párrafo breve permite practicar la estructura narrativa.'],
    ['LEN-REV', 'monserrat', 2, 'Escribí una oración sobre una salida y revisá la mayúscula inicial, la concordancia y el punto final.', null, null, 'Leela en voz baja antes de revisar.', 'Revisar una oración entrena la corrección sin exigir un texto largo.']
  ];
  const extra = rows.map((r, i) => {
    const [habilidad, colegio, dificultad, consigna, opciones, respuesta, pista, explicacion] = r;
    const area = habilidad.startsWith('MAT-') ? 'matematica' : 'lengua';
    return opciones ? {id:`V611-${String(i+1).padStart(3,'0')}`,area,habilidad,colegios:[colegio],dificultad,tipo:'choice',consigna,opciones,respuesta,pista,explicacion}
      : {id:`V611-${String(i+1).padStart(3,'0')}`,area,habilidad,colegios:[colegio],dificultad,tipo:'selfcheck',consigna,criterios:habilidad==='LEN-REV' ? ['Escribí una sola oración','Comienza con mayúscula','El sujeto y el verbo concuerdan','Termina con punto'] : ['Escribí una oración o un párrafo breve','La idea se entiende','Incluí el elemento pedido','Revisé mayúsculas y puntuación'],pista,explicacion,papel:true};
  });

  const previousFetch = window.fetch.bind(window);
  window.fetch = async function ingresoV611BankFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url !== './data/ejercicios.json' && !url.endsWith('/data/ejercicios.json')) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const current = data.ejercicios || [];
      // Las consignas heredadas también aparecen en simulacros: la etapa actual prioriza
      // un paso pequeño de escritura. Conservamos el ID y el progreso previo.
      for (const e of current) {
        if (e.tipo !== 'selfcheck') continue;
        if (/renglones/i.test(e.consigna)) {
          e.consigna = e.consigna.replace(/una narración de \d+\s*(?:a|-|y)\s*\d+\s*renglones/gi, 'un párrafo breve de hasta cuatro oraciones').replace(/(?:entre |en |de )?\d+\s*(?:a|-|y)\s*\d+\s*renglones/gi, 'un párrafo breve de hasta cuatro oraciones').replace(/continuá (esta situación )?un párrafo breve/gi, 'continuá $1en un párrafo breve').replace(/narrá un párrafo breve/gi, 'contá en un párrafo breve');
          e.criterios = e.criterios.map(c => /renglones/i.test(c) ? 'Escribí hasta cuatro oraciones en un párrafo breve' : /agregué un título/i.test(c) ? 'La primera oración presenta la situación' : c);
        }
        if (e.habilidad === 'LEN-REV') e.consigna = e.consigna.replace(/una producción que hayas escrito hoy|un texto narrativo que hayas escrito hoy|una narración breve propia/gi, 'una oración o un párrafo breve que hayas escrito hoy').replace(/Escribí un párrafo breve de hasta cuatro oraciones sobre una situación inesperada y luego hacé una segunda versión corregida/i, 'Escribí un párrafo breve de hasta cuatro oraciones sobre una situación inesperada y revisalo');
        if (e.id === 'V4-L057') e.consigna = 'Revisá una oración o un párrafo breve que hayas escrito hoy. Corregí lo necesario en el mismo texto.';
        if (e.id === 'V4-L058') e.consigna = 'Revisá una oración o un párrafo breve que hayas escrito hoy: hacela más clara y evitá repeticiones.';
        if (e.id === 'V6-L039') e.criterios[e.criterios.length - 1] = 'La idea central se entiende con claridad';
        if (e.id === 'V6-L040') {
          e.consigna = e.consigna.replace('Marcá los criterios cumplidos en la versión final.', 'Marcá los criterios después de revisarlo.');
          e.criterios[0] = 'El párrafo se entiende mejor después de revisarlo';
        }
      }
      const repeated = current.find(e => e.id === 'V4-L042');
      if (repeated) repeated.opciones = ['tuvo','tubo','tubó','tuvó'];
      const ambiguous = current.find(e => e.id === 'V610-M008');
      if (ambiguous) ambiguous.consigna = 'En una fila se forman grupos de 8 sin que sobre nadie. Hay más de 40 y menos de 50 estudiantes. ¿Cuál es el total?';
      const ids = new Set(current.map(e => e.id));
      data.version = 11;
      data.ejercicios = [...current, ...extra.filter(e => !ids.has(e.id))];
      return new Response(JSON.stringify(data), {status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json; charset=utf-8'}});
    } catch (error) {
      console.error('[Banco V6.11] No se pudo actualizar el banco', error);
      return response;
    }
  };
})();
