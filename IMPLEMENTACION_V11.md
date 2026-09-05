# Implementación v11 · paradas y trazados viales orientativos

## Alcance

Esta versión inicia la mejora geográfica sin modificar horarios, servicios ni
el historial semanal:

- incorpora un piloto de ocho trazados viales, uno por corredor;
- incorpora las coordenadas aportadas de Primero de Mayo, Empalme Tanti,
  Sierra de Oro y La Juanita, más 21 puntos auditados desde el catálogo único;
- mueve la flecha sobre la geometría de calles y rutas del piloto;
- mantiene el mapa esquemático cuando un perfil no fue procesado;
- bloquea el enrutamiento de perfiles con coordenadas críticamente incoherentes;
- aísla del mapa 31 coordenadas que aparecen como punto central de dos saltos
  críticos, sin borrarlas del catálogo;
- aparta por perfil cualquier otro punto involucrado en un salto crítico no
  resoluble, para que el mapa use un conector punteado en vez de una diagonal
  falsa;
- agrega herramientas reproducibles para auditar paradas y generar nuevos
  trazados por tandas.

La revisión del catálogo del 05/09/2026 recibió 23 coordenadas nuevas. Se
incorporaron 21 por resultar coherentes con sus paradas vecinas. `La Puerta`
del perfil Cruz del Eje–Alto de los Quebrachos y `Villa del Parque` del
corredor Ruta 5 permanecen como dudosas y no se aplican al mapa. Las dos siguen
disponibles en búsqueda, filtros y cálculos horarios porque su exclusión es
exclusivamente geográfica.

## Archivos nuevos

- `app-transporte/data/trazados.json`: geometrías estáticas del piloto.
- `scripts/transporte/auditar_paradas_recorridos.py`: genera la auditoría de
  faltantes y tramos sospechosos.
- `scripts/transporte/generar_trazados_orientativos.py`: consulta OSRM una sola
  vez y guarda la geometría simplificada.
- `tests/test_generar_trazados_orientativos.py`: controles del generador y del
  piloto publicado.

## Criterio de seguridad geográfica

Un perfil no se envía al enrutador cuando entre dos puntos conocidos ocurre
alguna de estas situaciones:

- más de 120 km en línea recta; o
- más de 200 km/h implícitos en un tramo superior a 10 km.

La auditoría también marca para revisión los tramos superiores a 125 km/h. Una
alerta no determina automáticamente cuál de los dos puntos es incorrecto.
La cuarentena automática se aplica únicamente cuando un punto queda entre dos
saltos críticos y sus dos vecinos sí resultan coherentes entre sí.

Después de retirar esos puntos aislados, la auditoría vuelve a evaluar la
secuencia. Si todavía existe un salto crítico y no se puede determinar con
seguridad cuál extremo es incorrecto, ambos quedan marcados como dudosos solo
para ese perfil y no se dibujan. La coordenada permanece registrada para su
revisión; nunca se reemplaza por una deducción inventada.

Caso de regresión incorporado: en Córdoba–Villa Dolores por Altas Cumbres se
omiten Horno de Cal y Las Chacras. Sus ubicaciones registradas producían saltos
de 174 a 192 km respecto de las paradas vecinas, incompatibles con intervalos
de diez minutos.

## Piloto

El piloto cubre un perfil de Ida en cada corredor:

- Este-Sudeste: Córdoba–Laguna Larga.
- Noreste: Morteros–San Francisco.
- Norte: Córdoba–Deán Funes.
- Punilla: Cosquín–La Falda.
- Ruta 5: Córdoba–Alta Gracia.
- Sierras Chicas: Córdoba–Agua de Oro.
- Sur: Río Tercero–Berrotarán.
- Traslasierra: Villa Dolores–Villa Cura Brochero.

Los ocho deben revisarse visualmente antes de ampliar el procesamiento. El mapa
los identifica como **recorridos viales orientativos**: no confirman el
itinerario autorizado y no representan seguimiento en vivo.

## Regeneración

La base vial no se regenera al subir los PDF semanales, porque los trazados
pertenecen a los perfiles de recorrido y no a cada horario. Se actualiza cuando
cambian coordenadas o secuencias:

```bash
python3 scripts/transporte/generar_trazados_orientativos.py \
  --routes app-transporte/data/recorridos.json \
  --output app-transporte/data/trazados.json \
  --profile ID_DE_PERFIL
```

Para una tanda completa de perfiles aptos se omite `--profile`. Conviene hacer
tandas pequeñas y revisar el resultado antes de incorporarlo.

## Resultado auditado al preparar la versión

- 5.504 servicios vigentes; sin modificaciones.
- 4.240 servicios con perfil intermedio vinculado.
- 111 paradas vinculadas todavía sin coordenadas.
- 520 puntos del catálogo de recorridos con coordenadas.
- 116 coordenadas conservadas en el catálogo auditable; 111 aplicadas a
  recorridos y 5 a cabeceras provenientes de PDF.
- 127 perfiles bloqueados por al menos una alerta crítica.
- 322 perfiles aptos para procesamiento vial gradual.
- 8 perfiles en el piloto inicial.
- 72 pruebas aprobadas: 21 de Python y 51 de JavaScript.
