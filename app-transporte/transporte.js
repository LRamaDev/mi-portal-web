(function () {
  'use strict';

  var COLORS = { 'SIERRAS CHICAS': '#1478ad', 'SUR': '#d79200' };
  var state = { data: null, geo: null, map: null, layer: null, focusLine: null };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (value) {
    return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  };
  var unique = function (items) {
    return Array.from(new Set(items.filter(Boolean))).sort(function (a,b) { return a.localeCompare(b,'es'); });
  };

  function todayInCordoba() {
    var short = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Argentina/Cordoba' }).format(new Date());
    return { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 }[short] || '';
  }

  function formatDate(iso) {
    if (!iso) return 'Sin fecha informada';
    return new Intl.DateTimeFormat('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', timeZone:'UTC' }).format(new Date(iso + 'T00:00:00Z'));
  }

  function fillSelect(id, values, firstLabel) {
    var element = $(id), old = element.value;
    element.innerHTML = '<option value="">' + esc(firstLabel) + '</option>' + values.map(function (value) {
      return '<option value="' + esc(value) + '">' + esc(value) + '</option>';
    }).join('');
    if (values.indexOf(old) !== -1) element.value = old;
  }

  function populateFilters() {
    var services = state.data.services;
    fillSelect('filter-corridor', unique(services.map(function (s) { return s.corridor; })), 'Todos');
    fillSelect('filter-line', unique(services.map(function (s) { return s.line; })), 'Todas');
    fillSelect('filter-company', unique(services.map(function (s) { return s.company; })), 'Todas');
    fillSelect('filter-modality', unique(services.map(function (s) { return s.modality; })), 'Todas');
    $('filter-day').value = String(todayInCordoba());
  }

  function filteredServices() {
    var text = $('filter-search').value.trim().toLocaleLowerCase('es');
    var corridor = $('filter-corridor').value;
    var line = $('filter-line').value;
    var day = Number($('filter-day').value || 0);
    var company = $('filter-company').value;
    var modality = $('filter-modality').value;
    return state.data.services.filter(function (service) {
      if (corridor && service.corridor !== corridor) return false;
      if (line && service.line !== line) return false;
      if (day && service.service_days.indexOf(day) === -1) return false;
      if (company && service.company !== company) return false;
      if (modality && service.modality !== modality) return false;
      if (!text) return true;
      return [service.line, service.company, service.route, service.corridor, service.modality]
        .join(' ').toLocaleLowerCase('es').indexOf(text) !== -1;
    }).sort(function (a,b) { return a.minutes - b.minutes || a.line.localeCompare(b.line,'es'); });
  }

  function coordinates(service) {
    return service.nodes.map(function (node) {
      var place = state.geo.locations[node];
      return place ? { name: node, lat: place.lat, lon: place.lon, source: place.source } : null;
    }).filter(Boolean);
  }

  function renderMap(services) {
    state.layer.clearLayers();
    var lines = new Map();
    services.forEach(function (service) { if (!lines.has(service.line_id)) lines.set(service.line_id, service); });
    var bounds = [];
    var mapped = 0;

    lines.forEach(function (service) {
      var points = coordinates(service);
      if (points.length < 2) return;
      mapped += 1;
      var active = state.focusLine === service.line_id || lines.size === 1;
      var latlngs = points.map(function (point) { bounds.push([point.lat, point.lon]); return [point.lat, point.lon]; });
      var color = COLORS[service.corridor] || '#6b7280';
      var path = L.polyline(latlngs, {
        color: color, weight: active ? 7 : 3, opacity: active ? .95 : .42,
        dashArray: active ? null : '8 7', lineCap: 'round'
      }).addTo(state.layer);
      path.bindTooltip(service.line, { sticky: true });
      path.on('click', function () { state.focusLine = service.line_id; renderAll(); });

      if (active) {
        points.forEach(function (point, index) {
          L.circleMarker([point.lat, point.lon], {
            radius: 7, weight: 2, color: '#fff', fillColor: color, fillOpacity: 1
          }).bindPopup('<strong>' + esc(point.name) + '</strong>' + esc(service.line) + '<br><small>' + esc(index === 0 ? 'Primera localidad indicada' : 'Localidad indicada en la línea') + '</small>')
            .addTo(state.layer);
        });
      }
    });
    $('kpi-mapped').textContent = mapped + ' / ' + lines.size;
    if ((state.focusLine || lines.size === 1) && bounds.length) state.map.fitBounds(bounds, { padding:[36,36], maxZoom:11 });
    else if (!bounds.length) state.map.setView([-31.7,-64.0], 7);
  }

  function serviceHTML(service) {
    var route = service.route ? '<span class="route-tag">' + esc(service.route) + '</span>' : '<span>Ruta no detallada</span>';
    var duplicate = service.possible_duplicate ? '<span>Coincidencia repetida en fuente</span>' : '';
    return '<button class="service-item ' + (state.focusLine === service.line_id ? 'active' : '') + '" type="button" data-line="' + esc(service.line_id) + '">' +
      '<span class="service-time">' + esc(service.time) + '</span><span class="service-copy">' +
      '<strong>' + esc(service.line) + '</strong>' +
      '<small>' + esc(service.company) + ' · Sentido ' + esc(service.direction) + '<br>' + esc(service.service_days_text) + '</small>' +
      '<span class="service-tags"><span>' + esc(service.modality) + '</span>' + route + duplicate + '</span></span></button>';
  }

  function renderResults(services) {
    var limit = 300, shown = services.slice(0, limit);
    $('result-count').textContent = services.length.toLocaleString('es-AR');
    $('results').innerHTML = services.length ? shown.map(serviceHTML).join('') +
      (services.length > limit ? '<div class="empty-state">Mostrando los primeros ' + limit + ' resultados. Usá los filtros para precisar la búsqueda.</div>' : '') :
      '<div class="empty-state"><strong>No encontramos servicios</strong><br>Probá con otro día o quitá alguno de los filtros.</div>';
  }

  function renderAll() {
    var services = filteredServices();
    var lines = unique(services.map(function (s) { return s.line_id; }));
    if (state.focusLine && lines.indexOf(state.focusLine) === -1) state.focusLine = null;
    $('kpi-services').textContent = services.length.toLocaleString('es-AR');
    $('kpi-lines').textContent = lines.length.toLocaleString('es-AR');
    $('kpi-companies').textContent = unique(services.map(function (s) { return s.company; })).length.toLocaleString('es-AR');
    renderResults(services);
    renderMap(services);
  }

  function bindEvents() {
    ['filter-search','filter-corridor','filter-line','filter-day','filter-company','filter-modality'].forEach(function (id) {
      $(id).addEventListener('input', function () { state.focusLine = null; renderAll(); });
      $(id).addEventListener('change', function () { state.focusLine = null; renderAll(); });
    });
    $('reset-filters').addEventListener('click', function () {
      $('filter-search').value = '';
      ['filter-corridor','filter-line','filter-company','filter-modality'].forEach(function (id) { $(id).value = ''; });
      $('filter-day').value = String(todayInCordoba());
      state.focusLine = null;
      renderAll();
      state.map.setView([-31.7,-64.0], 7);
    });
    $('results').addEventListener('click', function (event) {
      var item = event.target.closest('.service-item');
      if (!item) return;
      state.focusLine = item.getAttribute('data-line');
      renderAll();
    });
  }

  function initMap() {
    state.map = L.map('transport-map', { scrollWheelZoom: true }).setView([-31.7,-64.0], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
    }).addTo(state.map);
    state.layer = L.layerGroup().addTo(state.map);
  }

  function sourceSummary() {
    var sources = state.data.sources;
    var latest = sources.map(function (source) { return source.publication_date; }).filter(Boolean).sort().pop();
    $('updated-date').textContent = formatDate(latest);
    $('updated-detail').textContent = sources.map(function (source) {
      var corridor = source.filename.indexOf('SIERRAS') !== -1 ? 'Sierras Chicas' : 'Sur';
      return corridor + ': sin cambios desde ' + formatDate(source.unchanged_since);
    }).join(' · ');
    var stats = state.data.stats;
    $('quality-note').innerHTML = '<strong>Control automático:</strong> ' + stats.source_rows.toLocaleString('es-AR') +
      ' filas procesadas; ' + stats.possible_duplicate_excess + ' coincidencias exactas señaladas; ' +
      stats.cuit_not_available + ' CUIT no informados. Cabeceras pendientes de ubicar: ' + esc(state.geo.unresolved.join(', ') || 'ninguna') + '.';
  }

  function fail(message) {
    $('results').innerHTML = '<div class="empty-state"><strong>No se pudo cargar la información.</strong><br>' + esc(message) + '</div>';
    $('updated-date').textContent = 'Error de carga';
  }

  Promise.all([
    fetch('data/horarios.json', { cache:'no-store' }).then(function (response) { if (!response.ok) throw new Error('horarios.json'); return response.json(); }),
    fetch('data/cabeceras.json', { cache:'no-store' }).then(function (response) { if (!response.ok) throw new Error('cabeceras.json'); return response.json(); })
  ]).then(function (payloads) {
    state.data = payloads[0]; state.geo = payloads[1];
    initMap(); populateFilters(); bindEvents(); sourceSummary(); renderAll();
  }).catch(function (error) { fail(error.message || String(error)); });
})();
