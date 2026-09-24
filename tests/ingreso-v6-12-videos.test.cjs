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
const skills = JSON.parse(fs.readFileSync(path.join(root, 'data/habilidades.json'), 'utf8')).habilidades;
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('los videos viven en el banco de habilidades y conservan su asociación pedagógica', () => {
  const expected = {
    p1: {
      'MAT-MED-LONG': 'FvLXSPXaKFI', 'MAT-ANG-CS': 'RhtBGxdYSJI',
      'LEN-REV': '7Rf1w8UT_rg',
      'MAT-DEC-OPS': 'y_F5eXD8Cb0', 'MAT-PER': 'OTT8SKMdBD8'
    },
    p2: {
      'MAT-FR-ORD': 'ZqnHbXCCSIc', 'MAT-FR-OPS': 'qJtoI1ipxs8',
      'LEN-UNI-BI': 'tvs0UpX93mw',
      'MAT-CIRC': 'bG3f36JQkuA', 'MAT-MCM': 'txLlA_fyL5g',
      'MAT-SEX': 'u3RnEp5vMvs'
    }
  };
  const found = {p1: {}, p2: {}};
  for (const skill of skills) {
    const ids = new Set();
    for (const video of skill.videos || []) {
      assert.match(video.id, /^[\w-]{11}$/, `${skill.id}: ID válido de YouTube`);
      assert.ok(typeof video.titulo === 'string' && video.titulo.trim(), `${skill.id}: falta título`);
      assert.ok(Array.isArray(video.perfiles) && video.perfiles.length, `${skill.id}: falta perfil`);
      assert.ok(!ids.has(video.id), `el video ${video.id} no se repite dentro de ${skill.id}`);
      ids.add(video.id);
      for (const profile of video.perfiles) {
        assert.ok(profile in found, `perfil desconocido: ${profile}`);
        (found[profile][skill.id] ||= []).push(video.id);
      }
    }
  }
  for (const id of ['p1', 'p2']) {
    assert.deepEqual(found[id], Object.fromEntries(Object.entries(expected[id]).map(([skillId, videoId]) => [skillId, [videoId]])));
  }
  assert.match(skills.find(row => row.id === 'LEN-REV').videos[0].titulo, /Concordancia/);
  assert.match(skills.find(row => row.id === 'LEN-UNI-BI').videos[0].titulo, /Oraciones unimembres y bimembres/);
  assert.match(app, /row\.progress\.attempts < 3 \? ' · dato inicial'/);
});

test('una habilidad puede ofrecer varios videos y el perfil ve solo los suyos', () => {
  const skill = {id:'EJEMPLO', videos:[
    {id:'12345678901',perfiles:['p1']},
    {id:'12345678902',perfiles:['p2']},
    {id:'12345678903',perfiles:['p1','p2']}
  ]};
  const match = app.match(/function videoForProfile\(skillId, profileId, videoId\) \{[\s\S]*?\n  \}/);
  assert.ok(match, 'debe existir la consulta por habilidad y perfil');
  const context = vm.createContext({skillsById:new Map([[skill.id,skill]])});
  const find = vm.runInContext(`${match[0]}; videoForProfile`, context);
  assert.equal(find('EJEMPLO','p1','12345678901').id, '12345678901');
  assert.equal(find('EJEMPLO','p2','12345678901'), undefined);
  assert.equal(find('EJEMPLO','p2','12345678903').id, '12345678903');
  assert.equal(find('OTRO','p1'), undefined);
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
  assert.match(app, /skills\.flatMap\(skill => \(skill\.videos \|\| \[\]\)/);
  assert.doesNotMatch(app, /const VIDEO_RESOURCES =/);
  assert.match(app, /data-skill-video="\$\{escapeHtml\(skill\.id\)\}"/);
  assert.match(app, /fetch\('\.\/data\/habilidades\.json', \{ cache: 'no-store' \}\)/);
  assert.match(sw, /url\.pathname\.endsWith\('\/data\/habilidades\.json'\)/);
});
