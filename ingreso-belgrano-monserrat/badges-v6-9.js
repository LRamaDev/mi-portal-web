(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined' && window.document) {
    window.IngresoBadges = api;
    window.document.addEventListener('DOMContentLoaded', function () { api.init(window); });
  }
})(function () {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const SEEN_KEY = 'ingreso-belgrano-monserrat-badges-seen-v1';
  const DAY_MS = 86400000;

  const BADGES = [
    { id: 'primer-paso', icon: '🌱', title: 'Primer paso', category: 'Inicio', description: 'Completaste tu primer diagnóstico.', target: 1, unit: 'diagnóstico', metric: s => s.diagnostics },
    { id: 'en-marcha', icon: '🚀', title: 'En marcha', category: 'Constancia', description: 'Completaste 3 sesiones de estudio.', target: 3, unit: 'sesiones', metric: s => s.sessions },
    { id: 'constancia', icon: '⭐', title: 'Constancia', category: 'Constancia', description: 'Llegaste a 10 sesiones completas.', target: 10, unit: 'sesiones', metric: s => s.sessions },
    { id: 'racha', icon: '🔥', title: 'Racha de estudio', category: 'Constancia', description: 'Estudiaste al menos 3 días seguidos.', target: 3, unit: 'días seguidos', metric: s => s.maxStreak },
    { id: 'mate-activa', icon: '➗', title: 'Exploradora matemática', category: 'Práctica', description: 'Registraste 25 intentos de Matemática.', target: 25, unit: 'intentos', metric: s => s.mathAttempts },
    { id: 'lengua-activa', icon: '📚', title: 'Exploradora de palabras', category: 'Práctica', description: 'Registraste 25 intentos de Lengua.', target: 25, unit: 'intentos', metric: s => s.langAttempts },
    { id: 'equilibrio', icon: '⚖️', title: 'Entrenamiento equilibrado', category: 'Práctica', description: 'Acumulaste al menos 15 intentos en cada materia.', target: 15, unit: 'por materia', metric: s => Math.min(s.mathAttempts, s.langAttempts) },
    { id: 'persistente', icon: '🧗', title: 'Persistente', category: 'Esfuerzo', description: 'Volviste sobre un mismo tema hasta acumular 8 intentos.', target: 8, unit: 'intentos en un tema', metric: s => s.maxSkillAttempts },
    { id: 'temas-firmes', icon: '💪', title: 'Tres temas firmes', category: 'Aprendizaje', description: 'Alcanzaste 80% o más de dominio en 3 habilidades con práctica sostenida.', target: 3, unit: 'habilidades', metric: s => s.strongSkills },
    { id: 'primer-simulacro', icon: '🎯', title: 'Me animé al simulacro', category: 'Simulacros', description: 'Completaste tu primer simulacro de ingreso.', target: 1, unit: 'simulacro', metric: s => s.fullSimulations },
    { id: 'doble-desafio', icon: '🏫', title: 'Doble desafío', category: 'Simulacros', description: 'Completaste simulacros del Belgrano y del Monserrat.', target: 2, unit: 'colegios', metric: s => s.simulationSchools },
    { id: 'ochenta-puntos', icon: '🏅', title: '80 puntos o más', category: 'Simulacros', description: 'Alcanzaste al menos 80/100 en un simulacro completo.', target: 80, unit: 'puntos', metric: s => s.bestSimulationScore },
    { id: 'ritmo-20', icon: '🗓️', title: 'Ritmo sostenido', category: 'Constancia', description: 'Completaste 20 sesiones de estudio.', target: 20, unit: 'sesiones', metric: s => s.sessions },
    { id: 'racha-5', icon: '🔥', title: 'Cinco días en carrera', category: 'Constancia', description: 'Estudiaste al menos 5 días seguidos.', target: 5, unit: 'días seguidos', metric: s => s.maxStreak },
    { id: 'cien-intentos', icon: '💯', title: '100 intentos', category: 'Práctica', description: 'Acumulaste 100 respuestas registradas entre las dos materias.', target: 100, unit: 'intentos', metric: s => s.totalAttempts },
    { id: 'cinco-firmes', icon: '🌟', title: 'Cinco temas firmes', category: 'Aprendizaje', description: 'Alcanzaste 80% o más de dominio en 5 habilidades con práctica sostenida.', target: 5, unit: 'habilidades', metric: s => s.strongSkills },
    { id: 'nivel-ingreso', icon: '🧠', title: 'Subí la dificultad', category: 'Aprendizaje', description: 'Resolviste correctamente ejercicios de nivel Modo ingreso en 2 habilidades.', target: 2, unit: 'habilidades', metric: s => s.advancedSkills },
    { id: 'remontada', icon: '📈', title: '¡Qué remontada!', category: 'Superación', description: 'Mejoraste al menos 20 puntos de dominio en un tema que venías trabajando.', target: 1, unit: 'tema recuperado', metric: s => s.recoveredSkills, secret: true },
    { id: 'video-aprendo', icon: '🎬', title: 'Miré para entender', category: 'Recursos', description: 'Exploraste videos de apoyo de 3 temas diferentes.', target: 3, unit: 'temas con video', metric: s => s.videoTopics },
    { id: 'video-practico', icon: '▶️', title: 'Del video a la práctica', category: 'Recursos', description: 'Después del video elegiste practicar 3 temas diferentes.', target: 3, unit: 'temas practicados', metric: s => s.videoPracticeTopics },
    { id: 'simulacros-4', icon: '📝', title: 'Cuatro simulacros', category: 'Simulacros', description: 'Completaste 4 simulacros de ingreso.', target: 4, unit: 'simulacros', metric: s => s.fullSimulations },
    { id: 'noventa-puntos', icon: '🏆', title: '90 puntos o más', category: 'Simulacros', description: 'Alcanzaste al menos 90/100 en un simulacro completo.', target: 90, unit: 'puntos', metric: s => s.bestSimulationScore }
  ];

  let activeMode = null;
  let skillsById = new Map();

  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function readState(storage) {
    let parsed = {};
    try { parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '{}'); } catch (_) { parsed = {}; }
    parsed.profiles = parsed.profiles || {};
    ['p1', 'p2'].forEach(function (id, index) {
      parsed.profiles[id] = parsed.profiles[id] || {};
      parsed.profiles[id].name = parsed.profiles[id].name || ('Perfil ' + (index + 1));
      parsed.profiles[id].progress = parsed.profiles[id].progress || {};
      parsed.profiles[id].history = Array.isArray(parsed.profiles[id].history) ? parsed.profiles[id].history : [];
      parsed.profiles[id].sessions = safeNumber(parsed.profiles[id].sessions);
    });
    return parsed;
  }

  function localDayNumber(timestamp) {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return null;
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
  }

  function maxConsecutiveDays(history) {
    const days = Array.from(new Set((history || []).map(function (item) {
      return localDayNumber(item && item.at);
    }).filter(function (value) { return value !== null; }))).sort(function (a, b) { return a - b; });
    if (!days.length) return 0;
    let best = 1;
    let current = 1;
    for (let i = 1; i < days.length; i += 1) {
      if (days[i] === days[i - 1] + 1) current += 1;
      else current = 1;
      if (current > best) best = current;
    }
    return best;
  }

  function skillArea(skillId, map) {
    const fromMap = map && map.get ? map.get(skillId) : null;
    if (fromMap && fromMap.area) return fromMap.area;
    const id = String(skillId || '').toUpperCase();
    if (id.indexOf('MAT-') === 0) return 'matematica';
    if (id.indexOf('LEN-') === 0) return 'lengua';
    return null;
  }

  function statsForProfile(profile, map) {
    const progress = profile && profile.progress ? profile.progress : {};
    const history = profile && Array.isArray(profile.history) ? profile.history : [];
    let mathAttempts = 0;
    let langAttempts = 0;
    let maxSkillAttempts = 0;
    let strongSkills = 0;
    let advancedSkills = 0;
    let recoveredSkills = 0;

    Object.keys(progress).forEach(function (skillId) {
      const row = progress[skillId] || {};
      const attempts = safeNumber(row.attempts);
      const area = skillArea(skillId, map);
      if (area === 'matematica') mathAttempts += attempts;
      if (area === 'lengua') langAttempts += attempts;
      maxSkillAttempts = Math.max(maxSkillAttempts, attempts);
      if (attempts >= 3 && safeNumber(row.mastery) >= 80) strongSkills += 1;
      if (safeNumber(row.maxDifficultyCorrect) >= 4) advancedSkills += 1;
      if (attempts >= 5 && row.lowestMastery != null && safeNumber(row.mastery) >= 65 && safeNumber(row.mastery) - safeNumber(row.lowestMastery) >= 20) recoveredSkills += 1;
    });

    const simulations = history.filter(function (item) {
      return item && item.type === 'simulacro' && (item.fullExam || safeNumber(item.total) === 100);
    });
    const schoolSet = new Set(simulations.map(function (item) { return item.school; }).filter(Boolean));
    const scores = simulations.map(function (item) { return safeNumber(item.score); });
    const videoLearning = profile && profile.videoLearning ? profile.videoLearning : {};
    const videoTopics = new Set((videoLearning.viewed || []).map(function (row) { return String(row).split(':')[0]; }).filter(Boolean)).size;
    const videoPracticeTopics = new Set(Array.isArray(videoLearning.practiced) ? videoLearning.practiced : []).size;

    return {
      diagnostics: history.some(function (item) { return item && item.type === 'diagnostico'; }) ? 1 : 0,
      sessions: safeNumber(profile && profile.sessions),
      maxStreak: maxConsecutiveDays(history),
      mathAttempts: mathAttempts,
      langAttempts: langAttempts,
      totalAttempts: mathAttempts + langAttempts,
      maxSkillAttempts: maxSkillAttempts,
      strongSkills: strongSkills,
      advancedSkills: advancedSkills,
      recoveredSkills: recoveredSkills,
      videoTopics: videoTopics,
      videoPracticeTopics: videoPracticeTopics,
      fullSimulations: simulations.length,
      simulationSchools: schoolSet.size,
      bestSimulationScore: scores.length ? Math.max.apply(null, scores) : 0
    };
  }

  function progressText(badge, current) {
    const value = Math.min(current, badge.target);
    if (badge.id === 'primer-paso') return value ? 'Diagnóstico completado' : 'Falta el primer diagnóstico';
    if (badge.unit === 'puntos') return value + '/' + badge.target + ' puntos';
    return value + '/' + badge.target + ' ' + badge.unit;
  }

  function evaluateProfile(profile, map) {
    const stats = statsForProfile(profile || {}, map || new Map());
    return BADGES.map(function (badge) {
      const current = Math.max(0, safeNumber(badge.metric(stats)));
      return {
        id: badge.id,
        icon: badge.icon,
        title: badge.title,
        category: badge.category,
        description: badge.description,
        secret: Boolean(badge.secret),
        target: badge.target,
        current: current,
        earned: current >= badge.target,
        progressText: progressText(badge, current)
      };
    });
  }

  function earnedCount(profile, map) {
    return evaluateProfile(profile, map).filter(function (badge) { return badge.earned; }).length;
  }

  function badgeCardHtml(badge) {
    const pct = Math.max(0, Math.min(100, Math.round((badge.current / badge.target) * 100)));
    const hiddenSecret = badge.secret && !badge.earned;
    const title = hiddenSecret ? 'Insignia sorpresa' : badge.title;
    const description = hiddenSecret ? 'Seguí practicando: se desbloquea cuando superás un desafío de aprendizaje.' : badge.description;
    return '<article class="achievement-card ' + (badge.earned ? 'earned' : 'locked') + '">' +
      '<div class="achievement-top"><span class="achievement-icon" aria-hidden="true">' + (hiddenSecret ? '❔' : badge.icon) + '</span>' +
      '<span class="achievement-category">' + escapeHtml(badge.category) + '</span></div>' +
      '<h4>' + escapeHtml(title) + '</h4>' +
      '<p>' + escapeHtml(description) + '</p>' +
      (badge.earned
        ? '<span class="achievement-state earned-state">✓ Conseguida</span>'
        : '<div class="achievement-progress" aria-label="' + escapeHtml(badge.progressText) + '"><span>' + escapeHtml(badge.progressText) + '</span><div class="achievement-track"><span style="width:' + pct + '%"></span></div></div>') +
      '</article>';
  }

  function ensureUi(doc) {
    const homeGrid = doc.querySelector('[data-view="inicio"] .stats-grid');
    if (homeGrid && !doc.getElementById('stat-badges-card')) {
      const card = doc.createElement('article');
      card.id = 'stat-badges-card';
      card.className = 'stat-card achievement-stat';
      card.innerHTML = '<small>Insignias</small><strong id="stat-badges">0/' + BADGES.length + '</strong><span id="stat-badges-note">logros conseguidos</span>';
      homeGrid.appendChild(card);
    }

    const summary = doc.getElementById('progress-summary');
    if (summary && !doc.getElementById('achievements-panel')) {
      const panel = doc.createElement('section');
      panel.id = 'achievements-panel';
      panel.className = 'panel achievements-panel';
      panel.innerHTML = '<div class="achievements-heading"><div><p class="eyebrow">Motivación</p><h3>Insignias y logros</h3><p>No hace falta hacer todo perfecto: también hay insignias por practicar, volver a intentar y sostener el estudio.</p></div><span id="achievements-total" class="achievements-total"></span></div><div id="achievements-content"></div>';
      summary.insertAdjacentElement('afterend', panel);
    }
  }

  function activeProfileIds() {
    if (activeMode === 'together') return ['p1', 'p2'];
    if (activeMode === 'p1' || activeMode === 'p2') return [activeMode];
    return [];
  }

  function render(root) {
    const doc = root.document;
    ensureUi(doc);
    const state = readState(root.localStorage);
    const ids = activeProfileIds();

    const homeValue = doc.getElementById('stat-badges');
    const homeNote = doc.getElementById('stat-badges-note');
    if (homeValue && homeNote) {
      if (activeMode === 'together') {
        const p1 = earnedCount(state.profiles.p1, skillsById);
        const p2 = earnedCount(state.profiles.p2, skillsById);
        homeValue.textContent = p1 + ' + ' + p2;
        homeNote.textContent = 'insignias de cada perfil';
      } else if (ids.length) {
        const count = earnedCount(state.profiles[ids[0]], skillsById);
        homeValue.textContent = count + '/' + BADGES.length;
        homeNote.textContent = count === BADGES.length ? '¡colección completa!' : 'logros conseguidos';
      }
    }

    const content = doc.getElementById('achievements-content');
    const total = doc.getElementById('achievements-total');
    if (!content || !total || !ids.length) return;

    const groups = ids.map(function (id) {
      const profile = state.profiles[id];
      const evaluated = evaluateProfile(profile, skillsById);
      const count = evaluated.filter(function (badge) { return badge.earned; }).length;
      return '<section class="achievement-profile-group">' +
        (ids.length > 1 ? '<div class="achievement-profile-title"><strong>' + escapeHtml(profile.name) + '</strong><span>' + count + '/' + BADGES.length + '</span></div>' : '') +
        '<div class="achievements-grid">' + evaluated.map(badgeCardHtml).join('') + '</div></section>';
    }).join('');

    content.innerHTML = groups;
    if (ids.length === 1) {
      const count = earnedCount(state.profiles[ids[0]], skillsById);
      total.textContent = count + ' de ' + BADGES.length;
    } else {
      total.textContent = 'Cada perfil conserva sus propios logros';
    }
  }

  function readSeen(storage) {
    try {
      const parsed = JSON.parse(storage.getItem(SEEN_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeSeen(storage, seen) {
    try { storage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (_) {}
  }

  function showBadgeToast(root, names) {
    const toast = root.document.getElementById('toast');
    if (!toast || !names.length) return;
    const label = names.length === 1
      ? '🏅 ¡Nueva insignia! ' + names[0]
      : '🏅 ¡Nuevas insignias! ' + names.slice(0, 2).join(' · ') + (names.length > 2 ? ' +' + (names.length - 2) : '');
    toast.textContent = label;
    toast.classList.add('show');
    root.clearTimeout(showBadgeToast._timer);
    showBadgeToast._timer = root.setTimeout(function () { toast.classList.remove('show'); }, 5200);
  }

  function checkNewBadges(root, notify) {
    const ids = activeProfileIds();
    if (!ids.length) return render(root);
    const state = readState(root.localStorage);
    const seen = readSeen(root.localStorage);
    const newNames = [];

    ids.forEach(function (id) {
      const earnedIds = evaluateProfile(state.profiles[id], skillsById)
        .filter(function (badge) { return badge.earned; })
        .map(function (badge) { return badge.id; });
      if (!Array.isArray(seen[id])) {
        seen[id] = earnedIds;
        return;
      }
      const known = new Set(seen[id]);
      evaluateProfile(state.profiles[id], skillsById).forEach(function (badge) {
        if (badge.earned && !known.has(badge.id)) {
          known.add(badge.id);
          newNames.push((ids.length > 1 ? state.profiles[id].name + ': ' : '') + badge.title);
        }
      });
      seen[id] = Array.from(known);
    });

    writeSeen(root.localStorage, seen);
    render(root);
    if (notify && newNames.length) showBadgeToast(root, newNames);
  }

  function loadSkills(root) {
    return root.fetch('./data/habilidades.json')
      .then(function (response) { if (!response.ok) throw new Error('habilidades'); return response.json(); })
      .then(function (data) {
        skillsById = new Map((data.habilidades || []).map(function (skill) { return [skill.id, skill]; }));
        render(root);
      })
      .catch(function () { render(root); });
  }

  function init(root) {
    ensureUi(root.document);
    loadSkills(root);
    render(root);

    root.document.addEventListener('click', function (event) {
      const profile = event.target.closest && event.target.closest('.profile-card[data-profile]');
      if (profile) {
        activeMode = profile.dataset.profile;
        root.setTimeout(function () { checkNewBadges(root, false); }, 0);
        return;
      }

      if (event.target.closest && event.target.closest('#profile-switch, #active-profile')) {
        activeMode = null;
        return;
      }

      if (event.target.closest && event.target.closest('[data-nav="progreso"]')) {
        root.setTimeout(function () { render(root); }, 0);
      }

      if (event.target.closest && event.target.closest('#check-answer, #next-exercise, #fs-primary')) {
        root.setTimeout(function () { checkNewBadges(root, true); }, 220);
      }
    });

    root.addEventListener('ingreso:profile-changed', function (event) {
      activeMode = event.detail && event.detail.mode ? event.detail.mode : null;
      root.setTimeout(function () { checkNewBadges(root, false); }, 0);
    });

    root.addEventListener('storage', function (event) {
      if (event.key === STORAGE_KEY) render(root);
    });

    root.document.addEventListener('visibilitychange', function () {
      if (!root.document.hidden) checkNewBadges(root, false);
    });
  }

  return {
    BADGES: BADGES,
    statsForProfile: statsForProfile,
    evaluateProfile: evaluateProfile,
    maxConsecutiveDays: maxConsecutiveDays,
    init: init
  };
});
