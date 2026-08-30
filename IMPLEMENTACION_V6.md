# v6 · Atención a usuarios y control de inspectores

La v6 separa dos tareas que usan la misma fuente de horarios, pero necesitan pantallas y resultados diferentes.

## Atención a usuarios

- Conserva la búsqueda por origen y destino, incluidos puntos intermedios.
- Identifica por separado el tramo consultado, la salida publicada y el destino final que figura en el cartel del colectivo.
- Mantiene la llegada y duración estimadas.
- Si faltan coordenadas intermedias, dibuja conectores punteados entre los puntos conocidos y conserva la flecha orientativa.
- Si el origen o el destino seleccionado no tiene coordenadas, no inventa su ubicación y explica por qué no puede animarlo.

## Control de inspectores

- Distingue la base del equipo del lugar real del operativo.
- Bases disponibles: Córdoba, Río Cuarto, Villa María, San Francisco, Villa Dolores, Villa Carlos Paz, Cruz del Eje, Jesús María, Cosquín y Operativo móvil.
- Permite elegir localidad, terminal o punto específico, corredor, empresa, día y franja horaria.
- Permite seleccionar varias líneas simultáneamente.
- Ordena los servicios por la hora en que deben pasar por el lugar del control.
- Marca cada hora como `Publicado` cuando corresponde a la cabecera de salida o `Estimado` cuando procede de una localidad intermedia.
- Muestra el destino final/cartel, el sentido y la salida publicada de cada servicio.

La base del equipo es una referencia organizativa. No se usa la dirección de una delegación como ubicación automática del control. Las direcciones y teléfonos no se incorporan porque las fuentes públicas de atención al usuario y la información operativa aportada no coinciden en todos los casos.

## Flechas y coordenadas

La base contiene 661 localidades y 252 todavía no tienen coordenadas. En la v5, cualquier hueco intermedio detenía por completo la flecha. En la v6:

- la flecha funciona cuando el origen y el destino elegidos tienen coordenadas;
- los huecos intermedios se representan con un conector punteado y esquemático;
- la secuencia y los horarios de esas localidades se mantienen en el detalle;
- no se muestra una flecha falsa cuando falta la ubicación del origen o destino.

Con los datos actuales, las cabeceras de origen y destino están ubicadas en 5.375 de los 5.506 servicios (97,6 %). Los 131 restantes requieren completar al menos una cabecera antes de poder animar el recorrido completo de manera honesta.

El mapa sigue siendo esquemático: no representa calles, posición en vivo ni velocidad real.

## Archivos de esta versión

| Archivo | Acción |
|---|---|
| `app-transporte/index.html` | Modificar |
| `app-transporte/transporte.css` | Modificar |
| `app-transporte/transporte.js` | Modificar |
| `app-transporte/recorridos.js` | Modificar |
| `tests/transporte-recorridos.test.cjs` | Modificar |
| `tests/transporte-ui.test.cjs` | Modificar |
| `IMPLEMENTACION_V6.md` | Agregar |

No se modifican `horarios.json`, `cabeceras.json`, `recorridos.json`, la portada ni `.github/workflows/actualizar-horarios.yml`. La actualización de los ocho PDF de cada lunes conserva el mismo procedimiento.

## Pruebas

```bash
node --test tests/transporte-recorridos.test.cjs tests/transporte-ui.test.cjs
python -B tests/test_procesar_recorridos.py
```

Los controles incluyen Falda del Carmen → Córdoba, conectores esquemáticos, destino final/cartel, selección múltiple, día de paso, franja horaria y separación de los dos modos de uso.
