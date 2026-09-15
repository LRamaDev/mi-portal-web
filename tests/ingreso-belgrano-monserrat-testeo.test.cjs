const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'ingreso-belgrano-monserrat');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('el módulo de testeo familiar es JavaScript válido y se carga en la app', () => {
  const code = read('testeo.js');
  const html = read('index.html');
  const sw = read('sw.js');
  assert.doesNotThrow(() => new vm.Script(code, { filename: 'testeo.js' }));
  assert.match(html, /<script src="\.\/testeo\.js"><\/script>/);
  assert.match(sw, /\.\/testeo\.js/);
  assert.match(sw, /ingreso-bm-v3-testeo-familiar/);
});

test('el testeo ofrece cuatro valoraciones y evita pedir datos personales', () => {
  const code = read('testeo.js');
  for (const rating of ['facil', 'bien', 'dificil', 'confuso']) {
    assert.match(code, new RegExp(`data-rating="${rating}"`));
  }
  assert.match(code, /No escribas datos personales/);
  assert.match(code, /study_feedback/);
});
