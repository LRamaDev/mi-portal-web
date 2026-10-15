(() => {
  'use strict';

  // Actividades propuestas por la familia. Se muestran para ambos ingresos
  // mediante la habilidad común MAT-FR-ORD.
  const topic = 'Comparación y orden de fracciones';
  const rows = [
    {
      id: 'FRAC-ORD-001', dificultad: 1, subhabilidad: 'Igual denominador',
      consigna: 'Tomás y Sofía compraron alfajores iguales. Tomás comió 5/8 del suyo y Sofía, 3/8. ¿Quién comió más?',
      opciones: ['Tomás', 'Sofía', 'Comieron lo mismo', 'No se puede saber sin conocer el peso'], respuesta: 'Tomás',
      pista: 'Los dos alfajores tienen el mismo tamaño y están divididos en ocho partes iguales.',
      explicacion: 'Con igual denominador se comparan los numeradores: 5 > 3. Entonces 5/8 > 3/8.',
      errorFrecuente: 'Pensar que hace falta conocer el peso, aunque los alfajores son iguales.'
    },
    {
      id: 'FRAC-ORD-002', dificultad: 1, subhabilidad: 'Comparación con la unidad',
      consigna: '¿Cuál de estas fracciones es estrictamente mayor que 1?',
      opciones: ['4/5', '7/6', '9/9', '3/4'], respuesta: '7/6',
      pista: 'Para superar una unidad, el numerador debe ser mayor que el denominador.',
      explicacion: '7 > 6, así que 7/6 = 1 + 1/6. En cambio, 9/9 = 1 y las otras dos fracciones son menores que 1.',
      errorFrecuente: 'Creer que 9/9 es mayor que 1, cuando equivale exactamente a una unidad.'
    },
    {
      id: 'FRAC-ORD-003', dificultad: 1, subhabilidad: 'Igual numerador',
      consigna: 'Los frascos A, B y C contienen 2/3 kg, 2/5 kg y 2/4 kg de harina, respectivamente. ¿Cuál tiene más y por qué?',
      opciones: ['A: dos tercios son mayores porque cada tercio es una parte más grande', 'B: dos quintos son mayores porque 5 es el denominador más grande', 'C: dos cuartos son mayores porque 4 queda entre 3 y 5', 'Los tres tienen la misma cantidad porque el numerador es 2'],
      respuesta: 'A: dos tercios son mayores porque cada tercio es una parte más grande',
      pista: 'Si repartís lo mismo entre menos partes, cada parte resulta más grande.',
      explicacion: 'Con igual numerador, la fracción de menor denominador es mayor: 2/3 > 2/4 > 2/5.',
      errorFrecuente: 'Elegir 2/5 porque su denominador es el número más grande.',
      ajusteFormato: 'La respuesta escrita breve se presenta como elección de una justificación para poder corregirla de forma fiable.'
    },
    {
      id: 'FRAC-ORD-004', dificultad: 1, subhabilidad: 'Denominador común simple',
      consigna: 'Completá la comparación: 3/5 [ __ ] 7/10.',
      opciones: ['>', '<', '='], respuesta: '<',
      pista: 'Convertí 3/5 en décimos multiplicando el numerador y el denominador por 2.',
      explicacion: '3/5 = 6/10 y 6/10 < 7/10. Por eso corresponde el símbolo <.',
      errorFrecuente: 'Comparar numeradores y denominadores por separado sin expresar partes del mismo tamaño.'
    },
    {
      id: 'FRAC-ORD-005', dificultad: 2, subhabilidad: 'Orden con denominador común',
      consigna: '¿Cómo se ordenan de menor a mayor 2/3, 3/4 y 7/12?',
      opciones: ['7/12 < 2/3 < 3/4', '2/3 < 3/4 < 7/12', '3/4 < 2/3 < 7/12', '7/12 < 3/4 < 2/3'],
      respuesta: '7/12 < 2/3 < 3/4',
      pista: 'Llevá las tres fracciones a doceavos.',
      explicacion: '7/12, 2/3 = 8/12 y 3/4 = 9/12. Como 7 < 8 < 9, ese es el orden ascendente.',
      errorFrecuente: 'Ordenar por el tamaño de los denominadores sin comparar las fracciones equivalentes.'
    },
    {
      id: 'FRAC-ORD-006', dificultad: 2, subhabilidad: 'Comparación en un contexto',
      consigna: 'Lucía, Camila y Martina usaron 5/6, 3/4 y 7/8 de latas de pintura idénticas. ¿Quién usó más y quién menos?',
      opciones: ['Más Martina; menos Camila', 'Más Lucía; menos Martina', 'Más Camila; menos Lucía', 'Más Martina; menos Lucía'],
      respuesta: 'Más Martina; menos Camila',
      pista: 'Convertí las tres fracciones a partes de 24 para compararlas.',
      explicacion: '5/6 = 20/24, 3/4 = 18/24 y 7/8 = 21/24. Martina usó más y Camila menos.',
      errorFrecuente: 'Comparar la pintura que queda en vez de la pintura usada.',
      ajusteFuente: 'Se corrigió “catorceavos” por “partes de 24” en la pista original.'
    },
    {
      id: 'FRAC-ORD-007', dificultad: 2, subhabilidad: 'Fracciones entre dos valores',
      consigna: '«Entre 2/5 y 4/5 solo existe una fracción: 3/5». ¿Es verdadero o falso? Elegí una justificación.',
      opciones: ['Falso: también están 5/10 y 7/10, entre muchas otras', 'Verdadero: 3 es el único entero entre 2 y 4', 'Falso: 1/5 también está entre esas fracciones', 'Verdadero: todas las fracciones entre ellas deben tener denominador 5'],
      respuesta: 'Falso: también están 5/10 y 7/10, entre muchas otras',
      pista: 'Expresá 2/5 y 4/5 en décimos: ¿cuántas fracciones quedan entre 4/10 y 8/10?',
      explicacion: '2/5 = 4/10 y 4/5 = 8/10. Entre ellas están 5/10, 6/10 y 7/10; se pueden hallar infinitas.',
      errorFrecuente: 'Mirar solo los numeradores enteros cuando se conserva el denominador 5.'
    },
    {
      id: 'FRAC-ORD-008', dificultad: 2, subhabilidad: 'Distancia a la unidad',
      consigna: 'En una carrera de atletismo, Mateo recorrió 11/12 del circuito y Valentín 14/15. ¿Quién está más cerca de la meta?',
      opciones: ['Mateo', 'Valentín', 'Van exactamente iguales', 'No se puede determinar'], respuesta: 'Valentín',
      pista: 'Calculá qué parte del circuito le falta recorrer a cada uno.',
      explicacion: 'A Mateo le falta 1/12 y a Valentín 1/15. Como 1/15 < 1/12, Valentín está más cerca.',
      errorFrecuente: 'Confundir la parte que falta con la parte recorrida.'
    },
    {
      id: 'FRAC-ORD-009', dificultad: 4, subhabilidad: 'Orden con dato complementario',
      consigna: 'Agustín leyó 3/5 de un libro, a Bianca le falta 3/10 y Camilo leyó 5/8. ¿Cuál es el orden de mayor a menor cantidad leída?',
      opciones: ['Bianca > Camilo > Agustín', 'Camilo > Agustín > Bianca', 'Agustín > Camilo > Bianca', 'Bianca > Agustín > Camilo'],
      respuesta: 'Bianca > Camilo > Agustín',
      pista: 'El dato de Bianca indica lo que le falta: calculá primero cuánto leyó.',
      explicacion: 'Bianca leyó 7/10 = 28/40; Camilo, 5/8 = 25/40; Agustín, 3/5 = 24/40. Entonces Bianca > Camilo > Agustín.',
      errorFrecuente: 'Tomar 3/10 como la fracción leída por Bianca.'
    },
    {
      id: 'FRAC-ORD-010', dificultad: 4, subhabilidad: 'Intercalación e irreductibilidad', tipo: 'input',
      consigna: 'Escribí una fracción irreducible estrictamente entre 3/7 y 4/7. Hacé el procedimiento en tu cuaderno.',
      respuesta: '1/2',
      respuestaRacionalEntre: { mayorQue: [3, 7], menorQue: [4, 7], irreducible: true },
      pista: 'Amplificá ambas fracciones para abrir un espacio entre los numeradores; después simplificá.',
      explicacion: '3/7 = 6/14 y 4/7 = 8/14. Entre ellas está 7/14, que se simplifica a 1/2. También vale, por ejemplo, 13/28, que es otra fracción irreducible dentro del intervalo.',
      errorFrecuente: 'Escribir 7/14 sin simplificar o creer que no hay fracciones entre esos extremos.',
      ajusteFuente: '13/28 es otra respuesta válida, pero no es equivalente a 1/2.'
    },
    {
      id: 'FRAC-ORD-011', dificultad: 4, subhabilidad: 'Proporción frente a cantidad absoluta',
      consigna: 'El grupo A ordenó 3/4 de una caja de 40 libros; el grupo B, 1/2 de una caja de 100. «A ordenó más porque 3/4 > 1/2». ¿Es correcto?',
      opciones: ['No: A ordenó 30 libros y B, 50; los totales de las cajas son distintos', 'Sí: 3/4 es mayor que 1/2, sin importar el tamaño de cada caja', 'No: A ordenó 40 libros y B, 100', 'Sí: A ordenó 75 libros y B, 50'],
      respuesta: 'No: A ordenó 30 libros y B, 50; los totales de las cajas son distintos',
      pista: 'Calculá por separado 3/4 de 40 y 1/2 de 100.',
      explicacion: '3/4 de 40 = 30; 1/2 de 100 = 50. La fracción mayor corresponde a una caja menor: por eso B ordenó más libros.',
      errorFrecuente: 'Comparar solo las fracciones y olvidar que las cajas tienen diferentes cantidades de libros.'
    },
    {
      id: 'FRAC-ORD-012', dificultad: 4, subhabilidad: 'Orden de representaciones racionales',
      consigna: 'A = 7/4, B = 1 + 2/3, C = 12/8 y D = 1,8. ¿Cuál es el orden de menor a mayor?',
      opciones: ['C < B < A < D', 'B < C < A < D', 'C < A < B < D', 'D < A < B < C'],
      respuesta: 'C < B < A < D',
      pista: 'Convertí cada expresión a un número decimal; 12/8 se puede simplificar a 3/2.',
      explicacion: 'C = 1,5; B = 1,666…; A = 1,75; D = 1,8. Entonces C < B < A < D.',
      errorFrecuente: 'Leer 1,8 como 1,08 o calcular mal 1 + 2/3.'
    }
  ];

  const criteria = [
    'Compara correctamente fracciones de igual denominador.',
    'Distingue fracciones mayores, menores e iguales a la unidad.',
    'Justifica cuál fracción es mayor cuando los numeradores son iguales.',
    'Usa una fracción equivalente para comparar denominadores distintos.',
    'Establece el orden ascendente mediante un denominador común.',
    'Interpreta las cantidades usadas y compara fracciones de un mismo entero.',
    'Reconoce que existen muchas fracciones entre dos fracciones dadas.',
    'Compara las partes faltantes para determinar la cercanía a la unidad.',
    'Calcula el complemento y ordena tres fracciones de mayor a menor.',
    'Intercala una fracción y la escribe en forma irreducible.',
    'Distingue proporción de cantidad absoluta cuando cambian los enteros.',
    'Ordena fracciones y decimales expresados de distintas maneras.'
  ];

  const EXTRA = rows.map((row, index) => ({
    area: 'matematica', habilidad: 'MAT-FR-ORD', colegios: ['comun'],
    tipo: 'choice', papel: true, tema: topic, criterioEvaluacion: criteria[index],
    fuente: 'Propuesta pedagógica aportada por la familia', ...row
  }));
  const previousFetch = window.fetch.bind(window);
  window.fetch = async function fractionsOrderBankFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url !== './data/ejercicios.json' && !url.endsWith('/data/ejercicios.json')) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const data = await response.clone().json();
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      data.ejercicios = [...(data.ejercicios || []), ...EXTRA.filter(e => !existing.has(e.id))];
      return new Response(JSON.stringify(data), {
        status: response.status, statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('[Banco de fracciones] No se pudo ampliar el banco', error);
      return response;
    }
  };
})();
