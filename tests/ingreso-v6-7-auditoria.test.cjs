'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const testeo = fs.readFileSync(path.join(APP, 'testeo.js'), 'utf8');
const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8');
const coverage = fs.readFileSync(path.join(APP, 'COBERTURA_V6_7.md'), 'utf8');

function syntaxCheck(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('los scripts modificados por V6.7 tienen sintaxis válida', () => {
  syntaxCheck(path.join(APP, 'testeo.js'));
  syntaxCheck(path.join(APP, 'sw.js'));
  syntaxCheck(path.join(ROOT, 'tools', 'auditar-ingreso-v6-7.cjs'));
});

test('la auditoría reconstruye y valida el banco efectivo de 402 actividades', () => {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'auditar-ingreso-v6-7.cjs')], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Banco V6\.7 OK: 402 actividades, 68 habilidades, 4 correcciones aplicadas\./);
});

test('V6.7 corrige los cuatro hallazgos concretos sin cambiar sus IDs', () => {
  for (const id of ['V5-M047', 'V5-L016', 'V4-L051', 'V6-L037']) {
    assert.match(testeo, new RegExp(id.replace('-', '\\-')));
  }
  assert.match(testeo, /alternativas:\s*\[\]/);
  assert.match(testeo, /al horario de la reunión/);
  assert.match(testeo, /respuesta:\s*'revelar'/);
  assert.match(testeo, /respuesta:\s*'sesión'/);
});

test('la matriz de cobertura documenta el banco completo y sus brechas prioritarias', () => {
  assert.match(coverage, /402 actividades/);
  assert.match(coverage, /36 habilidades de Matemática y 32 de Lengua/);
  assert.match(coverage, /`MAT-FR-CON` \| 2 \|/);
  assert.match(coverage, /`MAT-MULT` \| 3 \|/);
  assert.match(coverage, /`MAT-PROB` \| 3 \|/);
  assert.match(coverage, /`MAT-NAT-OPS` \| 21 \|/);
  assert.match(coverage, /`MAT-DEC-OPS` \| 16 \|/);
});

test('la versión visible y el caché quedan identificados como V6.7', () => {
  assert.match(testeo, /PEDAGOGICAL_VERSION = '6\.7'/);
  assert.match(sw, /ingreso-bm-v6-7-auditoria-pedagogica/);
});
