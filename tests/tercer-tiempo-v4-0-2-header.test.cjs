const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('V4.0.2 corrige icono, subtitulo y contraste de nube', () => {
  const html = read('tercer-tiempo-v4-beta-ui/index.html');
  const config = read('tercer-tiempo-v4-beta-ui/config.js');
  const css = read('tercer-tiempo-v4-beta-ui/v4-0-2.css');
  const header = read('tercer-tiempo-v4-beta-ui/v4-header-fix.js');

  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-v4-beta-ui', 'icon.svg')));
  assert.match(html, /href="\.\/icon\.svg"/);
  assert.match(html, /v4-0-2\.css/);
  assert.match(html, /v4-header-fix\.js/);
  assert.match(config, /appVersion:\s*'4\.0\.2-beta-ui'/);
  assert.match(header, /\.brand-copy span/);
  assert.match(header, /group\?\.name/);
  assert.match(header, /\.\/icon\.svg/);
  assert.match(css, /\.tt-sync-badge\.is-online/);
  assert.match(css, /\.brand-copy span/);
});
