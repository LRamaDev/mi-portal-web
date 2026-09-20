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

test('ningún módulo heredado puede sobrescribir la versión oficial', () => {
  for (const file of legacyFiles) {
    const source = fs.readFileSync(path.join(APP, file), 'utf8');

    const appVersionWriter = /const meta = document\.querySelector\('meta\[name="app-version"\]'\);(?:(?!\n\s*function ).)*meta\.setAttribute\('content'/s;
    assert.doesNotMatch(source, appVersionWriter, `${file}: no debe modificar meta app-version`);

    const hardcodedBadgeWriter = /badge\.textContent\s*=\s*`Versión \$\{(?:VERSION|DISPLAY_VERSION|PEDAGOGICAL_VERSION)\}`/;
    assert.doesNotMatch(source, hardcodedBadgeWriter, `${file}: el cartel no debe usar una versión interna`);

    const versionBlocks = source.match(/function (?:setVisibleVersion|setIntroVersion)\(\) \{[\s\S]*?\n  \}/g) || [];
    assert.ok(versionBlocks.length >= 1, `${file}: falta el bloque de versión esperado`);
    for (const block of versionBlocks) {
      assert.match(block, /meta\?\.getAttribute\('content'\)/, `${file}: cada bloque debe leer la versión oficial`);
      assert.match(block, /Versión \$\{releaseVersion\}/, `${file}: cada bloque debe mostrar releaseVersion`);
    }
  }
});
