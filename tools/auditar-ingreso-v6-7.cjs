#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const BANK_PATH = path.join(APP, 'data', 'ejercicios.json');
const SKILLS_PATH = path.join(APP, 'data', 'habilidades.json');
const LAYERS = ['config.js', 'banco-v4.js', 'banco-v5.js', 'banco-v6.js', 'testeo.js'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fakeElement() {
  return {
    hidden: false,
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    setAttribute() {},
    insertAdjacentElement() {},
    showModal() {},
    close() {},
    style: {},
    textContent: '',
    innerHTML: ''
  };
}

async function buildRuntimeBank() {
  const base = readJson(BANK_PATH);
  const local = new Map();
  const document = {
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return fakeElement(); },
    head: fakeElement(),
    body: fakeElement()
  };

  const context = {
    console,
    Response,
    Request,
    Headers,
    URL,
    setTimeout,
    clearTimeout,
    document,
    navigator: { onLine: true },
    localStorage: {
      getItem(key) { return local.has(key) ? local.get(key) : null; },
      setItem(key, value) { local.set(key, String(value)); },
      removeItem(key) { local.delete(key); }
    }
  };
  context.window = context;
  context.globalThis = context;
  context.fetch = async input => {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json')) {
      return new Response(JSON.stringify(base), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
    throw new Error(`Fetch inesperado durante auditoría: ${url}`);
  };

  vm.createContext(context);
  for (const file of LAYERS) {
    const source = fs.readFileSync(path.join(APP, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  const response = await context.window.fetch('./data/ejercicios.json');
  assert.equal(response.ok, true, 'El banco efectivo debe poder construirse');
  return response.json();
}

function auditExercise(exercise, skillById) {
  assert.ok(exercise && typeof exercise === 'object', 'Cada actividad debe ser un objeto');
  assert.ok(exercise.id, 'Cada actividad debe tener ID');
  assert.ok(['matematica', 'lengua'].includes(exercise.area), `${exercise.id}: área inválida`);
  assert.ok(skillById.has(exercise.habilidad), `${exercise.id}: habilidad inexistente ${exercise.habilidad}`);
  assert.equal(skillById.get(exercise.habilidad).area, exercise.area, `${exercise.id}: habilidad y área no coinciden`);
  assert.ok(Number.isInteger(exercise.dificultad) && exercise.dificultad >= 1 && exercise.dificultad <= 4, `${exercise.id}: dificultad fuera de 1–4`);
  assert.ok(Array.isArray(exercise.colegios) && exercise.colegios.length > 0, `${exercise.id}: colegios ausentes`);
  exercise.colegios.forEach(school => assert.ok(['comun', 'belgrano', 'monserrat'].includes(school), `${exercise.id}: colegio inválido ${school}`));
  assert.ok(['choice', 'input', 'selfcheck'].includes(exercise.tipo), `${exercise.id}: tipo inválido`);
  assert.ok(String(exercise.consigna || '').trim(), `${exercise.id}: consigna vacía`);
  assert.ok(String(exercise.pista || '').trim(), `${exercise.id}: pista vacía`);
  assert.ok(String(exercise.explicacion || '').trim(), `${exercise.id}: explicación vacía`);

  if (exercise.tipo === 'choice') {
    assert.ok(Array.isArray(exercise.opciones) && exercise.opciones.length >= 3, `${exercise.id}: opciones insuficientes`);
    assert.ok(exercise.opciones.includes(exercise.respuesta), `${exercise.id}: la respuesta no está entre las opciones`);
    assert.equal(new Set(exercise.opciones).size, exercise.opciones.length, `${exercise.id}: opciones duplicadas`);
  }

  if (exercise.tipo === 'input') {
    assert.ok(String(exercise.respuesta ?? '').trim(), `${exercise.id}: respuesta vacía`);
    const alternatives = exercise.alternativas || [];
    assert.ok(Array.isArray(alternatives), `${exercise.id}: alternativas debe ser arreglo`);
    alternatives.forEach(value => {
      assert.notEqual(String(value), 'NaN', `${exercise.id}: alternativa NaN`);
      assert.notEqual(String(value), 'undefined', `${exercise.id}: alternativa undefined`);
    });
  }

  if (exercise.tipo === 'selfcheck') {
    assert.ok(Array.isArray(exercise.criterios) && exercise.criterios.length >= 4, `${exercise.id}: faltan criterios de autoevaluación`);
  }
}

async function main() {
  const bank = await buildRuntimeBank();
  const skills = readJson(SKILLS_PATH).habilidades || [];
  const skillById = new Map(skills.map(skill => [skill.id, skill]));
  const exercises = bank.ejercicios || [];

  assert.equal(exercises.length, 402, `Se esperaban 402 actividades y hay ${exercises.length}`);
  assert.equal(new Set(exercises.map(e => e.id)).size, exercises.length, 'Hay IDs de actividades duplicados');
  assert.equal(skills.length, 68, `Se esperaban 68 habilidades y hay ${skills.length}`);

  exercises.forEach(exercise => auditExercise(exercise, skillById));

  const byId = new Map(exercises.map(e => [e.id, e]));
  assert.deepEqual(byId.get('V5-M047').alternativas, [], 'V5-M047 no debe contener la alternativa NaN');
  assert.equal(byId.get('V5-L016').respuesta, 'al horario de la reunión', 'V5-L016 debe tener referente inequívoco');
  assert.equal(byId.get('V4-L051').respuesta, 'revelar', 'V4-L051 debe trabajar parónimos reales');
  assert.equal(byId.get('V6-L037').respuesta, 'sesión', 'V6-L037 debe trabajar sesión/cesión');

  const coverage = new Map(skills.map(skill => [skill.id, { total: 0, levels: new Set() }]));
  exercises.forEach(exercise => {
    const row = coverage.get(exercise.habilidad);
    row.total += 1;
    row.levels.add(exercise.dificultad);
  });
  for (const [skillId, row] of coverage) {
    assert.ok(row.total > 0, `${skillId}: habilidad sin actividades`);
  }

  const thin = [...coverage]
    .filter(([, row]) => row.total <= 3)
    .map(([id, row]) => `${id}:${row.total}[${[...row.levels].sort().join(',')}]`);

  console.log(`Banco V6.7 OK: ${exercises.length} actividades, ${skills.length} habilidades, ${bank.auditoriaV67?.corrected || 0} correcciones aplicadas.`);
  console.log(`Coberturas de 3 actividades o menos: ${thin.join(' · ')}`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
