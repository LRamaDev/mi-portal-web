'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const APP = path.resolve(__dirname, '../ingreso-belgrano-monserrat');
const read = file => fs.readFileSync(path.join(APP, file), 'utf8');
const source = JSON.parse(read('data/ejercicios-prioridades-octubre.json'));
const rows = source.ejercicios;
const fresh = rows.filter(e => e.lote === 'prioridades-22-octubre');
const answers = require(path.join(APP, 'respuestas-v6-21.js'));
const find = id => fresh.find(e => e.idFuente === id);

test('incorpora 90 actividades distintas y conserva las 12 pendientes sin colisiones', () => {
  assert.equal(rows.length, 102);
  assert.equal(fresh.length, 90);
  assert.equal(new Set(rows.map(e => e.id)).size, 102);
  assert.equal(fresh.filter(e => e.area === 'matematica').length, 60);
  assert.equal(fresh.filter(e => e.area === 'lengua').length, 30);
  assert.equal(fresh.filter(e => e.perfilOrigen === 'A').length, 70);
  assert.equal(fresh.filter(e => e.perfilOrigen === 'V').length, 20);
  assert.equal(fresh.filter(e => e.dificultad === 1).length, 27);
  assert.equal(fresh.filter(e => e.dificultad === 2).length, 36);
  assert.equal(fresh.filter(e => e.dificultad === 4).length, 27);
  for (let n = 1; n <= 12; n++) assert.ok(rows.some(e => e.id === `FRAC-ORD-${String(n).padStart(3, '0')}`));
  assert.notEqual(find('FRAC-ORD-001').id, 'FRAC-ORD-001');
});

test('la clasificación, las pistas y la presentación son válidas para ambos perfiles', () => {
  const skills = new Map(JSON.parse(read('data/habilidades.json')).habilidades.map(e => [e.id, e]));
  for (const e of rows) {
    assert.equal(e.area, skills.get(e.habilidad)?.area, e.id);
    assert.deepEqual(e.colegios, ['comun']);
    for (const key of ['consigna', 'pista', 'explicacion', 'subhabilidad', 'errorFrecuente', 'criterioEvaluacion']) assert.ok(e[key]?.trim(), e.id + ' ' + key);
    assert.doesNotMatch(JSON.stringify(e), /\\(?:frac|text|RK|anatomical)|<br|\*\*/);
    if (e.tipo === 'choice') {
      assert.ok(e.opciones.length >= 3 && e.opciones.includes(e.respuesta), e.id);
      assert.equal(new Set(e.opciones).size, e.opciones.length);
    }
  }
});

test('las cuentas numéricas y las unidades se corrigen por valor y respetan la irreductibilidad', () => {
  const cases = [
    ['FRAC-PROB-003', '8/14'], ['FRAC-PROB-005', String(15 / 3 * 8)],
    ['FRAC-PROB-006', '4/15'], ['FRAC-PROB-008', String(500 * 6)],
    ['DEC-OPER-002', '$18.475'], ['DEC-OPER-003', '$3.662,65'],
    ['DEC-OPER-007', '25.50 cm'], ['DEC-OPER-008', '$28.570,20'],
    ['DEC-OPER-010', '1.500 pesos'], ['PERIM-002', String(6 * 15)],
    ['PERIM-005', '36 metros'], ['PERIM-006', String(2 * (3 * 8 + 8))],
    ['PERIM-010', String(2 * (18 + 10) / 4)], ['FRAC-OPER-002', '6 kg'],
    ['FRAC-OPER-005', '2/5'], ['FRAC-OPER-006', '2/8 kg'],
    ['FRAC-OPER-008', '7/10'], ['FRAC-OPER-010', '30 m']
  ];
  for (const [id, value] of cases) {
    assert.equal(answers.check(find(id), value), true, id + ' ' + value);
    assert.equal(answers.check(find(id), '999999'), false, id);
    assert.equal(answers.check(find(id), '2/0'), false, id);
  }
  assert.equal(answers.check(find('FRAC-OPER-005'), '6/15'), false);
  assert.equal(answers.check(find('FRAC-OPER-008'), '0,7'), false);
  assert.equal(answers.check(find('PERIM-002'), '90 m'), false);
  assert.equal(answers.check(find('DEC-OPER-007'), '25,5 texto'), false);
});

test('intercalar no exige una única respuesta modelo y excluye extremos y fracciones reducibles', () => {
  for (const [id, valid, invalid] of [
    ['FRAC-ORD-009', ['1/2', '9/20', '7/13'], ['2/5', '3/5', '5/10']],
    ['FRAC-ORD-V09', ['1/2', '7/15', '8/15'], ['4/9', '5/9', '9/18']]
  ]) {
    for (const value of valid) assert.equal(answers.check(find(id), value), true, id + ' ' + value);
    for (const value of invalid) assert.equal(answers.check(find(id), value), false, id + ' ' + value);
  }
  const prior = rows.find(e => e.id === 'FRAC-ORD-010');
  assert.equal(answers.check(prior, '13/28'), true);
  assert.equal(answers.check(prior, '7/14'), false);
});

