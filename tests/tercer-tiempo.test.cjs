const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const portal = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tercer-tiempo', 'index.html'), 'utf8');
const beta = fs.readFileSync(path.join(root, 'tercer-tiempo-beta', 'index.html'), 'utf8');
const betaV2 = fs.readFileSync(path.join(root, 'tercer-tiempo-beta-v2', 'index.html'), 'utf8');

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

test('publica la renovación beta sin reemplazar la versión estable', () => {
  assert.match(beta, /className="beta-shell"/);
  assert.match(beta, /className="beta-rail"/);
  assert.match(beta, /className="mobile-progress"/);
  assert.match(beta, /Armá el equipo/);
  assert.match(beta, /Cerrá las cuentas/);
  assert.match(beta, /loadStoredList\('tt_players'\)/);
  assert.match(beta, /api\.whatsapp\.com\/send/);
  assert.match(beta, /href="\.\/icon\.svg"/);
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-beta', 'assets', 'cancha-fondo.jpg')));
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-beta', 'icon.svg')));
  assert.notEqual(beta, app);
});

test('la beta v2 reemplaza los pasos rígidos por una carga rápida', () => {
  assert.match(betaV2, /className="quick-app"/);
  assert.match(betaV2, /¿Quiénes jugaron\?/);
  assert.match(betaV2, /¿Qué se pagó\?/);
  assert.match(betaV2, /Se divide entre todo el equipo/);
  assert.match(betaV2, /Así quedan las cuentas/);
  assert.match(betaV2, /Cerrar las cuentas/);
  assert.doesNotMatch(betaV2, /const steps = \[/);
  assert.doesNotMatch(betaV2, /activeTab/);
});

test('la beta v2 conserva el motor y separa sus datos de las versiones anteriores', () => {
  assert.match(betaV2, /loadPreferredList\('tt_v2_players', 'tt_players'\)/);
  assert.match(betaV2, /loadPreferredList\('tt_v2_expenses', 'tt_expenses'\)/);
  assert.match(betaV2, /fromId: debtor\.id/);
  assert.match(betaV2, /toId: creditor\.id/);
  assert.match(betaV2, /api\.whatsapp\.com\/send/);
  assert.match(betaV2, /link\.download = `liquidacion-/);
  assert.match(betaV2, /Solo aparecen quienes van a recibir una transferencia/);
});

test('la beta v2 mantiene las versiones anteriores y sus recursos propios', () => {
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-beta-v2', 'assets', 'cancha-fondo.jpg')));
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-beta-v2', 'icon.svg')));
  assert.match(betaV2, /tercer-tiempo-beta-v2\//);
  assert.notEqual(betaV2, beta);
  assert.notEqual(betaV2, app);
});

test('la beta v2 suma una identidad visual de día de partido sin alterar el flujo', () => {
  assert.match(betaV2, /BETA V2\.1: CLUB DE NOCHE/);
  assert.match(betaV2, /Partido en curso/);
  assert.match(betaV2, /className="section-kicker"/);
  assert.match(betaV2, /concept-\$\{concept\.category\}/);
  assert.match(betaV2, /data-category=\{expense\.category\}/);
  assert.match(betaV2, /className="mini-avatar"/);
  assert.match(betaV2, /className="mobile-settle-icon"/);
  assert.match(betaV2, /url\('\.\/assets\/cancha-fondo\.jpg'\)/);
});

test('la beta v2 separa cerveza y gaseosa y mejora la grilla de conceptos', () => {
  assert.match(betaV2, /category: 'beer', label: 'Cerveza'/);
  assert.match(betaV2, /category: 'soda', label: 'Gaseosa'/);
  assert.doesNotMatch(betaV2, /category: 'drinks', label: 'Bebidas', description:/);
  assert.match(betaV2, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(betaV2, /\.concept-button:nth-last-child\(-n \+ 2\)/);
  assert.match(betaV2, /\.concept-button:last-child \{/);
  assert.match(betaV2, /\.concept-soda\.is-selected/);
});
