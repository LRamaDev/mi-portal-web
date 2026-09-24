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
  assert.match(result.stdout, /Banco V6\.7 OK: 402 actividades, 68 habilidades, 22 correcciones aplicadas\./);
});

test('V6.7 conserva IDs y corrige los hallazgos pedagógicos/estructurales', () => {
  const correctedIds = ['V5-M047', 'V5-L016', 'V5-L027', 'V5-L028', 'V5-L029', 'V5-L030', 'V4-L042', 'V4-L051', 'V6-L020', 'V6-L037'];
  for (const id of correctedIds) assert.match(testeo, new RegExp(id.replace('-', '\\-')));
  assert.match(testeo, /missingTextIds/);
  for (const id of ['V6-L026','V6-L027','V6-L028','V6-L029','V6-L030','V6-L031','V6-L032','V6-L033','V6-L034','V6-L035','V6-L036','V6-L038']) {
    assert.match(testeo, new RegExp(id.replace('-', '\\-')));
  }
  assert.match(testeo, /alternativas:\s*\[\]/);
  assert.match(testeo, /al horario de la reunión/);
  assert.match(testeo, /respuesta:\s*'revelar'/);
  assert.match(testeo, /respuesta:\s*'sesión'/);
  assert.match(testeo, /respuesta:\s*'bicicleta'/);
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

test('el parche V6.7 sigue presente y el caché puede avanzar a versiones posteriores', () => {
  assert.match(testeo, /PEDAGOGICAL_VERSION = '6\.7'/);
  assert.match(sw, /ingreso-bm-v6-15-cache-videos/);
});
