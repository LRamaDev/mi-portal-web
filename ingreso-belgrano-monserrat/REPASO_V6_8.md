# V6.8 · Entrenamiento adaptativo con repaso espaciado

La V6.8 usa el mapa de dominio ya existente para decidir **cuándo conviene volver sobre una habilidad**. No reemplaza el diagnóstico, no cambia los simulacros y no incorpora una escala oficial de los colegios: los intervalos descritos acá son una decisión pedagógica interna de la aplicación.

## Objetivo

Hasta V6.7, la práctica adaptativa ya aplicaba una mezcla aproximada 60/25/15:

- 5 actividades de habilidades débiles;
- 2 de habilidades en desarrollo;
- 1 de habilidades dominadas.

La V6.8 conserva esa estructura, pero dentro de cada grupo ordena mejor qué habilidad conviene presentar primero. Para eso combina:

1. dominio estimado;
2. tiempo transcurrido desde el último intento;
3. prioridad curricular que ya tenía la habilidad;
4. exposición pendiente en el otro perfil cuando estudian juntas;
5. un refuerzo pequeño para algunas brechas de cobertura detectadas en V6.7.

## Intervalos de repaso

| Dominio estimado | Intervalo orientativo |
|---|---:|
| Menos de 40 % | 1 día |
| 40–64 % | 2 días |
| 65–84 % | 4 días |
| 85 % o más | 7 días |

La intención es simple: volver rápido sobre lo que todavía cuesta y espaciar lo que ya está firme.

El intervalo no bloquea la práctica. Si una chica decide hacer varias sesiones el mismo día, una habilidad todavía puede aparecer porque sigue siendo débil o porque hacen falta actividades para completar la sesión. El vencimiento funciona como **prioridad**, no como prohibición.

## Cómo se integra con el selector existente

La lógica central de `app.js` sigue armando prácticas de ocho actividades. V6.8 no sustituye ese motor: durante el instante en que se construye una práctica, ajusta dinámicamente la prioridad de las habilidades.

Esto evita alterar:

- el diagnóstico adaptativo;
- los simulacros completos;
- el cálculo de dominio;
- el historial de progreso;
- la sincronización con Supabase.

Cuando termina la selección, las prioridades vuelven a su valor curricular original.

## Modo juntas

En práctica compartida se consideran los dos perfiles por separado.

- Si cualquiera de los dos tiene una habilidad vencida, esa habilidad gana prioridad.
- Si uno de los perfiles todavía no trabajó una habilidad que el otro ya conoce, se agrega un refuerzo de exposición.
- La respuesta sigue atribuyéndose al perfil cuyo turno corresponde, como en las versiones anteriores.

No se mezclan los diagnósticos individuales.

## Brechas de cobertura de V6.7

La auditoría V6.7 detectó algunos contenidos con menor representación. V6.8 aplica un refuerzo pequeño —sin forzar su aparición— sobre:

- concepto y representación de fracciones (`MAT-FR-CON`);
- múltiplos y divisores (`MAT-MULT`);
- resolución de problemas de varios pasos (`MAT-PROB`);
- algunos contenidos de geometría y magnitudes;
- comprensión lectora y parónimos.

Este refuerzo es deliberadamente menor que el efecto del dominio y del vencimiento: la necesidad real de cada perfil sigue siendo el criterio principal.

## Interfaz

En Inicio aparece un bloque **Repaso espaciado** dentro de las prioridades actuales. Muestra:

- cuántas habilidades están listas para repasar ese día;
- hasta cuatro sugerencias concretas;
- si en modo juntas una habilidad todavía no fue vista por uno de los perfiles;
- una aclaración de que los intervalos son internos de la app.

Cuando el diagnóstico individual todavía no está completo, el bloque explica que primero hace falta obtener esas evidencias iniciales.

## Compatibilidad

- No cambia la estructura de `study_state` ni `study_profile_state`.
- No reinicia progreso.
- No cambia IDs de actividades ni habilidades.
- No modifica los 402 ejercicios auditados en V6.7.
- No modifica los simulacros fijos.
- La caché PWA pasa a `ingreso-bm-v6-8-repaso-espaciado`.

## Validación

`tests/ingreso-v6-8-repaso.test.cjs` comprueba:

- los cuatro intervalos de repaso;
- la diferencia entre una habilidad débil y una dominada;
- el comportamiento compartido cuando solo un perfil tiene un repaso vencido;
- la exposición pendiente de uno de los perfiles;
- que un contenido vencido reciba más prioridad que uno fresco;
- versión visible, carga del módulo y caché PWA.

Además, la auditoría de las 402 actividades de V6.7 se mantiene como control de regresión.
