# NeuroMisión v2 — arquitectura funcional y visual

Estado: especificación para implementación; **no representa una versión jugable**. Base analizada: `neuromision/` v1.1.

## Reglas no negociables
1. No mostrar nombres reales, nombres de ejemplo, ni perfiles precargados en la interfaz. Cada persona escribe su nombre.
2. Guardar progreso local por nombre ingresado, sin enviar información a servidor ni exigir cuenta. Mostrar únicamente perfiles ya creados por la propia persona en ese navegador si se habilita la recuperación; nunca preinstalar perfiles.
3. Preservar los datos de `localStorage` existentes (`neuromision_v1_profiles`, `neuromision_v1_last`). No borrar ni sobrescribir progresos al actualizar. Documentar la limitación entre dispositivos y en navegación privada.
4. Mantener las cinco misiones, las 27 actividades por recorrido total, las reglas educativas, la accesibilidad táctil y por teclado, las opciones aleatorizadas, el arrastre de secuencias y la retroalimentación.
5. No cambiar `main` ni la página actual hasta finalizar pruebas funcionales y revisión visual.

## Arquitectura sugerida de archivos

```text
neuromision/
  index.html              # Versión publicada actual; NO modificar hasta aprobación
  app.js                  # Motor v1.1 existente
  styles.css
  v2/                     # Entorno de prueba aislado
    index.html            # Portada y contenedor de vistas
    styles/
      tokens.css          # Paleta clara, tipografía, espaciados
      components.css      # Encabezado, tarjetas, controles
      worlds.css          # Mapa y territorios
      activities.css      # Pregunta, esquemas, respuestas, pistas
      responsive.css      # 320 px a escritorio
    js/
      content.js          # Banco: ID permanente, tema, mecánica, dificultad, explicación
      selection.js        # Selección equilibrada y antirrepetición
      storage.js          # Compatibilidad de progreso v1 + ampliación de historial
      engine.js           # Resolver ejercicios, puntuaciones e insignias
      views.js            # Portada, perfil, mapa, previa, actividad, resultado
      main.js             # Navegación e inicialización
    assets/
      worlds/             # Ilustraciones propias de los cinco territorios
      diagrams/           # Diagramas educativos correctos, legibles y etiquetables
```

Los archivos JS pueden usarse como módulos nativos del navegador en GitHub Pages, sin framework ni compilación. Si se decide extraer código del motor actual, hacerlo conservando primero pruebas de regresión.

## Diseño visual acordado

Tema claro permanente en v2: fondo crema/celeste muy suave, tinta azul petróleo, superficies blancas, sombras livianas. Cada territorio tiene color principal identificable, sin depender exclusivamente del color para indicar su estado.

- Ciudad Central: azul/turquesa; sistema nervioso central y periférico.
- Valle de la Neurona: violeta; estructura de la neurona.
- Bosque Sensorial: verde; estímulos y receptores.
- Ruta de los Reflejos: naranja; circuitos reflejos y acciones voluntarias.
- Torre Final: coral/dorado; integración.

**Mapa:** una ilustración continua de cinco territorios con senderos conectados (imagen o SVG con ilustración real, no solo emojis ni tarjetas textuales). El mapa se adapta a móvil sin depender de hover; cada territorio es un botón accesible con descripción y estado. El usuario puede seguir jugando desde su estado; una misión completada se puede volver a jugar.

**Ilustraciones:** producir ilustraciones diseñadas para el juego: una del mapa, cinco escenas de territorio, un cuerpo con SNC/SNP y una neurona detallada. Mantener dos versiones de los diagramas: presentación y capa interactiva de puntos, de modo que las áreas pulsables estén alineadas, no oculten estructuras y se adapten a distintos tamaños.

**Actividad:** en el primer pantallazo deben verse pregunta y comienzo del recurso interactivo. Orden de jerarquía: progreso compacto → tarjeta de pregunta destacada → ilustración o tarjetas de respuesta → pista bajo demanda → explicación tras responder. No mostrar grandes párrafos introductorios antes de la consigna.

**Responsive:** prioridad a 360–430 px con tacto, y escritorio 1280 px; controles accesibles con tamaño de toque adecuado; diagramas ampliables/desplazables cuando la lectura lo requiera; `prefers-reduced-motion` y `focus-visible`.

