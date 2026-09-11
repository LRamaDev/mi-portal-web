const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tercer-tiempo', 'index.html'), 'utf8');

test('el portal publica Tercer Tiempo como proyecto web y permite filtrarlo', () => {
  assert.match(portal, /data-filter="deportes"/);
  assert.match(portal, /data-category="deportes"/);
  assert.match(portal, /href="\.\/tercer-tiempo\/index\.html"/);
  assert.match(portal, />Tercer Tiempo FMSC</);
});

test('la versión web conserva las funciones principales de la APK', () => {
  assert.match(app, /loadStoredList\('tt_players'\)/);
  assert.match(app, /loadStoredList\('tt_expenses'\)/);
  assert.match(app, /¿Quién le paga a quién\?/);
  assert.match(app, /api\.whatsapp\.com\/send/);
  assert.match(app, /link\.download = `liquidacion-/);
});

test('la aplicación web tiene identidad propia y regreso al portal', () => {
  assert.match(app, /<meta name="description"/);
  assert.match(app, /<link rel="canonical" href="https:\/\/lramadev\.github\.io\/mi-portal-web\/tercer-tiempo\/"/);
  assert.match(app, /href="\.\.\/"/);
  assert.match(app, /Volver al portal de Lea Rama Dev/);
});

test('la interfaz deportiva mejora la jerarquía visual sin tapar el contenido', () => {
  assert.match(app, /className="app-shell"/);
  assert.match(app, /className="app-header"/);
  assert.match(app, /className="app-tabs"/);
  assert.match(app, /Cuentas claras después del partido/);
  assert.match(app, /className="app-footer"/);
  assert.match(app, /position: static;/);
  assert.match(app, /url\('\.\/assets\/cancha-fondo\.jpg'\)/);
  assert.match(app, /href="\.\/icon\.svg"/);
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo', 'assets', 'cancha-fondo.jpg')));
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo', 'icon.svg')));
  assert.doesNotMatch(app, /animate-bounce/);
  assert.doesNotMatch(app, /fixed bottom-0 w-full max-w-md/);
});
