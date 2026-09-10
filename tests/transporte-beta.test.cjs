const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const beta = path.join(root, 'app-transporte-beta');
const stable = path.join(root, 'app-transporte');

function read(name) {
  return fs.readFileSync(path.join(beta, name), 'utf8');
}

test('la beta está identificada como versión de prueba y no enlaza herramientas internas', () => {
  const html = read('index.html');
  assert.match(html, /Versión de prueba · ERSeP/);
  assert.match(html, /class="beta-banner"/);
  assert.doesNotMatch(html, /href="\.\.\/app-transporte\/"|Volver al portal|Versión estable/);
  assert.doesNotMatch(html, /id="admin-open"|id="admin-dialog"|admin\.js|admin-token/);
});

test('la beta reutiliza los datos y el logo de la aplicación estable', () => {
  const html = read('index.html');
  const transport = read('transporte.js');
  const history = read('historico.js');
  assert.equal(fs.existsSync(path.join(beta, 'data')), false);
  assert.match(html, /\.\.\/app-transporte\/assets\/logo-ersep\.png/);
  assert.match(transport, /DATA_BASE\s*=\s*'\.\.\/app-transporte\/'/);
  assert.match(history, /DATA_BASE\s*=\s*'\.\.\/app-transporte\/'/);
  assert.ok(fs.existsSync(path.join(stable, 'data', 'horarios.json')));
  assert.ok(fs.existsSync(path.join(stable, 'data', 'historico', 'indice.json')));
});

test('los recursos locales de la beta existen y su JavaScript es válido', () => {
  const html = read('index.html');
  const localResources = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1].split('?')[0])
    .filter(value => !/^(?:https?:|#)/.test(value) && value !== '../');
  for (const resource of localResources) {
    assert.ok(fs.existsSync(path.resolve(beta, resource)), `No existe ${resource}`);
  }
  for (const name of ['recorridos.js', 'historico.js', 'transporte.js', 'asistente.js']) {
    assert.doesNotThrow(() => new vm.Script(read(name), { filename: name }));
  }
});

test('la interfaz conserva adaptaciones para celular y computadora', () => {
  const css = read('transporte.css');
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /@media\(max-width:420px\)/);
  assert.match(css, /\.assistant-form\{display:grid/);
  assert.match(css, /\.assistant-actions>\*\{width:100%\}/);
  assert.match(css, /\.beta-banner>div\{align-items:flex-start;flex-direction:column/);
});


test('el asistente beta v13 es conversacional, progresivo y adaptable', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const assistant = read('asistente.js');
  for (const id of ['assistant-progress','assistant-progress-fill','assistant-preview','assistant-summary-origin','assistant-summary-destination','assistant-summary-submit']) {
    assert.match(html, new RegExp('id="'+id+'"'));
  }
  assert.equal((html.match(/data-assistant-step="/g)||[]).length,4);
  assert.equal((html.match(/data-assistant-day-offset="/g)||[]).length,2);
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /asistente\.js\?v=\d+-beta/);
  assert.match(css, /@keyframes assistant-card-in/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(assistant, /updateProgress/);
  assert.match(assistant, /updateSummary/);
});


test('la beta v14 compacta modos, pliega filtros y acerca el tramo elegido', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  assert.doesNotMatch(html, /sin IA/i);
  assert.doesNotMatch(html, /id="mode-select"|class="mode-picker"/);
  assert.match(html, /<details id="advanced-search"/);
  assert.match(html, /id="advanced-filter-count"/);
  assert.match(transport, /function fitActiveRoute/);
  assert.match(transport, /var visible=points\.length\?points:fallback/);
  assert.match(transport, /maxZoom:15/);
  assert.match(transport, /updateAdvancedSummary/);
  assert.match(css, /\.assistant-preview:not\(\.is-ready\)\{display:none\}/);
  assert.match(css, /#transport-map\{height:330px\}/);
});


test('la beta v15 usa un colectivo con movimiento más pausado y accesible', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /transporte\.js\?v=\d+-beta/);
  assert.match(transport, /function startBus/);
  assert.match(transport, /class="moving-bus"/);
  assert.match(transport, /routeKilometers=total\*111/);
  assert.match(transport, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(transport, /startArrow|moving-arrow|➤/);
  assert.match(css, /\.route-bus-marker/);
  assert.match(css, /\.moving-bus-body/);
});


test('la beta v16 ajusta la velocidad y sugiere el origen por ubicación', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  const assistant = read('asistente.js');
  assert.match(html, /id="assistant-location"/);
  assert.match(html, /data-location-label>Usar mi ubicación/);
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /transporte\.js\?v=\d+-beta/);
  assert.match(html, /asistente\.js\?v=16-beta/);
  assert.match(transport, /nearestOrigin:function/);
  assert.match(transport, /return 6371\*2\*Math\.atan2/);
  assert.match(transport, /Math\.max\(16000,Math\.min\(32000/);
  assert.match(assistant, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(assistant, /MAX_LOCATION_DISTANCE_KM=50/);
  assert.match(assistant, /maximumAge:300000/);
  assert.match(css, /\.assistant-origin-tools/);
  assert.match(css, /@media\(max-width:520px\)/);
});


test('la beta v17 prioriza la búsqueda ciudadana y oculta el contenido secundario', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  assert.match(html, /Servicio de consulta ciudadana/);
  assert.match(html, /VERSIÓN DE PRUEBA/);
  assert.doesNotMatch(html, /mode-select|mode-picker|Volver al portal|Ir a la versión estable|class="stable-link"/);
  assert.doesNotMatch(html, /class="mode-guide user-guide"|id="route-coverage"|class="kpi-row"|class="data-note"|id="map-legend"/);
  assert.match(html, /id="public-results-area"[^>]*hidden/);
  assert.match(html, /class="share-tools"/);
  assert.match(html, /transporte\.css\?v=17-beta/);
  assert.match(html, /transporte\.js\?v=17-beta/);
  assert.match(transport, /function revealPublicResults/);
  assert.match(transport, /updated-detail'\)\.textContent='Horarios vigentes'/);
  assert.doesNotMatch(transport, /\$\('mode-select'\)\.addEventListener/);
  assert.match(css, /\.public-beta\{background-image:none\}/);
  assert.match(css, /\.public-results-area\[hidden\]\{display:none\}/);
});
