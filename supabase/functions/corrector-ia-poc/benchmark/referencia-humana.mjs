// Referencia HUMANA inicial, exclusiva de dos textos ficticios del prototipo.
// No es una calificación oficial del examen Monserrat ni sustituye la corrección adulta.
import { FIXTURES } from "../fixtures.mjs";

export const REFERENCIA_VERSION = "monserrat-narrativa-fixtures-v1";
export const REFERENCIAS = Object.freeze({
  "ficcion-01": Object.freeze({
    titulo: "La caja en el patio",
    erroresObligatorios: Object.freeze([
      { id: "quizo", fragmento: "quizo", correccion: "quiso", criterio: "ortografia",
        explicacion: "Quiso es la tercera persona del singular del pretérito perfecto simple de querer. No es subjuntivo." },
      { id: "se_callo", fragmento: "se callo", correccion: "se cayó", criterio: "ortografia",
        explicacion: "En este contexto el verbo es caerse: cayó, con y y tilde. Callo no expresa esa acción." },
      { id: "despues", fragmento: "Despues", correccion: "Después", criterio: "ortografia",
        explicacion: "Después lleva tilde y aquí funciona como adverbio temporal, no como conjunción." },
      { id: "busco", fragmento: "busco", correccion: "buscó", criterio: "ortografia",
        explicacion: "Buscó es tercera persona del singular del pretérito perfecto simple; busco es primera del presente." },
      { id: "logro", fragmento: "logro", correccion: "logró", criterio: "ortografia",
        explicacion: "Logró es tercera persona del singular del pretérito perfecto simple; no primera persona." },
      { id: "encontro", fragmento: "encontro", correccion: "encontró", criterio: "ortografia",
        explicacion: "Encontró es tercera persona del singular del pretérito perfecto simple y lleva tilde." }
    ]),
    observacionesNoAutomaticas: Object.freeze([
      "Conviene una coma antes de «pero»: «quiso abrirla, pero la llave se cayó».",
      "Resulta apropiada una coma tras la subordinada temporal inicial: «Cuando la abrió, encontró…».",
      "El conflicto y el desenlace son comprensibles, pero el ambiente y la tensión narrativa están poco desarrollados."
    ]),
    nota: "No se fija una nota humana exacta: la evaluación de 35 puntos requiere juicio sobre dimensiones cualitativas."
  }),
  "ficcion-02": Object.freeze({
    titulo: "El mapa de la biblioteca",
    erroresObligatorios: Object.freeze([
      { id: "separacion_oraciones", fragmento: "lo buscó por todos lados estaba",
        correccion: "lo buscó por todos lados. Estaba", criterio: "puntuacion",
        explicacion: "Hay dos proposiciones independientes sin unión válida; pueden separarse con punto y mayúscula." },
      { id: "como_indirecto", fragmento: "como había", correccion: "cómo había", criterio: "ortografia",
        explicacion: "En «nadie explicó cómo había llegado», cómo introduce una interrogativa indirecta y lleva tilde." }
    ]),
    observacionesNoAutomaticas: Object.freeze([
      "La coma tras «Una mañana» es posible, pero no corresponde exigirla como error obligatorio.",
      "El hallazgo del mapa resuelve la búsqueda; la aventura y las motivaciones pueden desarrollarse más."
    ]),
    nota: "No se fija una nota humana exacta. Hay dos correcciones obligatorias de forma y aspectos narrativos de revisión."
  })
});

export function referenciaPara(fixtureId) {
  const ref = REFERENCIAS[fixtureId];
  if (!ref || !Object.hasOwn(FIXTURES,fixtureId)) throw new Error("Relato ficticio no admitido");
  const texto = FIXTURES[fixtureId].texto;
  for (const e of ref.erroresObligatorios) {
    if (!texto.includes(e.fragmento)) throw new Error("La referencia no coincide con el texto: " + e.id);
    if (!e.correccion || !e.explicacion) throw new Error("Referencia incompleta");
  }
  return { fixtureId, texto, referencia: ref };
}
