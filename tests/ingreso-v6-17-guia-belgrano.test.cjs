'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const bankPath = path.join(APP, 'banco-v6-17-belgrano.js');
const skillsPath = path.join(APP, 'data', 'habilidades.json');

test('el banco Belgrano V6.17 tiene sintaxis válida', () => {
  const result = spawnSync(process.execPath, ['--check', bankPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

async function buildExtra() {
  const base = { version: 1, ejercicios: [] };
  const context = {
    window: { fetch: async () => new Response(JSON.stringify(base)) },
    Response,
    console
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(bankPath, 'utf8'), context, { filename: 'banco-v6-17-belgrano.js' });
  return context.window.fetch('./data/ejercicios.json').then(r => r.json());
}

test('incorpora los 64 ejercicios de la guía con trazabilidad completa', async () => {
  const data = await buildExtra();
  const rows = data.ejercicios;
  assert.equal(rows.length, 64);
  assert.equal(new Set(rows.map(e => e.id)).size, 64);
  assert.deepEqual(rows.map(e => e.fuenteEjercicio).sort((a,b)=>a-b), Array.from({length:64},(_,i)=>i+1));
  assert.ok(rows.every(e => Array.isArray(e.colegios) && e.colegios.length === 1 && e.colegios[0] === 'belgrano'));
  assert.ok(rows.every(e => /Guía Integrada Resuelta/.test(e.fuente)));
  assert.equal(rows.filter(e => e.area === 'matematica').length, 50);
  assert.equal(rows.filter(e => e.area === 'lengua').length, 14);
});

test('las inconsistencias detectadas en la guía no ingresan silenciosamente', async () => {
  const data = await buildExtra();
  const byId = new Map(data.ejercicios.map(e => [e.id, e]));

  assert.match(byId.get('BEL26-003').consigna, /compuesto impar/);
  assert.match(byId.get('BEL26-003').ajusteFuente, /28 y 27/);

  assert.equal(byId.get('BEL26-049').respuesta, '48');
  assert.match(byId.get('BEL26-049').explicacion, /48 cm/);
  assert.match(byId.get('BEL26-049').ajusteFuente, /46 cm/);

  assert.match(byId.get('BEL26-051').respuesta, /crujido/);
  assert.match(byId.get('BEL26-051').ajusteFuente, /requiere j/);

  assert.doesNotMatch(byId.get('BEL26-061').consigna, /del texto/i);
  assert.match(byId.get('BEL26-061').ajusteFuente, /no aparecen/);

  assert.match(byId.get('BEL26-064').consigna, /frecuentes/);
  assert.match(byId.get('BEL26-064').ajusteFuente, /indispensables/);
});

test('la clasificación de habilidades refleja contenidos comunes acreditados por la guía Belgrano', () => {
  const skills = JSON.parse(fs.readFileSync(skillsPath, 'utf8')).habilidades;
  const byId = new Map(skills.map(s => [s.id, s]));
  for (const id of ['MAT-COMB','MAT-POT','MAT-FR-OPS','MAT-FR-DEC']) {
    assert.deepEqual(byId.get(id).colegios, ['comun'], id + ' debe quedar disponible para ambos ingresos');
  }
});

test('las actividades fuente cubren matemática y lengua con explicación utilizable por la app', async () => {
  const rows = (await buildExtra()).ejercicios;
  assert.ok(rows.every(e => typeof e.pista === 'string' && e.pista.trim()));
  assert.ok(rows.every(e => typeof e.explicacion === 'string' && e.explicacion.trim()));
  assert.ok(rows.every(e => Number.isInteger(e.dificultad) && e.dificultad >= 1 && e.dificultad <= 4));
  for (const e of rows.filter(e => e.tipo === 'choice')) {
    assert.ok(Array.isArray(e.opciones) && e.opciones.length >= 3);
    assert.ok(e.opciones.includes(e.respuesta));
    assert.equal(new Set(e.opciones).size, e.opciones.length);
  }
});
