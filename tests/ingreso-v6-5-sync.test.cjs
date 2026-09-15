const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'ingreso-belgrano-monserrat');
const uiPath = path.join(appDir, 'ui-v6-4.js');
const swPath = path.join(appDir, 'sw.js');
const sqlPath = path.join(appDir, 'supabase-study-profile-state.sql');

const ui = fs.readFileSync(uiPath, 'utf8');
const sw = fs.readFileSync(swPath, 'utf8');
const sql = fs.readFileSync(sqlPath, 'utf8');

test('UI V6.5 tiene sintaxis JavaScript válida', () => {
  const result = spawnSync(process.execPath, ['--check', uiPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('la sincronización usa filas separadas para p1 y p2', () => {
  assert.match(ui, /const PROFILE_IDS = \['p1', 'p2'\]/);
  assert.match(ui, /study_profile_state/);
  assert.match(ui, /save_study_profile_state/);
  assert.match(ui, /p_profile_id: profileId/);
});

test('la copia vieja de un perfil no puede reemplazar una nueva', () => {
  assert.match(sql, /primary key \(user_id, profile_id\)/);
  assert.match(sql, /where coalesce\(nullif\(public\.study_profile_state\.payload->>'updatedAt'/);
  assert.match(sql, /<= incoming_ms/);
});

test('la app refresca progreso al volver, recuperar conexión o foco', () => {
  assert.match(ui, /visibilitychange/);
  assert.match(ui, /window\.addEventListener\('online', refreshFromCloud\)/);
  assert.match(ui, /window\.addEventListener\('focus', refreshFromCloud\)/);
});

test('la versión visible pasa a 6.5 y cambia el caché', () => {
  assert.match(ui, /const DISPLAY_VERSION = '6\.5'/);
  assert.match(ui, /Versión \$\{DISPLAY_VERSION\}/);
  assert.match(sw, /ingreso-bm-v6-5-sync-perfiles/);
});
