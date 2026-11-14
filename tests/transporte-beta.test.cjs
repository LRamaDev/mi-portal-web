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
  assert.match(html, /transporte\.js\?v=31-beta/);
  assert.ok(html.includes('asistente.js?v=31-beta'));
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
  assert.ok(html.includes('asistente.js?v=31-beta'));
  assert.match(analytics, /busqueda_realizada/);
  assert.match(analytics, /MEASUREMENT_ID/);
  assert.match(analytics, /anonymize_ip/);
  assert.match(assistant, /ERSePAnalytics/);
  assert.match(assistant, /resultsCount:results\.total/);
  assert.doesNotMatch(analytics, /assistant-origin|assistant-destination|filter-origin|filter-destination/);
});




test('v30 usa como cabecera el recorte de la referencia original y no redibuja la marca', () => {
  const html=read('index.html');
  const css=read('diseno-v30.css');
  const pathRef=path.join(beta,'assets','cabecera-fiel-v30.webp');
  assert.ok(fs.existsSync(pathRef));
  const bytes=fs.readFileSync(pathRef);
  assert.ok(bytes.length>7000);
  assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
  assert.ok(html.includes('src="assets/cabecera-fiel-v30.webp"'));
  assert.ok(html.includes('width="500" height="133"'));
  assert.ok(html.includes('class="visually-hidden"'));
  assert.doesNotMatch(html, /class="header-brand"/);
  assert.doesNotMatch(html, /class="hero-landscape"/);
  assert.doesNotMatch(html, /class="viaja-lockup"/);
  assert.ok(html.includes('diseno-v30.css?v=32-beta'));
  assert.doesNotMatch(html, /href="diseno-v29.css/);
  assert.ok(css.includes('CABECERA BLOQUEADA'));
  assert.ok(css.includes('cabecera-fiel-v30.webp'));
  assert.ok(css.includes('.public-beta .header .header-reference'));
  assert.ok(css.includes('.public-beta .header::before,'));
  assert.ok(css.includes('content:none!important'));
});

test('v30 coloca EN PRUEBA y una sola guarda de colores en la entrada al formulario', () => {
  const html=read('index.html');
  const css=read('diseno-v30.css');
  const header=html.indexOf('<header class="header"');
  const card=html.indexOf('class="travel-assistant assistant-v13"');
  const heading=html.indexOf('class="intro-heading"');
  const badge=html.indexOf('class="beta-banner"');
  const bar=html.indexOf('class="intro-colorbar"');
  const form=html.indexOf('id="assistant-form"');
  assert.ok(header>=0&&card>header&&heading>card&&badge>heading&&bar>badge&&form>bar);
  assert.equal((html.match(/class="beta-banner"/g)||[]).length,1);
  assert.equal((html.match(/class="intro-colorbar"/g)||[]).length,1);
  assert.equal((html.match(/id="page-title"/g)||[]).length,1);
  assert.ok(html.includes('¿A dónde viajás?'));
  assert.ok(html.includes('Consultá horarios y recorridos del transporte interurbano.'));
  assert.ok(css.includes('.public-beta .intro-heading'));
  assert.ok(css.includes('.public-beta .intro-colorbar'));
  assert.ok(css.includes('width:min(100%,440px)'));
});

test('v30 conserva la interfaz y sus herramientas funcionales intactas', () => {
  const html=read('index.html');
  const css=read('diseno-v30.css');
  const js=read('asistente.js');
  const transport=read('transporte.js');
  for (const id of ['assistant-form','assistant-origin','assistant-destination','assistant-day',
    'assistant-time-mode','assistant-time','assistant-location','assistant-swap',
    'assistant-results','assistant-now','assistant-clear','public-results-area',
    'advanced-search','transport-map','journey-detail','updated-date','updated-detail','theme-toggle']) {
    assert.ok(html.includes('id="'+id+'"'),'Falta '+id);
  }
  assert.equal((html.match(/class="field-icon"/g)||[]).length,4);
  assert.equal((html.match(/data-assistant-step="/g)||[]).length,4);
  assert.equal((html.match(/data-assistant-day-offset="/g)||[]).length,2);
  assert.ok(html.indexOf('id="theme-toggle"')>html.indexOf('class="viaja-footer"'));
  assert.ok(html.includes('id="theme-label"'));
  assert.ok(css.includes('.public-beta .footer-settings .theme-toggle'));
  assert.ok(css.includes('.public-beta .workspace'));
  assert.ok(css.includes('.public-beta #transport-map'));
  assert.ok(css.includes('.public-beta .public-results-area[hidden]'));
  assert.ok(css.includes('@media screen and (max-width:375px)'));
  assert.ok(js.includes('function swapRoute'));
  assert.ok(js.includes('ERSePAnalytics'));
  assert.ok(transport.includes('function revealPublicResults'));
  assert.equal(css.split('{').length,css.split('}').length);
});

test('v30 mantiene accesos y el logo original del ERSeP al pie', () => {
  const html=read('index.html');
  const shortcuts=read('accesos-v28.js');
  assert.equal((html.match(/data-shortcut="/g)||[]).length,3);
  for(const key of ['favorites','alerts','info']) assert.ok(html.includes('data-shortcut="'+key+'"'));
  assert.ok(html.includes('class="ersep-oficial" src="../app-transporte/assets/logo-ersep.png"'));
  assert.ok(html.includes('class="footer-colorbar"'));
  assert.ok(html.includes('class="service-disclaimer"'));
  assert.ok(html.includes('Reclamar un servicio que no pasó'));
  assert.ok(html.includes('analitica.js?v=1-beta'));
  assert.ok(html.includes('accesos-v28.js?v=28-beta'));
  assert.ok(shortcuts.includes('function renderFavorites()'));
  assert.ok(shortcuts.includes('function renderAlerts()'));
  assert.ok(shortcuts.includes('Todavía no cuenta con alertas verificadas'));
  assert.ok(shortcuts.includes('function renderInfo()'));
  assert.doesNotMatch(shortcuts,/fetch\(|XMLHttpRequest|sendBeacon|supabase/);
});

test('v31 iguala el ancho del encabezado y la tarjeta sin espacio superior', () => {
  const html=read('index.html'),css=read('diseno-v30.css');
  assert.ok(html.includes('diseno-v30.css?v=32-beta'));
  assert.ok(css.includes('.public-beta .header .header-reference'));
  assert.ok(css.includes('margin:0 calc(var(--ref-gutter) * 2);'));
  assert.ok(css.includes('padding-inline:calc(var(--ref-gutter) * 2);'));
  assert.ok(css.includes('background:transparent;'));
  assert.ok(css.includes('mix-blend-mode:multiply'));
  assert.ok(css.includes('.public-beta .footer-colorbar'));
  assert.ok(css.includes('display:none!important'));
  assert.equal(css.split('{').length,css.split('}').length);
});

test('v31 alinea origen destino día y horario sin recortar selectores', () => {
  const css=read('diseno-v30.css');
  for(const selector of [
    '.public-beta .assistant-v13 #assistant-origin',
    '.public-beta .assistant-v13 #assistant-destination',
    '.public-beta .assistant-v13 #assistant-day',
    '.public-beta .assistant-v13 #assistant-time-mode',
    '.public-beta .assistant-v13 .assistant-origin-tools'
  ]) assert.ok(css.includes(selector), 'Falta '+selector);
  assert.ok(css.includes('max-width:calc(100% - 34px)'));
  assert.ok(css.includes('box-sizing:border-box'));
});

test('v31 elimina búsqueda exhaustiva pública sin borrar filtros del motor', () => {
  const html=read('index.html'),assistant=read('asistente.js'),transport=read('transporte.js');
  assert.ok(html.includes('id="advanced-search" class="advanced-search" hidden aria-hidden="true"'));
  assert.ok(html.includes('id="filter-origin"'));
  assert.ok(html.includes('id="filter-destination"'));
  assert.ok(html.includes('id="filter-search"'));
  assert.ok(html.includes('id="filter-day"'));
  assert.ok(transport.includes('state.engine.query(filters())'));
  assert.doesNotMatch(assistant,/data-assistant-all/);
  assert.doesNotMatch(assistant,/búsqueda completa|búsqueda avanzada|filtros completos/);
  assert.ok(assistant.includes('assistant-more-note'));
});

test('v31 abre mapa y detalle solamente después de seleccionar un servicio', () => {
  const html=read('index.html'),transport=read('transporte.js'),css=read('diseno-v30.css');
  assert.ok(html.includes('class="map-column" hidden'));
  assert.ok(html.includes('id="public-results-area" class="public-results-area" aria-label="Resultados y recorrido" hidden'));
  assert.ok(html.includes('class="results-panel" aria-labelledby="results-title" hidden'));
  assert.ok(html.includes('class="share-tools" hidden'));
  assert.ok(css.includes('.public-beta .map-column[hidden]'));
  assert.ok(css.includes('.public-beta #advanced-search[hidden]'));
  assert.ok(transport.includes('if(mapColumn)mapColumn.hidden=!active'));
  assert.ok(transport.includes('if(publicArea)publicArea.hidden=!active'));
  assert.ok(transport.includes('if(!active){renderDetails(null);return;}'));
  assert.ok(transport.includes('if(!state.map)initMap()'));
  assert.doesNotMatch(transport,/state\.routes\);initMap\(\)/);
  assert.doesNotMatch(transport,/addEventListener\('toggle'.*revealPublicResults/);
});

test('v32 une cabecera y tarjeta con borde superior recto sin tocar la referencia', () => {
  const html=read('index.html'),css=read('diseno-v30.css');
  assert.ok(html.includes('src="assets/cabecera-fiel-v30.webp"'));
  assert.ok(html.includes('diseno-v30.css?v=32-beta'));
  assert.ok(css.includes('border-radius:0 0 21px 21px'));
  assert.ok(css.includes('border-top:0;'));
  assert.ok(css.includes('border-top-left-radius:0;'));
  assert.ok(css.includes('border-top-right-radius:0;'));
  assert.equal(css.split('{').length,css.split('}').length);
});

test('v32 no muestra logo de producto en la precarga pero conserva progreso animado', () => {
  const html=read('index.html'),css=read('diseno-v30.css');
  const from=html.indexOf('<div id="app-splash"');
  const to=html.indexOf('<div class="wrap">',from);
  const splash=html.slice(from,to);
  assert.ok(from>=0&&to>from);
  assert.doesNotMatch(splash,/<img/);
  assert.doesNotMatch(splash,/viaja-marca.svg|logo-ersep.png/);
  assert.ok(splash.includes('class="app-splash-bus"'));
  assert.ok(splash.includes('class="app-splash-route"'));
  assert.ok(splash.includes('ERSeP Viaja'));
  assert.ok(css.includes('.public-beta .app-splash-card>strong'));
  assert.ok(css.includes('.public-beta .app-splash-bus'));
});
