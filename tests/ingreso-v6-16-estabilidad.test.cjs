'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');
const syncUi = fs.readFileSync(path.join(APP, 'ui-v6-4.js'), 'utf8');
const sim = fs.readFileSync(path.join(APP, 'simulacros.js'), 'utf8');
const badgesPath = path.join(APP, 'badges-v6-9.js');
const bankPath = path.join(APP, 'banco-v6-16.js');

test('los archivos modificados conservan sintaxis válida', () => {
  for (const file of ['app.js','ui-v6-4.js','adaptive-v6-8.js','simulacros.js','badges-v6-9.js','banco-v6-16.js']) {
    const result = spawnSync(process.execPath, ['--check', path.join(APP, file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, file + ': ' + (result.stderr || result.stdout));
  }
});

test('el perfil activo se conserva localmente y la sincronización no recarga la página', () => {
  assert.match(app, /ACTIVE_MODE_KEY = 'ingreso-active-profile-v1'/);
  assert.match(app, /ACTIVE_VIEW_KEY = 'ingreso-active-view-v1'/);
  assert.match(app, /restoreActiveContext\(\)/);
  assert.match(app, /sessionStorage\.setItem/);
  assert.match(app, /ingreso:remote-state-updated/);
  assert.match(app, /ingreso:profile-changed/);
  assert.doesNotMatch(syncUi, /window\.setTimeout\(\(\) => window\.location\.reload\(\), 80\)/);
  assert.match(syncUi, /ingreso:remote-state-updated/);
});

test('la práctica evita repeticiones semánticas y ajusta dificultad por respuestas recientes', () => {
  assert.match(app, /function exerciseFingerprint\(e\)/);
  assert.match(app, /function dedupeExercises\(list\)/);
  assert.match(app, /usedExerciseFingerprintsRecently/);
  assert.match(app, /recent\.slice\(-3\)\.every\(Boolean\)/);
  assert.match(app, /recent\.slice\(-2\)\.every\(value => value === false\)/);
  assert.match(sim, /usedFingerprints/);
  assert.match(sim, /exerciseFingerprint\(e\)/);
});

test('el banco V6.16 agrega 48 actividades nuevas, equilibradas y complejas', async () => {
  const source = fs.readFileSync(bankPath, 'utf8');
  const base = { version: 1, ejercicios: [] };
  const context = {
    window: { fetch: async () => new Response(JSON.stringify(base)) },
    Response,
    console
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'banco-v6-16.js' });
  const data = await context.window.fetch('./data/ejercicios.json').then(r => r.json());
  assert.equal(data.ejercicios.length, 48);
  assert.equal(new Set(data.ejercicios.map(e => e.id)).size, 48);
  assert.equal(data.ejercicios.filter(e => e.area === 'matematica').length, 24);
  assert.equal(data.ejercicios.filter(e => e.area === 'lengua').length, 24);
  assert.ok(data.ejercicios.every(e => e.dificultad >= 3 && e.dificultad <= 4));
  assert.ok(data.ejercicios.filter(e => e.dificultad === 4).length >= 20);
});

test('las insignias incorporan progreso, videos, dificultad y superación', () => {
  delete require.cache[require.resolve(badgesPath)];
  const badges = require(badgesPath);
  assert.equal(badges.BADGES.length, 22);
  for (const id of ['nivel-ingreso','remontada','video-aprendo','video-practico','noventa-puntos']) {
    assert.ok(badges.BADGES.some(b => b.id === id), 'falta insignia ' + id);
  }
  const map = new Map([
    ['MAT-X',{area:'matematica'}], ['LEN-X',{area:'lengua'}]
  ]);
  const profile = {
    sessions: 20,
    videoLearning: { viewed:['MAT-X:a','LEN-X:b','MAT-Y:c'], practiced:['MAT-X','LEN-X','MAT-Y'] },
    progress: {
      'MAT-X': {attempts:8,correct:7,mastery:86,lowestMastery:55,maxDifficultyCorrect:4},
      'LEN-X': {attempts:8,correct:7,mastery:84,lowestMastery:60,maxDifficultyCorrect:4}
    },
    history: [{at:Date.now(),type:'simulacro',school:'belgrano',score:92,total:100,fullExam:true}]
  };
  const evaluated = badges.evaluateProfile(profile, map);
  assert.equal(evaluated.find(b => b.id === 'nivel-ingreso').earned, true);
  assert.equal(evaluated.find(b => b.id === 'remontada').earned, true);
  assert.equal(evaluated.find(b => b.id === 'video-aprendo').earned, true);
  assert.equal(evaluated.find(b => b.id === 'video-practico').earned, true);
  assert.equal(evaluated.find(b => b.id === 'noventa-puntos').earned, true);
});
