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

test('los videos viven en el banco de habilidades como recursos compartidos', () => {
  const videos = [];
  for (const skill of skills) {
    const ids = new Set();
    for (const video of skill.videos || []) {
      assert.match(video.id, /^[\w-]{11}$/, `${skill.id}: ID válido de YouTube`);
      assert.ok(typeof video.titulo === 'string' && video.titulo.trim(), `${skill.id}: falta título`);
      assert.ok(!ids.has(video.id), `el video ${video.id} no se repite dentro de ${skill.id}`);
      ids.add(video.id);
      videos.push({skill:skill.id, ...video});
    }
  }
  assert.equal(videos.length, 11);
  assert.ok(videos.some(row => row.skill === 'MAT-MED-LONG' && row.id === 'FvLXSPXaKFI'));
  assert.ok(videos.some(row => row.skill === 'LEN-UNI-BI' && row.id === 'tvs0UpX93mw'));
  assert.ok(videos.some(row => row.skill === 'LEN-REV' && row.id === '7Rf1w8UT_rg'));
});

test('un video vinculado a un contenido puede abrirse desde cualquier perfil', () => {
  const skill = {id:'EJEMPLO', videos:[
    {id:'12345678901',titulo:'Video A',perfiles:['p1']},
    {id:'12345678902',titulo:'Video B',perfiles:['p2']}
  ]};
  const validMatch = app.match(/function validSkillVideos\(skill\) \{[\s\S]*?\n  \}/);
  const findMatch = app.match(/function videoForProfile\(skillId, profileId, videoId\) \{[\s\S]*?\n  \}/);
  assert.ok(validMatch && findMatch, 'deben existir los helpers de video');
  const context = vm.createContext({skillsById:new Map([[skill.id,skill]])});
  const find = vm.runInContext(`${validMatch[0]}; ${findMatch[0]}; videoForProfile`, context);

  assert.equal(find('EJEMPLO','p1','12345678901').id, '12345678901');
  assert.equal(find('EJEMPLO','p2','12345678901').id, '12345678901');
  assert.equal(find('EJEMPLO','p1','12345678902').id, '12345678902');
  assert.equal(find('EJEMPLO','p2','12345678902').id, '12345678902');
});

test('Contenidos permite ver el video ahí mismo y practicar la habilidad', () => {
  assert.match(app, /data-skill-video="/);
  assert.match(app, /data-skill-practice="/);
  assert.match(app, /data-skill-video-stage/);
  assert.match(app, /function handleSkillResourceAction\(event\)/);
  assert.match(app, /youtube-nocookie\.com\/embed\/\$\{video\.id\}/);
  assert.match(app, /startSession\(\{ type: 'practica', area: skill\.area, skillId \}\)/);
  assert.match(css, /\.skill-video-stage/);
  assert.match(css, /\.skill-practice-link/);
});

test('la pestaña Videos muestra todo el banco y usa el progreso sólo para ordenar', () => {
  const start = app.indexOf('  function renderVideos() {');
  const end = app.indexOf('  function videoCardHtml', start);
  assert.ok(start >= 0 && end > start, 'renderVideos debe estar disponible');
  const source = app.slice(start, end);
  assert.match(source, /validSkillVideos\(skill\)/);
  assert.doesNotMatch(source, /\.filter\(video => video\.perfiles/);
  assert.match(source, /Todos los videos del banco están disponibles para ambos perfiles/);
  assert.match(source, /recommendedForProfile/);
});

test('la navegación y el reproductor integrado siguen usando YouTube sin salir de la app', () => {
  assert.equal((html.match(/data-nav="videos"/g) || []).length, 2);
  assert.match(html, /data-view="videos"/);
  assert.match(css, /\.mobile-nav\{grid-template-columns:repeat\(5,1fr\)\}/);
  assert.match(app, /youtube-nocookie\.com\/embed\/\$\{id\}/);
  assert.match(app, /document\.createElement\('iframe'\)/);
  assert.doesNotMatch(app, /youtube\.com\/results\?search_query/);
  assert.match(app, /querySelectorAll\('iframe'\)\.forEach\(frame => frame\.remove\(\)\)/);
  assert.match(app, /if \(skillId\) pool = pool\.filter\(e => e\.habilidad === skillId\)/);
  assert.match(app, /fetch\(`\.\/data\/habilidades\.json\?v=\$\{encodeURIComponent\(releaseVersion\)\}`/);
  assert.match(sw, /url\.pathname\.endsWith\('\/data\/habilidades\.json'\)/);
});

test('la versión vigente mantiene el banco de habilidades versionado en la PWA', () => {
  const version = html.match(/meta name="app-version" content="([^"]+)"/)[1];
  assert.ok(sw.includes(`'./data/habilidades.json?v=${version}'`), 'el banco vigente se guarda para uso sin conexión');
  assert.notEqual(`./data/habilidades.json?v=${version}`, './data/habilidades.json');
});
