const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const appDir = path.join(root, 'ingreso-belgrano-monserrat');
const bankPath = path.join(appDir, 'banco-v6.js');
const uiPath = path.join(appDir, 'ui-v6.js');
const stylesPath = path.join(appDir, 'styles-v6.css');
const indexPath = path.join(appDir, 'index.html');
const swPath = path.join(appDir, 'sw.js');
const skillsPath = path.join(appDir, 'data', 'habilidades.json');

const bank = fs.readFileSync(bankPath, 'utf8');
const ui = fs.readFileSync(uiPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const sw = fs.readFileSync(swPath, 'utf8');
const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8')).habilidades;
const skillIds = new Set(skills.map(s => s.id));

test('banco V6 tiene sintaxis JavaScript válida', () => {
  const result = spawnSync(process.execPath, ['--check', bankPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('UI V6 tiene sintaxis JavaScript válida', () => {
  const result = spawnSync(process.execPath, ['--check', uiPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});

test('la V6 agrega exactamente 80 IDs únicos', () => {
  const ids = [...bank.matchAll(/['"](V6-[ML]\d{3})['"]/g)].map(m => m[1]);
  assert.equal(ids.length, 80);
  assert.equal(new Set(ids).size, 80);
  assert.equal(ids.filter(id => id.startsWith('V6-M')).length, 40);
  assert.equal(ids.filter(id => id.startsWith('V6-L')).length, 40);
});

test('todas las habilidades referenciadas en V6 existen en el mapa pedagógico', () => {
  const referenced = [...new Set([...bank.matchAll(/['"]((?:MAT|LEN)-[A-Z-]+)['"]/g)].map(m => m[1]))];
  const invalid = referenced.filter(id => !skillIds.has(id));
  assert.deepEqual(invalid, []);
});

test('la página carga V6 en el orden correcto', () => {
  assert.match(index, /styles-v6\.css/);
  assert.match(index, /banco-v6\.js/);
  assert.match(index, /ui-v6\.js/);
  assert.ok(index.indexOf('banco-v6.js') < index.indexOf('app.js'));
  assert.ok(index.indexOf('ui-v6.js') > index.indexOf('app.js'));
});

test('la salida segura sincroniza study_state antes de cerrar la sesión local', () => {
  assert.match(ui, /safeSignOut/);
  assert.match(ui, /from\('study_state'\)/);
  assert.match(ui, /remoteUpdatedAt <= localUpdatedAt/);
  assert.match(ui, /auth\.signOut\(\{ scope: 'local' \}\)/);
  assert.ok(ui.indexOf("from('study_state')") < ui.lastIndexOf("auth.signOut({ scope: 'local' })"));
});

test('la selección de perfil usa una transición de contracción y subida', () => {
  assert.match(ui, /v6-profile-leaving/);
  assert.match(ui, /v6-shell-rising/);
  assert.match(ui, /v6GateContract/);
  assert.match(ui, /v6ShellRise/);
});

test('el selector oculto no puede reaparecer debajo de la app', () => {
  assert.match(styles, /#profile-gate\[hidden\],#app-shell\[hidden\]\{display:none!important\}/);
});

test('la versión 6.3 queda visible incluso en la pantalla de acceso', () => {
  assert.match(index, /<meta name="app-version" content="6\.3">/);
  assert.match(index, /class="build-version"/);
  assert.match(index, />Versión 6\.3<\/div>/);
  assert.match(index, /z-index:100000/);
});

test('service worker cachea todos los recursos V6 renovados', () => {
  assert.match(sw, /ingreso-bm-v6-3-version-visible/);
  for (const asset of ['styles-v6.css','banco-v6.js','ui-v6.js']) assert.match(sw, new RegExp(asset.replace('.', '\\.')));
});
