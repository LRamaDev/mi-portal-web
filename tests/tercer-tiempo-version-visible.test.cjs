const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('la versión visible se centraliza en config y se carga en la interfaz', () => {
  const config = read('tercer-tiempo-beta-v3/js/config.js');
  const html = read('tercer-tiempo-beta-v3/index.html');
  const ui = read('tercer-tiempo-beta-v3/js/version-ui.js');

  assert.match(config, /appVersion: '3\.2\.1'/);
  assert.match(config, /versionLabel: 'Beta v3\.2\.1'/);
  assert.match(html, /version-badge\.css/);
  assert.match(html, /js\/version-ui\.js/);
  assert.match(ui, /tt-version-badge/);
});
