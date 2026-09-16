const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V4.0.1 no fuerza scroll al refrescar el paso actual', () => {
  const ui = read('tercer-tiempo-v4-beta-ui/v4-ui.js');
  assert.match(ui, /applyMatchStep\(matchStep, \{ scroll: false \}\)/);
  assert.match(ui, /observer\.observe\(document\.documentElement, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(ui, /attributeFilter: \['class'\]/);
});

test('V4.0.1 carga correcciones de contraste y desplazamiento', () => {
  const html = read('tercer-tiempo-v4-beta-ui/index.html');
  const css = read('tercer-tiempo-v4-beta-ui/v4-fixes.css');
  const config = read('tercer-tiempo-v4-beta-ui/config.js');
  assert.match(html, /v4-fixes\.css/);
  assert.match(css, /overflow-y: auto !important/);
  assert.match(css, /touch-action: pan-y/);
  assert.match(css, /color: var\(--v4-ink\) !important/);
  assert.match(config, /4\.0\.1-beta-ui/);
});
