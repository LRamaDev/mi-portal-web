'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const pedagogyPath = path.join(APP, 'pedagogy-v6-18.js');
const engine = require(pedagogyPath);
const DAY = engine.DAY_MS;

function exercise(id, difficulty = 3, type = 'input') {
  return {
    id,
    habilidad: 'SKILL-X',
    area: 'matematica',
    colegios: ['comun'],
    dificultad: difficulty,
    tipo: type
  };
}

function emptyProfile(progress = {}) {
  return { progress: { ...progress }, evidence: [], pendingEvidence: [], history: [], sessions: 0 };
}

function event(profileId, ex, correct, at, extra = {}) {
  return engine.createEvidence({
    profileId,
    exercise: ex,
    correct,
    hintUsed: false,
    sessionType: 'practica',
    origin: 'manual',
    purpose: 'practica',
    durationMs: 45000,
    evaluationWeight: ex.tipo === 'selfcheck' ? .65 : 1,
    at,
    ...extra
  });
}

test('el motor V6.18 tiene sintaxis válida y expone el modelo pedagógico', () => {
  const result = spawnSync(process.execPath, ['--check', pedagogyPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(engine.STATES, ['sin_evidencia','explorando','en_desarrollo','consistente','consolidado']);
  assert.equal(engine.RETENTION_DAYS, 3);
  assert.equal(engine.CONSOLIDATED_REVIEW_DAYS, 7);
});

test('un único acierto difícil sigue siendo Explorando y confianza baja', () => {
  const profile = emptyProfile();
  const ex = exercise('ONE-D4', 4);
  const ev = event('p1', ex, true, 1000000);
  const { analysis } = engine.applyAttempt(profile, ex, ev, { maxDifficulty: 4 });

  assert.equal(profile.progress['SKILL-X'].attempts, 1);
  assert.equal(analysis.state, 'explorando');
  assert.equal(analysis.confidence, 'baja');
  assert.notEqual(analysis.state, 'consistente');
  assert.notEqual(analysis.state, 'consolidado');
});

test('un mastery histórico alto con un solo intento migra a Explorando y confianza baja', () => {
  const legacy = {
    version:1, attempts:1, correct:1, mastery:92, lastAt:1000,
    recent:[true], maxDifficultyCorrect:4, lowestMastery:92
  };
  const analysis = engine.analyzeSkill({ legacy, evidence: [], maxDifficulty:4, now:2000 });
  assert.equal(analysis.state, 'explorando');
  assert.equal(analysis.confidence, 'baja');
  assert.equal(analysis.needsVerification, false);
});

test('caso A: 18 intentos, 9 aciertos y tres recientes correctos pide comprobación en vez de quedar anclado al 50%', () => {
  const legacy = {
    version: 1,
    attempts: 18,
    correct: 9,
    mastery: 75,
    lastAt: 1000000,
    recent: [false, true, true, true],
    maxDifficultyCorrect: 3,
    lowestMastery: 28
  };
  const initial = engine.analyzeSkill({ legacy, evidence: [], maxDifficulty: 4, now: 1000000 + DAY });

  assert.equal(initial.state, 'en_desarrollo');
  assert.equal(initial.trend, 'mejorando');
  assert.equal(initial.needsVerification, true);
  assert.equal(initial.confidence, 'media');
  assert.ok(initial.preferredDifficulty >= 3);

  const profile = emptyProfile({
    'SKILL-X': {
      attempts: 18, correct: 9, mastery: 75, lastAt: 1000000,
      recent: [false,true,true,true], maxDifficultyCorrect: 3,
      lowestMastery: 28, legacy, pedagogy: initial
    }
  });
  const ex = exercise('A-CHECK', 3);
  const ev = event('p1', ex, true, 1000000 + DAY, { purpose: 'comprobacion' });
  const result = engine.applyAttempt(profile, ex, ev, { maxDifficulty: 4 });

  assert.equal(result.analysis.state, 'consistente');
  assert.equal(result.analysis.retentionVerified, false);
  assert.equal(profile.progress['SKILL-X'].legacy.attempts, 18);
  assert.equal(profile.progress['SKILL-X'].attempts, 19);
});

test('errores históricos no son deuda permanente: cuatro aciertos recientes, variados y autónomos permiten Consistente', () => {
  const profile = emptyProfile({
    'SKILL-X': {
      attempts: 5, correct: 1, mastery: 25, lastAt: 1000,
      recent: [false,false,false,false], maxDifficultyCorrect: 2
    }
  });

  for (let i = 0; i < 4; i++) {
    const ex = exercise('RECENT-' + i, 3);
    const ev = event('p1', ex, true, 2000000 + i * 60000);
    engine.applyAttempt(profile, ex, ev, { maxDifficulty: 4 });
  }

  const analysis = profile.progress['SKILL-X'].pedagogy;
  assert.equal(analysis.state, 'consistente');
  assert.ok(analysis.recentScore >= 90);
  assert.equal(profile.progress['SKILL-X'].legacy.attempts, 5);
  assert.equal(profile.progress['SKILL-X'].legacy.correct, 1);
});

test('fallar un desafío superior no borra el nivel ya establecido', () => {
  const profile = emptyProfile();
  for (let i = 0; i < 4; i++) {
    const ex = exercise('BASE-' + i, 3);
    engine.applyAttempt(profile, ex, event('p1', ex, true, 3000000 + i * 60000), { maxDifficulty: 4 });
  }
  assert.equal(profile.progress['SKILL-X'].pedagogy.state, 'consistente');
  assert.equal(profile.progress['SKILL-X'].pedagogy.establishedDifficulty, 3);

  const challenge = exercise('CHALLENGE-D4', 4);
  engine.applyAttempt(profile, challenge, event('p1', challenge, false, 3000000 + 10 * 60000, { purpose:'desafio' }), { maxDifficulty: 4 });

  const after = profile.progress['SKILL-X'].pedagogy;
  assert.equal(after.state, 'consistente');
  assert.equal(after.seriousRegression, false);
  assert.equal(after.establishedDifficulty, 3);
});

test('la retención exige separación temporal; no alcanza una racha del mismo día', () => {
  const base = 5000000;
  const profile = emptyProfile();

  for (let i = 0; i < 4; i++) {
    const ex = exercise('CONSISTENT-' + i, 3);
    engine.applyAttempt(profile, ex, event('p1', ex, true, base + i * 60000), { maxDifficulty: 4 });
  }
  const first = profile.progress['SKILL-X'].pedagogy;
  assert.equal(first.state, 'consistente');
  assert.equal(first.retentionVerified, false);

  const tooSoon = exercise('TOO-SOON', 3);
  engine.applyAttempt(profile, tooSoon, event('p1', tooSoon, true, first.consistentSince + 2 * DAY, { purpose:'practica' }), { maxDifficulty: 4 });
  assert.equal(profile.progress['SKILL-X'].pedagogy.state, 'consistente');
  assert.equal(profile.progress['SKILL-X'].pedagogy.retentionVerified, false);

  const later = exercise('RETENTION', 3);
  engine.applyAttempt(profile, later, event('p1', later, true, first.consistentSince + 4 * DAY, { purpose:'retencion' }), { maxDifficulty: 4 });
  const retained = profile.progress['SKILL-X'].pedagogy;
  assert.equal(retained.retentionVerified, true);
  assert.equal(retained.confidence, 'alta');
  assert.equal(retained.state, 'consolidado');
});

test('caso V: autoevaluaciones de producción escrita no permiten declarar Consistente por sí solas', () => {
  const legacy = {
    version:1, attempts:11, correct:6, mastery:27, lastAt:1000,
    recent:[false,true,false,true], maxDifficultyCorrect:4, lowestMastery:30
  };
  const profile = emptyProfile({
    'SKILL-X': {
      attempts:11, correct:6, mastery:27, lastAt:1000,
      recent:[false,true,false,true], maxDifficultyCorrect:4,
      lowestMastery:30, legacy
    }
  });

  for (let i = 0; i < 4; i++) {
    const ex = exercise('PROD-' + i, 4, 'selfcheck');
    const ev = event('p2', ex, true, 7000000 + i * 60000, {
      evaluationWeight:.65,
      purpose:'practica'
    });
    engine.applyAttempt(profile, ex, ev, { maxDifficulty:4 });
  }

  const analysis = profile.progress['SKILL-X'].pedagogy;
  assert.equal(analysis.selfcheckOnly, true);
  assert.equal(analysis.state, 'en_desarrollo');
  assert.notEqual(analysis.state, 'consistente');
});

test('los contadores compatibles se reconstruyen desde baseline + evidencia aunque un payload haya quedado atrasado', () => {
  const legacy = {
    version:1, attempts:18, correct:9, mastery:75, lastAt:1000,
    recent:[true,true,true], maxDifficultyCorrect:3, lowestMastery:59
  };
  const ex1 = exercise('SYNC-1',3);
  const ex2 = exercise('SYNC-2',3);
  const profile = {
    progress:{'SKILL-X':{attempts:19,correct:10,mastery:75,lastAt:2000,legacy}},
    evidence:[
      event('p1',ex1,true,2000),
      event('p1',ex2,true,3000)
    ],
    pendingEvidence:[],history:[],sessions:0
  };
  engine.ensureAnalysis(profile,'SKILL-X',{maxDifficulty:4,now:4000});
  assert.equal(profile.progress['SKILL-X'].attempts,20);
  assert.equal(profile.progress['SKILL-X'].correct,11);
  assert.equal(profile.progress['SKILL-X'].lastAt,3000);
});

test('cada evidencia registra los campos requeridos y conserva autonomía/ayudas/tiempo/contexto', () => {
  const ex = { ...exercise('FIELDS', 3), colegios:['belgrano'] };
  const ev = engine.createEvidence({
    profileId:'p1', exercise:ex, correct:true, hintUsed:true,
    sessionType:'practica', origin:'video', purpose:'comprobacion',
    durationMs:32123, evaluationWeight:1, school:'belgrano', at:123456789
  });
  for (const field of [
    'eventId','profileId','at','exerciseId','skillId','area','school','difficulty',
    'correct','hintUsed','autonomous','context','origin','purpose','durationMs',
    'evaluationMode','evaluationWeight'
  ]) assert.ok(Object.hasOwn(ev, field), 'falta ' + field);
  assert.equal(ev.profileId,'p1');
  assert.equal(ev.exerciseId,'FIELDS');
  assert.equal(ev.skillId,'SKILL-X');
  assert.equal(ev.school,'belgrano');
  assert.equal(ev.difficulty,3);
  assert.equal(ev.correct,true);
  assert.equal(ev.hintUsed,true);
  assert.equal(ev.autonomous,false);
  assert.equal(ev.context,'practica');
  assert.equal(ev.origin,'video');
  assert.equal(ev.purpose,'comprobacion');
  assert.equal(ev.durationMs,32123);
});

test('la migración Supabase es aditiva, append-only y expone una vista adulta', () => {
  const sql = fs.readFileSync(path.join(APP, 'supabase-study-attempt-evidence-v6-18.sql'), 'utf8');
  assert.match(sql, /create table if not exists public\.study_attempt_evidence/);
  assert.match(sql, /event_id text primary key/);
  assert.match(sql, /hint_used boolean/);
  assert.match(sql, /duration_ms integer/);
  assert.match(sql, /evaluation_mode text/);
  assert.match(sql, /revoke update, delete on table public\.study_attempt_evidence/);
  assert.match(sql, /create or replace view public\.study_skill_current/);
  assert.doesNotMatch(sql, /delete from public\.study_(?:state|profile_state)/i);
  assert.doesNotMatch(sql, /drop table/i);
});

test('la interfaz de alumnas no vuelve a mostrar porcentajes de mastery ni comparaciones en modo juntas', () => {
  const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');
  const index = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  assert.doesNotMatch(app, /% de dominio estimado/);
  assert.doesNotMatch(app, /\$\{summary\.mastery\}%/);
  assert.doesNotMatch(app, /\$\{progress\.mastery\}%/);
  assert.match(app, /En modo juntas no mostramos avances de un perfil al otro/);
  assert.match(index, /No muestra notas ni porcentajes de dominio/);
  assert.match(index, />Mi recorrido<\/button>/);
});

test('el historial queda protegido y ya no existe el reinicio destructivo desde la app', () => {
  const config = fs.readFileSync(path.join(APP, 'config.js'), 'utf8');
  assert.match(config, /history-protection-note/);
  assert.match(config, /Historial protegido/);
  assert.doesNotMatch(config, /reset-all-progress/);
  assert.doesNotMatch(config, /current\.profiles\[id\]\.history = \[\]/);
});

test('la sincronización une evidencias, sesiones y progreso en vez de reemplazarlos', () => {
  const sync = fs.readFileSync(path.join(APP, 'ui-v6-4.js'), 'utf8');
  assert.match(sync, /function mergeEvidenceRows/);
  assert.match(sync, /function mergeHistoryRows/);
  assert.match(sync, /function mergeProgressMaps/);
  assert.match(sync, /function mergeProfilePayload/);
  assert.match(sync, /merged\.progress = mergeProgressMaps/);
  assert.match(sync, /merged\.history = mergeHistoryRows/);
  assert.match(sync, /merged\.evidence = mergeEvidenceRows/);
  assert.match(sync, /merged\.pendingEvidence = mergeEvidenceRows/);
});

test('las sesiones futuras dejan de recortarse a las últimas 60', () => {
  const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');
  const sim = fs.readFileSync(path.join(APP, 'simulacros.js'), 'utf8');
  assert.doesNotMatch(app, /history\s*=.*slice\(-60\)/);
  assert.doesNotMatch(sim, /history\s*=.*slice\(-60\)/);
});
