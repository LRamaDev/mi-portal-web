'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../ingreso-belgrano-monserrat');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const rows = JSON.parse(read('data/ejercicios-refuerzo-noviembre.json')).ejercicios;
const check = require(path.join(root, 'respuestas-v6-21.js')).check;
const get = id => rows.find(e => e.id === id);

test('12 actividades nuevas, habilidades e IDs válidos, sin colisiones', () => {
  assert.equal(rows.length, 12);
  const existing = [
    ...JSON.parse(read('data/ejercicios.json')).ejercicios,
    ...JSON.parse(read('data/ejercicios-prioridades-octubre.json')).ejercicios
  ];
  assert.equal(new Set([...existing, ...rows].map(e => e.id)).size, existing.length + 12);
  const skills = new Map(JSON.parse(read('data/habilidades.json')).habilidades.map(s => [s.id, s]));
  for (const e of rows) {
    assert.equal(skills.get(e.habilidad)?.area, e.area, e.id);
    for (const key of ['consigna', 'pista', 'explicacion', 'errorFrecuente', 'criterioEvaluacion'])
      assert.ok(e[key]?.trim(), e.id + ' ' + key);
    if (e.tipo === 'choice') {
      assert.equal(e.opciones.length, 4);
      assert.equal(new Set(e.opciones).size, 4);
      assert.ok(e.opciones.includes(e.respuesta));
    }
  }
});

test('se validan operaciones matemáticas y irreductibilidad', () => {
  for (const [id, yes, no] of [
    ['NOV26-A-DEC-OPS-02', '1,485', '14,85'],
    ['NOV26-A-FR-PROB-01', '$3.994,75', '3995,75'],
    ['NOV26-V-FR-PROB-01', '60', '90'],
    ['NOV26-V-FR-OPS-01', '3/4', '6/8']
  ]) {
    assert.equal(check(get(id), yes), true, id);
    assert.equal(check(get(id), no), false, id);
  }
  assert.equal(get('NOV26-A-FR-ORD-01').respuesta, 'Joaquín > Tomás > Mateo');
  assert.equal(get('NOV26-V-FR-ORD-02').respuesta, '7/8 > 13/15 > 5/6');
});

test('narración con autoevaluación y video de apoyo sin corrección binaria', () => {
  const task = get('NOV26-V-LEN-PROD-01');
  assert.equal(task.tipo, 'selfcheck');
  assert.equal(task.maxOraciones, 4);
  assert.equal(task.criterios.length, 4);
  assert.ok(task.respuestaEjemplo);
  assert.equal(task.respuesta, undefined);
  const skills = JSON.parse(read('data/habilidades.json')).habilidades;
  assert.ok(skills.find(s => s.id === 'LEN-PROD').videos.length);
  assert.ok(skills.find(s => s.id === 'MAT-FR-ORD').videos[0].perfiles.includes('p1'));
});

test('loader agrega sin repetir IDs y conserva el banco si falla la descarga', async () => {
  let fail = false;
  const fake = async url => url.includes('refuerzo-noviembre')
    ? (fail ? new Response('', { status: 503 }) : new Response(JSON.stringify({ ejercicios: rows })))
    : new Response(JSON.stringify({ ejercicios: [{ id: 'BASE' }, rows[0]] }));
  const context = { window: { fetch: fake }, Response, console: { error() {} } };
  vm.createContext(context);
  vm.runInContext(read('banco-refuerzo-noviembre.js'), context);
  let data = await context.window.fetch('./data/ejercicios.json').then(r => r.json());
  assert.equal(data.ejercicios.length, 13);
  assert.equal(data.ejercicios[0].id, 'BASE');
  assert.equal(new Set(data.ejercicios.map(e => e.id)).size, 13);

  fail = true;
  const other = { window: { fetch: fake }, Response, console: { error() {} } };
  vm.createContext(other);
  vm.runInContext(read('banco-refuerzo-noviembre.js'), other);
  data = await other.window.fetch('./data/ejercicios.json').then(r => r.json());
  assert.equal(data.ejercicios.length, 2);
});

test('orden de carga y recursos versionados en service worker actual', () => {
  const h = read('index.html');
  const s = read('sw.js');
  const version = h.match(/meta name="app-version" content="(6\.\d+\.\d+)"/)?.[1];
  assert.ok(version, 'Debe existir una versión visible');
  assert.ok(h.indexOf('banco-v6-21.js?') < h.indexOf('banco-refuerzo-noviembre.js?'));
  assert.ok(h.indexOf('banco-refuerzo-noviembre.js?') < h.indexOf('app.js?'));
  assert.ok(s.includes(`./data/ejercicios-refuerzo-noviembre.json?v=${version}`));
  assert.ok(read('app.js').includes(`register('./sw.js?v=${version}')`));
});
