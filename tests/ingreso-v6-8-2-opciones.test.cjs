'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const choicePath = path.join(APP, 'choice-order-v6-8-2.js');
const index = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8');
const { shuffleArray } = require(choicePath);

test('el parche de opciones tiene sintaxis válida y está cargado', () => {
  const result = spawnSync(process.execPath, ['--check', choicePath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(index, /\.\/choice-order-v6-8-2\.js/);
  assert.match(sw, /choice-order-v6-8-2\.js/);
  assert.match(sw, /ingreso-bm-v6-8-2-opciones-aleatorias/);
});

test('shuffleArray no modifica el banco original ni pierde opciones', () => {
  const original = ['correcta', 'b', 'c', 'd'];
  const shuffled = shuffleArray(original, () => 0);
  assert.deepEqual(original, ['correcta', 'b', 'c', 'd']);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
  assert.notDeepEqual(shuffled, original);
});

test('la opción correcta puede ocupar cualquiera de las posiciones sin sesgo fijo a la primera', () => {
  let state = 123456789;
  const random = () => {
    state = (1103515245 * state + 12345) % 2147483648;
    return state / 2147483648;
  };
  const counts = [0, 0, 0, 0];
  for (let i = 0; i < 4000; i += 1) {
    const shuffled = shuffleArray(['correcta', 'b', 'c', 'd'], random);
    counts[shuffled.indexOf('correcta')] += 1;
  }
  counts.forEach(count => assert.ok(count > 750 && count < 1250, `distribución inesperada: ${counts.join(',')}`));
});
