const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'tercer-tiempo-v4-beta-ui', 'v4-1-lineup.css'), 'utf8');
const config = fs.readFileSync(path.join(root, 'tercer-tiempo-v4-beta-ui', 'config.js'), 'utf8');
const lineup = fs.readFileSync(path.join(root, 'tercer-tiempo-v4-beta-ui', 'v4-1-lineup.js'), 'utf8');

assert.match(config, /appVersion:\s*'4\.1\.1-beta-ui'/);
assert.match(config, /versionLabel:\s*'V4\.1\.1 Beta UI'/);
assert.match(css, /\.team-move\.is-lineup-move\s*\{[\s\S]*display:\s*none\s*!important/);
assert.match(css, /\.team-player-copy strong\s*\{[\s\S]*white-space:\s*normal\s*!important/);
assert.match(lineup, /button\.click\(\)/);
assert.match(lineup, /ArrowUp/);
assert.match(lineup, /ArrowDown/);

console.log('Tercer Tiempo V4.1.1 compact lineup checks passed');
