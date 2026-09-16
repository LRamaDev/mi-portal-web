const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V3.3 mantiene visible la sincronización como estado de la app', () => {
  const index = read('tercer-tiempo-beta-v3/index.html');
  const ui = read('tercer-tiempo-beta-v3/js/v3-3-ui.js');
  const config = read('tercer-tiempo-beta-v3/js/config.js');

  assert.match(index, /v3-3\.css/);
  assert.match(index, /v3-3-ui\.js/);
  assert.match(config, /appVersion:\s*'3\.[3-9](?:\.\d+)?'/);
  assert.match(ui, /Nube activa/);
  assert.match(ui, /Solo dispositivo/);
  assert.match(ui, /tercer-tiempo-cloud-update/);
  assert.match(ui, /sync\.getSession/);
});

test('V3.3 conserva el compartir formación por WhatsApp como texto', () => {
  const ui = read('tercer-tiempo-beta-v3/js/v3-3-ui.js');

  assert.match(ui, /https:\/\/wa\.me\/\?text=/);
  assert.match(ui, /WhatsApp/);
  assert.match(ui, /teamAssignments/);
  assert.match(ui, /lineups/);
});

test('V3.3 mantiene el orden alfabético en convocatoria y edición de jugadores', () => {
  const ui = read('tercer-tiempo-beta-v3/js/v3-3-ui.js');

  assert.match(ui, /\.participant-picker/);
  assert.match(ui, /\.player-list/);
  assert.match(ui, /localeCompare\(b, 'es-AR'/);
  assert.match(ui, /sensitivity: 'base'/);
});
