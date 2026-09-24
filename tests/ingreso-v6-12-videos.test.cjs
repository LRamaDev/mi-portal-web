'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'ingreso-belgrano-monserrat');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles-v6.css'), 'utf8');
const skillIds = new Set(JSON.parse(fs.readFileSync(path.join(root, 'data/habilidades.json'), 'utf8')).habilidades.map(row => row.id));
const match = app.match(/const VIDEO_RESOURCES = (\{[\s\S]*?\n  \});/);
assert.ok(match, 'debe existir el catálogo de videos curados');
const catalog = vm.runInNewContext(`(${match[1]})`);

test('cada recurso elegido queda asociado a la habilidad y al perfil correctos', () => {
  const expected = {
    p1: {
      'MAT-MED-LONG': 'FvLXSPXaKFI', 'MAT-ANG-CS': 'RhtBGxdYSJI',
      'LEN-REV': '7Rf1w8UT_rg',
      'MAT-DEC-OPS': 'y_F5eXD8Cb0', 'MAT-PER': 'OTT8SKMdBD8'
    },
    p2: {
      'MAT-FR-ORD': 'ZqnHbXCCSIc', 'MAT-FR-OPS': 'qJtoI1ipxs8',
      'MAT-CIRC': 'bG3f36JQkuA', 'MAT-MCM': 'txLlA_fyL5g',
      'MAT-SEX': 'u3RnEp5vMvs'
    }
  };
  for (const id of ['p1', 'p2']) {
    assert.deepEqual(Object.fromEntries(catalog[id].map(row => [row.skillId, row.videoId])), expected[id]);
    for (const row of catalog[id]) {
      assert.ok(skillIds.has(row.skillId), `${id}: ${row.skillId} debe existir en el banco`);
      assert.match(row.videoId, /^[\w-]{11}$/);
    }
  }
  assert.equal(catalog.p1.filter(row => row.skillId === 'MAT-ANG-CS').length, 1, 'el enlace repetido de ángulos aparece una sola vez');
  assert.match(catalog.p1.find(row => row.skillId === 'LEN-REV').title, /Concordancia/, 'el video de Lengua explica concordancia, una parte de la revisión de textos');
});

test('la navegación móvil y de escritorio lleva al reproductor integrado', () => {
  assert.equal((html.match(/data-nav="videos"/g) || []).length, 2);
  assert.match(html, /data-view="videos"/);
  assert.match(css, /\.mobile-nav\{grid-template-columns:repeat\(5,1fr\)\}/);
  assert.match(app, /youtube-nocookie\.com\/embed\/\$\{id\}/);
  assert.match(app, /document\.createElement\('iframe'\)/);
  assert.doesNotMatch(app, /youtube\.com\/results\?search_query/);
  assert.match(app, /querySelectorAll\('iframe'\)\.forEach\(frame => frame\.remove\(\)\)/);
  assert.match(app, /if \(skillId\) pool = pool\.filter\(e => e\.habilidad === skillId\)/);
});
