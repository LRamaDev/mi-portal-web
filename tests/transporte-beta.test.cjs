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
  assert.match(html, /asistente\.js\?v=\d+-beta/);
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
  assert.match(html, /aria-label="Consulta pública de servicios"/);
  assert.match(html, /VERSIÓN DE PRUEBA/);
  assert.doesNotMatch(html, /mode-select|mode-picker|Volver al portal|Ir a la versión estable|class="stable-link"/);
  assert.doesNotMatch(html, /class="mode-guide user-guide"|id="route-coverage"|class="kpi-row"|class="data-note"|id="map-legend"/);
  assert.match(html, /id="public-results-area"[^>]*hidden/);
  assert.match(html, /class="share-tools"/);
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /transporte\.js\?v=\d+-beta/);
  assert.match(transport, /function revealPublicResults/);
  assert.match(transport, /updated-detail'\)\.textContent='Horarios vigentes'/);
  assert.doesNotMatch(transport, /\$\('mode-select'\)\.addEventListener/);
  assert.match(css, /\.public-beta\{background-image:none\}/);
  assert.match(css, /\.public-results-area\[hidden\]\{display:none\}/);
});


test('la beta v18 presenta la identidad ERSeP Viaja y una entrada animada accesible', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  const icon = read('assets/ersep-viaja-icon.svg');
  assert.match(html, /<title>ERSeP Viaja · Versión de prueba · ERSeP<\/title>/);
  assert.match(html, /name="theme-color" content="#00719f"/);
  assert.match(html, /id="app-splash"/);
  assert.match(html, /assets\/ersep-viaja-icon\.svg/);
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /transporte\.js\?v=\d+-beta/);
  assert.match(css, /--primary:#00719f/);
  assert.match(css, /@keyframes ersep-splash-logo/);
  assert.match(css, /@keyframes ersep-splash-bus/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(transport, /function dismissSplash/);
  assert.match(transport, /dismissSplash\(\)/);
  assert.match(icon, /<title id="title">ERSeP Viaja<\/title>/);
});

test('la beta v19 extiende la entrada y permite invertir origen y destino', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  const assistant = read('asistente.js');
  assert.match(html, /id="assistant-swap"/);
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /transporte\.js\?v=\d+-beta/);
  assert.match(html, /asistente\.js\?v=\d+-beta/);
  assert.match(transport, /SPLASH_DURATION_MS=2000/);
  assert.match(transport, /SPLASH_FADE_MS=280/);
  assert.match(transport, /SPLASH_DURATION_MS-SPLASH_FADE_MS/);
  assert.match(assistant, /function swapRoute/);
  assert.match(assistant, /listOrigins\(day\)/);
  assert.match(assistant, /listDestinations\(oldDestination,day\)/);
  assert.match(assistant, /origin\.value=oldDestination;populateDestinations\(false\);destination\.value=oldOrigin/);
  assert.match(assistant, /addEventListener\('click',swapRoute\)/);
  assert.match(css, /\.assistant-swap/);
});

test('la beta v20 ordena los controles progresivos y mejora el encabezado móvil', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const transport = read('transporte.js');
  const assistant = read('asistente.js');
  const destination = html.indexOf('data-assistant-step="2"');
  const swap = html.indexOf('class="assistant-swap-row"');
  const day = html.indexOf('data-assistant-step="3"');
  assert.ok(destination < swap && swap < day);
  assert.match(html, /id="assistant-swap"[^>]*hidden disabled/);
  assert.match(html, /Intercambiar origen y destino/);
  assert.match(html, /class="theme-moon"/);
  assert.match(html, /class="theme-sun"/);
  assert.match(html, /transporte\.css\?v=\d+-beta/);
  assert.match(html, /transporte\.js\?v=\d+-beta/);
  assert.match(html, /asistente\.js\?v=\d+-beta/);
  assert.match(css, /\.assistant-v13 \.assistant-time-wrap\[hidden\]\{display:none\}/);
  assert.match(css, /\.assistant-swap\[hidden\]\{display:none\}/);
  assert.match(css, /grid-template-columns:44px minmax\(0,1fr\) 44px/);
  assert.match(css, /\.public-beta \.theme-toggle\{display:grid;place-items:center/);
  assert.match(assistant, /\$\('assistant-swap'\)\.hidden=!ready/);
  assert.match(transport, /action=light\?'Activar modo oscuro':'Activar modo claro'/);
  assert.doesNotMatch(transport, /\$\('theme-icon'\)\.textContent/);
});

test('la beta v21 aclara los horarios, la fuente oficial y el acceso a reclamos', () => {
  const html = read('index.html');
  const css = read('transporte.css');
  const assistant = read('asistente.js');
  assert.match(html, /¿Qué horario querés consultar\?/);
  assert.match(html, /Mostrar todos los horarios del día/);
  assert.match(html, /Salir a partir de una hora elegida/);
  assert.match(html, /Elegí la hora más temprana/);
  assert.doesNotMatch(html, />Después de una hora</);
  assert.doesNotMatch(html, />Hora mínima</);
  assert.match(html, /Secretaría de Transporte de la Provincia de Córdoba/);
  assert.match(html, /https:\/\/ersep\.cba\.gov\.ar\/usuariosnopresencial\//);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Reclamar un servicio que no pasó/);
  assert.match(html, /id="assistant-clear"[^>]*>[\s\S]*Nueva búsqueda/);
  assert.match(html, /transporte\.css\?v=21-beta/);
  assert.match(html, /transporte\.js\?v=21-beta/);
  assert.match(html, /asistente\.js\?v=21-beta/);
  assert.match(assistant, /A partir de las/);
  assert.match(assistant, /a partir de las/);
  assert.match(css, /\.assistant-swap-row \.assistant-swap\{border-color:#6d9133;background:#87b540/);
  assert.match(css, /#assistant-clear\{[^}]*background:#a6192e/);
  assert.match(css, /\.service-disclaimer/);
});

