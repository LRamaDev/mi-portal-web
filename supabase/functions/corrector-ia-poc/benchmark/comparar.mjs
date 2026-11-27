// Comparación OFFLINE contra una referencia humana. No llama a ninguna API.
// Detección textual ≠ explicación gramatical correcta ni nota válida.
import { referenciaPara } from "./referencia-humana.mjs";

export function compararCobertura(fixtureId, respuesta) {
  const { texto, referencia } = referenciaPara(fixtureId);
  if (!respuesta || !Array.isArray(respuesta.errores)) throw new Error("Lista de errores requerida");
  const citasVerificables = respuesta.errores.filter(item =>
    item && typeof item.fragmento==="string" && texto.includes(item.fragmento)
  );
  const citasNoVerificables = respuesta.errores.length-citasVerificables.length;
  const objetivos = referencia.erroresObligatorios.map(e => {
    const hallazgos = citasVerificables.filter(item => item.fragmento.includes(e.fragmento));
    const deteccion = hallazgos.length>0;
    const correccionCoincidente = hallazgos.some(item =>
      typeof item.correccion==="string" && item.correccion.includes(e.correccion)
    );
    return {id:e.id,criterio:e.criterio,detectado:deteccion,correccionCoincidente};
  });
  const detectados=objetivos.filter(o=>o.detectado).length;
  const correccionesCoincidentes=objetivos.filter(o=>o.correccionCoincidente).length;
  const total=objetivos.length;
  const propuesta=Number.isInteger(respuesta.puntajePropuestoPorModelo) ?
    respuesta.puntajePropuestoPorModelo : Number.isInteger(respuesta.puntajeEstimado) ?
      respuesta.puntajeEstimado : null;

  return {
    fixtureId, referenciaVersion:"monserrat-narrativa-fixtures-v1",
    cantidadErroresObligatorios:total,detectados,correccionesCoincidentes,
    coberturaPorcentaje:Math.round(1000*detectados/total)/10,
    citasNoVerificables, objetivos,
    puntajePropuestoPorModelo:propuesta,
    puntajeMaximoIncompatible:propuesta===35 && total>0,
    // La corrección sintáctica no se puede certificar con equivalencia de cadenas.
    explicacionesGramaticalesVerificadas:false,
    requiereRevisionHumana:true,
    observacionesCualitativasFueraDeMetricas:referencia.observacionesNoAutomaticas.length
  };
}
