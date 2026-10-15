'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const APP = path.resolve(__dirname, '../ingreso-belgrano-monserrat');
const bank = fs.readFileSync(path.join(APP, 'banco-frac-ord.js'), 'utf8');
const app = fs.readFileSync(path.join(APP, 'app.js'), 'utf8');

async function exercises() {
  const context = {
    window: { fetch: async () => new Response(JSON.stringify({ ejercicios: [] })) },
    Response, console
  };
  vm.createContext(context);
  vm.runInContext(bank, context);
  return (await context.window.fetch('./data/ejercicios.json').then(r => r.json())).ejercicios;
}

test('las doce propuestas quedan disponibles para ambos colegios y con progresión 4-4-4', async () => {
  const rows = await exercises();
  assert.equal(rows.length, 12);
  assert.deepEqual(Array.from(rows, e => e.id), Array.from({ length: 12 }, (_, i) => `FRAC-ORD-${String(i + 1).padStart(3, '0')}`));
  assert.deepEqual(Array.from(rows, e => e.dificultad), [1,1,1,1,2,2,2,2,4,4,4,4]);
  for (const row of rows) {
    assert.equal(row.habilidad, 'MAT-FR-ORD');
    assert.deepEqual([...row.colegios], ['comun']);
    assert.ok(row.pista && row.explicacion && row.errorFrecuente);
    if (row.tipo === 'choice') assert.ok(row.opciones.includes(row.respuesta));
  }
  assert.equal(rows.find(e => e.id === 'FRAC-ORD-010').tipo, 'input');
});

test('el ejercicio 010 acepta toda fracción irreducible dentro del intervalo', async () => {
  const row = (await exercises()).find(e => e.id === 'FRAC-ORD-010');
  const start = app.indexOf('  function isCorrect(e, answer) {');
  const end = app.indexOf('  function lockCurrentInputs()', start);
  assert.ok(start >= 0 && end > start);
  const isCorrect = vm.runInNewContext(`${app.slice(start, end)}\nisCorrect;`);
  for (const value of ['1/2', '13/28', '  5 / 11 ', '49/100']) assert.equal(isCorrect(row, value), true, value);
  for (const value of ['7/14', '6/14', '3/7', '4/7', '2/3', '0,5', '3/0', 'texto']) assert.equal(isCorrect(row, value), false, value);
});

test('el nuevo banco se carga antes de iniciar la app y queda precacheado', () => {
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8');
  assert.match(html, /banco-frac-ord\.js\?v=6\.19/);
  assert.ok(html.indexOf('banco-frac-ord.js') < html.indexOf('app.js'));
  assert.match(sw, /banco-frac-ord\.js\?v=6\.19/);
});