test('práctica y simulacro comparten corrector sin alterar respuestas textuales históricas', () => {
  for (const [file, signature] of [['app.js', 'function isCorrect(e, answer)'], ['simulacros.js', 'function isCorrect(exercise, answer)']]) {
    const code = read(file);
    const start = code.indexOf(signature);
    const end = code.indexOf('  function lock', start);
    const correct = vm.runInNewContext(code.slice(start, end) + '\nisCorrect;', { window: { IngresoAnswers: answers } });
    assert.equal(correct(find('FRAC-ORD-009'), '9/20'), true, file);
    assert.equal(correct(find('FRAC-ORD-009'), '5/10'), false, file);
    assert.equal(correct({ respuesta: 'sin embargo' }, ' Sin embargo '), true);
    assert.equal(correct({ respuesta: 'sí' }, 'si'), false);
  }
});

test('las producciones son breves, con criterios propios y ejemplo orientativo', () => {
  const open = fresh.filter(e => e.tipo === 'selfcheck');
  assert.equal(open.length, 9);
  for (const e of open) {
    assert.ok(e.maxOraciones >= 1 && e.maxOraciones <= 3);
    assert.equal(e.criterios.length, 4);
    assert.ok(e.respuestaEjemplo);
    assert.equal(e.respuesta, undefined);
  }
  assert.match(find('LENG-REV-007').respuesta, /tenía.*éxito.*seguíamos/);
  assert.match(find('LENG-PROD-005').respuestaEjemplo, /la palanca/);
  const sim = read('simulacros.js');
  const start = sim.indexOf('function productionRubric(total, exercise)');
  const end = sim.indexOf('\n  function ', start + 10);
  const rubric = vm.runInNewContext(sim.slice(start, end) + '\nproductionRubric;');
  const result = rubric(35, find('LENG-PROD-004'));
  assert.deepEqual(Array.from(result, e => e.label), find('LENG-PROD-004').criterios);
  assert.equal(result.reduce((sum, e) => sum + e.points, 0), 35);
});

async function loadBank(fetch) {
  const context = { window: { fetch }, Response, console: { error() {} } };
  vm.createContext(context);
  vm.runInContext(read('banco-v6-21.js'), context);
  return context;
}

test('la carga conserva el banco existente, es idempotente y permite otras peticiones', async () => {
  let sourceRequests = 0;
  const context = await loadBank(async url => {
    if (url.includes('prioridades-octubre')) { sourceRequests++; return new Response(JSON.stringify(source)); }
    return new Response(JSON.stringify({ ejercicios: [{ id: 'BASE' }, rows[0]] }));
  });
  for (let i = 0; i < 2; i++) {
    const bank = await context.window.fetch('./data/ejercicios.json').then(r => r.json());
    assert.equal(bank.ejercicios.length, 103);
    assert.equal(new Set(bank.ejercicios.map(e => e.id)).size, 103);
    assert.equal(bank.ejercicios[0].id, 'BASE');
  }
  assert.equal(sourceRequests, 1);
  const unrelated = await context.window.fetch('./data/habilidades.json').then(r => r.json());
  assert.equal(unrelated.ejercicios.length, 2);
});

test('si falla el archivo adicional se conserva el banco previo y se reintenta después', async () => {
  let requests = 0;
  const context = await loadBank(async url => {
    if (url.includes('prioridades-octubre')) {
      requests++;
      return requests === 1 ? new Response('', { status: 503 }) : new Response(JSON.stringify(source));
    }
    return new Response(JSON.stringify({ ejercicios: [{ id: 'BASE' }] }));
  });
  assert.equal((await context.window.fetch('./data/ejercicios.json').then(r => r.json())).ejercicios.length, 1);
  assert.equal((await context.window.fetch('./data/ejercicios.json').then(r => r.json())).ejercicios.length, 103);
});

test('los datos adicionales se precachean con la versión y ambos correctores cargan antes de su uso', () => {
  const html = read('index.html');
  const sw = read('sw.js');
  const version = html.match(/meta name="app-version" content="([^"]+)"/)[1];
  const dataUrl = `./data/ejercicios-prioridades-octubre.json?v=${version}`;
  assert.ok(sw.includes(dataUrl));
  assert.ok(read('banco-v6-21.js').includes(dataUrl));
  for (const file of ['banco-v6-21.js', 'respuestas-v6-21.js']) {
    assert.ok(html.indexOf(`./${file}?`) < html.indexOf('./app.js?'));
    assert.ok(sw.includes(`./${file}?v=${version}`));
  }
});
