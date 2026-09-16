const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('V4 Beta UI convive con la V3 y reutiliza el mismo almacenamiento', () => {
  const html = read('tercer-tiempo-v4-beta-ui/index.html');
  const config = read('tercer-tiempo-v4-beta-ui/config.js');

  assert.match(html, /tercer-tiempo-beta-v3\/js\/app\.jsx/);
  assert.match(html, /tercer-tiempo-beta-v3\/js\/cloud-sync\.js/);
  assert.match(html, /share-menu-v3-4-1\.js/);
  assert.match(config, /storageKey: 'tt_app_v1'/);
  assert.match(config, /versionLabel: 'V4 Beta UI'/);
});

test('V4 reduce la navegación principal a Inicio, Partido, Tercer tiempo y Más', () => {
  const ui = read('tercer-tiempo-v4-beta-ui/v4-ui.js');
  const css = read('tercer-tiempo-v4-beta-ui/v4.css');

  assert.match(ui, /data-v4-more/);
  assert.match(ui, /tt-v4-hidden-nav/);
  assert.match(ui, /Plantel/);
  assert.match(ui, /Grupo e historial/);
  assert.match(css, /grid-template-columns: repeat\(4/);
});

test('V4 transforma Partido en un flujo guiado', () => {
  const ui = read('tercer-tiempo-v4-beta-ui/v4-ui.js');
  assert.match(ui, /Convocados/);
  assert.match(ui, /Equipos/);
  assert.match(ui, /Después/);
  assert.match(ui, /applyMatchStep/);
  assert.match(ui, /Continuar a equipos/);
});

test('V4 usa una identidad visual distinta sin eliminar funciones', () => {
  const css = read('tercer-tiempo-v4-beta-ui/v4.css');
  const html = read('tercer-tiempo-v4-beta-ui/index.html');
  assert.match(css, /--v4-bg: #f5f3ee/);
  assert.match(css, /tt-v4-home-intro/);
  assert.match(css, /tt-v4-stepper/);
  assert.match(html, /share-whatsapp-v3-4\.js/);
  assert.match(html, /third-time-autonomous-ui\.js/);
});
