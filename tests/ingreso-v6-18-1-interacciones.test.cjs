'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const read = file => fs.readFileSync(path.join(APP, file), 'utf8');

const index = read('index.html');
const app = read('app.js');

test('todos los módulos interactivos conservan sintaxis JavaScript válida', () => {
  const files = [
    'app.js','simulacros.js','ui-v6.js','ui-v6-4.js','adaptive-v6-8.js',
    'badges-v6-9.js','choice-order-v6-8-2.js','testeo.js','seguridad.js','config.js',
    'pedagogy-v6-18.js'
  ];
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', path.join(APP, file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, file + ': ' + (result.stderr || result.stdout));
  }
});

test('bindUI no usa querySelector simple como si fuera una lista', () => {
  const start = app.indexOf('  function bindUI() {');
  const end = app.indexOf('\n  function cloneDefault()', start);
  assert.ok(start >= 0 && end > start, 'no se encontró bindUI');
  const block = app.slice(start, end);

  // Regresión exacta que rompió múltiples clicks en V6.18:
  // $('selector') devuelve un único elemento y no admite .forEach.
  assert.doesNotMatch(block, /(^|[^$])\$\([^\n;]*\)\.forEach/gm);
  assert.match(block, /\$\$\('\[data-practice\]'\)\.forEach/);
  assert.match(block, /\$\$\('\[data-sim-school\]'\)\.forEach/);
  assert.match(block, /\$\$\('\[data-nav\]'\)\.forEach/);
  assert.match(block, /\$\$\('\[data-skill-filter\]'\)\.forEach/);
});

test('todos los controles estáticos que app.js enlaza por id existen en index.html', () => {
  const ids = [...app.matchAll(/\$\('#([^']+)'\)\.addEventListener/g)].map(match => match[1]);
  assert.ok(ids.length >= 12, 'se esperaban controles enlazados por id');
  for (const id of new Set(ids)) {
    assert.match(index, new RegExp('id=["\\\']' + id.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&') + '["\\\']'), 'falta #' + id);
  }
});

test('cada destino de navegación visible tiene una vista correspondiente', () => {
  const navs = [...index.matchAll(/data-nav="([^"]+)"/g)].map(match => match[1]);
  const views = new Set([...index.matchAll(/data-view="([^"]+)"/g)].map(match => match[1]));
  assert.ok(navs.length >= 10);
  for (const nav of navs) assert.ok(views.has(nav), 'data-nav sin vista: ' + nav);
});

test('los botones principales de entrenamiento y simulacro están completos', () => {
  const practice = [...index.matchAll(/<button[^>]+data-practice="([^"]+)"[^>]*>/g)].map(match => match[1]);
  assert.deepEqual(practice.sort(), ['lengua','matematica']);

  const simulations = [...index.matchAll(/<button[^>]+data-sim-school="([^"]+)"[^>]+data-sim-area="([^"]+)"[^>]*>/g)]
    .map(match => match.slice(1,3).join(':'))
    .sort();
  assert.deepEqual(simulations, [
    'belgrano:lengua','belgrano:matematica','monserrat:lengua','monserrat:matematica'
  ]);
});

test('los contenedores con delegación de clicks existen y sus manejadores siguen enlazados', () => {
  for (const id of ['video-library','skills-container','family-tutoring-panel']) {
    assert.match(index, new RegExp('id="' + id + '"'));
  }
  assert.match(app, /\$\('#video-library'\)\.addEventListener\('click', handleVideoAction\)/);
  assert.match(app, /\$\('#skills-container'\)\.addEventListener\('click', handleSkillResourceAction\)/);
  assert.match(app, /\$\('#family-tutoring-panel'\)\.addEventListener\('click'/);
});

test('los interceptores globales de clicks están limitados a acciones intencionales', () => {
  const ui = read('ui-v6.js');
  const together = read('ui-v6-4.js');
  const sim = read('simulacros.js');

  assert.match(ui, /closest\?\.\('\.profile-card\[data-profile\]'\)/);
  assert.match(sim, /closest\?\.\('\.exam-button\[data-sim-school\]\[data-sim-area\]'\)/);
  assert.match(together, /if \(!togetherMode\) return;/);
  assert.doesNotMatch(app, /document\.addEventListener\('click',[\s\S]{0,220}stopImmediatePropagation/);
});

test('la reparación fuerza una caché nueva y assets V6.18.1', () => {
  const sw = read('sw.js');
  assert.match(index, /meta name="app-version" content="6\.18\.1"/);
  assert.match(index, /app\.js\?v=6\.18\.1/);
  assert.match(app, /serviceWorker\.register\('\.\/sw\.js\?v=6\.18\.1'\)/);
  assert.match(sw, /ingreso-bm-v6-18-1-interacciones/);
  assert.match(sw, /const VERSION='6\.18\.1'/);
});
