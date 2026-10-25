"use strict";
/*
 * NeuroMisión v3.4 — 50 consignas revisadas.
 * Se carga DESPUÉS de app-v2.js y ANTES de app-v3.js.
 * No renumera los 76 ejercicios existentes ni altera IDs de partidas guardadas.
 * Las etiquetas difficulty son documentales; la selección actual sigue siendo aleatoria.
 * Las opciones[0] son correctas; el motor aleatoriza el orden mostrado.
 */
const NEUROMISION_34_NEW = [
  [
    {
      "type": "choice",
      "q": "Si una persona se lastima un nervio del brazo, ¿qué comunicación podría verse afectada?",
      "options": [
        "La comunicación entre el brazo y el sistema nervioso central",
        "Solo el movimiento, porque ninguna vía periférica transmite sensibilidad",
        "Solo la sensibilidad, porque ninguna vía periférica lleva órdenes a músculos",
        "El procesamiento cerebral, sin afectar el traslado de señales por el brazo"
      ],
      "answer": 0,
      "hint": "Los nervios conectan el sistema nervioso central con el resto del cuerpo.",
      "note": "Los nervios periféricos transportan información sensitiva y motora entre el cuerpo y el sistema nervioso central.",
      "id": "m0-v34-01",
      "difficulty": "básico"
    },
    {
      "type": "choice",
      "q": "Cuando escribís una nota, ¿qué recorrido general ayuda a mover la mano voluntariamente?",
      "options": [
        "El sistema central organiza el movimiento y los nervios llevan señales hacia los músculos",
        "Los nervios periféricos organizan por sí solos qué palabras vas a escribir",
        "Los músculos de los dedos deciden qué letras formar sin recibir órdenes nerviosas",
        "Los receptores visuales envían órdenes directas a los dedos sin pasar por centros nerviosos"
      ],
      "answer": 0,
      "hint": "Pensá quién organiza la acción y por dónde viajan las órdenes hacia la mano.",
      "note": "El sistema nervioso central participa en planificar la escritura y las vías motoras conducen señales hacia los músculos de la mano.",
      "id": "m0-v34-02",
      "difficulty": "intermedio"
    },
    {
      "type": "choice",
      "q": "¿Qué afirmación distingue correctamente al sistema nervioso central del periférico?",
      "options": [
        "El central incluye encéfalo y médula; el periférico incluye los nervios que los conectan con el cuerpo",
        "El central incluye nervios de brazos y piernas; el periférico, el encéfalo",
        "El central incluye solo el cerebro; la médula es siempre periférica",
        "El periférico incluye la médula espinal; el central, los nervios de la piel"
      ],
      "answer": 0,
      "hint": "Recordá qué estructuras están protegidas por el cráneo y las vértebras.",
      "note": "El sistema nervioso central comprende encéfalo y médula espinal; el periférico comprende nervios y ganglios.",
      "id": "m0-v34-03",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Relacioná cada situación con la estructura que interviene especialmente.",
      "left": [
        "Mantener el equilibrio al caminar",
        "Decidir responder una pregunta",
        "Conducir señales entre encéfalo y cuerpo",
        "Enviar señales hacia músculos del brazo"
      ],
      "right": [
        "Cerebelo",
        "Cerebro",
        "Médula espinal",
        "Nervios periféricos"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Pensá qué estructura coordina, cuál participa en decisiones y cuáles comunican señales.",
      "note": "Cerebro, cerebelo, médula y nervios cumplen funciones complementarias en la vida cotidiana.",
      "id": "m0-v34-04",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Relacioná cada situación con la dirección de la información nerviosa.",
      "left": [
        "Sentís frío en una mano",
        "Movés una pierna para patear",
        "Notás una piedra dentro del zapato",
        "Girás el cuello para saludar"
      ],
      "right": [
        "Sensitiva: desde la mano hacia el sistema central",
        "Motora: desde el sistema central hacia la pierna",
        "Sensitiva: desde el pie hacia el sistema central",
        "Motora: desde el sistema central hacia el cuello"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Una señal sensitiva informa sobre el cuerpo; una motora dirige el movimiento.",
      "note": "Las vías sensitivas llevan información hacia el sistema nervioso central; las motoras llevan señales a los músculos.",
      "id": "m0-v34-05",
      "difficulty": "desafío"
    },
    {
      "type": "classify",
      "q": "Clasificá estas estructuras según dónde se encuentran.",
      "buckets": [
        "Dentro del cráneo",
        "En el interior de la columna vertebral",
        "En otras regiones del cuerpo"
      ],
      "items": [
        [
          "Cerebro",
          0
        ],
        [
          "Cerebelo",
          0
        ],
        [
          "Médula espinal",
          1
        ],
        [
          "Nervios de la mano",
          2
        ],
        [
          "Nervios del pie",
          2
        ]
      ],
      "hint": "Pensá qué estructuras están protegidas por huesos del cráneo y cuáles recorren el cuerpo.",
      "note": "El encéfalo está protegido por el cráneo, la médula por la columna y muchos nervios periféricos recorren otras regiones.",
      "id": "m0-v34-06",
      "difficulty": "intermedio"
    },
    {
      "type": "classify",
      "q": "¿La descripción corresponde a una estructura central o periférica?",
      "buckets": [
        "Central",
        "Periférica"
      ],
      "items": [
        [
          "Estructura que integra información dentro del encéfalo",
          0
        ],
        [
          "Nervio que lleva señales desde la piel del brazo",
          1
        ],
        [
          "Médula que participa en algunos reflejos",
          0
        ],
        [
          "Nervio que conduce órdenes hacia un músculo de la pierna",
          1
        ]
      ],
      "hint": "Diferenciá dónde se procesa parte de la información y por dónde viajan señales hacia o desde el cuerpo.",
      "note": "Los centros nerviosos y los nervios periféricos realizan tareas complementarias.",
      "id": "m0-v34-07",
      "difficulty": "intermedio"
    },
    {
      "type": "order",
      "q": "Ordená lo que ocurre cuando ves caer un vaso e intentás agarrarlo.",
      "steps": [
        "La luz reflejada por el vaso llega a los ojos",
        "Las señales visuales llegan al encéfalo",
        "El encéfalo organiza una respuesta voluntaria",
        "Las señales motoras viajan hacia los músculos",
        "Los músculos mueven el brazo"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Primero detectás el vaso; después se organiza y ejecuta un movimiento.",
      "note": "En una acción voluntaria, la información sensorial se procesa y se coordina una respuesta motora.",
      "id": "m0-v34-08",
      "difficulty": "intermedio"
    },
    {
      "type": "order",
      "q": "Ordená el recorrido simplificado al escuchar un timbre y caminar hacia la puerta.",
      "steps": [
        "El timbre produce sonido",
        "El oído detecta el sonido",
        "La información llega al sistema nervioso central",
        "Decidís acercarte a la puerta",
        "Los músculos ejecutan el movimiento"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Una cosa es captar el sonido y otra decidir qué hacer con esa información.",
      "note": "La percepción y la acción voluntaria requieren comunicación entre receptores, centros nerviosos y músculos.",
      "id": "m0-v34-09",
      "difficulty": "intermedio"
    },
    {
      "type": "point",
      "diagram": "human",
      "target": "cerebelo",
      "q": "Tocá la estructura que ayuda a coordinar los movimientos para mantener el equilibrio.",
      "hint": "Está detrás y debajo de otras partes del encéfalo.",
      "note": "El cerebelo contribuye a ajustar movimientos, postura y equilibrio.",
      "id": "m0-v34-10",
      "difficulty": "básico"
    }
  ],
  [
    {
      "type": "choice",
      "q": "¿Qué diferencia hay entre un impulso por el axón y la transmisión en una sinapsis química?",
      "options": [
        "En el axón se propaga un impulso eléctrico; en la sinapsis química se liberan neurotransmisores",
        "En el axón se liberan olores y la sinapsis fabrica mielina",
        "Ambos procesos dependen de que el núcleo salga de la célula",
        "La sinapsis química es únicamente el recubrimiento del axón"
      ],
      "answer": 0,
      "hint": "Compará cómo avanza una señal por el axón y cómo pasa información a otra célula.",
      "note": "El impulso nervioso se propaga por la membrana del axón y muchas sinapsis usan neurotransmisores para comunicar células.",
      "id": "m1-v34-01",
      "difficulty": "desafío"
    },
    {
      "type": "choice",
      "q": "¿Qué ocurre, de forma simplificada, en una sinapsis química?",
      "options": [
        "Una neurona puede liberar neurotransmisores que llevan información a otra célula",
        "La información se comunica únicamente cuando los núcleos de dos neuronas se tocan",
        "Las terminales solo reciben señales luminosas, nunca liberan sustancias",
        "La mielina funciona como neurotransmisor entre células"
      ],
      "answer": 0,
      "hint": "Pensá en la comunicación entre células.",
      "note": "En muchas sinapsis, una neurona libera neurotransmisores que actúan sobre otra célula.",
      "id": "m1-v34-02",
      "difficulty": "intermedio"
    },
    {
      "type": "choice",
      "q": "¿Por qué un axón puede transmitir señales hacia zonas alejadas del cuerpo celular?",
      "options": [
        "Porque propaga impulsos nerviosos a lo largo de su membrana",
        "Porque la mielina produce impulsos sin que participe la membrana del axón",
        "Porque las dendritas conducen todas las señales hasta la otra punta del axón",
        "Porque el núcleo de la neurona se desplaza por el axón llevando cada mensaje"
      ],
      "answer": 0,
      "hint": "El axón es una prolongación especializada para la conducción de impulsos.",
      "note": "La membrana del axón permite que se propaguen impulsos nerviosos hasta sus terminaciones.",
      "id": "m1-v34-03",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Relacioná cada pregunta sobre el funcionamiento neuronal con su estructura.",
      "left": [
        "¿Dónde está el material genético?",
        "¿Qué región participa en integrar señales?",
        "¿Qué prolongación conduce impulsos?",
        "¿Dónde puede liberarse un neurotransmisor?"
      ],
      "right": [
        "Núcleo",
        "Cuerpo celular o soma",
        "Axón",
        "Terminales del axón"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Pensá en el núcleo, el soma y las partes que comunican señales.",
      "note": "Núcleo, soma, axón y terminales cumplen funciones diferentes en la célula nerviosa.",
      "id": "m1-v34-04",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Uní cada parte neuronal con una descripción correcta.",
      "left": [
        "Núcleo",
        "Mielina",
        "Axón",
        "Terminales"
      ],
      "right": [
        "Contiene material genético",
        "Recubrimiento que facilita la propagación del impulso en muchos axones",
        "Prolongación que conduce el impulso nervioso",
        "Extremos que participan en la comunicación con otras células"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Observá qué hay dentro del soma y qué estructuras aparecen a lo largo del axón.",
      "note": "El núcleo, la mielina, el axón y las terminales cumplen funciones distintas.",
      "id": "m1-v34-05",
      "difficulty": "intermedio"
    },
    {
      "type": "classify",
      "q": "Clasificá las partes según su participación más característica.",
      "buckets": [
        "Recepción",
        "Conducción del impulso",
        "Facilita la conducción",
        "Comunicación sináptica"
      ],
      "items": [
        [
          "Dendritas",
          0
        ],
        [
          "Axón",
          1
        ],
        [
          "Vaina de mielina",
          2
        ],
        [
          "Terminales del axón",
          3
        ]
      ],
      "hint": "Una cosa es conducir el impulso y otra es facilitar que viaje más rápido.",
      "note": "En el modelo escolar, las dendritas reciben señales, el axón conduce, la mielina facilita y las terminales participan en sinapsis.",
      "id": "m1-v34-06",
      "difficulty": "desafío"
    },
    {
      "type": "classify",
      "q": "¿Estas estructuras forman parte del soma o se extienden fuera de él?",
      "buckets": [
        "Dentro del soma",
        "Se extiende fuera del soma"
      ],
      "items": [
        [
          "Núcleo de la neurona",
          0
        ],
        [
          "Axón",
          1
        ],
        [
          "Citoplasma del cuerpo celular",
          0
        ],
        [
          "Dendritas",
          1
        ]
      ],
      "hint": "El soma es el cuerpo celular que contiene el núcleo.",
      "note": "El núcleo y el citoplasma pertenecen al soma; axón y dendritas se prolongan desde él.",
      "id": "m1-v34-07",
      "difficulty": "intermedio"
    },
    {
      "type": "order",
      "q": "Ordená cómo una neurona motora puede activar un músculo.",
      "steps": [
        "Un impulso nervioso viaja por el axón de una neurona motora",
        "El impulso llega a las terminaciones próximas al músculo",
        "Se libera un neurotransmisor en la unión con el músculo",
        "La fibra muscular recibe la señal",
        "El músculo se contrae"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Seguí la señal desde la neurona motora hasta el músculo.",
      "note": "En la unión neuromuscular, la señal de una neurona motora puede activar fibras musculares y generar contracción.",
      "id": "m1-v34-08",
      "difficulty": "desafío"
    },
    {
      "type": "order",
      "q": "Ordená un ejemplo simple de comunicación nerviosa al recibir un estímulo en la piel.",
      "steps": [
        "Un receptor de la piel detecta un estímulo",
        "Se genera una señal en la vía sensitiva",
        "La señal se propaga a lo largo de un axón",
        "La terminal transmite información a otra célula del circuito"
      ],
      "start": [
        3,
        2,
        1,
        0
      ],
      "hint": "Comenzá en el receptor y terminá con la comunicación a otra célula.",
      "note": "Los impulsos pueden viajar por axones y la información transmitirse en sinapsis.",
      "id": "m1-v34-09",
      "difficulty": "intermedio"
    },
    {
      "type": "point",
      "diagram": "neuron",
      "target": "nucleo",
      "q": "Señalá el núcleo que está dentro del cuerpo celular de la neurona.",
      "hint": "Buscá la estructura redondeada ubicada dentro del soma.",
      "note": "El núcleo es una estructura interna del soma que contiene el material genético.",
      "id": "m1-v34-10",
      "difficulty": "básico"
    }
  ],
  [
    {
      "type": "choice",
      "q": "Cuando tocás una superficie rugosa, ¿qué receptores participan principalmente?",
      "options": [
        "Mecanorreceptores de la piel",
        "Fotorreceptores de los ojos",
        "Receptores olfatorios de la nariz",
        "Receptores auditivos del oído"
      ],
      "answer": 0,
      "hint": "La rugosidad se percibe mediante el tacto.",
      "note": "Los mecanorreceptores cutáneos responden a estímulos mecánicos, como presión y contacto.",
      "id": "m2-v34-01",
      "difficulty": "intermedio"
    },
    {
      "type": "choice",
      "q": "Ves un relámpago y después escuchás un trueno. ¿Qué estímulo capta cada sentido?",
      "options": [
        "Los ojos detectan luz y los oídos detectan sonido",
        "Los ojos detectan sonido y los oídos detectan luz",
        "La nariz detecta la luz y la lengua detecta el sonido",
        "Los músculos del brazo detectan ambos estímulos"
      ],
      "answer": 0,
      "hint": "El relámpago aporta luz y el trueno produce sonido.",
      "note": "Los fotorreceptores responden a la luz; los receptores auditivos detectan vibraciones que llegan como sonido.",
      "id": "m2-v34-02",
      "difficulty": "básico"
    },
    {
      "type": "choice",
      "q": "¿Por qué podemos detectar el aroma de una fruta?",
      "options": [
        "Porque ciertas sustancias que libera estimulan receptores olfatorios",
        "Porque los receptores gustativos de la lengua detectan directamente aromas que están lejos",
        "Porque los fotorreceptores de la retina detectan moléculas olorosas",
        "Porque los receptores del oído interno detectan las sustancias que producen el olor"
      ],
      "answer": 0,
      "hint": "Oler depende de sustancias presentes en el aire.",
      "note": "Los receptores olfatorios detectan determinadas moléculas odorantes que llegan a la nariz.",
      "id": "m2-v34-03",
      "difficulty": "básico"
    },
    {
      "type": "pair",
      "q": "Relacioná la sensación con el tipo de receptor que participa.",
      "left": [
        "Notar presión sobre el hombro",
        "Percibir olor a una naranja",
        "Ver el brillo de una linterna",
        "Notar frío al sostener hielo"
      ],
      "right": [
        "Mecanorreceptores de la piel",
        "Receptores olfatorios",
        "Fotorreceptores de la retina",
        "Termorreceptores de la piel"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Distinguí estímulos mecánicos, sustancias químicas, luz y temperatura.",
      "note": "Cada tipo de receptor es sensible a determinadas propiedades del ambiente o del cuerpo.",
      "id": "m2-v34-04",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Relacioná situaciones cotidianas con el estímulo que detectás.",
      "left": [
        "Suena la campana",
        "Encendés una linterna",
        "Sostenés un cubito de hielo",
        "Olfateás una flor"
      ],
      "right": [
        "Sonido",
        "Luz",
        "Cambio de temperatura",
        "Sustancias odorantes"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Pensá en qué cambia en el entorno en cada situación.",
      "note": "Sonido, luz, temperatura y sustancias químicas pueden estimular diferentes receptores.",
      "id": "m2-v34-05",
      "difficulty": "intermedio"
    },
    {
      "type": "classify",
      "q": "Clasificá ejemplos de estímulos según su tipo.",
      "buckets": [
        "Luminoso",
        "Mecánico",
        "Térmico",
        "Químico"
      ],
      "items": [
        [
          "Brillo de una linterna",
          0
        ],
        [
          "Vibración producida por un parlante",
          1
        ],
        [
          "Frío de un cubito de hielo",
          2
        ],
        [
          "Aroma de pan recién hecho",
          3
        ],
        [
          "Sal que probás en una comida",
          3
        ]
      ],
      "hint": "Las ondas de luz, vibraciones, temperatura y moléculas se detectan de maneras diferentes.",
      "note": "La luz activa fotorreceptores; vibraciones activan mecanorreceptores; temperatura, termorreceptores; sustancias, quimiorreceptores.",
      "id": "m2-v34-06",
      "difficulty": "desafío"
    },
    {
      "type": "classify",
      "q": "Clasificá qué tipo de estímulo detecta principalmente cada órgano en estos ejemplos.",
      "buckets": [
        "Luz",
        "Sonido",
        "Sustancias químicas",
        "Contacto o presión"
      ],
      "items": [
        [
          "Ojo al mirar un cartel",
          0
        ],
        [
          "Oído al escuchar música",
          1
        ],
        [
          "Nariz al oler una flor",
          2
        ],
        [
          "Lengua al probar un alimento",
          2
        ],
        [
          "Piel al tocar una superficie rugosa",
          3
        ]
      ],
      "hint": "No agrupes el sonido y el tacto: en estos ejemplos son sentidos distintos.",
      "note": "Los órganos sensoriales cuentan con receptores que responden a luz, sonido, sustancias químicas o estímulos táctiles.",
      "id": "m2-v34-07",
      "difficulty": "desafío"
    },
    {
      "type": "order",
      "q": "Ordená lo que pasa cuando apoyás la mano sobre algo frío.",
      "steps": [
        "La piel entra en contacto con el objeto frío",
        "Los termorreceptores responden al cambio de temperatura",
        "Las vías sensitivas conducen información nerviosa",
        "El sistema nervioso central procesa esa información",
        "Reconocés la sensación de frío"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Empezá en la piel y terminá en la percepción.",
      "note": "La percepción de la temperatura requiere receptores, vías nerviosas y procesamiento central.",
      "id": "m2-v34-08",
      "difficulty": "intermedio"
    },
    {
      "type": "order",
      "q": "Ordená cómo llegás a percibir el sabor de una fruta.",
      "steps": [
        "Colocás un trozo de fruta en la boca",
        "Sustancias de la fruta se disuelven en la saliva",
        "Los receptores gustativos responden a esas sustancias",
        "Se transmiten señales nerviosas",
        "El encéfalo participa en la percepción del sabor"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Para activar receptores gustativos, las sustancias deben entrar en contacto con ellos.",
      "note": "La percepción del sabor combina señales gustativas y otros sentidos, como el olfato.",
      "id": "m2-v34-09",
      "difficulty": "intermedio"
    },
    {
      "type": "point",
      "diagram": "sensory",
      "target": "hielo",
      "q": "En el bosque ilustrado, tocá el objeto que puede provocar una sensación de frío.",
      "hint": "Buscá los cubitos transparentes y azulados.",
      "note": "La piel contiene receptores sensibles a cambios de temperatura.",
      "id": "m2-v34-10",
      "difficulty": "básico"
    }
  ],
  [
    {
      "type": "choice",
      "q": "Después de retirar la mano por reflejo ante algo caliente, ¿podés reconocer lo que sucedió?",
      "options": [
        "Sí, porque la información también puede llegar al encéfalo y permitir percibir el estímulo",
        "No, porque en un reflejo nunca llega información al encéfalo",
        "Solo si antes decidiste conscientemente retirar la mano",
        "No, porque los receptores de la piel dejan de funcionar durante el reflejo"
      ],
      "answer": 0,
      "hint": "Que la retirada sea automática no significa que el encéfalo deje de recibir información.",
      "note": "Los circuitos espinales pueden iniciar la retirada rápida mientras información sensitiva llega al encéfalo y se percibe.",
      "id": "m3-v34-01",
      "difficulty": "desafío"
    },
    {
      "type": "choice",
      "q": "¿Cuál es la diferencia general entre la vía sensitiva y la vía motora?",
      "options": [
        "La sensitiva lleva información hacia el sistema central y la motora conduce órdenes hacia efectores",
        "La vía motora lleva información de los receptores hacia la médula y la sensitiva sale al músculo",
        "Las vías sensitivas y motoras cumplen exactamente el mismo recorrido y función",
        "Los músculos reemplazan la vía sensitiva y no necesitan señales nerviosas"
      ],
      "answer": 0,
      "hint": "Una vía informa y la otra lleva una orden de respuesta.",
      "note": "Las vías sensitivas llevan información de receptores y las motoras conducen señales a efectores.",
      "id": "m3-v34-02",
      "difficulty": "intermedio"
    },
    {
      "type": "choice",
      "q": "¿Cuál de estas acciones es claramente voluntaria?",
      "options": [
        "Decidir atarte los cordones",
        "Retirar la mano por reflejo ante calor intenso",
        "Cerrar los ojos de forma refleja ante una ráfaga de aire",
        "La respuesta automática del reflejo rotuliano"
      ],
      "answer": 0,
      "hint": "Buscá la acción que requiere una decisión consciente.",
      "note": "Atarse los cordones es una acción voluntaria; numerosos reflejos son respuestas automáticas.",
      "id": "m3-v34-03",
      "difficulty": "básico"
    },
    {
      "type": "pair",
      "q": "Uní los elementos del arco reflejo con su función.",
      "left": [
        "Receptor de la piel",
        "Vía sensitiva",
        "Vía motora",
        "Músculo efector"
      ],
      "right": [
        "Detectar el estímulo",
        "Conducir información hacia el sistema central",
        "Llevar señales motoras hacia el músculo",
        "Realizar el movimiento de retirada"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Diferenciá detectar, informar, ordenar y actuar.",
      "note": "El circuito de un reflejo conecta receptores, vías nerviosas y efectores.",
      "id": "m3-v34-04",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Relacioná cada situación con la explicación que corresponde.",
      "left": [
        "Retirar la mano de algo caliente",
        "Parpadear ante una corriente de aire",
        "Elegir lanzar una pelota",
        "Decidir escribir una palabra"
      ],
      "right": [
        "Respuesta refleja de protección ante calor",
        "Respuesta automática que ayuda a proteger el ojo",
        "Movimiento iniciado voluntariamente para arrojar un objeto",
        "Movimiento voluntario para producir escritura"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Dos situaciones ocurren de forma automática y dos requieren una elección.",
      "note": "Reflejos y acciones voluntarias pueden activar músculos, pero se organizan de manera diferente.",
      "id": "m3-v34-05",
      "difficulty": "intermedio"
    },
    {
      "type": "classify",
      "q": "Clasificá elementos que llevan información de entrada o ejecutan la respuesta.",
      "buckets": [
        "Entrada sensitiva",
        "Salida motora o efector"
      ],
      "items": [
        [
          "Receptores de la piel que detectan calor",
          0
        ],
        [
          "Neurona sensitiva",
          0
        ],
        [
          "Neurona motora",
          1
        ],
        [
          "Músculo que retira la mano",
          1
        ]
      ],
      "hint": "Primero llega información al sistema central; después actúa el efector.",
      "note": "La información sensitiva desencadena respuestas que pueden enviarse mediante vías motoras.",
      "id": "m3-v34-06",
      "difficulty": "intermedio"
    },
    {
      "type": "classify",
      "q": "Clasificá los componentes del arco reflejo según su función.",
      "buckets": [
        "Detecta el estímulo",
        "Conduce señales nerviosas",
        "Ejecuta el movimiento"
      ],
      "items": [
        [
          "Receptores de la piel sensibles al calor",
          0
        ],
        [
          "Neurona sensitiva",
          1
        ],
        [
          "Neurona motora",
          1
        ],
        [
          "Músculo que retira la mano",
          2
        ]
      ],
      "hint": "Diferenciá lo que detecta, lo que transporta señales y lo que ejecuta la respuesta.",
      "note": "En el arco reflejo, receptores captan señales, neuronas las conducen y los músculos pueden actuar como efectores.",
      "id": "m3-v34-07",
      "difficulty": "intermedio"
    },
    {
      "type": "order",
      "q": "Ordená un ejemplo simplificado del reflejo rotuliano.",
      "steps": [
        "Un golpecito controlado en el tendón debajo de la rodilla estira brevemente el músculo",
        "Receptores del músculo detectan el estiramiento",
        "Una neurona sensitiva lleva información hacia la médula espinal",
        "Una neurona motora envía una señal al músculo del muslo",
        "El músculo se contrae y la pierna se extiende"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "El receptor está en el músculo y el circuito involucra la médula espinal.",
      "note": "El reflejo rotuliano es un ejemplo de circuito rápido ante estiramiento muscular; se usa en controles médicos.",
      "id": "m3-v34-08",
      "difficulty": "desafío"
    },
    {
      "type": "order",
      "q": "Ordená una respuesta refleja de parpadeo ante una corriente de aire en el ojo.",
      "steps": [
        "El aire estimula receptores de la superficie ocular",
        "Las vías sensitivas transmiten la información",
        "Circuitos del sistema nervioso central activan la respuesta refleja",
        "Las vías motoras llevan señales a los músculos del párpado",
        "Los párpados se cierran"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Identificá el estímulo, el recorrido nervioso y el músculo que responde.",
      "note": "El parpadeo reflejo ayuda a proteger los ojos mediante circuitos que integran señales sensitivas y motoras.",
      "id": "m3-v34-09",
      "difficulty": "desafío"
    },
    {
      "type": "point",
      "diagram": "reflex",
      "target": "receptor",
      "q": "Tocá la zona de la mano donde los receptores detectan el calor.",
      "hint": "Buscá la piel de la mano próxima al objeto caliente.",
      "note": "La detección inicial de estímulos ocurre en receptores sensoriales de la piel.",
      "id": "m3-v34-10",
      "difficulty": "básico"
    }
  ],
  [
    {
      "type": "choice",
      "q": "Durante un partido, ves la pelota y escuchás un silbato. ¿Cómo recibís ambas informaciones?",
      "options": [
        "Los ojos reciben luz y los oídos detectan sonidos; el sistema nervioso procesa ambas señales",
        "Los ojos reciben también el silbato como sonido y los oídos detectan colores",
        "Solo un sentido puede funcionar a la vez durante un partido",
        "El músculo del brazo detecta directamente la luz y las ondas sonoras"
      ],
      "answer": 0,
      "hint": "Pensá en dos receptores diferentes trabajando al mismo tiempo.",
      "note": "Distintos sistemas sensoriales pueden captar estímulos simultáneos y aportar información al encéfalo.",
      "id": "m4-v34-01",
      "difficulty": "intermedio"
    },
    {
      "type": "choice",
      "q": "¿Qué parte del cuerpo es el efector cuando decidís patear una pelota?",
      "options": [
        "Los músculos que mueven la pierna",
        "La luz reflejada por la pelota",
        "El sonido del silbato",
        "Los fotorreceptores de la retina"
      ],
      "answer": 0,
      "hint": "El efector realiza el movimiento.",
      "note": "Los músculos son efectores que generan movimientos al recibir señales motoras.",
      "id": "m4-v34-02",
      "difficulty": "básico"
    },
    {
      "type": "choice",
      "q": "¿Qué afirmación resume mejor cómo se comunican las partes del sistema nervioso?",
      "options": [
        "Los receptores captan estímulos, las vías nerviosas comunican señales y los centros nerviosos participan en organizar respuestas",
        "Los receptores captan estímulos y ordenan movimientos directos sin intervención de los centros nerviosos",
        "El sistema nervioso central puede recibir información, pero nunca envía señales hacia los músculos",
        "Los músculos del cuerpo detectan todos los estímulos del ambiente sin receptores especializados"
      ],
      "answer": 0,
      "hint": "Relacioná receptores, vías nerviosas, centros y respuesta.",
      "note": "El sistema nervioso integra recepción de información, comunicación entre células y control de respuestas.",
      "id": "m4-v34-03",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Uní cada situación con la estructura más vinculada a ella.",
      "left": [
        "Detectar la luz de una pelota",
        "Coordinar el equilibrio al correr",
        "Transportar señales por el brazo",
        "Ejecutar el movimiento de una mano"
      ],
      "right": [
        "Fotorreceptores de la retina",
        "Cerebelo",
        "Nervios periféricos",
        "Músculos de la mano"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "Pensá qué detecta, qué coordina, qué comunica y qué ejecuta.",
      "note": "Distintas estructuras actúan en conjunto al percibir y moverse.",
      "id": "m4-v34-04",
      "difficulty": "intermedio"
    },
    {
      "type": "pair",
      "q": "Relacioná cada elemento de una jugada con su papel.",
      "left": [
        "Pelota iluminada",
        "Retina del ojo",
        "Encéfalo",
        "Músculos del brazo"
      ],
      "right": [
        "Objeto observado cuya luz llega a los ojos",
        "Contiene receptores que responden a la luz",
        "Participa en procesar y organizar la respuesta",
        "Ejecutan el movimiento para atajar"
      ],
      "show": [
        3,
        2,
        1,
        0
      ],
      "hint": "En una acción se distingue el estímulo, la recepción, el procesamiento y la respuesta.",
      "note": "Para atrapar una pelota se integran percepción visual, control nervioso y acción muscular.",
      "id": "m4-v34-05",
      "difficulty": "intermedio"
    },
    {
      "type": "classify",
      "q": "¿Qué elementos detectan información y cuáles ejecutan una respuesta?",
      "buckets": [
        "Detectan información",
        "Ejecutan una respuesta"
      ],
      "items": [
        [
          "Fotorreceptores de la retina",
          0
        ],
        [
          "Receptores olfatorios",
          0
        ],
        [
          "Músculos de la mano",
          1
        ],
        [
          "Músculos de las piernas",
          1
        ]
      ],
      "hint": "Los receptores captan estímulos y los músculos pueden actuar como efectores.",
      "note": "La detección sensorial y la respuesta motora son funciones diferentes y complementarias.",
      "id": "m4-v34-06",
      "difficulty": "desafío"
    },
    {
      "type": "classify",
      "q": "Clasificá cada elemento de una respuesta según su papel.",
      "buckets": [
        "Recepción sensorial",
        "Procesamiento en el sistema central",
        "Respuesta motora"
      ],
      "items": [
        [
          "La retina detecta la luz",
          0
        ],
        [
          "El encéfalo organiza un movimiento voluntario",
          1
        ],
        [
          "Los músculos del brazo se contraen",
          2
        ],
        [
          "Los receptores del oído detectan sonido",
          0
        ],
        [
          "La médula espinal integra una respuesta refleja",
          1
        ]
      ],
      "hint": "Separá lo que detecta, lo que integra y lo que realiza el movimiento.",
      "note": "Las respuestas integran recepción de información, procesamiento central y ejecución motora.",
      "id": "m4-v34-07",
      "difficulty": "desafío"
    },
    {
      "type": "order",
      "q": "Ordená una respuesta voluntaria cuando agarrás una botella muy fría y decidís apoyarla.",
      "steps": [
        "Al agarrar la botella, los receptores de la piel detectan frío",
        "Las vías sensitivas llevan información al sistema nervioso central",
        "El encéfalo procesa la sensación y decidís apoyar la botella",
        "Se envían señales motoras hacia los músculos de la mano y del brazo",
        "Los músculos permiten colocar la botella sobre la mesa"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Primero sentís el frío, después tomás una decisión y movés la mano.",
      "note": "El tacto y la temperatura aportan información que puede influir en decisiones y movimientos voluntarios.",
      "id": "m4-v34-08",
      "difficulty": "desafío"
    },
    {
      "type": "order",
      "q": "Ordená qué pasa cuando notás piedritas dentro de una zapatilla y decidís quitártela.",
      "steps": [
        "Los receptores de la piel del pie detectan presión incómoda",
        "Las señales sensitivas viajan hacia el sistema nervioso central",
        "Percibís la molestia y decidís detenerte",
        "Las vías motoras activan los músculos necesarios para quitarte la zapatilla",
        "Retirás la zapatilla"
      ],
      "start": [
        4,
        3,
        2,
        1,
        0
      ],
      "hint": "Una sensación en el pie puede llevarte a decidir una acción.",
      "note": "La información táctil puede guiar decisiones voluntarias y movimientos coordinados.",
      "id": "m4-v34-09",
      "difficulty": "intermedio"
    },
    {
      "type": "point",
      "diagram": "final",
      "target": "pelota",
      "q": "En la escena final, tocá el objeto cuya luz reflejada llega a los ojos de la jugadora.",
      "hint": "Buscá el objeto que está intentando atajar.",
      "note": "La pelota refleja luz que llega a los ojos y permite que la jugadora vea su posición.",
      "id": "m4-v34-10",
      "difficulty": "básico"
    }
  ]
];

NEUROMISION_34_NEW.forEach(function(group,mi){
  if(group.length!==10)throw new Error("Debe haber 10 ejercicios nuevos por misión: "+mi);
  const used=new Set(MISSION_BANKS[mi].map(t=>t.id));
  group.forEach(function(t){
    if(used.has(t.id))throw new Error("ID duplicado: "+t.id);
    used.add(t.id);
    MISSIONS[mi].tasks.push(t);
    MISSION_BANKS[mi].push(t);
  });
});

/*
 * Correcciones editoriales a ejercicios anteriores, conservando sus IDs y
 * su misma respuesta correcta. No se borran los registros de práctica.
 */
const N34_LEGACY_FIXES=[
  {mission:0,id:"m0-e08",
    q:"¿Qué parte del sistema nervioso está protegida principalmente por la columna vertebral?",
    options:["La médula espinal","El cerebro","El cerebelo","Los nervios de la mano"],
    hint:"La médula espinal recorre un conducto dentro de la columna vertebral.",
    note:"La columna vertebral protege la médula espinal, que forma parte del sistema nervioso central."},
  {mission:0,id:"m0-e09",
    options:["Conectar el sistema nervioso central con el resto del cuerpo","Transportar oxígeno en la sangre","Mantener la forma de los huesos","Digerir los alimentos"]},
  {mission:0,id:"m0-e07",
    q:"¿Qué parte del encéfalo interviene especialmente en coordinar el equilibrio y ajustar los movimientos?",
    options:["El cerebelo","El cerebro","La médula espinal","Los nervios de las piernas"],
    hint:"Buscá una región situada detrás y debajo del cerebro.",
    note:"El cerebelo participa de manera destacada en el equilibrio, la postura y la coordinación fina de movimientos."},
  {mission:4,id:"m4-e07",
    options:["Estímulo visual → procesamiento nervioso → respuesta muscular","Estímulo visual → movimiento muscular → procesamiento nervioso","Respuesta muscular → percepción visual → decisión","Decisión de frenar → detección de luz → receptor visual"]},
  {mission:4,id:"m4-e08",
    options:["Dendritas: recepción de señales","Mielina: lugar donde se almacena el material genético","Cerebelo: transmite impulsos por el axón de una neurona","Médula espinal: receptor principal de la luz"]}
];
N34_LEGACY_FIXES.forEach(function(change){
  const bank=MISSION_BANKS[change.mission];
  const task=bank.find(t=>t.id===change.id);
  if(!task)throw new Error("No se encuentra el ejercicio anterior: "+change.id);
  for(const key of ["q","options","hint","note"]){
    if(Object.hasOwn(change,key))task[key]=change[key];
  }
});
