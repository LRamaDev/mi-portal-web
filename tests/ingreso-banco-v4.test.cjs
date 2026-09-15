const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'ingreso-belgrano-monserrat');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('el banco V4 es JavaScript válido y agrega 120 actividades', () => {
  const code = read('banco-v4.js');
  const sandbox = {
    window: { fetch: async () => ({ ok: false }) },
    console,
    Response: global.Response
  };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  assert.doesNotThrow(() => vm.runInContext(code, sandbox, { filename: 'banco-v4.js' }));
  assert.equal(sandbox.window.INGRESO_BANCO_V4.count, 120);
});

test('todos los ids V4 son únicos', () => {
  const code = read('banco-v4.js');
  const ids = [...code.matchAll(/['"](V4-[ML]\d{3})['"]/g)].map(match => match[1]);
  assert.equal(ids.length, 120);
  assert.equal(new Set(ids).size, 120);
});

test('las habilidades usadas por V4 existen en el mapa pedagógico', () => {
  const code = read('banco-v4.js');
  const skills = JSON.parse(read(path.join('data', 'habilidades.json'))).habilidades;
  const valid = new Set(skills.map(skill => skill.id));
  const used = [...code.matchAll(/['"]((?:MAT|LEN)-[A-Z-]+)['"]/g)].map(match => match[1]);
  assert.ok(used.length > 0);
  const missing = [...new Set(used)].filter(id => !valid.has(id));
  assert.deepEqual(missing, []);
});

test('la página y el service worker cargan el banco V4', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  assert.match(html, /banco-v4\.js/);
  assert.match(sw, /banco-v4\.js/);
  assert.match(sw, /ingreso-bm-v4-banco/);
  assert.match(html, /Simulacros completos · 100 puntos/);
});
