# Banco de referencia humana — Corrector de Lengua Monserrat
**Fecha:** 19 de noviembre de 2026  
**Estado:** auditoría experimental de dos ficciones. **Sin textos reales de estudiantes.**

## Propósito
Comparar de forma reproducible GLM 4.7 Flash y GPT-OSS 20B contra una **referencia de corrección humana**. No se pretende obtener una nota automática confiable. El corrector sigue separado de la práctica y del seguimiento de A y V.

### Ficción 1 — Caja en el patio
Texto original (mismo que `fixtures.mjs`):

> La caja estaba escondida bajo una maceta. El chico quizo abrirla pero la llave se callo. Despues busco una rama y logro sacar la llave del barro. Cuando la abrió encontro semillas para el jardín.

**Seis correcciones ortográficas obligatorias:**

| Texto | Forma adecuada | Explicación correcta |
| --- | --- | --- |
| quizo | quiso | Pretérito perfecto simple de querer, 3.ª persona singular; no subjuntivo. |
| se callo | se cayó | Caerse se escribe con y; cayó lleva tilde. |
| Despues | Después | Es adverbio temporal y lleva tilde. |
| busco | buscó | 3.ª persona singular del pretérito; no «busco» en presente. |
| logro | logró | 3.ª persona singular del pretérito; no primera persona. |
| encontro | encontró | 3.ª persona singular del pretérito, con tilde. |

**Puntuación y producción:** conviene una coma antes de «pero» y otra tras «Cuando la abrió» al anteceder la subordinada temporal. Se entiende el conflicto y su resolución; falta desarrollo expresivo y variedad narrativa. Estos aspectos requieren revisión contextual, **no búsqueda literal de palabras**.

### Ficción 2 — Biblioteca
Texto original:

> Una mañana el mapa desapareció. La bibliotecaria lo buscó por todos lados estaba muy nerviosa. Finalmente lo encontró dentro de un libro, pero nadie explicó como había llegado ahí.

| Texto | Forma adecuada | Explicación correcta |
| --- | --- | --- |
| lo buscó por todos lados estaba | lo buscó por todos lados. Estaba | Dos oraciones sin separación; se admite una solución equivalente gramatical. |
| como había | cómo había | Interrogativa indirecta: «nadie explicó cómo había llegado». |

**Criterios no obligatorios:** una coma tras «Una mañana» es opcional en esta construcción. No descontarla como falta. El desenlace resuelve la búsqueda, aunque la aventura podría desarrollarse más.

## Primer registro real de GLM 4.7 Flash
`glm-ficcion01-captura-20261119.json` es una **transcripción manual** de la captura compartida el 19/11; **no** es la respuesta JSON original de Cloudflare.

**Análisis de coincidencias verificables:**
- Detección ortográfica: **5 de 6** (83,3%). Omitió «se callo».
- Las cinco sustituciones ortográficas detectadas sí coinciden textualmente con las formas correctas.
- **Explicaciones incorrectas**: calificó «quizo» como subjuntivo, «después» como conjunción y «logró» como primera persona.
- La cuarta explicación acierta con la tilde y sugiere una coma pertinente, pero simplifica imprecisamente su función al hablar de «separar oraciones».
- Dio **35/35**, cifra incompatible con los errores observados y **no válida como calificación**.
- No se deduce ninguna medida de precisión semántica de las coincidencias literales: una cita textual real puede acompañar una explicación falsa.

## Cómo comparar sin consumir API
Los archivos `referencia-humana.mjs`, `comparar.mjs` y `comparar.test.mjs` permiten evaluar sin red:
```sh
node --test supabase/functions/corrector-ia-poc/benchmark/comparar.test.mjs
```
La prueba no lee secretos, no contacta Cloudflare ni modifica Supabase. El comparador mide cobertura de errores obligatorios y coincidencia literal de la propuesta, pero no acredita el puntaje, la calidad narrativa ni las explicaciones gramaticales. Eso requiere revisión adulta.

### Segundo registro real: GPT-OSS 20B — 19/11/2026
`gpt-oss-ficcion01-captura-20261119.json` es una **transcripción manual** de la captura compartida por el usuario, no el JSON bruto del proveedor.

**Comparación sobre la misma ficción 1:**

| Indicador | GLM 4.7 Flash | GPT-OSS 20B |
| --- | --- | --- |
| Errores ortográficos obligatorios detectados | 5/6 (83,3 %) | 5/6 (83,3 %) |
| Error omitido | `se callo → se cayó` | `logro → logró` |
| Sustituciones textualmente coincidentes | 5/6 | 5/6 |
| Explicaciones | Errores al identificar subjuntivo, conjunción y persona verbal | La explicación de `quizo` es falsa: no falta ninguna tilde; la de `se callo` es incompleta |
| Nota propuesta por el modelo | 35/35 | 27/35 |
| Nota validada | Ninguna | Ninguna |

**Precisión de las explicaciones de GPT-OSS:** acertó la sustitución `quizo → quiso` pero afirmó que faltaba tilde en «ó», lo cual es falso: la forma correcta `quiso` lleva **s** y no lleva tilde. La explicación de `se callo → se cayó` alude a la tilde, pero omite distinguir los verbos *caerse* y *callarse* y el cambio de **ll** por **y**. Las observaciones de `Después`, `buscó` y `encontró` son sustancialmente correctas.

**Interpretación:** ambos tuvieron la misma cobertura literal en una sola ficción. GPT-OSS parece formular mejores explicaciones en este caso, pero **la evidencia es demasiado pequeña para elegir un modelo de forma definitiva**. No hay justificación pedagógica para convertir la cifra 27/35 en nota.

**Limitaciones metodológicas:** no evaluamos todavía la calidad real de las observaciones narrativas ni una segunda ficción con ambos modelos. Las transcripciones de capturas no sustituyen los registros estructurados originales.

### Antes de estudiar con este corrector
1. Exigir que todos los errores obligatorios aparezcan, que las sugerencias sean gramaticalmente correctas y que la retroalimentación no introduzca errores nuevos.
2. Repetir los ensayos con más ficciones de diferente dificultad para reducir la dependencia de solo dos textos.
3. Mantener calificaciones de IA **no validadas**, con revisión de una persona adulta y sin impactar niveles de dominio.
4. Verificar las condiciones de privacidad relativas a menores antes de admitir textos reales. 
