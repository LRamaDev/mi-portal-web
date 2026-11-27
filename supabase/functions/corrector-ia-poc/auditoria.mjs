// Auditoría de fiabilidad, solo para los dos relatos FICTICIOS de la prueba.
// El puntaje que genera un LLM NO se convierte automáticamente en nota.
const INDICIOS = Object.freeze({
  "ficcion-01": Object.freeze(["quizo", "se callo", "Despues", "busco", "logro", "encontro"]),
  "ficcion-02": Object.freeze(["lo buscó por todos lados estaba", "como había"])
});
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);

/**
 * Protege la experiencia familiar ante notas máximas incompatibles con errores,
 * fragmentos inventados y omisiones en los relatos de control.
 * Esto NO valida reglas gramaticales o explicaciones: requiere revisión humana.
 */
export function auditarCorreccionFicticia(fixtureId, fixture, resultado) {
  if (!own(INDICIOS, fixtureId) || typeof fixture?.texto !== "string")
    throw new Error("Fixture de auditoría no identificado");
  if (!resultado || !Array.isArray(resultado.errores) ||
      !Number.isInteger(resultado.puntajeEstimado) || resultado.maximo !== 35)
    throw new Error("Respuesta del modelo no auditable");

  const texto = fixture.texto;
  const erroresConFuente = resultado.errores.filter(e =>
    typeof e?.fragmento === "string" && texto.includes(e.fragmento)
  );
  const erroresInventados = resultado.errores.length - erroresConFuente.length;
  const omitidos = INDICIOS[fixtureId].filter(indicio =>
    !erroresConFuente.some(e => e.fragmento.includes(indicio))
  );

  const motivos = ["evaluacion_no_calibrada"];
  if (resultado.puntajeEstimado === 35 && erroresConFuente.length)
    motivos.push("puntaje_maximo_con_errores");
  if (erroresInventados) motivos.push("fragmentos_ajenos_al_texto");
  if (omitidos.length) motivos.push("errores_esperados_omitidos");
  if (resultado.criterios?.ortografia === 4 && INDICIOS[fixtureId].length)
    motivos.push("ortografia_maxima_pese_a_errores_conocidos");

  // Los motivos se exponen como códigos, nunca se confía en explicaciones
  // gramaticales del modelo sin revisión adulta.
  return {
    ...resultado,
    errores: erroresConFuente,
    // Separar la cifra inventada por el modelo de una nota que se pueda usar.
    puntajePropuestoPorModelo: resultado.puntajeEstimado,
    puntajeEstimado: null,
    calificacionValidada: false,
    auditoria: {
      estado: "requiere_revision_adulta",
      motivos,
      indiciosConocidosOmitidos: omitidos.length,
      fragmentosInventadosDescartados: erroresInventados
    }
  };
}
