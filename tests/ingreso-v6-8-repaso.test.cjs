'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const adaptivePath = path.join(APP, 'adaptive-v6-8.js');
const uiPath = path.join(APP, 'ui-v6-4.js');
const index = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8');
const adaptive = fs.readFileSync(adaptivePath, 'utf8');
const ui = fs.readFileSync(uiPath, 'utf8');
const core = require(adaptivePath);

function days(n) { return n * core.DAY_MS; }

test('los scripts V6.8 tienen sintaxis válida', () => {
  for (const file of [adaptivePath, uiPath]) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  }
  assert.equal(typeof core.intervalDays, 'function');
  assert.equal(typeof core.profileReviewStatus, 'function');
  assert.equal(typeof core.aggregateReviewStatus, 'function');
  assert.equal(typeof core.priorityAdjustment, 'function');
});

test('los intervalos internos aumentan a medida que sube el dominio', () => {
  assert.equal(core.intervalDays(20, 2), 1);
  assert.equal(core.intervalDays(39, 2), 1);
  assert.equal(core.intervalDays(40, 2), 2);
  assert.equal(core.intervalDays(64, 2), 2);
  assert.equal(core.intervalDays(65, 2), 4);
  assert.equal(core.intervalDays(84, 2), 4);
  assert.equal(core.intervalDays(85, 2), 7);
  assert.equal(core.intervalDays(100, 2), 7);
  assert.equal(core.intervalDays(80, 0), 0);
});

test('una habilidad débil vence antes que una habilidad firme', () => {
  const now = days(20);
  const weak = core.profileReviewStatus({ attempts: 3, mastery: 35, lastAt: now - days(1.2) }, now);
  const strong = core.profileReviewStatus({ attempts: 8, mastery: 90, lastAt: now - days(1.2) }, now);
  assert.equal(weak.due, true);
  assert.equal(weak.intervalDays, 1);
  assert.equal(strong.due, false);
  assert.equal(strong.intervalDays, 7);
});

test('en modo juntas alcanza con que un perfil tenga el repaso vencido', () => {
  const now = days(30);
  const status = core.aggregateReviewStatus([
    { attempts: 5, mastery: 88, lastAt: now - days(8) },
    { attempts: 5, mastery: 88, lastAt: now - days(2) }
  ], now);
  assert.equal(status.due, true);
  assert.equal(status.dueProfiles, 1);
  assert.ok(status.maxRatio > 1);
});

test('si un perfil todavía no vio una habilidad, la práctica compartida recibe un refuerzo de exposición', () => {
  const now = days(30);
  const status = core.aggregateReviewStatus([
    { attempts: 4, mastery: 78, lastAt: now - days(1) },
    undefined
  ], now);
  assert.equal(status.needsExposure, true);
  assert.equal(status.unseenProfiles, 1);
  assert.ok(core.priorityAdjustment(status, 0) > 0);
});

test('un repaso vencido recibe más prioridad que uno todavía fresco', () => {
  const due = { unseen:false, needsExposure:false, due:true, maxRatio:2.2 };
  const fresh = { unseen:false, needsExposure:false, due:false, maxRatio:0.2 };
  assert.ok(core.priorityAdjustment(due, 0) > core.priorityAdjustment(fresh, 0));
});

test('la bienvenida inicial queda limitada y usa estado privado por perfil', () => {
  assert.match(ui, /const VERSION = '6\.8\.1'/);
  assert.match(ui, /const MAX_VIEWS = 2/);
  assert.match(ui, /study_profile_intro_state/);
  assert.match(ui, /motivation_views/);
  assert.match(ui, /sessionStorage/);
});

test('V6.16 conserva el motor V6.8 y carga el sistema de insignias', () => {
  assert.match(index, /meta name="app-version" content="6\.15"/);
  assert.match(index, /\.\/adaptive-v6-8\.js/);
  assert.match(index, /\.\/choice-order-v6-8-2\.js/);
  assert.match(index, /\.\/badges-v6-9\.js/);
  assert.match(index, /\.\/badges-v6-9\.css/);
  assert.match(sw, /ingreso-bm-v6-16-estabilidad-y-progresion/);
  assert.match(sw, /adaptive-v6-8\.js/);
  assert.match(sw, /choice-order-v6-8-2\.js/);
  assert.match(sw, /badges-v6-9\.js/);
  assert.match(sw, /badges-v6-9\.css/);
  assert.match(adaptive, /practiceSelectionActive/);
  assert.match(adaptive, /MAT-FR-CON/);
  assert.match(adaptive, /Repaso espaciado/);
});
