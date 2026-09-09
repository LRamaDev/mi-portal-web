const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const beta = path.join(root, 'app-transporte-beta');
const stable = path.join(root, 'app-transporte');

function read(name) {
  return fs.readFileSync(path.join(beta, name), 'utf8');
}

test('la beta está identificada y permite volver a la versión estable', () => {
  const html = read('index.html');
  assert.match(html, /Versión de prueba · ERSeP/);
  assert.match(html, /class="beta-banner"/);
  assert.ok((html.match(/href="\.\.\/app-transporte\/"/g) || []).length >= 2);
  assert.doesNotMatch(html, /id="admin-open"|id="admin-dialog"|admin\.js|admin-token/);
});

test('la beta reutiliza los datos y el logo de la aplicación estable', () => {
  const html = read('index.html');
  const transport = read('transporte.js');
  const history = read('historico.js');
  assert.equal(fs.existsSync(path.join(beta, 'data')), false);
  assert.match(html, /\.\.\/app-transporte\/assets\/logo-ersep\.png/);
  assert.match(transport, /DATA_BASE\s*=\s*'\.\.\/app-transporte\/'/);
  assert.match(history, /DATA_BASE\s*=\s*'\.\.\/app-transporte\/'/);
  assert.ok(fs.existsSync(path.join(stable, 'data', 'horarios.json')));
  assert.ok(fs.existsSync(path.join(stable, 'data', 'historico', 'indice.json')));
});

test('los recursos locales de la beta existen y su JavaScript es válido', () => {
  const html = read('index.html');
  const localResources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1].split('?')[0])
    .filter(value => !/^(?:https?:|#)/.test(value) && value !== '../');
  for (const resource of localResources) {
    assert.ok(fs.existsSync(path.resolve(beta, resource)), `No existe ${resource}`);
  }
  for (const name of ['recorridos.js', 'historico.js', 'transporte.js', 'asistente.js']) {
    assert.doesNotThrow(() => new vm.Script(read(name), { filename: name }));
  }
});

test('la interfaz conserva adaptaciones para celular y computadora', () => {
  const css = read('transporte.css');
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /@media\(max-width:420px\)/);
  assert.match(css, /\.assistant-form\{display:grid/);
  assert.match(css, /\.assistant-actions>\*\{width:100%\}/);
  assert.match(css, /\.beta-banner>div\{align-items:flex-start;flex-direction:column/);
});
