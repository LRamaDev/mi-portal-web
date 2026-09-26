(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.IngresoPedagogy = api;
})(function () {
  'use strict';

  const VERSION = 1;
  const DAY_MS = 86400000;
  const RETENTION_DAYS = 3;
  const CONSOLIDATED_REVIEW_DAYS = 7;
  const STATES = ['sin_evidencia', 'explorando', 'en_desarrollo', 'consistente', 'consolidado'];
  const STATE_LABELS = {
    sin_evidencia: 'Sin evidencia',
    explorando: 'Explorando',
    en_desarrollo: 'En desarrollo',
    consistente: 'Consistente',
    consolidado: 'Consolidado'
  };
  const STATE_RANK = Object.fromEntries(STATES.map((state, index) => [state, index]));

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const bools = value => Array.isArray(value) ? value.map(Boolean) : [];

  function normalizedLegacy(progress, detailedEvidence = []) {
    if (progress?.legacy && Number(progress.legacy.version || 0) >= 1) {
      return {
        version: 1,
        attempts: num(progress.legacy.attempts),
        correct: num(progress.legacy.correct),
        mastery: num(progress.legacy.mastery),
        lastAt: num(progress.legacy.lastAt),
        recent: bools(progress.legacy.recent).slice(-4),
        maxDifficultyCorrect: num(progress.legacy.maxDifficultyCorrect),
        lowestMastery: progress.legacy.lowestMastery == null ? null : num(progress.legacy.lowestMastery)
      };
    }

    const detailCount = detailedEvidence.length;
    const detailCorrect = detailedEvidence.filter(event => event.correct).length;
    const attempts = Math.max(0, num(progress?.attempts) - detailCount);
    const correct = Math.max(0, num(progress?.correct) - detailCorrect);
    return {
      version: 1,
      attempts,
      correct,
      mastery: num(progress?.mastery),
      lastAt: num(progress?.lastAt),
      recent: detailCount ? [] : bools(progress?.recent).slice(-4),
      maxDifficultyCorrect: num(progress?.maxDifficultyCorrect),
      lowestMastery: progress?.lowestMastery == null ? null : num(progress.lowestMastery)
    };
  }

  function evidenceQuality(event) {
    const difficulty = clamp(num(event?.difficulty, 2), 1, 4);
    const difficultyFactor = { 1: 0.85, 2: 0.95, 3: 1.05, 4: 1.15 }[difficulty] || 1;
    const autonomyFactor = event?.hintUsed ? 0.7 : 1;
    const evaluationFactor = clamp(num(event?.evaluationWeight, event?.evaluationMode === 'selfcheck' ? 0.65 : 1), 0.4, 1);
    return difficultyFactor * autonomyFactor * evaluationFactor;
  }

  function objectiveEvidence(event) {
    return event?.evaluationMode !== 'selfcheck' && num(event?.evaluationWeight, 1) >= 0.9;
  }

  function spanDays(events) {
    if (!events.length) return 0;
    const times = events.map(event => num(event.at)).filter(Boolean).sort((a, b) => a - b);
    if (times.length < 2) return 0;
    return (times[times.length - 1] - times[0]) / DAY_MS;
  }

  function distinctExercises(events) {
    return new Set(events.map(event => String(event.exerciseId || '')).filter(Boolean)).size;
  }

  function establishedDifficulty(events) {
    for (let difficulty = 4; difficulty >= 1; difficulty -= 1) {
      const matches = events.filter(event =>
        event.correct &&
        !event.hintUsed &&
        objectiveEvidence(event) &&
        num(event.difficulty, 1) >= difficulty
      );
      if (distinctExercises(matches) >= 2) return difficulty;
    }
    return 0;
  }

  function weightedRecentScore(events, established = 0) {
    const recent = [...events].sort((a, b) => num(a.at) - num(b.at)).slice(-6).reverse();
    if (!recent.length) return null;
    const recency = [1, 0.86, 0.74, 0.62, 0.52, 0.44];
    let numerator = 0;
    let denominator = 0;
    recent.forEach((event, index) => {
      const q = evidenceQuality(event) * (recency[index] || 0.4);
      let outcome = event.correct ? 1 : 0;
      // Un error en una dificultad superior a la ya establecida informa sobre
      // transferencia/desafío, pero no borra el dominio del nivel anterior.
      if (!event.correct && established && num(event.difficulty, 1) > established) outcome = 0.45;
      numerator += outcome * q;
      denominator += q;
    });
    return denominator ? numerator / denominator : null;
  }

  function recentFailureAtOrBelow(events, difficulty) {
    if (!difficulty) return false;
    const relevant = events
      .filter(event => objectiveEvidence(event) && num(event.difficulty, 1) <= difficulty)
      .slice(-3);
    return relevant.filter(event => !event.correct).length >= 2;
  }

  function trendFor(legacy, evidence, established, targetDifficulty) {
    const detailed = [...evidence].sort((a, b) => num(a.at) - num(b.at));
    const objective = detailed.filter(objectiveEvidence);
    const comparisonDifficulty = established || targetDifficulty || 2;

    if (recentFailureAtOrBelow(objective, comparisonDifficulty)) return 'revisar';

    if (objective.length >= 4) {
      const last = objective.slice(-2);
      const previous = objective.slice(-4, -2);
      const score = rows => rows.reduce((sum, event) => sum + (event.correct ? 1 : 0), 0) / Math.max(1, rows.length);
      const delta = score(last) - score(previous);
      if (delta >= 0.5) return 'mejorando';
      if (delta <= -0.5 && last.some(event => num(event.difficulty, 1) <= comparisonDifficulty)) return 'revisar';
      const lastThree = objective.slice(-3);
      if (lastThree.length === 3 && lastThree.every(event => event.correct) && previous.some(event => !event.correct)) return 'mejorando';
      return 'estable';
    }

    const legacyRecent = bools(legacy.recent);
    const historicalAccuracy = legacy.attempts ? legacy.correct / legacy.attempts : 0;
    if (legacyRecent.slice(-3).length === 3 && legacyRecent.slice(-3).every(Boolean) && historicalAccuracy < 0.75) return 'mejorando';
    if (legacyRecent.slice(-2).length === 2 && legacyRecent.slice(-2).every(value => !value)) return 'revisar';
    if (objective.length >= 2 && objective.slice(-2).every(event => event.correct) && historicalAccuracy < 0.75) return 'mejorando';
    return 'estable';
  }

  function confidenceFor(legacy, evidence, retentionVerified) {
    const detailed = [...evidence].sort((a, b) => num(a.at) - num(b.at));
    const distinct = distinctExercises(detailed);
    const qualityUnits = detailed.reduce((sum, event) => sum + Math.min(1.15, evidenceQuality(event)), 0);
    const legacyUnits = legacy.attempts ? Math.min(2, 0.6 + Math.log2(legacy.attempts + 1) * 0.35) : 0;
    const totalUnits = qualityUnits + legacyUnits;

    if (retentionVerified && detailed.length >= 3 && distinct >= 3) return 'alta';
    if (detailed.length >= 6 && distinct >= 4 && spanDays(detailed) >= 2) return 'alta';
    if (totalUnits >= 3 && (distinct >= 2 || legacy.attempts >= 4)) return 'media';
    if (legacy.attempts >= 4) return 'media';
    return 'baja';
  }

  function qualitativeMessage(analysis) {
    if (!analysis || analysis.state === 'sin_evidencia') return 'Todavía no trabajamos suficiente este tema.';
    if (analysis.state === 'explorando') {
      if (analysis.trend === 'mejorando') return '¡Buen comienzo! Sigamos probando formas distintas de resolverlo.';
      return 'Estamos conociendo este tema. Hace falta un poco más de práctica.';
    }
    if (analysis.state === 'en_desarrollo') {
      if (analysis.trend === 'mejorando') return '¡Viene mejorando! Ahora vamos a comprobarlo con otro ejercicio.';
      if (analysis.trend === 'revisar') return 'Este tema necesita un poco más de práctica.';
      return 'Vas avanzando. Conviene seguir practicando con ejercicios variados.';
    }
    if (analysis.state === 'consistente') return 'Ya lo resolvés muy bien. Más adelante lo vamos a repasar.';
    return 'Este tema está firme. Lo vamos a volver a visitar para mantenerlo.';
  }

  function analyzeSkill({ legacy, evidence = [], maxDifficulty = 4, previousAnalysis = null, now = Date.now() }) {
    const safeLegacy = legacy || normalizedLegacy(null, []);
    const detailed = [...evidence]
      .filter(event => event && event.skillId)
      .sort((a, b) => num(a.at) - num(b.at));
    const totalAttempts = num(safeLegacy.attempts) + detailed.length;
    const maxAvailable = clamp(num(maxDifficulty, 4), 1, 4);
    const targetDifficulty = Math.min(3, maxAvailable);

    if (!totalAttempts) {
      return {
        version: VERSION,
        state: 'sin_evidencia',
        stateLabel: STATE_LABELS.sin_evidencia,
        trend: 'estable',
        confidence: 'baja',
        needsVerification: false,
        retentionVerified: false,
        targetDifficulty,
        preferredDifficulty: Math.min(2, maxAvailable),
        establishedDifficulty: 0,
        recentScore: null,
        detailedEvidenceCount: 0,
        legacyAttempts: 0,
        distinctExercises: 0,
        consistentSince: null,
        retentionDueAt: null,
        nextReviewAt: null,
        lastEvidenceAt: 0,
        qualitative: qualitativeMessage({ state: 'sin_evidencia', trend: 'estable' })
      };
    }

    const recent = detailed.slice(-6);
    const objective = detailed.filter(objectiveEvidence);
    const recentObjective = objective.slice(-5);
    const established = establishedDifficulty(objective.slice(-10));
    const demonstrated = Math.max(
      num(safeLegacy.maxDifficultyCorrect),
      ...detailed.filter(event => event.correct).map(event => num(event.difficulty, 1)),
      0
    );
    const trend = trendFor(safeLegacy, detailed, established, targetDifficulty);
    const recentScore = weightedRecentScore(detailed, established || Math.min(demonstrated, targetDifficulty));
    const legacyRecent = bools(safeLegacy.recent);
    const legacyStreak = legacyRecent.slice(-3).length === 3 && legacyRecent.slice(-3).every(Boolean);
    const historicalAccuracy = safeLegacy.attempts ? safeLegacy.correct / safeLegacy.attempts : 0;

    const recentCorrect = recentObjective.filter(event => event.correct);
    const autonomousCorrect = recentCorrect.filter(event => !event.hintUsed);
    const atTargetCorrect = autonomousCorrect.filter(event => num(event.difficulty, 1) >= targetDifficulty);
    const recentAtOrBelowFailures = recentObjective.filter(event => !event.correct && num(event.difficulty, 1) <= (established || targetDifficulty));

    const consistentByDetailed =
      recentObjective.length >= 4 &&
      recentCorrect.length >= 3 &&
      autonomousCorrect.length >= 2 &&
      distinctExercises(recentCorrect) >= 3 &&
      atTargetCorrect.length >= 1 &&
      recentAtOrBelowFailures.length <= 1;

    const verificationEvents = detailed.filter(event =>
      event.purpose === 'comprobacion' &&
      event.correct &&
      !event.hintUsed &&
      objectiveEvidence(event) &&
      num(event.difficulty, 1) >= targetDifficulty
    );

    const legacyReadyForVerification =
      safeLegacy.attempts >= 5 &&
      legacyStreak &&
      num(safeLegacy.maxDifficultyCorrect) >= targetDifficulty;

    const consistentByLegacyBridge = legacyReadyForVerification && verificationEvents.length >= 1;
    const selfcheckOnly = detailed.length > 0 && detailed.every(event => !objectiveEvidence(event));
    const seriousRegression = recentFailureAtOrBelow(objective, established || targetDifficulty);

    let state;
    if (totalAttempts <= 2 && !consistentByDetailed && !consistentByLegacyBridge) state = 'explorando';
    else if ((consistentByDetailed || consistentByLegacyBridge) && !selfcheckOnly) state = 'consistente';
    else state = 'en_desarrollo';

    if (previousAnalysis && STATE_RANK[previousAnalysis.state] >= STATE_RANK.consistente && !seriousRegression && !selfcheckOnly) {
      if (STATE_RANK[state] < STATE_RANK.consistente) state = 'consistente';
    }

    const previousConsistentSince = num(previousAnalysis?.consistentSince, 0);
    const consistentSince = STATE_RANK[state] >= STATE_RANK.consistente
      ? (previousConsistentSince || num(detailed[detailed.length - 1]?.at, now))
      : null;
    const retentionDueAt = consistentSince ? consistentSince + RETENTION_DAYS * DAY_MS : null;

    const retentionEvidence = retentionDueAt
      ? detailed.find(event =>
          num(event.at) >= retentionDueAt &&
          event.correct &&
          !event.hintUsed &&
          objectiveEvidence(event) &&
          num(event.difficulty, 1) >= targetDifficulty
        )
      : null;
    const retentionVerified = Boolean(retentionEvidence);
    const confidence = confidenceFor(safeLegacy, detailed, retentionVerified);

    if (state === 'consistente' && retentionVerified && confidence === 'alta') state = 'consolidado';
    if (previousAnalysis?.state === 'consolidado' && !seriousRegression && !selfcheckOnly) state = 'consolidado';

    const lastEvidenceAt = Math.max(num(safeLegacy.lastAt), num(detailed[detailed.length - 1]?.at));
    const strongRecentDetailed =
      recentObjective.slice(-3).length === 3 &&
      recentObjective.slice(-3).every(event => event.correct) &&
      recentObjective.slice(-3).filter(event => !event.hintUsed).length >= 2 &&
      distinctExercises(recentObjective.slice(-3)) >= 2;

    const needsVerification =
      STATE_RANK[state] < STATE_RANK.consistente &&
      !selfcheckOnly &&
      (legacyReadyForVerification || strongRecentDetailed || (recentScore != null && recentScore >= 0.78 && recentObjective.length >= 3));

    let preferredDifficulty = Math.min(2, maxAvailable);
    if (state === 'en_desarrollo') {
      const base = established || Math.min(Math.max(2, demonstrated), targetDifficulty);
      preferredDifficulty = trend === 'mejorando' || needsVerification
        ? Math.min(maxAvailable, Math.max(targetDifficulty, base))
        : Math.min(maxAvailable, Math.max(1.5, base));
      if (trend === 'revisar') preferredDifficulty = Math.max(1, preferredDifficulty - 0.75);
    } else if (state === 'consistente' || state === 'consolidado') {
      preferredDifficulty = Math.min(maxAvailable, Math.max(targetDifficulty, established || targetDifficulty));
    }

    let nextReviewAt = null;
    if (state === 'consistente') nextReviewAt = retentionDueAt;
    else if (state === 'consolidado') nextReviewAt = lastEvidenceAt ? lastEvidenceAt + CONSOLIDATED_REVIEW_DAYS * DAY_MS : now + CONSOLIDATED_REVIEW_DAYS * DAY_MS;
    else if (lastEvidenceAt) nextReviewAt = lastEvidenceAt + DAY_MS;

    const analysis = {
      version: VERSION,
      state,
      stateLabel: STATE_LABELS[state],
      trend,
      confidence,
      needsVerification,
      retentionVerified,
      targetDifficulty,
      preferredDifficulty: Number(preferredDifficulty.toFixed(2)),
      establishedDifficulty: established,
      demonstratedDifficulty: demonstrated,
      recentScore: recentScore == null ? null : Math.round(recentScore * 100),
      detailedEvidenceCount: detailed.length,
      legacyAttempts: num(safeLegacy.attempts),
      historicalAccuracy: safeLegacy.attempts ? Math.round(historicalAccuracy * 100) : null,
      distinctExercises: distinctExercises(detailed),
      consistentSince,
      retentionDueAt,
      nextReviewAt,
      lastEvidenceAt,
      selfcheckOnly,
      seriousRegression
    };
    analysis.qualitative = qualitativeMessage(analysis);
    return analysis;
  }

  function derivePurpose(analysis, { sessionType = 'practica', difficulty = 2, now = Date.now() } = {}) {
    if (sessionType === 'diagnostico') return 'exploracion';
    if (sessionType === 'simulacro') return 'evaluacion';
    if (analysis?.nextReviewAt && now >= analysis.nextReviewAt && ['consistente', 'consolidado'].includes(analysis.state)) return 'retencion';
    if (analysis?.needsVerification && num(difficulty, 1) >= num(analysis.targetDifficulty, 2)) return 'comprobacion';
    if (analysis?.establishedDifficulty && num(difficulty, 1) > analysis.establishedDifficulty) return 'desafio';
    return 'practica';
  }

  function createEventId(profileId, exerciseId, at = Date.now()) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return [String(profileId || 'p'), String(exerciseId || 'e'), String(at), Math.random().toString(36).slice(2, 10)].join('-');
  }

  function createEvidence({
    profileId,
    exercise,
    correct,
    hintUsed = false,
    sessionType = 'practica',
    origin = 'manual',
    purpose = 'practica',
    durationMs = null,
    evaluationWeight = 1,
    school = null,
    at = Date.now()
  }) {
    const exerciseSchool = Array.isArray(exercise?.colegios) && exercise.colegios.length === 1 && exercise.colegios[0] !== 'comun'
      ? exercise.colegios[0]
      : null;
    return {
      version: VERSION,
      eventId: createEventId(profileId, exercise?.id, at),
      profileId,
      at,
      exerciseId: String(exercise?.id || ''),
      skillId: String(exercise?.habilidad || ''),
      area: String(exercise?.area || ''),
      school: school || exerciseSchool || null,
      difficulty: clamp(num(exercise?.dificultad, 2), 1, 4),
      correct: Boolean(correct),
      hintUsed: Boolean(hintUsed),
      autonomous: !hintUsed,
      context: sessionType,
      origin,
      purpose,
      durationMs: durationMs == null ? null : Math.max(0, Math.round(num(durationMs))),
      evaluationMode: exercise?.tipo === 'selfcheck' ? 'selfcheck' : 'objective',
      evaluationWeight: clamp(num(evaluationWeight, 1), 0.4, 1)
    };
  }

  function applyAttempt(profile, exercise, event, { maxDifficulty = 4 } = {}) {
    if (!profile || !exercise || !event) return null;
    profile.progress ||= {};
    profile.evidence ||= [];
    profile.pendingEvidence ||= [];

    if (!profile.evidence.some(row => row.eventId === event.eventId)) profile.evidence.push(event);
    if (!profile.pendingEvidence.some(row => row.eventId === event.eventId)) profile.pendingEvidence.push(event);

    const skillId = exercise.habilidad;
    const row = profile.progress[skillId] || { attempts: 0, correct: 0, mastery: 0, lastAt: 0 };
    const skillEvidenceBefore = profile.evidence.filter(item => item.skillId === skillId && item.eventId !== event.eventId);
    const legacy = normalizedLegacy(row, skillEvidenceBefore);
    const previousAnalysis = row.pedagogy || analyzeSkill({
      legacy,
      evidence: skillEvidenceBefore,
      maxDifficulty,
      now: event.at
    });

    let oldEvidence = event.correct ? 52 + event.difficulty * 10 : Math.max(8, 38 - event.difficulty * 4);
    if (event.hintUsed && event.correct) oldEvidence -= 10;
    oldEvidence = Math.round(oldEvidence * event.evaluationWeight);
    const legacyMastery = num(row.attempts) === 0
      ? oldEvidence
      : Math.round(num(row.mastery) * 0.68 + oldEvidence * 0.32);
    const nextMastery = clamp(legacyMastery, 0, 100);
    const recent = [...bools(row.recent), Boolean(event.correct)].slice(-4);
    const previousLow = row.lowestMastery == null ? num(row.mastery, nextMastery) : num(row.lowestMastery);

    const allSkillEvidence = profile.evidence.filter(item => item.skillId === skillId);
    const analysis = analyzeSkill({
      legacy,
      evidence: allSkillEvidence,
      maxDifficulty,
      previousAnalysis,
      now: event.at
    });

    profile.progress[skillId] = {
      ...row,
      attempts: num(row.attempts) + 1,
      correct: num(row.correct) + (event.correct ? 1 : 0),
      mastery: nextMastery,
      lastAt: event.at,
      recent,
      lowestMastery: Math.min(previousLow, nextMastery),
      maxDifficultyCorrect: Math.max(num(row.maxDifficultyCorrect), event.correct ? event.difficulty : 0),
      legacy,
      pedagogy: analysis
    };
    return { event, analysis, previousAnalysis };
  }

  function ensureAnalysis(profile, skillId, { maxDifficulty = 4, now = Date.now() } = {}) {
    if (!profile) return null;
    profile.progress ||= {};
    profile.evidence ||= [];
    profile.pendingEvidence ||= [];
    const row = profile.progress[skillId];
    const skillEvidence = profile.evidence.filter(event => event.skillId === skillId);
    if (!row && !skillEvidence.length) return analyzeSkill({
      legacy: normalizedLegacy(null, []),
      evidence: [],
      maxDifficulty,
      now
    });

    const legacy = normalizedLegacy(row || {}, skillEvidence);
    const analysis = analyzeSkill({
      legacy,
      evidence: skillEvidence,
      maxDifficulty,
      previousAnalysis: row?.pedagogy || null,
      now
    });
    profile.progress[skillId] = { ...(row || {}), legacy, pedagogy: analysis };
    return analysis;
  }

  function stateRank(state) {
    return STATE_RANK[state] ?? 0;
  }

  return {
    VERSION,
    DAY_MS,
    RETENTION_DAYS,
    CONSOLIDATED_REVIEW_DAYS,
    STATES,
    STATE_LABELS,
    stateRank,
    normalizedLegacy,
    evidenceQuality,
    analyzeSkill,
    derivePurpose,
    createEvidence,
    applyAttempt,
    ensureAnalysis,
    qualitativeMessage
  };
});
