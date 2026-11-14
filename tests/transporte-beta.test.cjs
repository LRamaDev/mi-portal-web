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
  for (const name of ['analitica.js', 'recorridos.js', 'historico.js', 'transporte.js', 'asistente.js', 'accesos-v28.js']) {
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
  assert.match(html, /EN PRUEBA/);
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
  assert.match(html, /name="theme-color" content="#990d32"/);
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
  assert.match(html, /Invertir recorrido/);
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
  assert.match(html, /<strong>Horario<\/strong>/);
  assert.match(html, /Todos los horarios/);
  assert.match(html, /Desde una hora/);
  assert.match(html, /Desde las/);
  assert.doesNotMatch(html, />Después de una hora</);
  assert.doesNotMatch(html, />Hora mínima</);
  assert.match(html, /Secretaría de Transporte de la Provincia de Córdoba/);
  assert.match(html, /https:\/\/ersep\.cba\.gov\.ar\/usuariosnopresencial\//);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Reclamar un servicio que no pasó/);
  assert.match(html, /id="assistant-clear"[^>]*>[\s\S]*Nueva búsqueda/);
  assert.match(html, /transporte\.css\?v=21-beta/);
  assert.match(html, /transporte\.js\?v=21-beta/);
  assert.ok(html.includes('asistente.js?v=23-beta'));
  assert.match(assistant, /A partir de las/);
  assert.match(assistant, /a partir de las/);
  assert.match(css, /\.assistant-swap-row \.assistant-swap\{border-color:#6d9133;background:#87b540/);
  assert.match(css, /#assistant-clear\{[^}]*background:#a6192e/);
  assert.match(css, /\.service-disclaimer/);
});


test('la beta prepara un contador privado de búsquedas sin datos del trayecto', () => {
  const html = read('index.html');
  const analytics = read('analitica.js');
  const assistant = read('asistente.js');
  assert.ok(html.includes('analitica.js?v=1-beta'));
  assert.ok(html.includes('asistente.js?v=23-beta'));
  assert.match(analytics, /busqueda_realizada/);
  assert.match(analytics, /MEASUREMENT_ID/);
  assert.match(analytics, /anonymize_ip/);
  assert.match(assistant, /ERSePAnalytics/);
  assert.match(assistant, /resultsCount:results\.total/);
  assert.doesNotMatch(analytics, /assistant-origin|assistant-destination|filter-origin|filter-destination/);
});



test('la v29 reproduce la cabecera de marca y la tarjeta superpuesta', () => {
  const html=read('index.html');
  const css=read('diseno-v29.css');
  const landscape=read('assets/cordoba-paisaje.svg');
  assert.ok(html.includes('diseno-v29.css?v=29-beta'));
  assert.doesNotMatch(html, /href="diseno-v28.css/);
  assert.doesNotMatch(html, /href="diseno-v26.css/);
  assert.ok(html.includes('class="viaja-logo" src="assets/viaja-marca.svg"'));
  assert.ok(html.includes('class="hero-landscape" src="assets/cordoba-paisaje.svg"'));
  assert.ok(html.includes('<h1>ERSeP <span>Viaja</span></h1>'));
  assert.ok(html.includes('class="header-tagline"'));
  assert.ok(landscape.includes('Silueta ilustrada de la arquitectura histórica de Córdoba'));
  assert.ok(css.includes('background:linear-gradient(120deg,#810a2b'));
  assert.ok(css.includes('.public-beta .header::before'));
  assert.ok(css.includes('.public-beta .header::after'));
  assert.ok(css.includes('.public-beta .assistant-v13'));
  assert.ok(css.includes('margin:-26px 0 0'));
  assert.ok(css.includes('.public-beta .assistant-v13::before {content:none!important'));
  assert.ok(css.includes('.public-beta .transport-intro h2'));
  assert.ok(css.includes('font-size:clamp(28px,7.2vw,34px)'));
});

test('la v29 deja solo la búsqueda en la tarjeta, sin información accesoria encima', () => {
  const html=read('index.html');
  const a=html.indexOf('class="travel-assistant assistant-v13"');
  const b=html.indexOf('</section>',html.indexOf('class="transport-intro app-intro"'));
  const c=html.indexOf('class="viaja-shortcuts"');
  const d=html.indexOf('class="service-disclaimer"');
  const e=html.indexOf('class="viaja-footer"');
  assert.ok(a>=0&&b>a&&c>b&&d>c&&e>d);
  assert.ok(html.includes('¿A dónde viajás?'));
  assert.ok(html.includes('Consultá horarios y recorridos del transporte interurbano.'));
  assert.equal((html.match(/id="page-title"/g)||[]).length,1);
  assert.equal((html.match(/id="updated-date"/g)||[]).length,1);
  assert.equal((html.match(/class="beta-banner"/g)||[]).length,1);
  assert.ok(html.indexOf('id="updated-date"')>e);
  assert.ok(html.indexOf('class="beta-banner"')>e);
  assert.ok(html.includes('class="footer-colorbar"'));
  assert.ok(html.includes('class="ersep-oficial" src="../app-transporte/assets/logo-ersep.png"'));
  assert.ok(html.indexOf('class="ersep-oficial"')>c);
  assert.ok(html.indexOf('class="footer-colorbar"')>html.indexOf('class="ersep-oficial"'));
  assert.ok(html.includes('aria-label="Información sobre horarios y reclamos"'));
  assert.ok(html.includes('Reclamar un servicio que no pasó'));
});

test('la v29 conserva los controles de búsqueda y la navegación vertical universal', () => {
  const html=read('index.html');
  const css=read('diseno-v29.css');
  const assistant=read('asistente.js');
  const transport=read('transporte.js');
  assert.ok(css.includes('@media screen {'));
  assert.ok(css.includes('width:min(100%,440px)'));
  assert.ok(css.includes('max-width:440px'));
  assert.ok(css.includes('grid-template-columns:minmax(0,1fr)'));
  assert.ok(css.includes('@media screen and (max-width:365px)'));
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('.public-beta .workspace'));
  assert.ok(css.includes('.public-beta .results-panel'));
  assert.ok(css.includes('.public-beta #transport-map'));
  assert.ok(css.includes('.public-beta .public-results-area[hidden]'));
  assert.ok(css.includes('.public-beta .assistant-v13 .assistant-step[data-assistant-step="1"]::after'));
  assert.ok(css.includes('border-left:3px dotted var(--viaja-bordo)'));
  assert.ok(css.includes('.public-beta .assistant-quick-days button[aria-pressed="true"]'));
  for(const id of ['assistant-origin','assistant-destination','assistant-day','assistant-time-mode','assistant-location','assistant-swap','assistant-now','assistant-clear','assistant-results','transport-map','journey-detail','public-results-area','advanced-search','updated-date','updated-detail']) {
    assert.ok(html.includes('id="'+id+'"'),'Falta '+id);
  }
  assert.equal((html.match(/class="field-icon"/g)||[]).length,4);
  assert.equal((html.match(/data-assistant-step="/g)||[]).length,4);
  assert.equal((html.match(/data-assistant-day-offset="/g)||[]).length,2);
  assert.ok(transport.includes("users?'¿A dónde viajás?'"));
  assert.ok(transport.includes('function revealPublicResults'));
  assert.ok(assistant.includes('function swapRoute'));
  assert.ok(assistant.includes('ERSePAnalytics'));
  assert.equal(css.split('{').length,css.split('}').length);
});

test('la v29 conserva favoritos, alertas e información útil con acciones reales', () => {
  const html=read('index.html');
  const js=read('accesos-v28.js');
  const css=read('diseno-v29.css');
  assert.equal((html.match(/data-shortcut="/g)||[]).length,3);
  for(const key of ['favorites','alerts','info'])
    assert.ok(html.includes('data-shortcut="'+key+'"'));
  assert.ok(html.includes('id="quick-panel"'));
  assert.ok(html.includes('accesos-v28.js?v=28-beta'));
  assert.ok(js.includes('window.localStorage.setItem'));
  assert.ok(js.includes('window.localStorage.getItem'));
  assert.ok(js.includes('function renderFavorites()'));
  assert.ok(js.includes('function restore(item)'));
  assert.ok(js.includes('form.requestSubmit()'));
  assert.ok(js.includes('function renderAlerts()'));
  assert.ok(js.includes('Todavía no cuenta con alertas verificadas'));
  assert.ok(js.includes('function renderInfo()'));
  assert.ok(js.includes('La ausencia de un aviso aquí no significa'));
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon|supabase|google-analytics/);
  assert.ok(css.includes('.public-beta .viaja-shortcuts'));
  assert.ok(css.includes('.public-beta .viaja-quick-panel[hidden]'));
  assert.ok(css.includes('.public-beta .quick-primary'));
  assert.ok(html.includes('analitica.js?v=1-beta'));
  assert.ok(html.includes('class="share-tools"'));
});
