const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const APP = path.join(__dirname, '..', 'ingreso-belgrano-monserrat');
const read = file => fs.readFileSync(path.join(APP, file), 'utf8');
const app = read('app.js');
const security = read('seguridad.js');
const index = read('index.html');
const sql = read('supabase-study-visit-metrics-v6-19.sql');

test('el guardado principal confirma éxito aunque una evidencia complementaria quede pendiente', () => {
  const sync = app.slice(app.indexOf('async function syncRemoteState'), app.indexOf('function toast'));
  assert.match(sync, /await syncPendingEvidence\(\)/);
  assert.match(sync, /return true/);
  assert.doesNotMatch(sync, /return evidenceSynced/);
});

test('la app registra visitas y entradas de visitantes sin usar identidad familiar', () => {
  assert.match(security, /function trackAnonymousVisit/);
  assert.match(security, /event_type: eventType/);
  assert.match(security, /trackAnonymousVisit\('page_view'/);
  assert.match(security, /trackAnonymousVisit\('visitor_entry', 'visitor'\)/);
  assert.match(security, /crypto\.randomUUID\(\)/);
  assert.match(index, /id="family-visit-metrics"/);
  assert.match(app, /function renderVisitMetrics/);
});

test('las métricas son insertables sin registro y legibles solo para la cuenta familiar', () => {
  assert.match(sql, /create table if not exists public\.study_visit_events/);
  assert.match(sql, /No guarda nombres, correos, respuestas, progreso, IP/);
  assert.match(sql, /grant insert on table public\.study_visit_events to anon, authenticated/);
  assert.match(sql, /grant select on table public\.study_visit_events to authenticated/);
  assert.match(sql, /for select to authenticated/);
  assert.match(sql, /public\.study_access/);
});
