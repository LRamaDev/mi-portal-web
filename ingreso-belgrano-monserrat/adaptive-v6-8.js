(() => {
  'use strict';

  const DAY_MS = 86400000;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function intervalDays(mastery, attempts = 1) {
    if (!attempts) return 0;
    const value = Number(mastery || 0);
    if (value < 40) return 1;
    if (value < 65) return 2;
    if (value < 85) return 4;
    return 7;
  }

  function profileReviewStatus(progress, now = Date.now()) {
    const attempts = Number(progress?.attempts || 0);
    const mastery = Number(progress?.mastery || 0);
    if (!attempts) {
      return {
        attempts: 0,
        mastery: 0,
        unseen: true,
        due: false,
        intervalDays: 0,
        ageDays: 0,
        ratio: 0,
        overdueDays: 0,
        daysUntilDue: 0
      };
    }

    const interval = intervalDays(mastery, attempts);
    const lastAt = Number(progress?.lastAt || 0);
    const ageDays = lastAt > 0 ? Math.max(0, (now - lastAt) / DAY_MS) : 999;
    const ratio = interval ? ageDays / interval : 0;
    const due = ageDays >= interval;
    return {
      attempts,
      mastery,
      unseen: false,
      due,
      intervalDays: interval,
      ageDays,
      ratio,
      overdueDays: due ? Math.max(0, ageDays - interval) : 0,
      daysUntilDue: due ? 0 : Math.max(0, interval - ageDays)
    };
  }

  function aggregateReviewStatus(progressRows, now = Date.now()) {
    const statuses = (progressRows || []).map(progress => profileReviewStatus(progress, now));
    const attempted = statuses.filter(status => !status.unseen);
    const unseenProfiles = statuses.filter(status => status.unseen).length;

    if (!attempted.length) {
      return {
        unseen: true,
        needsExposure: unseenProfiles > 0,
        unseenProfiles,
        due: false,
        dueProfiles: 0,
        mastery: 0,
        maxRatio: 0,
        maxOverdueDays: 0,
        nextDueDays: 0
      };
    }

    const dueRows = attempted.filter(status => status.due);
    return {
      unseen: false,
      needsExposure: unseenProfiles > 0,
      unseenProfiles,
      due: dueRows.length > 0,
      dueProfiles: dueRows.length,
      mastery: Math.round(attempted.reduce((sum, status) => sum + status.mastery, 0) / attempted.length),
      maxRatio: Math.max(...attempted.map(status => status.ratio)),
      maxOverdueDays: dueRows.length ? Math.max(...dueRows.map(status => status.overdueDays)) : 0,
      nextDueDays: dueRows.length ? 0 : Math.min(...attempted.map(status => status.daysUntilDue))
    };
  }

  function priorityAdjustment(status, coverageBonus = 0) {
    const coverage = Number(coverageBonus || 0);
    if (!status) return coverage;
    if (status.unseen) return coverage + 1.25;

    let adjustment = coverage;
    if (status.needsExposure) adjustment += 1.5;
    if (status.due) adjustment += clamp(1 + Math.max(0, status.maxRatio - 1) * 1.75, 1, 5);
    else adjustment -= clamp((1 - status.maxRatio) * 1.5, 0, 1.5);
    return adjustment;
  }

  const core = { DAY_MS, intervalDays, profileReviewStatus, aggregateReviewStatus, priorityAdjustment };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
    return;
  }

  const DISPLAY_VERSION = '6.8';
  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const COVERAGE_BONUS = {
    'MAT-FR-CON': 0.9,
    'MAT-MULT': 0.8,
    'MAT-PROB': 0.8,
    'MAT-TRI': 0.35,
    'MAT-CUAD': 0.35,
    'MAT-ANG': 0.35,
    'MAT-MED-CAP': 0.35,
    'MAT-MED-TIEMPO': 0.35,
    'LEN-COMP-LIT': 0.3,
    'LEN-COMP-INF': 0.3,
    'LEN-PARON': 0.25
  };

  const runtime = {
    activeMode: null,
    practiceSelectionActive: false,
    skills: [],
    renderTimer: null
  };

  function safeState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function profileIds() {
    if (runtime.activeMode === 'together') return ['p1', 'p2'];
    return ['p1', 'p2'].includes(runtime.activeMode) ? [runtime.activeMode] : [];
  }

  function hasDiagnostic(profileId, state = safeState()) {
    return (state.profiles?.[profileId]?.history || []).some(item => item?.type === 'diagnostico');
  }

  function statusForSkill(skillId, now = Date.now()) {
    const state = safeState();
    const ids = profileIds();
    const rows = ids.map(id => state.profiles?.[id]?.progress?.[skillId]);
    return aggregateReviewStatus(rows, now);
  }

  function decorateSkills(skillRows) {
    runtime.skills = Array.isArray(skillRows) ? skillRows : [];
    runtime.skills.forEach(skill => {
      if (!skill || skill.__v68Decorated) return;
      const basePriority = Number(skill.prioridad || 3);
      Object.defineProperty(skill, '__v68Decorated', { value: true, enumerable: false });
      Object.defineProperty(skill, '__v68BasePriority', { value: basePriority, enumerable: false });
      Object.defineProperty(skill, 'prioridad', {
        configurable: true,
        enumerable: true,
        get() {
          if (!runtime.practiceSelectionActive || !profileIds().length) return basePriority;
          const status = statusForSkill(skill.id);
          const adjusted = basePriority + priorityAdjustment(status, COVERAGE_BONUS[skill.id] || 0);
          return clamp(adjusted, 0.5, 12);
        }
      });
    });
    scheduleRender(50);
  }

  function installSkillsFetchDecorator() {
    if (window.__INGRESO_V68_SKILLS_FETCH__) return;
    window.__INGRESO_V68_SKILLS_FETCH__ = true;
    const previousFetch = window.fetch.bind(window);

    window.fetch = async function ingresoV68Fetch(input, initOptions) {
      const url = typeof input === 'string' ? input : (input?.url || '');
      const isSkills = url === './data/habilidades.json' || url.endsWith('/data/habilidades.json');
      const response = await previousFetch(input, initOptions);
      if (!isSkills || !response?.ok) return response;

      try {
        const data = await response.clone().json();
        decorateSkills(data.habilidades || []);
        return new Proxy(response, {
          get(target, property) {
            if (property === 'json') return async () => data;
            const value = Reflect.get(target, property, target);
            return typeof value === 'function' ? value.bind(target) : value;
          }
        });
      } catch (error) {
        console.warn('[Ingreso V6.8] No se pudo decorar el mapa de habilidades', error);
        return response;
      }
    };
  }

  function markPracticeSelection() {
    runtime.practiceSelectionActive = true;
    window.setTimeout(() => { runtime.practiceSelectionActive = false; }, 0);
  }

  function bindModeAndPracticeIntent() {
    document.querySelectorAll('.profile-card[data-profile]').forEach(button => {
      button.addEventListener('click', () => {
        runtime.activeMode = button.dataset.profile || null;
        scheduleRender(260);
      }, true);
    });

    document.querySelectorAll('#profile-switch, #active-profile').forEach(button => {
      button.addEventListener('click', () => {
        runtime.activeMode = null;
        scheduleRender(120);
      }, true);
    });

    document.querySelectorAll('[data-practice]').forEach(button => {
      button.addEventListener('click', markPracticeSelection, true);
    });

    document.querySelector('#start-recommended')?.addEventListener('click', () => {
      if (runtime.activeMode === 'together') return;
      const ids = profileIds();
      const state = safeState();
      if (ids.length && ids.every(id => hasDiagnostic(id, state))) markPracticeSelection();
    }, true);

    document.querySelectorAll('#check-answer, #next-exercise').forEach(button => {
      button.addEventListener('click', () => scheduleRender(120));
    });
  }

  function reviewRows(now = Date.now()) {
    const ids = profileIds();
    if (!ids.length || !runtime.skills.length) return [];
    const state = safeState();

    return runtime.skills.map(skill => {
      const rows = ids.map(id => state.profiles?.[id]?.progress?.[skill.id]);
      const status = aggregateReviewStatus(rows, now);
      return { skill, status };
    });
  }

  function reviewLabel(row) {
    if (row.status.needsExposure && runtime.activeMode === 'together') return 'Falta verlo en un perfil';
    if (row.status.maxOverdueDays >= 1) return `${Math.floor(row.status.maxOverdueDays)} d de atraso`;
    return 'Repasar hoy';
  }

  function ensureReviewSummary() {
    const priorityList = document.querySelector('#priority-list');
    if (!priorityList) return null;
    let summary = document.querySelector('#v68-review-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'v68-review-summary';
      summary.className = 'v68-review-summary';
      priorityList.insertAdjacentElement('beforebegin', summary);
    }
    return summary;
  }

  function renderReviewSummary() {
    const summary = ensureReviewSummary();
    if (!summary) return;
    const ids = profileIds();
    if (!ids.length) {
      summary.hidden = true;
      return;
    }

    summary.hidden = false;
    const state = safeState();
    const diagnosticsReady = ids.every(id => hasDiagnostic(id, state));
    const rows = reviewRows();
    const due = rows
      .filter(row => !row.status.unseen && row.status.due)
      .sort((a, b) => (b.status.maxRatio - a.status.maxRatio) || ((b.skill.__v68BasePriority || 3) - (a.skill.__v68BasePriority || 3)));
    const exposure = runtime.activeMode === 'together'
      ? rows.filter(row => row.status.needsExposure && !row.status.unseen && !row.status.due)
      : [];
    const suggestions = [...due, ...exposure].slice(0, 4);

    const recommended = document.querySelector('#start-recommended');
    if (recommended && runtime.activeMode !== 'together') {
      recommended.textContent = diagnosticsReady
        ? (due.length ? `Repaso de hoy · ${due.length}` : 'Empezar entrenamiento')
        : 'Empezar diagnóstico';
    }

    if (!diagnosticsReady && runtime.activeMode !== 'together') {
      summary.innerHTML = `
        <div class="v68-review-head"><div><span class="v68-review-icon">↻</span><strong>Repaso espaciado</strong></div><span class="v68-review-count">Después del diagnóstico</span></div>
        <p>Primero completá el diagnóstico. Con esas primeras evidencias la app va a decidir cuándo conviene volver sobre cada habilidad.</p>`;
      return;
    }

    const lead = due.length
      ? `${due.length} habilidad${due.length === 1 ? '' : 'es'} ${due.length === 1 ? 'está' : 'están'} lista${due.length === 1 ? '' : 's'} para repasar hoy.`
      : 'No hay repasos vencidos. Podés seguir practicando sin concentrar todo en lo mismo.';
    const togetherNote = runtime.activeMode === 'together'
      ? ' En modo juntas se prioriza una habilidad si cualquiera de los dos perfiles la tiene pendiente o todavía no la trabajó.'
      : '';

    summary.innerHTML = `
      <div class="v68-review-head"><div><span class="v68-review-icon">↻</span><strong>Repaso espaciado</strong></div><span class="v68-review-count">${due.length ? `${due.length} para hoy` : 'Al día'}</span></div>
      <p>${lead}${togetherNote}</p>
      ${suggestions.length ? `<div class="v68-review-chips">${suggestions.map(row => `<span><b>${escapeHtml(row.skill.nombre)}</b><small>${reviewLabel(row)}</small></span>`).join('')}</div>` : ''}
      <small class="v68-review-help">La app vuelve antes a lo que cuesta (aprox. 1–2 días) y separa más los repasos de lo que ya está firme (4–7 días). Estos intervalos son una decisión pedagógica interna de la app.</small>`;
  }

  function scheduleRender(delay = 0) {
    window.clearTimeout(runtime.renderTimer);
    runtime.renderTimer = window.setTimeout(renderReviewSummary, delay);
  }

  function installRenderObserver() {
    const target = document.querySelector('#priority-list');
    if (!target || typeof MutationObserver === 'undefined') return;
    new MutationObserver(() => scheduleRender(30)).observe(target, { childList: true, subtree: true });
  }

  function setVisibleVersion() {
    const meta = document.querySelector('meta[name="app-version"]');
    const releaseVersion = meta?.getAttribute('content') || DISPLAY_VERSION;
    const badge = document.querySelector('.build-version');
    if (badge) {
      badge.textContent = `Versión ${releaseVersion}`;
      badge.setAttribute('aria-label', `Versión instalada ${releaseVersion}`);
      badge.title = `Versión ${releaseVersion} · entrenamiento adaptativo con repaso espaciado`;
    }
  }

  function injectStyles() {
    if (document.querySelector('#v68-review-styles')) return;
    const style = document.createElement('style');
    style.id = 'v68-review-styles';
    style.textContent = `
      .v68-review-summary{margin:0 0 16px;padding:15px 16px;border:1px solid rgba(23,63,107,.12);border-radius:16px;background:linear-gradient(135deg,rgba(238,247,255,.96),rgba(249,252,255,.98));box-shadow:0 8px 24px rgba(23,63,107,.06)}
      .v68-review-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px}.v68-review-head>div{display:flex;align-items:center;gap:8px}.v68-review-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#173f6b;color:#fff;font-weight:900}.v68-review-count{padding:5px 9px;border-radius:999px;background:#fff;color:#173f6b;font-size:.78rem;font-weight:800;border:1px solid rgba(23,63,107,.12)}
      .v68-review-summary p{margin:0;color:#526679;line-height:1.5}.v68-review-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.v68-review-chips span{display:grid;gap:1px;padding:8px 10px;border-radius:12px;background:#fff;border:1px solid rgba(23,63,107,.1)}.v68-review-chips b{font-size:.82rem;color:#173f6b}.v68-review-chips small{font-size:.72rem;color:#6b7d8d}.v68-review-help{display:block;margin-top:9px;color:#718293;line-height:1.45}
      @media(max-width:700px){.v68-review-summary{padding:13px}.v68-review-head{align-items:flex-start}.v68-review-chips{display:grid;grid-template-columns:1fr 1fr}.v68-review-chips span{min-width:0}}
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
  }

  installSkillsFetchDecorator();
  bindModeAndPracticeIntent();
  injectStyles();
  setVisibleVersion();
  installRenderObserver();
  scheduleRender(80);

  document.addEventListener('DOMContentLoaded', () => {
    setVisibleVersion();
    installRenderObserver();
    scheduleRender(250);
    window.setTimeout(setVisibleVersion, 900);
  });

  window.INGRESO_V68 = {
    version: DISPLAY_VERSION,
    core,
    render: renderReviewSummary,
    setActiveMode(mode) {
      runtime.activeMode = mode;
      scheduleRender(0);
    },
    getReviewRows: reviewRows
  };
})();
