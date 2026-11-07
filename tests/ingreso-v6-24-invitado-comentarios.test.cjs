const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'ingreso-belgrano-monserrat');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const app = read('app.js');
const safety = read('seguridad.js');
const css = read('styles-v6.css');
const html = read('index.html');
const sw = read('sw.js');

test('el visitante abre el único perfil local sin tarjeta de selección', () => {
  assert.match(app, /window\.INGRESO_ACCESS_MODE === 'visitor'[\s\S]*?state\.profiles\.p1\.name = 'Invitado';[\s\S]*?enterProfile\('p1', \{ restore: false \}\)/);
  assert.match(app, /window\.INGRESO_ACCESS_MODE === 'visitor' && mode !== 'p1'/);
  assert.match(css, /body\.ingreso-visitor #profile-gate/);
  assert.match(css, /body\.ingreso-visitor #active-profile/);
});

test('salir del visitante no recupera el perfil usado en la sesión familiar', () => {
  assert.match(safety, /sessionStorage\.removeItem\('ingreso-active-profile-v1'\)/);
  assert.match(safety, /sessionStorage\.removeItem\('ingreso-active-view-v1'\)/);
  assert.match(safety, /writeAccessMode\('family'\)/);
  assert.match(app, /window\.INGRESO_ACCESS_MODE === 'visitor' && view === 'familia'/);
});

test('los comentarios y avisos largos se quiebran sin desbordar la grilla', () => {
  assert.match(css, /\.family-feedback-inbox \.feedback-inbox-note/);
  assert.match(css, /\.family-exercise-reports \.exercise-report-item blockquote/);
  assert.match(css, /overflow-wrap:anywhere/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
});

test('versión y assets publicados coinciden en 6.24.0', () => {
  assert.match(html, /meta name="app-version" content="6\.24\.0"/);
  assert.match(sw, /const VERSION='6\.24\.0'/);
  assert.match(html, /seguridad\.js\?v=6\.24\.0/);
  assert.match(html, /styles-v6\.css\?v=6\.24\.0/);
});
