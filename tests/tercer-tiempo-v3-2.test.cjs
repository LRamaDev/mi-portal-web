const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V3.2 carga la capa autónoma y la nueva cancha después de la app principal', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  assert.match(html, /href="\.\/v3-2\.css"/);
  assert.match(html, /src="\.\/js\/third-time-autonomous-ui\.js"/);
  assert.match(html, /src="\.\/js\/share-pitch-v3-2\.js"/);
  assert.ok(html.indexOf('app.jsx') < html.indexOf('third-time-autonomous-ui.js'));
});

test('el tercer tiempo puede definir participantes sin exigir equipos ni resultado', () => {
  const standalone = read('tercer-tiempo-beta-v3/js/third-time-autonomous-ui.js');
  assert.match(standalone, /También funciona por separado/);
  assert.match(standalone, /sin armar equipos ni registrar un resultado/);
  assert.match(standalone, /participantIds: nextIds/);
  assert.match(standalone, /teamAssignments:/);
  assert.match(standalone, /uploadLocalNow/);
});

test('la tarjeta de cancha usa una silueta de camiseta con cuello y puños', () => {
  const share = read('tercer-tiempo-beta-v3/js/share-pitch-v3-2.js');
  assert.match(share, /const jerseyPath/);
  assert.match(share, /quadraticCurveTo/);
  assert.match(share, /const TRIM = '#20252b'/);
  assert.match(share, /Compartir en cancha|compartir en cancha/);
  assert.match(share, /Formación orientativa · Tercer Tiempo/);
});

test('V3.2 mantiene la consolidación UX de V3.1', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  assert.match(html, /href="\.\/ux-v3-1\.css"/);
});
