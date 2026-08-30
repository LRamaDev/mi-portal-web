(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TransportRoutes = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function normalize(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  }
  function canonical(value, aliases) { var n = normalize(value); return (aliases || {})[n] || n; }
  function signature(service, aliases) {
    var digits = String(service.cuit || '').replace(/\D/g, '');
    var nodes = service.nodes.slice();
    if (service.direction === 'V') nodes.reverse();
    return JSON.stringify([normalize(service.corridor), digits.length === 11 ? digits : '', normalize(service.modality), normalize(service.line), service.direction, normalize(service.route), nodes.map(function (n) { return canonical(n, aliases); })]);
  }
  function clock(total) {
    if (!Number.isFinite(total)) return { time: 'Sin estimación', dayOffset: null };
    var rounded = Math.round(total), day = Math.floor(rounded / 1440), minute = ((rounded % 1440) + 1440) % 1440;
    return { time: String(Math.floor(minute / 60)).padStart(2, '0') + ':' + String(minute % 60).padStart(2, '0'), dayOffset: day };
  }
  function validProfile(profile, places) {
    if (!profile || profile.issues.length || profile.stops.length < 2) return false;
    var last = 0;
    return profile.stops.every(function (stop, i) {
      if (!places[stop.place_id] || !Number.isFinite(stop.arrival_offset) || !Number.isFinite(stop.departure_offset) || stop.arrival_offset < last || stop.departure_offset < stop.arrival_offset) return false;
      if (i === 0 && (stop.arrival_offset !== 0 || stop.departure_offset !== 0)) return false;
      last = stop.departure_offset;
      return true;
    });
  }
  function create(schedule, geography, routes) {
    routes = routes && routes.schema_version === 1 ? routes : { places: {}, profiles: [], bindings: {}, name_aliases: {} };
    var aliases = routes.name_aliases || {}, places = Object.assign({}, routes.places), profiles = new Map(), byName = new Map();
    routes.profiles.forEach(function (p) { if (validProfile(p, places)) profiles.set(p.id, p); });
    Object.keys(places).forEach(function (id) {
      var p = places[id];
      [p.name].concat(p.aliases || []).forEach(function (name) {
        (p.corridors || []).forEach(function (c) {
          var key = normalize(c) + '|' + canonical(name, aliases);
          if (!byName.has(key)) byName.set(key, new Set());
          byName.get(key).add(id);
        });
      });
    });
    function fallbackPlace(name, corridor) {
      var candidates = byName.get(normalize(corridor) + '|' + canonical(name, aliases));
      if (candidates && candidates.size === 1) return Array.from(candidates)[0];
      var id = 'pdf-' + normalize(corridor) + '-' + canonical(name, aliases);
      if (!places[id]) {
        var geo = geography.locations[name];
        places[id] = { id: id, name: name, aliases: [name], corridors: [corridor], lat: geo ? geo.lat : null, lon: geo ? geo.lon : null, geo_source: geo ? geo.source : null };
      }
      return id;
    }
    var models = schedule.services.map(function (service) {
      var profile = profiles.get(routes.bindings[signature(service, aliases)]), stops;
      if (profile) stops = profile.stops;
      else {
        var names = service.nodes.slice();
        if (service.direction === 'V') names.reverse();
        stops = [names[0], names[names.length - 1]].map(function (name, i) {
          return { place_id: fallbackPlace(name, service.corridor), arrival_offset: i === 0 ? 0 : null, departure_offset: i === 0 ? 0 : null, rows: [] };
        });
      }
      return { service: service, profile: profile || null, stops: stops, search: normalize([service.line, service.company, service.corridor, service.modality, service.route].concat(stops.map(function (s) { return places[s.place_id].name; })).join(' ')) };
    });
    var byId = new Map(models.map(function (m) { return [m.service.id, m]; }));
    // Labels differentiate homonyms without joining their distinct source IDs.
    var labelCounts = new Map();
    Object.keys(places).forEach(function (id) { var n = canonical(places[id].name, aliases); labelCounts.set(n, (labelCounts.get(n) || 0) + 1); });
    function label(id) {
      var p = places[id];
      if (!p) return id;
      return p.name + (labelCounts.get(canonical(p.name, aliases)) > 1 ? ' · ' + p.corridors.join(' / ') + (p.source_id ? ' · ID ' + p.source_id : '') : '');
    }
    function makeJourney(model, from, to) {
      var s = model.service, start = model.stops[from], end = model.stops[to];
      var boarding = Number.isFinite(start.departure_offset) ? s.minutes + start.departure_offset : null;
      var arrival = Number.isFinite(end.arrival_offset) ? s.minutes + end.arrival_offset : null;
      var shift = Number.isFinite(boarding) ? Math.floor(boarding / 1440) : 0;
      return { key: s.id + '@' + from + '-' + to, model: model, service: s, from: from, to: to, origin: start.place_id, destination: end.place_id, boarding: boarding, arrival: arrival, duration: Number.isFinite(boarding) && Number.isFinite(arrival) ? arrival - boarding : null, estimatedBoarding: from > 0, days: Array.from(new Set(s.service_days.map(function (day) { return ((day - 1 + shift) % 7 + 7) % 7 + 1; }))).sort() };
    }
    function find(filters, exclude, enumerate) {
      filters = filters || {};
      var text = normalize(filters.search), found = [];
      models.forEach(function (model) {
        var s = model.service;
        if (['corridor', 'line', 'company', 'modality', 'direction'].some(function (f) { return f !== exclude && filters[f] && s[f] !== filters[f]; })) return;
        if (text && model.search.indexOf(text) === -1) return;
        var origin = exclude === 'origin' ? '' : filters.origin, destination = exclude === 'destination' ? '' : filters.destination;
        if (origin && destination && origin === destination) return;
        var starts = [], ends = [], last = model.stops.length - 1;
        model.stops.forEach(function (stop, index) {
          if (index < last && (origin ? stop.place_id === origin : enumerate === 'origin' || index === 0)) starts.push(index);
          if (index > 0 && (destination ? stop.place_id === destination : enumerate === 'destination' || index === last)) ends.push(index);
        });
        starts.forEach(function (from) { ends.forEach(function (to) {
          if (from >= to || model.stops[from].place_id === model.stops[to].place_id) return;
          var journey = makeJourney(model, from, to);
          if (exclude !== 'day' && filters.day && journey.days.indexOf(Number(filters.day)) === -1) return;
          found.push(journey);
        }); });
      });
      return found;
    }
    function facet(field, filters) {
      var values = new Set();
      find(filters, field, field === 'origin' || field === 'destination' ? field : null).forEach(function (j) {
        if (field === 'day') j.days.forEach(function (d) { values.add(String(d)); });
        else if (field === 'origin' || field === 'destination') values.add(j[field]);
        else if (j.service[field]) values.add(j.service[field]);
      });
      return Array.from(values);
    }
    function query(filters) {
      return find(filters).sort(function (a, b) {
        var av = clock(a.boarding), bv = clock(b.boarding);
        return av.time.localeCompare(bv.time) || label(a.origin).localeCompare(label(b.origin), 'es') || a.key.localeCompare(b.key);
      });
    }
    function coordinates(journey) {
      return journey.model.stops.map(function (s) { var p = places[s.place_id]; return Number.isFinite(p.lat) && Number.isFinite(p.lon) ? p : null; });
    }
    function control(filters) {
      filters = filters || {};
      if (!filters.location) return [];
      var lines = new Set(filters.lines || []), companies = new Set(filters.companies || []), found = [];
      var fromMinute = Number.isFinite(filters.fromMinute) ? filters.fromMinute : null;
      var toMinute = Number.isFinite(filters.toMinute) ? filters.toMinute : null;
      function inWindow(minute) {
        if (fromMinute === null || toMinute === null) return true;
        return fromMinute <= toMinute ? minute >= fromMinute && minute <= toMinute : minute >= fromMinute || minute <= toMinute;
      }
      models.forEach(function (model) {
        var s = model.service;
        if (filters.corridor && s.corridor !== filters.corridor) return;
        if (filters.company && s.company !== filters.company) return;
        if (companies.size && !companies.has(s.company)) return;
        if (lines.size && !lines.has(s.line)) return;
        model.stops.forEach(function (stop, index) {
          if (stop.place_id !== filters.location) return;
          var offset = index === 0 ? 0 : stop.arrival_offset;
          if (!Number.isFinite(offset)) return;
          var at = s.minutes + offset, shift = Math.floor(at / 1440);
          var days = Array.from(new Set(s.service_days.map(function (day) { return ((day - 1 + shift) % 7 + 7) % 7 + 1; }))).sort();
          if (filters.day && days.indexOf(Number(filters.day)) === -1) return;
          var minute = ((at % 1440) + 1440) % 1440;
          if (!inWindow(minute)) return;
          found.push({
            key: s.id + '@control-' + index,
            model: model,
            service: s,
            stopIndex: index,
            location: stop.place_id,
            at: at,
            minute: minute,
            days: days,
            publishedAtControl: index === 0,
            origin: model.stops[0].place_id,
            finalDestination: model.stops[model.stops.length - 1].place_id
          });
        });
      });
      return found.sort(function (a, b) { return a.minute - b.minute || a.service.company.localeCompare(b.service.company, 'es') || a.service.line.localeCompare(b.service.line, 'es') || a.key.localeCompare(b.key); });
    }
    return { models: models, places: places, label: label, query: query, facet: facet, control: control, coordinates: coordinates, modelById: byId, makeJourney: makeJourney, coverage: { total: models.length, linked: models.filter(function (m) { return m.profile; }).length } };
  }
  return { create: create, normalize: normalize, signature: signature, clock: clock, validProfile: validProfile };
}));
