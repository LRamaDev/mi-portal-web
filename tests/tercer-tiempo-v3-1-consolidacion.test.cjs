const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V3.1 carga una capa UX separada sin reemplazar la lógica principal', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  const css = read('tercer-tiempo-beta-v3/ux-v3-1.css');

  assert.match(html, /href="\.\/ux-v3-1\.css"/);
  assert.match(html, /src="\.\/js\/app\.jsx"/);
  assert.match(css, /Paso 1 · Quiénes juegan/);
  assert.match(css, /Paso 2 · Equipos y posiciones/);
  assert.match(css, /Después del partido/);
});

test('V3.1 reduce el peso visual administrativo en celular', () => {
  const css = read('tercer-tiempo-beta-v3/ux-v3-1.css');

  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.home-group-card \.card-heading p/);
  assert.match(css, /\.flow-step small/);
  assert.match(css, /\.rail-note/);
});

test('la sincronización manual queda detrás de opciones avanzadas y pide confirmación', () => {
  const authUi = read('tercer-tiempo-beta-v3/js/cloud-auth-ui.js');

  assert.match(authUi, /Sincronización automática/);
  assert.match(authUi, /Opciones avanzadas de sincronización/);
  assert.match(authUi, /Forzar copia de este dispositivo/);
  assert.match(authUi, /Recuperar copia de la nube/);
  assert.match(authUi, /root\.confirm\('¿Forzar la copia/);
  assert.match(authUi, /root\.confirm\('¿Recuperar la copia/);
});
