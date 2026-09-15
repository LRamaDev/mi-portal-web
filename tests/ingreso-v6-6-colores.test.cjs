const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const uiPath = path.join(root, 'ingreso-belgrano-monserrat', 'ui-v6-4.js');
const swPath = path.join(root, 'ingreso-belgrano-monserrat', 'sw.js');
const ui = fs.readFileSync(uiPath, 'utf8');
const sw = fs.readFileSync(swPath, 'utf8');

test('UI V6.6 tiene sintaxis JavaScript válida', () => {
  const result = spawnSync(process.execPath, ['--check', uiPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('V6.6 define tema turquesa para Perfil 1', () => {
  assert.match(ui, /data-profile-theme="p1"/);
  assert.match(ui, /#e4faf6/);
  assert.match(ui, /#287f78/);
});

test('V6.6 define tema lila para Perfil 2', () => {
  assert.match(ui, /data-profile-theme="p2"/);
  assert.match(ui, /#f1e9fb/);
  assert.match(ui, /#755b9b/);
});

test('modo juntas combina visualmente ambos perfiles', () => {
  assert.match(ui, /data-profile-theme="together"/);
  assert.match(ui, /#e2f8f4/);
  assert.match(ui, /#eee5f8/);
});

test('la versión visible es 6.6 y el caché fuerza actualización', () => {
  assert.match(ui, /DISPLAY_VERSION = '6\.6'/);
  assert.match(sw, /ingreso-bm-v6-6-colores-perfil/);
});
