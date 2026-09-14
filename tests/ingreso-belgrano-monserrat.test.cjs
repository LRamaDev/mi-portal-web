const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'ingreso-belgrano-monserrat');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('el motor de simulacros es JavaScript válido y está cargado por la app', () => {
  const code = read('simulacros.js');
  const html = read('index.html');
  const sw = read('sw.js');
  assert.doesNotThrow(() => new vm.Script(code, { filename: 'simulacros.js' }));
  assert.match(html, /<script src="\.\/simulacros\.js"><\/script>/);
  assert.match(sw, /\.\/simulacros\.js/);
  assert.match(sw, /ingreso-bm-v3-simulacros/);
});

test('los simulacros se presentan sobre 100 puntos y conservan las estructuras principales', () => {
  const code = read('simulacros.js');
  assert.match(code, /15\/12\/18\/10\/18\/9\/18/);
  assert.match(code, /Ortografía 18, Morfosintaxis 15, Discurso 32 y Producción 35/);
  assert.match(code, /Dos partes de 50 puntos/);
  assert.match(code, /22 consignas numeradas y 100 puntos/);
  assert.match(code, /score: earned, total: 100/);
});

test('la ponderación de las 22 consignas de Matemática Belgrano suma 100', () => {
  const code = read('simulacros.js');
  const match = code.match(/belgranoMathWeights\s*=\s*\[([^\]]+)\]/);
  assert.ok(match, 'No se encontró belgranoMathWeights');
  const weights = match[1].split(',').map(value => Number(value.trim()));
  assert.equal(weights.length, 22);
  assert.equal(weights.reduce((sum, value) => sum + value, 0), 100);
});

test('los simulacros completos exigen perfil individual y no muestran pistas', () => {
  const code = read('simulacros.js');
  assert.match(code, /El simulacro completo es individual/);
  assert.match(code, /Sin pistas/);
  assert.doesNotMatch(code, /Necesito una pista/);
});
