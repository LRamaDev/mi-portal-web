const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V3.4 carga los recursos y muestra la nueva versión', () => {
  const index = read('tercer-tiempo-beta-v3/index.html');
  const config = read('tercer-tiempo-beta-v3/js/config.js');

  assert.match(index, /v3-4\.css/);
  assert.match(index, /share-whatsapp-v3-4\.js/);
  assert.match(config, /appVersion: '3\.4\.0'/);
  assert.match(config, /versionLabel: 'Beta v3\.4\.0'/);
});

test('V3.4 comparte cancha y lista como PNG por WhatsApp', () => {
  const ui = read('tercer-tiempo-beta-v3/js/share-whatsapp-v3-4.js');

  assert.match(ui, /WhatsApp · Cancha/);
  assert.match(ui, /WhatsApp · Lista/);
  assert.match(ui, /createFormationCanvas/);
  assert.match(ui, /createListCanvas/);
  assert.match(ui, /image\/png/);
  assert.match(ui, /navigator\.share/);
  assert.match(ui, /navigator\.canShare/);
  assert.match(ui, /https:\/\/wa\.me\/\?text=/);
});

test('V3.4 tiene fallback de escritorio para copiar o descargar la imagen', () => {
  const ui = read('tercer-tiempo-beta-v3/js/share-whatsapp-v3-4.js');

  assert.match(ui, /ClipboardItem/);
  assert.match(ui, /navigator\.clipboard\.write/);
  assert.match(ui, /downloadBlob/);
  assert.match(ui, /Ctrl\+V/);
});

test('V3.4 reemplaza visualmente el WhatsApp de texto para no recargar la interfaz', () => {
  const ui = read('tercer-tiempo-beta-v3/js/share-whatsapp-v3-4.js');

  assert.match(ui, /data-v33-whatsapp/);
  assert.match(ui, /oldTextButton\.hidden = true/);
});
