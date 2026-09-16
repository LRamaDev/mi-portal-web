const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const appRoot = path.join(root, 'tercer-tiempo-v4-beta-ui');
const read = file => fs.readFileSync(path.join(appRoot, file), 'utf8');

const index = read('index.html');
const config = read('config.js');
const js = read('v4-1-lineup.js');
const css = read('v4-1-lineup.css');

assert.match(config, /appVersion:\s*'4\.1\.0-beta-ui'/);
assert.match(config, /versionLabel:\s*'V4\.1 Beta UI'/);
assert.match(index, /v4-1-lineup\.css/);
assert.match(index, /v4-1-lineup\.js/);

// Reordenamiento por arrastre: grip táctil/ratón + alternativa de teclado.
assert.match(js, /tt-v41-drag-handle/);
assert.match(js, /pointerdown/);
assert.match(js, /pointermove/);
assert.match(js, /ArrowUp/);
assert.match(js, /ArrowDown/);
assert.match(js, /team-move\.is-lineup-move/);
assert.match(css, /touch-action:\s*none/);
assert.match(css, /cursor:\s*grab/);

// El arquero se mantiene fijo y el rojo se espeja fila por fila sólo al dibujar.
assert.match(js, /index === 0/);
assert.match(js, /mirrorRedLineupByRows/);
assert.match(js, /slice\(cursor, cursor \+ count\)\.reverse\(\)/);
assert.match(js, /red:\s*\{/);
assert.match(js, /createFormationCanvas/);

console.log('Tercer Tiempo V4.1 lineup checks: OK');
