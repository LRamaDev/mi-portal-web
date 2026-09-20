'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'ingreso-belgrano-monserrat');
const index = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');

const legacyFiles = [
  'testeo.js',
  'ui-v6-4.js',
  'adaptive-v6-8.js',
  'choice-order-v6-8-2.js'
];

test('la versión visible oficial sigue siendo 6.9', () => {
  assert.match(index, /<meta name="app-version" content="6\.9">/);
  assert.match(index, />Versión 6\.9<\/div>/);
});

test('los módulos heredados leen la versión oficial y ya no la pisan', () => {
  for (const file of legacyFiles) {
    const source = fs.readFileSync(path.join(APP, file), 'utf8');
    const start = source.indexOf('function setVisibleVersion()');
    assert.ok(start >= 0, `${file}: falta setVisibleVersion`);
    const next = source.indexOf('\n\n  function ', start + 10);
    const block = source.slice(start, next >= 0 ? next : start + 900);
    assert.match(block, /meta\?\.getAttribute\('content'\)/, `${file}: debe leer meta app-version`);
    assert.doesNotMatch(block, /meta\.setAttribute\('content'/, `${file}: no debe modificar app-version`);
    assert.match(block, /Versión \$\{releaseVersion\}/, `${file}: el cartel debe usar releaseVersion`);
  }
});
