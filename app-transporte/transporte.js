(function () {
  'use strict';

  var COLORS = { 'SIERRAS CHICAS': '#1686c4', 'SUR': '#dc8a00', 'MIXED': '#8b5cf6' };
  var state = { data: null, geo: null, map: null, layer: null, focusServiceId: null, animationId: null };
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

  function directedNodes(service) {
    var nodes = service.nodes.slice();
    return service.direction === 'V' ? nodes.reverse() : nodes;
  }

  function directedName(service) {
    var nodes = directedNodes(service);
    return nodes.length > 1 ? nodes[0] + ' → ' + nodes[nodes.length - 1] : service.line;
  }

  function directionName(service) {
    return service.direction === 'V' ? 'Vuelta' : 'Ida';
  }

  function fillSelect(id, values, firstLabel) {
    var element = $(id), old = element.value;
    element.innerHTML = '<option value="">' + esc(firstLabel) + '</option>' + values.map(function (value) {
      return '<option value="' + esc(value) + '">' + esc(value) + '</option>';
    }).join('');
    if (values.indexOf(old) !== -1) element.value = old;
  }

  function updateLineFilter() {
    var corridor = $('filter-corridor').value;
    var services = state.data.services.filter(function (service) {
      return !corridor || service.corridor === corridor;
    });
    fillSelect('filter-line', unique(services.map(function (service) { return service.line; })), 'Todas');
  }

  function populateFilters() {
    var services = state.data.services;
    fillSelect('filter-corridor', unique(services.map(function (s) { return s.corridor; })), 'Todos');
    updateLineFilter();
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
      return [service.line, directedName(service), service.company, service.route, service.corridor, service.modality]
        .join(' ').toLocaleLowerCase('es').indexOf(text) !== -1;
    }).sort(function (a,b) { return a.minutes - b.minutes || directedName(a).localeCompare(directedName(b),'es'); });
  }

  function directedCoordinates(service) {
    return directedNodes(service).map(function (node) {
      var place = state.geo.locations[node];
      return place ? { name: node, lat: place.lat, lon: place.lon, source: place.source } : null;
    }).filter(Boolean);
  }

  function endpointPlaces(services) {
    var places = new Map();
    services.forEach(function (service) {
      var nodes = directedNodes(service);
      [nodes[0], nodes[nodes.length - 1]].filter(Boolean).forEach(function (name) {
        var geo = state.geo.locations[name];
        if (!geo) return;
        if (!places.has(name)) places.set(name, { name:name, lat:geo.lat, lon:geo.lon, corridors:new Set() });
        places.get(name).corridors.add(service.corridor);
      });
    });
    return places;
  }

  function curvedPoints(origin, destination) {
    var points = [], steps = 90;
    var dx = destination.lon - origin.lon;
    var dy = destination.lat - origin.lat;
    var control = {
      lat: (origin.lat + destination.lat) / 2 + dx * 0.16,
      lon: (origin.lon + destination.lon) / 2 - dy * 0.16
    };
    for (var index = 0; index <= steps; index += 1) {
      var t = index / steps, one = 1 - t;
      points.push([
        one * one * origin.lat + 2 * one * t * control.lat + t * t * destination.lat,
        one * one * origin.lon + 2 * one * t * control.lon + t * t * destination.lon
      ]);
    }
    return points;
  }

  function startArrow(points, color) {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    var marker = L.marker(points[0], {
      interactive: false,
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: 'route-arrow-marker',
        html: '<span class="moving-arrow" style="--arrow-color:' + color + '">➤</span>',
        iconSize: [34,34], iconAnchor: [17,17]
      })
    }).addTo(state.layer);
    var started = null, duration = 4200;
    function animate(timestamp) {
      if (!started) started = timestamp;
      var progress = ((timestamp - started) % duration) / duration;
      var position = progress * (points.length - 1);
      var index = Math.min(Math.floor(position), points.length - 2);
      var fraction = position - index;
      var current = points[index], next = points[index + 1];
      marker.setLatLng([
        current[0] + (next[0] - current[0]) * fraction,
        current[1] + (next[1] - current[1]) * fraction
      ]);
      if (marker._icon) {
        var arrow = marker._icon.querySelector('.moving-arrow');
        var angle = Math.atan2(-(next[0] - current[0]), next[1] - current[1]) * 180 / Math.PI;
        if (arrow) arrow.style.transform = 'rotate(' + angle + 'deg)';
      }
      state.animationId = requestAnimationFrame(animate);
    }
    state.animationId = requestAnimationFrame(animate);
  }

  function addEndpointMarker(place, isActive, label) {
    var corridors = Array.from(place.corridors || []);
    var color = corridors.length > 1 ? COLORS.MIXED : (COLORS[corridors[0]] || '#64748b');
    return L.circleMarker([place.lat, place.lon], {
      radius: isActive ? 9 : 5,
      weight: isActive ? 3 : 2,
      color: isActive ? '#ffffff' : color,
      fillColor: color,
      fillOpacity: isActive ? 1 : .82
    }).bindTooltip('<strong>' + esc(place.name) + '</strong>' + (label ? '<br>' + esc(label) : ''), { direction:'top' })
      .addTo(state.layer);
  }

  function renderMap(services) {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.animationId = null;
    state.layer.clearLayers();
    var places = endpointPlaces(services);
    var bounds = [];
    places.forEach(function (place) {
      bounds.push([place.lat, place.lon]);
      addEndpointMarker(place, false, 'Origen o destino');
    });
    $('kpi-mapped').textContent = places.size.toLocaleString('es-AR');

    var active = services.find(function (service) { return service.id === state.focusServiceId; });
    if (active) {
      var coordinates = directedCoordinates(active);
      if (coordinates.length >= 2) {
        var origin = coordinates[0], destination = coordinates[coordinates.length - 1];
        var color = COLORS[active.corridor] || '#64748b';
        var route = curvedPoints(origin, destination);
        L.polyline(route, { color:color, weight:4, opacity:.7, dashArray:'2 10', className:'animated-route-guide' }).addTo(state.layer);
        addEndpointMarker({ name:origin.name, lat:origin.lat, lon:origin.lon, corridors:new Set([active.corridor]) }, true, 'Salida · ' + active.time);
        addEndpointMarker({ name:destination.name, lat:destination.lat, lon:destination.lon, corridors:new Set([active.corridor]) }, true, 'Destino');
        startArrow(route, color);
        state.map.fitBounds([[origin.lat,origin.lon],[destination.lat,destination.lon]], { padding:[70,70], maxZoom:10 });
        return;
      }
    }
    if (bounds.length) state.map.fitBounds(bounds, { padding:[35,35], maxZoom:9 });
    else state.map.setView([-31.7,-64.0], 7);
  }

  function serviceHTML(service) {
    var route = service.route ? '<span class="route-tag">' + esc(service.route) + '</span>' : '<span>Ruta no detallada</span>';
    var duplicate = service.possible_duplicate ? '<span>Coincidencia repetida en fuente</span>' : '';
    var active = state.focusServiceId === service.id;
    return '<button class="service-item ' + (active ? 'active' : '') + '" type="button" data-service="' + esc(service.id) + '" aria-pressed="' + active + '">' +
      '<span class="service-time">' + esc(service.time) + '</span><span class="service-copy">' +
      '<strong>' + esc(directedName(service)) + '</strong>' +
      '<small>' + esc(service.company) + ' · <b>' + esc(directionName(service)) + '</b><br>' + esc(service.service_days_text) + '</small>' +
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
    if (state.focusServiceId && !services.some(function (service) { return service.id === state.focusServiceId; })) state.focusServiceId = null;
    $('kpi-services').textContent = services.length.toLocaleString('es-AR');
    $('kpi-lines').textContent = lines.length.toLocaleString('es-AR');
    $('kpi-companies').textContent = unique(services.map(function (s) { return s.company; })).length.toLocaleString('es-AR');
    renderResults(services);
    renderMap(services);
  }

  function clearSelectionAndRender() {
    state.focusServiceId = null;
    renderAll();
  }

  function bindEvents() {
    $('filter-search').addEventListener('input', clearSelectionAndRender);
    $('filter-corridor').addEventListener('change', function () {
      updateLineFilter();
      clearSelectionAndRender();
    });
    ['filter-line','filter-day','filter-company','filter-modality'].forEach(function (id) {
      $(id).addEventListener('change', clearSelectionAndRender);
    });
    $('reset-filters').addEventListener('click', function () {
      $('filter-search').value = '';
      ['filter-corridor','filter-company','filter-modality'].forEach(function (id) { $(id).value = ''; });
      updateLineFilter();
      $('filter-line').value = '';
      $('filter-day').value = String(todayInCordoba());
      clearSelectionAndRender();
    });
    $('results').addEventListener('click', function (event) {
      var item = event.target.closest('.service-item');
      if (!item) return;
      var id = item.getAttribute('data-service');
      state.focusServiceId = state.focusServiceId === id ? null : id;
      renderAll();
    });
  }

  function initTheme() {
    var button = $('theme-toggle');
    function updateButton() {
      var light = document.documentElement.dataset.theme === 'light';
      $('theme-icon').textContent = light ? '☾' : '☀';
      $('theme-label').textContent = light ? 'Modo oscuro' : 'Modo claro';
      button.setAttribute('aria-pressed', String(light));
    }
    updateButton();
    button.addEventListener('click', function () {
      var theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('transport-theme', theme); } catch (error) {}
      updateButton();
    });
  }

  function initMap() {
    state.map = L.map('transport-map', { scrollWheelZoom: true }).setView([-31.7,-64.0], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19
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

  initTheme();
  Promise.all([
    fetch('data/horarios.json', { cache:'no-store' }).then(function (response) { if (!response.ok) throw new Error('horarios.json'); return response.json(); }),
    fetch('data/cabeceras.json', { cache:'no-store' }).then(function (response) { if (!response.ok) throw new Error('cabeceras.json'); return response.json(); })
  ]).then(function (payloads) {
    state.data = payloads[0]; state.geo = payloads[1];
    initMap(); populateFilters(); bindEvents(); sourceSummary(); renderAll();
  }).catch(function (error) { fail(error.message || String(error)); });
})();
