const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V3.4.1 deja un único acceso visible a compartir', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  const js = read('tercer-tiempo-beta-v3/js/share-menu-v3-4-1.js');
  const css = read('tercer-tiempo-beta-v3/v3-4-1.css');
  const config = read('tercer-tiempo-beta-v3/js/config.js');

  assert.match(config, /appVersion: '3\.4\.1'/);
  assert.match(html, /v3-4-1\.css/);
  assert.match(html, /share-menu-v3-4-1\.js/);
  assert.match(js, /data-v341-share-menu/);
  assert.match(js, />Compartir</);
  assert.match(js, /Distribución en cancha/);
  assert.match(js, /Lista de jugadores/);
  assert.match(js, /shareApi\.handleShare/);
  assert.match(css, /tt-share-menu-managed > \*:not\(\.tt-share-main-button\)/);
  assert.match(css, /display: none !important/);
});

test('el panel de compartir mantiene sólo las dos salidas de imagen pedidas', () => {
  const js = read('tercer-tiempo-beta-v3/js/share-menu-v3-4-1.js');

  assert.match(js, /data-share-kind="formation"/);
  assert.match(js, /data-share-kind="list"/);
  assert.doesNotMatch(js, /WhatsApp · Texto/);
});