## Flujo de pantallas
1. Portada ilustrada: NeuroMisión, entrar/continuar.
2. Perfil: campo de nombre vacío por defecto si no se eligió un perfil; reconocer nombre previamente ingresado, con guardado por navegador. No hardcodear nombres.
3. Mapa ilustrado: cinco tierras, estado y progreso, acceso a repetición.
4. Previa de territorio: arte, objetivo breve, botón comenzar.
5. Desafío: consigna prioritaria, actividad, pista opcional, explicación posterior.
6. Cierre: insignia, puntaje de esta partida, mejor puntaje, volver al mapa o continuar.

## Banco y regla de partidas

| Territorio | Banco objetivo | Ejercicios mostrados |
|---|---:|---:|
| Ciudad Central | 14 | 5 |
| Valle de la Neurona | 16 | 6 |
| Bosque Sensorial | 14 | 5 |
| Ruta de los Reflejos | 14 | 5 |
| Torre Final | 18 | 6 |
| **Total** | **76** | **27** |

La selección usa identificadores estables y evita repetir la misma consigna consecutivamente si hay variedad suficiente; debe cubrir subtemas y tipos de ejercicios. Balance de dificultad sugerido para cinco preguntas: dos básicas, dos intermedias y una aplicada; para seis, dos básicas, tres intermedias y una aplicada. Registrar las actividades seleccionadas al inicio de la partida para no remezclar durante los reintentos o al continuar una sesión.

Los ejercicios `choice`, `point`, `order` y `pair` existentes se preservan. Se pueden agregar `classify` y `label` solamente cuando los componentes interactivos estén probados en móvil y teclado. Mantener los conceptos biológicos correctos y distinguir modelo simplificado de recorrido nervioso de explicaciones clínicas.

## Datos locales — compatibilidad

El formato v1 guarda un objeto por nombre normalizado a minúsculas en `neuromision_v1_profiles`, y la última identidad en `neuromision_v1_last`. Su estructura actual incluye `name`, `completed`, `best` y `active` (misión, actividad y puntaje). V2 **no debe mutar estos registros al leer** ni cambiar las claves de misiones 0–4.

Crear una capa `storage.js` que lea la versión anterior y use un espacio nuevo para el historial adicional de v2 (por ejemplo `neuromision_v2_history`), asociado a una clave normalizada de nombre. Guardar selección de IDs de la partida, índice, intentos y errores para retomar exactamente la misma actividad; hacerlo tras cada respuesta y transición. La mejor puntuación y las insignias históricas no se deben borrar al repetir. No registrar información sensible ni enviar telemetría de menores.

Caso de mismo nombre con distintas mayúsculas: recuperar la misma identidad. Nunca inferir que dos nombres distintos corresponden a la misma persona. Describir al jugador cómo cambiar de perfil sin afectar otros.

## Secuencia de implementación y puertas de calidad

1. **Diseño visual**: ilustración del mapa y de los dos diagramas anatómicos; revisar legibilidad con capturas de escritorio y móvil, sin alterar producción.
2. **Prototipo visual navegable**: portada, perfil, mapa y pantalla de actividad en `neuromision/v2/` con datos de muestra *genéricos y no personales*; no publicar tarjeta de acceso general al prototipo.
3. **Motor / banco**: portar mecánicas existentes, sumar banco a 76 y selector equilibrado. Validar unicidad de IDs, respuestas, explicaciones y distribución.
4. **Persistencia**: pruebas de migración/lectura v1, aislamiento de perfiles, recuperación de sesiones y partidas repetidas.
5. **Validación real**: móvil Android y PC: zonas táctiles, scroll de diagramas, arrastrar/seleccionar, estado de misiones, pistas y legibilidad de la consigna.
6. **Publicación controlada**: revisión del PR y pruebas de GitHub Pages antes de reemplazar la entrada del portal. Mantener opción de reversión a v1.1.

## Criterios de aceptación
- El mapa es una escena ilustrada reconocible de cinco territorios y no una grilla de texto.
- Fondo claro y pregunta principal legible sin desplazarse innecesariamente.
- Todas las actividades visuales poseen ilustraciones claras de tamaño suficiente.
- 76 ejercicios válidos en banco, pero solo 27 por recorrido completo.
- Dos partidas de una misión varían, sin reordenar una pregunta durante la misma partida.
- Se puede volver a jugar cualquier misión completada sin perder marcas.
- Cada nombre usa sus propios avances; se mantienen los perfiles v1 ya existentes.
- Funciona con mouse, teclado y táctil, y no altera otras aplicaciones del portal.
