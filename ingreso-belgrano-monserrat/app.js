(() => {
  'use strict';

  const APP_VERSION = 3;
  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const DAY_MS = 86400000;
  const REPEAT_COOLDOWN_DAYS = 7;
  // Recursos elegidos por la familia. Cada ID se asocia solo al tema que explica.
  const VIDEO_RESOURCES = {
    p1: [
      { skillId: 'MAT-MED-LONG', videoId: 'FvLXSPXaKFI', title: 'Conversiones de medidas de longitud' },
      { skillId: 'MAT-ANG-CS', videoId: 'RhtBGxdYSJI', title: 'Ángulos complementarios y suplementarios' },
      { skillId: 'LEN-REV', videoId: '7Rf1w8UT_rg', title: 'Concordancia: cómo revisar una oración' },
      { skillId: 'MAT-DEC-OPS', videoId: 'y_F5eXD8Cb0', title: 'Sumas y restas con decimales' },
      { skillId: 'MAT-PER', videoId: 'OTT8SKMdBD8', title: 'Perímetros' }
    ],
    p2: [
      { skillId: 'MAT-FR-ORD', videoId: 'ZqnHbXCCSIc', title: 'Comparar fracciones' },
      { skillId: 'MAT-FR-OPS', videoId: 'qJtoI1ipxs8', title: 'Sumar y restar fracciones' },
      { skillId: 'MAT-CIRC', videoId: 'bG3f36JQkuA', title: 'Radio y diámetro a partir de la circunferencia' },
      { skillId: 'MAT-MCM', videoId: 'txLlA_fyL5g', title: 'Mínimo común múltiplo' },
      { skillId: 'MAT-SEX', videoId: 'u3RnEp5vMvs', title: 'Suma sexagesimal: ejemplo con horas y minutos' }
    ]
  };
  const DEFAULT_STATE = {
    version: APP_VERSION,
    updatedAt: 0,
    dailyExerciseLog: {},
    profiles: {
      p1: { name: 'Perfil 1', progress: {}, history: [], sessions: 0 },
      p2: { name: 'Perfil 2', progress: {}, history: [], sessions: 0 }
    }
  };

  let state = loadLocalState();
  let skills = [];
  let exercises = [];
  let skillsById = new Map();
  let activeMode = null;
  let session = null;
  let supa = null;
  let authUser = null;
  let syncTimer = null;
  let recommendedArea = null;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      const [skillsData, exerciseData] = await Promise.all([
        fetch('./data/habilidades.json').then(r => { if (!r.ok) throw new Error('habilidades'); return r.json(); }),
        fetch('./data/ejercicios.json').then(r => { if (!r.ok) throw new Error('ejercicios'); return r.json(); })
      ]);
      skills = skillsData.habilidades || [];
      exercises = exerciseData.ejercicios || [];
      skillsById = new Map(skills.map(s => [s.id, s]));
    } catch (error) {
      console.error(error);
      toast('No se pudieron cargar los contenidos. Recargá la página.');
    }

    bindUI();
    refreshGateNames();
    setupSupabase();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=6.12').catch(() => {});
  }

  function bindUI() {
    $$('.profile-card').forEach(btn => btn.addEventListener('click', () => enterProfile(btn.dataset.profile)));
    $('#profile-switch').addEventListener('click', leaveProfile);
    $('#active-profile').addEventListener('click', leaveProfile);
    $$('[data-nav]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); navigate(btn.dataset.nav); }));
    $('#start-recommended').addEventListener('click', startRecommended);
    $('#start-diagnostic').addEventListener('click', () => startSession({ type: 'diagnostico', area: 'all' }));
    $$('[data-practice]').forEach(btn => btn.addEventListener('click', () => startSession({ type: 'practica', area: btn.dataset.practice })));
    $$('[data-sim-school]').forEach(btn => btn.addEventListener('click', () => startSession({ type: 'simulacro', area: btn.dataset.simArea, school: btn.dataset.simSchool })));
    $$('[data-skill-filter]').forEach(btn => btn.addEventListener('click', () => {
      $$('[data-skill-filter]').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      renderSkills(btn.dataset.skillFilter);
    }));
    $('#save-profile-names').addEventListener('click', saveProfileNames);
    $('#close-exercise').addEventListener('click', () => closeExercise(true));
    $('#hint-button').addEventListener('click', showHint);
    $('#check-answer').addEventListener('click', checkCurrentAnswer);
    $('#next-exercise').addEventListener('click', nextExercise);
    $('#sign-in').addEventListener('click', signIn);
    $('#sign-up').addEventListener('click', signUp);
    $('#sign-out').addEventListener('click', signOut);
    $('#video-library').addEventListener('click', handleVideoAction);
    $('#family-tutoring-panel').addEventListener('click', event => {
      if (event.target.closest('[data-nav="videos"]')) navigate('videos');
    });
    $('#exercise-dialog').addEventListener('cancel', e => { e.preventDefault(); closeExercise(true); });
  }

  function cloneDefault() { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }

  function hydrateState(raw) {
    const base = cloneDefault();
    const parsed = raw && typeof raw === 'object' ? raw : {};
    return {
      ...base,
      ...parsed,
      version: APP_VERSION,
      dailyExerciseLog: normalizeDailyExerciseLog(parsed.dailyExerciseLog),
      profiles: {
        p1: { ...base.profiles.p1, ...(parsed.profiles?.p1 || {}), progress: { ...(parsed.profiles?.p1?.progress || {}) }, history: [...(parsed.profiles?.p1?.history || [])] },
        p2: { ...base.profiles.p2, ...(parsed.profiles?.p2 || {}), progress: { ...(parsed.profiles?.p2?.progress || {}) }, history: [...(parsed.profiles?.p2?.history || [])] }
      }
    };
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? hydrateState(JSON.parse(raw)) : cloneDefault();
    } catch {
      return cloneDefault();
    }
  }

  function normalizeDailyExerciseLog(raw) {
    const log = raw && typeof raw === 'object' ? raw : {};
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (REPEAT_COOLDOWN_DAYS + 1));
    return Object.fromEntries(Object.entries(log)
      .filter(([day, rows]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && new Date(`${day}T00:00:00`).getTime() >= cutoff.getTime() && rows && typeof rows === 'object')
      .map(([day, rows]) => [day, {
        p1: Array.isArray(rows.p1) ? [...new Set(rows.p1.map(String))] : [],
        p2: Array.isArray(rows.p2) ? [...new Set(rows.p2.map(String))] : []
      }]));
  }

  function localDayKey(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function usedExerciseIdsRecently(ids, now = Date.now()) {
    const cutoff = now - REPEAT_COOLDOWN_DAYS * DAY_MS;
    const used = new Set();
    Object.entries(state.dailyExerciseLog || {}).forEach(([day, rows]) => {
      const timestamp = new Date(`${day}T00:00:00`).getTime();
      if (Number.isNaN(timestamp) || timestamp < cutoff) return;
      ids.forEach(id => (rows[id] || []).forEach(exerciseId => used.add(exerciseId)));
    });
    return used;
  }

  function markExerciseUsedToday(profileId, exerciseId) {
    if (!['p1', 'p2'].includes(profileId) || !exerciseId) return;
    const day = localDayKey();
    state.dailyExerciseLog ||= {};
    state.dailyExerciseLog[day] ||= { p1: [], p2: [] };
    const used = state.dailyExerciseLog[day][profileId] ||= [];
    if (!used.includes(exerciseId)) used.push(exerciseId);
    state.dailyExerciseLog = normalizeDailyExerciseLog(state.dailyExerciseLog);
  }

  function saveState({ sync = true } = {}) {
    state.version = APP_VERSION;
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (sync && authUser && supa) queueRemoteSync();
  }

  function queueRemoteSync() {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(syncRemoteState, 700);
  }

  function refreshGateNames() {
    $('#gate-name-p1').textContent = state.profiles.p1.name;
    $('#gate-name-p2').textContent = state.profiles.p2.name;
    $('#profile-name-p1').value = state.profiles.p1.name;
    $('#profile-name-p2').value = state.profiles.p2.name;
  }

  function enterProfile(mode) {
    activeMode = mode;
    $('#profile-gate').hidden = true;
    $('#app-shell').hidden = false;
    updateActiveProfilePill();
    navigate('inicio');
    renderAll();
  }

  function leaveProfile() {
    if (session) closeExercise(false);
    $('#video-library').querySelectorAll('iframe').forEach(frame => frame.remove());
    activeMode = null;
    $('#app-shell').hidden = true;
    $('#profile-gate').hidden = false;
    refreshGateNames();
  }

  function activeProfileIds() {
    if (activeMode === 'together') return ['p1', 'p2'];
    return activeMode ? [activeMode] : [];
  }

  function primaryProfileId() { return activeMode === 'p2' ? 'p2' : 'p1'; }

  function currentResponderId() {
    if (activeMode !== 'together') return primaryProfileId();
    return session?.jointTurn % 2 === 0 ? 'p1' : 'p2';
  }

  function updateActiveProfilePill() {
    const label = activeMode === 'together'
      ? `${state.profiles.p1.name} + ${state.profiles.p2.name}`
      : state.profiles[primaryProfileId()].name;
    $('#active-profile').textContent = label;
  }

  function navigate(view) {
    if (!view) return;
    // Desmontar el reproductor detiene el audio al salir de la pestaña.
    if (view !== 'videos') $('#video-library').querySelectorAll('iframe').forEach(frame => frame.remove());
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
    $$('.nav-button, .mobile-nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
    if (view === 'contenidos') renderSkills($('.chip.active')?.dataset.skillFilter || 'all');
    if (view === 'progreso') renderProgress();
    if (view === 'videos') renderVideos();
    if (view === 'familia') renderFamily();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    renderDashboard();
    renderSkills('all');
    renderProgress();
    renderVideos();
    renderFamily();
  }

  function renderDashboard() {
    const ids = activeProfileIds();
    const title = activeMode === 'together'
      ? `¡Hola, ${state.profiles.p1.name} y ${state.profiles.p2.name}!`
      : `¡Hola, ${state.profiles[primaryProfileId()].name}!`;
    $('#welcome-title').textContent = title;
    const needsDiagnostic = ids.some(id => !hasCompletedDiagnostic(id));
    $('#welcome-copy').textContent = needsDiagnostic
      ? 'Primero vamos a descubrir qué contenidos ya están firmes. El diagnóstico ajusta la dificultad según las respuestas.'
      : 'La práctica de hoy prioriza lo que cuesta, sostiene lo que está en desarrollo y repasa lo que ya está firme.';

    renderAreaStat('math', aggregateArea(ids, 'matematica'));
    renderAreaStat('lang', aggregateArea(ids, 'lengua'));
    $('#stat-sessions').textContent = ids.reduce((sum, id) => sum + (state.profiles[id].sessions || 0), 0);
    renderPriorities(ids);
    renderNextStep(ids, needsDiagnostic);
    renderWeeklyMission(ids);
    renderBalanceCoach(needsDiagnostic ? null : balanceRecommendation());
  }

  function renderNextStep(ids, needsDiagnostic) {
    const button = $('#start-recommended');
    const copy = $('#next-step-copy');
    if (!button || !copy) return;
    if (needsDiagnostic) {
      recommendedArea = null;
      button.textContent = 'Empezar diagnóstico';
      copy.textContent = 'Siguiente paso: un diagnóstico breve para que las actividades se adapten a cada perfil.';
      return;
    }
    const balance = balanceRecommendation();
    if (balance) {
      recommendedArea = balance.area;
      button.textContent = `Practicar ${balance.area === 'lengua' ? 'Lengua' : 'Matemática'}`;
      copy.textContent = balance.message;
      return;
    }
    recommendedArea = null;
    const weakest = weakestSkillFor(ids);
    button.textContent = '¿Qué hago ahora?';
    copy.textContent = weakest
      ? `Siguiente paso: una práctica breve que va a priorizar ${weakest.nombre}.`
      : 'Siguiente paso: una práctica breve para consolidar lo que ya aprendiste.';
  }

  function balanceRecommendation() {
    const profile = state.profiles[activeMode === 'together' ? 'p1' : primaryProfileId()];
    const sessions = (profile?.history || []).filter(item => item.type !== 'diagnostico' && ['matematica', 'lengua'].includes(item.area));
    const recent = sessions.filter(item => item.at >= weekStart());
    const lastTwo = sessions.slice(-2);
    const targetFor = area => area === 'matematica' ? 'lengua' : 'matematica';
    const label = area => area === 'lengua' ? 'Lengua' : 'Matemática';
    if (lastTwo.length === 2 && lastTwo.every(item => item.area === lastTwo[0].area) && lastTwo.every(item => localDayKey(item.at) === localDayKey())) {
      const area = targetFor(lastTwo[0].area);
      return { area, source: lastTwo[0].area, reason: 'today', message: `Ya hicieron dos sesiones seguidas de ${label(lastTwo[0].area)}. Para equilibrar, la próxima recomendación es ${label(area)}.` };
    }
    const math = recent.filter(item => item.area === 'matematica').length;
    const lang = recent.filter(item => item.area === 'lengua').length;
    if (math - lang >= 2) return { area: 'lengua', source: 'matematica', reason: 'week', message: `Esta semana hubo ${math} sesión${math === 1 ? '' : 'es'} de Matemática y ${lang} de Lengua. Conviene alternar con Lengua.` };
    if (lang - math >= 2) return { area: 'matematica', source: 'lengua', reason: 'week', message: `Esta semana hubo ${lang} sesión${lang === 1 ? '' : 'es'} de Lengua y ${math} de Matemática. Conviene alternar con Matemática.` };
    return null;
  }

  function renderBalanceCoach(balance) {
    const coach = $('#balance-coach');
    if (!coach) return;
    if (!balance || balance.reason !== 'today') {
      coach.hidden = true;
      coach.innerHTML = '';
      return;
    }
    const source = balance.source === 'matematica' ? 'Matemática' : 'Lengua';
    const target = balance.area === 'lengua' ? 'Lengua' : 'Matemática';
    const icon = balance.area === 'lengua' ? '📚' : '➗';
    coach.hidden = false;
    coach.innerHTML = `<div class="balance-coach-icon" aria-hidden="true">${icon}</div><div><p class="eyebrow">Entrenamiento inteligente</p><h3>¡Cambio de materia!</h3><p>Ya practicaste bastante ${source} por hoy. En el ingreso vas a resolver Matemática y, enseguida, Lengua. Alternar ahora entrena a tu cabeza para cambiar de números y procedimientos a leer, comprender y escribir.</p><p class="balance-coach-prompt">¿Probamos una práctica breve de ${target}?</p><button class="secondary-button" type="button">Practicar ${target}</button></div>`;
    coach.querySelector('button').addEventListener('click', () => startSession({ type: 'practica', area: balance.area }));
  }

  function weekStart(timestamp = Date.now()) {
    const date = new Date(timestamp);
    const day = date.getDay() || 7;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - day + 1);
    return date.getTime();
  }

  function renderWeeklyMission(ids) {
    const container = $('#weekly-mission');
    if (!container || !ids.length) return;
    const start = weekStart();
    const completed = ids.reduce((total, id) => total + (state.profiles[id].history || []).filter(item => item.at >= start).length, 0);
    const target = activeMode === 'together' ? 4 : 3;
    const remaining = Math.max(0, target - completed);
    const title = remaining ? `Misión de la semana · ${completed}/${target}` : 'Misión de la semana cumplida';
    const message = remaining
      ? `Completá ${remaining} sesión${remaining === 1 ? '' : 'es'} más. Cuenta practicar, repasar o hacer un simulacro.`
      : '¡Muy bien! Podés seguir practicando, pero ya cumpliste tu objetivo de constancia.';
    container.innerHTML = `<div class="weekly-mission-icon" aria-hidden="true">✦</div><div><p class="eyebrow">Constancia</p><h3>${title}</h3><p>${message}</p></div><span class="weekly-mission-count">${completed}/${target}</span>`;
  }

  function renderAreaStat(suffix, summary) {
    const main = $(`#stat-${suffix}`);
    const note = $(`#stat-${suffix}-note`);
    if (!summary.seen) {
      main.textContent = 'Sin evaluar';
      note.textContent = 'Hacé el diagnóstico inicial';
      return;
    }
    main.textContent = masteryLabel(summary.mastery);
    note.textContent = `${summary.mastery}% de dominio estimado`;
  }

  function renderPriorities(ids) {
    const container = $('#priority-list');
    const ranked = skills
      .map(skill => ({ skill, summary: aggregateSkill(ids, skill.id) }))
      .filter(x => x.summary.attempts > 0)
      .sort((a, b) => a.summary.mastery - b.summary.mastery)
      .slice(0, 6);

    if (!ranked.length) {
      container.innerHTML = '<div class="priority-item"><div><strong>Todavía no hay diagnóstico</strong><small>Empezá con una sesión inicial para construir el mapa de fortalezas.</small></div><span class="level unseen">Sin evaluar</span></div>';
      return;
    }

    container.innerHTML = ranked.map(({ skill, summary }) => `
      <div class="priority-item">
        <div><strong>${escapeHtml(skill.nombre)}</strong><small>${skill.area === 'matematica' ? 'Matemática' : 'Lengua'} · ${escapeHtml(skill.grupo)}</small></div>
        <span class="level ${levelClass(summary.mastery)}">${masteryLabel(summary.mastery)}</span>
      </div>`).join('');
  }

  function renderSkills(filter = 'all') {
    const container = $('#skills-container');
    if (!container) return;
    container.innerHTML = ['matematica', 'lengua'].map(area => {
      const rows = skills.filter(s => s.area === area && skillMatchesFilter(s, filter));
      if (!rows.length) return '';
      const groups = groupBy(rows, 'grupo');
      const groupHtml = Object.entries(groups).map(([group, list]) => `
        <div class="skill-section"><h3>${escapeHtml(group)}</h3><div class="skill-grid">${list.map(skillCardHtml).join('')}</div></div>`).join('');
      return `<section><div class="page-heading"><p class="eyebrow">${area === 'matematica' ? 'Matemática' : 'Lengua'}</p></div>${groupHtml}</section>`;
    }).join('');
  }

  function skillMatchesFilter(skill, filter) {
    if (filter === 'all') return true;
    if (filter === 'comun') return skill.colegios.includes('comun');
    return skill.colegios.includes(filter);
  }

  function skillCardHtml(skill) {
    const ids = activeProfileIds();
    const summary = ids.length ? aggregateSkill(ids, skill.id) : { attempts: 0, mastery: 0 };
    const badges = skill.colegios.includes('comun')
      ? '<span class="school-badge">Común a ambos</span>'
      : skill.colegios.map(c => `<span class="school-badge ${c}">${capitalize(c)}</span>`).join('');
    return `<article class="skill-card"><div class="skill-card-top"><strong>${escapeHtml(skill.nombre)}</strong><span class="level ${summary.attempts ? levelClass(summary.mastery) : 'unseen'}">${summary.attempts ? `${summary.mastery}%` : '—'}</span></div><div class="school-badges">${badges}</div></article>`;
  }

  function renderProgress() {
    const ids = activeProfileIds();
    if (!ids.length) return;
    const math = aggregateArea(ids, 'matematica');
    const lang = aggregateArea(ids, 'lengua');
    const attempts = ids.reduce((sum, id) => sum + totalProfileAttempts(id), 0);
    $('#progress-summary').innerHTML = `
      <article class="stat-card"><small>Matemática</small><strong>${math.seen ? math.mastery + '%' : '—'}</strong><span>${math.seen ? masteryLabel(math.mastery) : 'Sin evaluar'}</span></article>
      <article class="stat-card"><small>Lengua</small><strong>${lang.seen ? lang.mastery + '%' : '—'}</strong><span>${lang.seen ? masteryLabel(lang.mastery) : 'Sin evaluar'}</span></article>
      <article class="stat-card"><small>Respuestas registradas</small><strong>${attempts}</strong><span>evidencias de aprendizaje</span></article>`;

    $('#progress-detail').innerHTML = ['matematica', 'lengua'].map(area => {
      const items = skills.filter(s => s.area === area).map(skill => ({ skill, s: aggregateSkill(ids, skill.id) })).filter(x => x.s.attempts > 0).sort((a,b) => a.s.mastery - b.s.mastery);
      const rows = items.length ? items.map(({skill, s}) => `
        <div class="progress-row"><strong>${escapeHtml(skill.nombre)}</strong><div class="progress-bar"><span style="width:${s.mastery}%"></span></div><small>${s.mastery}% · ${s.attempts} int.</small></div>`).join('') : '<p>Sin datos todavía. El diagnóstico inicial va a completar este mapa.</p>';
      return `<section class="progress-group"><h3>${area === 'matematica' ? 'Matemática' : 'Lengua'}</h3>${rows}</section>`;
    }).join('');
  }

  function renderVideos() {
    const container = $('#video-library');
    const sections = activeProfileIds().map(id => {
      const rows = VIDEO_RESOURCES[id].map(resource => ({
        ...resource, skill: skillsById.get(resource.skillId),
        progress: state.profiles[id]?.progress?.[resource.skillId]
      })).filter(row => row.skill);
      rows.sort((a, b) => {
        const aSeen = a.progress?.attempts > 0;
        const bSeen = b.progress?.attempts > 0;
        return (bSeen - aSeen) || (aSeen ? a.progress.mastery - b.progress.mastery : 0);
      });
      return `<section class="video-profile" data-profile="${id}">
        ${activeMode === 'together' ? `<h3>${escapeHtml(state.profiles[id].name)}</h3>` : ''}
        <p class="video-profile-intro">${rows.some(row => row.progress?.attempts) ? 'Primero aparecen los temas que más conviene repasar.' : 'Todavía no hay respuestas sobre estos temas. Podés explorar los videos y hacer el diagnóstico para ordenar las sugerencias.'}</p>
        <div class="video-grid">${rows.map(row => videoCardHtml(row, id)).join('')}</div>
      </section>`;
    });
    container.innerHTML = sections.join('');
  }

  function videoCardHtml({skill, videoId, title, progress}, profileId) {
    const attempts = progress?.attempts || 0;
    const status = attempts
      ? progress.mastery < 65 ? `Para reforzar · ${progress.mastery}% estimado` : `Para repasar · ${progress.mastery}% estimado`
      : 'Para explorar · sin respuestas todavía';
    return `<article class="video-card" data-video-id="${videoId}" data-profile="${profileId}">
      <div class="video-card-top"><span class="level ${attempts ? levelClass(progress.mastery) : 'unseen'}">${escapeHtml(status)}</span><span class="video-subject">${skill.area === 'lengua' ? 'Lengua' : 'Matemática'}</span></div>
      <h4>${escapeHtml(skill.nombre)}</h4><p>${escapeHtml(title)}</p>
      <div class="video-stage"><button class="video-play" type="button" data-play-video="${videoId}" aria-label="Ver video de ${escapeHtml(skill.nombre)} acá">▷ <span>Ver video acá</span></button></div>
      <div class="video-actions"><button class="secondary-button" type="button" data-video-practice="${escapeHtml(skill.id)}">Practicar este tema</button></div>
    </article>`;
  }

  function handleVideoAction(event) {
    const play = event.target.closest('[data-play-video]');
    const practice = event.target.closest('[data-video-practice]');
    if (play) {
      const card = play.closest('.video-card');
      const id = play.dataset.playVideo;
      if (!VIDEO_RESOURCES[card.dataset.profile]?.some(row => row.videoId === id)) return;
      // Un solo reproductor activo; iframe solo tras una acción explícita.
      $('#video-library').querySelectorAll('iframe').forEach(frame => frame.remove());
      $('#video-library').querySelectorAll('.video-play').forEach(button => { button.hidden = false; });
      play.hidden = true;
      const frame = document.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
      frame.title = `Video: ${card.querySelector('h4').textContent}`;
      frame.loading = 'lazy';
      frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      card.querySelector('.video-stage').append(frame);
    }
    if (practice) {
      const card = practice.closest('.video-card');
      const skillId = practice.dataset.videoPractice;
      if (!VIDEO_RESOURCES[card.dataset.profile]?.some(row => row.skillId === skillId)) return;
      startSession({ type: 'practica', area: skillsById.get(skillId).area, skillId });
    }
  }

  function renderFamily() {
    refreshGateNames();
    renderFamilyActivity();
    renderTutoringPlan();
    if (!supa) {
      $('#sync-status').textContent = 'Modo local';
      $('#sync-help').textContent = 'La app funciona en este dispositivo. Para sincronizar entre celulares y PC hay que completar config.js con un proyecto Supabase.';
      $('#sync-dot').classList.remove('online');
      $('#auth-box').hidden = true;
      $('#sign-out').hidden = true;
      return;
    }
    if (authUser) {
      $('#sync-status').textContent = 'Sincronización activa';
      $('#sync-help').textContent = `Cuenta familiar conectada: ${authUser.email || 'usuario'}. Los cambios se guardan en la nube.`;
      $('#sync-dot').classList.add('online');
      $('#auth-box').hidden = true;
      $('#sign-out').hidden = false;
    } else {
      $('#sync-status').textContent = 'Supabase conectado';
      $('#sync-help').textContent = 'Ingresá con una cuenta familiar para mantener el mismo progreso en todos los dispositivos.';
      $('#sync-dot').classList.remove('online');
      $('#auth-box').hidden = false;
      $('#sign-out').hidden = true;
    }
  }

  function renderFamilyActivity() {
    const panel = $('#family-activity-panel');
    if (!panel) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rows = ['p1', 'p2'].map(id => {
      const profile = state.profiles[id];
      const history = profile.history || [];
      const todaySessions = history.filter(item => item.at >= today.getTime());
      const recent = [...history].sort((a, b) => b.at - a.at)[0];
      const weekly = history.filter(item => item.at >= weekStart() && item.type !== 'diagnostico');
      const mathWeek = weekly.filter(item => item.area === 'matematica').length;
      const langWeek = weekly.filter(item => item.area === 'lengua').length;
      return { profile, todaySessions, recent, focus: weakestSkillFor([id]), mathWeek, langWeek };
    });
    panel.innerHTML = `<p class="eyebrow">Acompañamiento</p><h3>Actividad de hoy</h3><p class="family-activity-intro">Un resumen simple para conversar sobre el estudio, sin comparar perfiles.</p><div class="family-activity-list">${rows.map(row => {
      const todayText = row.todaySessions.length ? `${row.todaySessions.length} sesión${row.todaySessions.length === 1 ? '' : 'es'} hoy` : 'Todavía no estudió hoy';
      const recentText = row.recent ? `Última actividad: ${sessionLabel(row.recent)}.` : 'Todavía no hay sesiones completas.';
      const focusText = row.focus ? `Próximo foco: ${escapeHtml(row.focus.nombre)}.` : 'Próximo foco: completar el diagnóstico inicial.';
      return `<article><strong>${escapeHtml(row.profile.name)}</strong><span>${todayText}</span><em>Esta semana: Matemática ${row.mathWeek} · Lengua ${row.langWeek}</em><small>${recentText} ${focusText}</small></article>`;
    }).join('')}</div>`;
  }

  function weakestSkillFor(ids) {
    return skills.map(skill => ({ skill, summary: aggregateSkill(ids, skill.id) }))
      .filter(row => row.summary.attempts > 0)
      .sort((a, b) => a.summary.mastery - b.summary.mastery)[0]?.skill || null;
  }

  function sessionLabel(item) {
    if (item.type === 'diagnostico') return 'diagnóstico';
    if (item.type === 'simulacro') return `simulacro de ${item.school === 'monserrat' ? 'Monserrat' : 'Belgrano'}`;
    return item.area === 'matematica' ? 'práctica de Matemática' : item.area === 'lengua' ? 'práctica de Lengua' : 'práctica adaptativa';
  }

  function renderTutoringPlan() {
    const panel = $('#family-tutoring-panel');
    if (!panel) return;
    const day = new Date().getDay();
    const isPreparationDay = day === 2 || day === 3;
    const status = isPreparationDay
      ? 'Lista lista para preparar la particular del jueves'
      : 'La lista se actualiza con cada sesión de práctica';
    panel.innerHTML = `<div class="tutoring-heading"><div><p class="eyebrow">Acompañamiento externo</p><h3>Para revisar con la particular</h3><p>La app selecciona hasta tres temas según las respuestas. Los videos elegidos por la familia se ven en la pestaña Videos; después conviene probar otro ejercicio. Es una guía de conversación, no una nota.</p></div><span class="tutoring-status ${isPreparationDay ? 'ready' : ''}">${status}</span></div><div class="tutoring-list">${['p1', 'p2'].map(id => tutoringProfileHtml(state.profiles[id], id)).join('')}</div>`;
  }

  function tutoringProfileHtml(profile, id) {
    const topics = skills
      .map(skill => ({ skill, progress: profile.progress?.[skill.id] }))
      .filter(row => row.progress?.attempts > 0)
      .sort((a, b) => (a.progress.mastery - b.progress.mastery) || (b.progress.attempts - a.progress.attempts))
      .slice(0, 3);
    const body = topics.length
      ? `<ol>${topics.map(row => `<li><strong>${escapeHtml(row.skill.nombre)}</strong><small>${row.progress.mastery}% de dominio estimado · ${row.progress.attempts} intento${row.progress.attempts === 1 ? '' : 's'}</small>${tutoringVideoHtml(row, id)}</li>`).join('')}</ol>`
      : '<p class="tutoring-empty">Todavía no hay evidencia suficiente. Después del diagnóstico aparecerán los temas a revisar.</p>';
    return `<article class="tutoring-profile" data-profile="${id}"><h4>${escapeHtml(profile.name)}</h4>${body}</article>`;
  }

  function tutoringVideoHtml({skill, progress}, id) {
    if (progress.mastery >= 65) return '';
    const video = VIDEO_RESOURCES[id].find(row => row.skillId === skill.id);
    if (!video) return '';
    const note = progress.attempts < 3 ? 'Pocos intentos todavía: miralo si querés repasar.' : 'Puede ayudarte a repasar este tema.';
    if (activeMode !== 'together' && activeMode !== id) return `<small class="tutoring-video-note">Elegí este perfil para ver su video en la pestaña Videos.</small>`;
    return `<button class="tutoring-video" type="button" data-nav="videos">Ver video en la app →</button><small class="tutoring-video-note">${note}</small>`;
  }

  function saveProfileNames() {
    state.profiles.p1.name = $('#profile-name-p1').value.trim() || 'Perfil 1';
    state.profiles.p2.name = $('#profile-name-p2').value.trim() || 'Perfil 2';
    saveState();
    refreshGateNames();
    updateActiveProfilePill();
    renderDashboard();
    toast('Nombres guardados.');
  }

  function hasCompletedDiagnostic(id) {
    return (state.profiles[id]?.history || []).some(item => item.type === 'diagnostico');
  }

  function startRecommended() {
    const ids = activeProfileIds();
    if (ids.some(id => !hasCompletedDiagnostic(id))) startSession({ type: 'diagnostico', area: 'all' });
    else startSession({ type: 'practica', area: recommendedArea || 'all' });
  }

  function startSession({ type, area, school = null, skillId = null }) {
    if (!exercises.length) return toast('Todavía se están cargando los ejercicios.');
    if (type === 'diagnostico' && activeMode === 'together') {
      toast('El diagnóstico es individual. Hacelo desde cada perfil para que el mapa de fortalezas sea preciso.');
      return;
    }
    const pool = buildSessionPool(type, area, school, skillId);
    if (!pool.length) return toast('No quedan consignas nuevas para esta selección en los últimos 7 días. Probá otra materia o retomá más adelante.');
    session = {
      type, area, school, items: pool, index: 0, correct: 0, answers: [], hintUsed: false,
      checked: false, finished: false, jointTurn: 0, selfcheckOpen: false,
      diagnosticExtensions: 0, diagnosticMaxExtensions: 6, startedAt: Date.now()
    };
    $('#exercise-dialog').showModal();
    renderExercise();
  }

  function buildSessionPool(type, area, school, skillId = null) {
    let pool = exercises.filter(e => area === 'all' || e.area === area);
    if (skillId) pool = pool.filter(e => e.habilidad === skillId);
    if (school) pool = pool.filter(e => e.colegios.includes('comun') || e.colegios.includes(school));
    const usedRecently = usedExerciseIdsRecently(activeProfileIds());
    pool = pool.filter(e => !usedRecently.has(e.id));
    if (type === 'diagnostico') return buildAdaptiveDiagnostic(pool);
    if (type === 'simulacro') return buildSimulationPool(pool, school, area);
    return buildAdaptivePractice(pool, skillId ? 3 : 8);
  }

  function buildAdaptiveDiagnostic(pool) {
    const selected = [];
    const usedExerciseIds = new Set();
    ['matematica', 'lengua'].forEach(area => {
      const usedSkillIds = new Set();
      const usedGroups = new Set();
      const common = pickDiagnosticSkills(area, 'comun', 5, pool, usedSkillIds, usedGroups);
      const belgrano = pickDiagnosticSkills(area, 'belgrano', 1, pool, usedSkillIds, usedGroups);
      const monserrat = pickDiagnosticSkills(area, 'monserrat', 1, pool, usedSkillIds, usedGroups);
      [...common, ...belgrano, ...monserrat].forEach(skillId => {
        const exercise = chooseExerciseForSkill(skillId, 2.5, pool, usedExerciseIds);
        if (exercise) { selected.push(exercise); usedExerciseIds.add(exercise.id); }
      });
    });
    return shuffle(selected);
  }

  function pickDiagnosticSkills(area, tag, count, pool, usedSkillIds, usedGroups) {
    const pid = primaryProfileId();
    const candidates = skills
      .filter(skill => skill.area === area && skill.colegios.includes(tag) && !usedSkillIds.has(skill.id))
      .filter(skill => pool.some(e => e.habilidad === skill.id && e.tipo !== 'selfcheck'))
      .map(skill => ({ skill, progress: state.profiles[pid]?.progress?.[skill.id] || null }))
      .sort((a, b) => {
        const aUnseen = a.progress?.attempts ? 0 : 1;
        const bUnseen = b.progress?.attempts ? 0 : 1;
        return (bUnseen - aUnseen) || ((b.skill.prioridad || 0) - (a.skill.prioridad || 0)) || a.skill.id.localeCompare(b.skill.id);
      });
    const picked = [];
    for (const row of candidates) {
      if (picked.length >= count) break;
      if (usedGroups.has(row.skill.grupo)) continue;
      picked.push(row.skill.id); usedSkillIds.add(row.skill.id); usedGroups.add(row.skill.grupo);
    }
    for (const row of candidates) {
      if (picked.length >= count) break;
      if (usedSkillIds.has(row.skill.id)) continue;
      picked.push(row.skill.id); usedSkillIds.add(row.skill.id);
    }
    return picked;
  }

  function chooseExerciseForSkill(skillId, targetDifficulty, pool, usedExerciseIds = new Set()) {
    const candidates = pool
      .filter(e => e.habilidad === skillId && e.tipo !== 'selfcheck' && !usedExerciseIds.has(e.id))
      .map(e => ({ e, distance: Math.abs((e.dificultad || 2) - targetDifficulty), rnd: Math.random() * .2 }))
      .sort((a, b) => (a.distance + a.rnd) - (b.distance + b.rnd));
    return candidates[0]?.e || null;
  }

  function buildAdaptivePractice(pool, count) {
    const ids = activeProfileIds();
    const candidatePool = pool.filter(e => e.tipo !== 'selfcheck' || e.area === 'lengua');
    const rows = candidatePool.map(e => {
      const agg = aggregateSkill(ids, e.habilidad);
      const category = agg.attempts === 0 ? 'developing' : agg.mastery < 55 ? 'weak' : agg.mastery < 80 ? 'developing' : 'mastered';
      return { e, agg, category, score: practiceScore(e, agg, category) };
    });
    const selected = [];
    takePracticeRows(rows.filter(r => r.category === 'weak'), 5, selected);
    takePracticeRows(rows.filter(r => r.category === 'developing'), 2, selected);
    takePracticeRows(rows.filter(r => r.category === 'mastered'), 1, selected);
    if (selected.length < count) takePracticeRows(rows, count - selected.length, selected, false);
    return shuffle(selected.slice(0, count));
  }

  function practiceScore(e, agg, category) {
    const skill = skillsById.get(e.habilidad);
    const target = preferredDifficulty(agg);
    const priority = skill?.prioridad || 3;
    const distancePenalty = Math.abs((e.dificultad || 2) - target) * 6;
    const weaknessBonus = category === 'weak' ? (100 - agg.mastery) / 7 : 0;
    const noveltyBonus = agg.attempts === 0 ? 5 : Math.max(0, 4 - agg.attempts);
    const ageDays = agg.lastAt ? (Date.now() - agg.lastAt) / DAY_MS : 30;
    const reviewBonus = category === 'mastered' ? Math.min(10, ageDays / 3) : 0;
    return priority * 3 + weaknessBonus + noveltyBonus + reviewBonus - distancePenalty + Math.random() * 3;
  }

  function preferredDifficulty(agg) {
    if (!agg.attempts) return 2;
    if (agg.mastery < 35) return 1.5;
    if (agg.mastery < 55) return 2.2;
    if (agg.mastery < 80) return 3;
    return 3.6;
  }

  function takePracticeRows(rows, count, selected, preferUniqueSkill = true) {
    if (count <= 0) return;
    const selectedIds = new Set(selected.map(e => e.id));
    const selectedSkills = new Set(selected.map(e => e.habilidad));
    const ordered = [...rows].sort((a, b) => b.score - a.score);
    let remaining = count;
    for (const row of ordered) {
      if (!remaining) break;
      if (selectedIds.has(row.e.id)) continue;
      if (preferUniqueSkill && selectedSkills.has(row.e.habilidad)) continue;
      selected.push(row.e); selectedIds.add(row.e.id); selectedSkills.add(row.e.habilidad); remaining -= 1;
    }
    if (remaining && preferUniqueSkill) takePracticeRows(ordered, remaining, selected, false);
  }

  function buildSimulationPool(pool, school, area) {
    const objective = pool.filter(e => e.tipo !== 'selfcheck');
    const selected = [];
    const blueprints = simulationBlueprint(school, area);
    blueprints.forEach(block => takeSimulationBlock(objective, block.groups, block.count, selected));
    const target = blueprints.reduce((sum, block) => sum + block.count, 0);
    if (selected.length < target) takeSimulationBlock(objective, null, target - selected.length, selected);
    if (school === 'monserrat' && area === 'lengua') {
      const writing = shuffle(pool.filter(e => e.tipo === 'selfcheck' && e.habilidad === 'LEN-PROD'))[0];
      if (writing) selected.push(writing);
    }
    return selected;
  }

  function simulationBlueprint(school, area) {
    if (school === 'belgrano' && area === 'matematica') return [
      { groups: ['Números naturales', 'Divisibilidad'], count: 4 },
      { groups: ['Fracciones', 'Decimales'], count: 4 },
      { groups: ['Magnitudes', 'Geometría', 'Problemas'], count: 4 }
    ];
    if (school === 'monserrat' && area === 'matematica') return [
      { groups: ['Números naturales', 'Numeración', 'Patrones', 'Datos'], count: 3 },
      { groups: ['Divisibilidad', 'Fracciones', 'Decimales'], count: 3 },
      { groups: ['Magnitudes', 'Geometría', 'Problemas'], count: 4 }
    ];
    if (school === 'belgrano' && area === 'lengua') return [
      { groups: ['Comprensión', 'Texto y discurso', 'Comunicación', 'Cohesión', 'Semántica'], count: 5 },
      { groups: ['Narración', 'Literatura', 'Gramática', 'Sintaxis'], count: 4 },
      { groups: ['Ortografía', 'Puntuación'], count: 3 }
    ];
    if (school === 'monserrat' && area === 'lengua') return [
      { groups: ['Comprensión', 'Texto y discurso', 'Cohesión', 'Semántica', 'Narración', 'Literatura'], count: 4 },
      { groups: ['Gramática', 'Sintaxis'], count: 2 },
      { groups: ['Ortografía', 'Puntuación'], count: 4 }
    ];
    return [{ groups: null, count: 8 }];
  }

  function takeSimulationBlock(pool, groups, count, selected) {
    const selectedIds = new Set(selected.map(e => e.id));
    const selectedSkills = new Set(selected.map(e => e.habilidad));
    const candidates = pool
      .filter(e => !selectedIds.has(e.id))
      .filter(e => !groups || groups.includes(skillsById.get(e.habilidad)?.grupo))
      .map(e => ({ e, score: (e.dificultad || 2) * 2 + (skillsById.get(e.habilidad)?.prioridad || 3) + Math.random() * 5 }))
      .sort((a, b) => b.score - a.score);
    let remaining = count;
    for (const row of candidates) {
      if (!remaining) break;
      if (selectedSkills.has(row.e.habilidad)) continue;
      selected.push(row.e); selectedIds.add(row.e.id); selectedSkills.add(row.e.habilidad); remaining -= 1;
    }
    for (const row of candidates) {
      if (!remaining) break;
      if (selectedIds.has(row.e.id)) continue;
      selected.push(row.e); selectedIds.add(row.e.id); remaining -= 1;
    }
  }

  function maybeExtendDiagnostic(e, correct) {
    if (session?.type !== 'diagnostico' || session.diagnosticExtensions >= session.diagnosticMaxExtensions) return false;
    const used = new Set(session.items.map(item => item.id));
    const usedRecently = usedExerciseIdsRecently(activeProfileIds());
    const direction = correct ? 1 : -1;
    const candidates = exercises
      .filter(item => item.habilidad === e.habilidad && item.tipo !== 'selfcheck' && !used.has(item.id) && !usedRecently.has(item.id))
      .filter(item => direction > 0 ? item.dificultad > e.dificultad : item.dificultad < e.dificultad)
      .sort((a, b) => Math.abs(a.dificultad - (e.dificultad + direction)) - Math.abs(b.dificultad - (e.dificultad + direction)));
    const next = candidates[0];
    if (!next) return false;
    session.items.push(next);
    session.diagnosticExtensions += 1;
    return true;
  }

  function currentExercise() { return session?.items[session.index]; }

  function renderExercise() {
    const e = currentExercise();
    if (!e) return finishSession();
    session.hintUsed = false; session.checked = false; session.selfcheckOpen = false;
    $('#exercise-mode').textContent = session.type === 'diagnostico' ? 'Diagnóstico adaptativo' : session.type === 'simulacro' ? 'Simulacro' : 'Práctica adaptativa';
    $('#exercise-progress').textContent = `${session.index + 1} de ${session.items.length}`;
    $('#exercise-progress-bar').style.width = `${(session.index / session.items.length) * 100}%`;
    $('#exercise-tags').innerHTML = exerciseTags(e);
    $('#exercise-paper').hidden = !e.papel;
    $('#exercise-text').hidden = !e.texto;
    $('#exercise-text').textContent = e.texto || '';
    $('#exercise-prompt').textContent = e.consigna;
    $('#exercise-feedback').hidden = true; $('#exercise-feedback').className = 'feedback'; $('#exercise-feedback').innerHTML = '';
    $('#exercise-selfcheck').hidden = true; $('#exercise-selfcheck').innerHTML = '';
    $('#hint-button').hidden = session.type !== 'practica';
    $('#check-answer').hidden = false; $('#check-answer').textContent = 'Comprobar';
    $('#next-exercise').hidden = true; $('#next-exercise').textContent = 'Siguiente';
    if (activeMode === 'together') {
      const pid = currentResponderId();
      $('#turn-banner').hidden = false; $('#turn-banner').textContent = `Turno de ${state.profiles[pid].name}`;
    } else $('#turn-banner').hidden = true;
    const answerBox = $('#exercise-answer');
    answerBox.hidden = false;
    if (e.tipo === 'choice') {
      answerBox.innerHTML = `<div class="choice-list">${e.opciones.map(o => `<label class="choice-option"><input type="radio" name="exercise-choice" value="${escapeAttr(o)}"><span>${escapeHtml(o)}</span></label>`).join('')}</div>`;
    } else if (e.tipo === 'input') {
      answerBox.innerHTML = '<input class="answer-input" id="answer-input" autocomplete="off" inputmode="text" placeholder="Escribí tu respuesta">';
      setTimeout(() => $('#answer-input')?.focus(), 80);
    } else {
      answerBox.innerHTML = '<p>Cuando termines en el cuaderno, tocá <strong>Comprobar</strong> para abrir la lista de revisión.</p>';
    }
  }

  function exerciseTags(e) {
    const skill = skillsById.get(e.habilidad);
    const school = e.colegios.includes('comun') ? 'Común a ambos' : e.colegios.map(capitalize).join(' · ');
    const level = ['Descubrir', 'Practicar', 'Desafiarme', 'Modo ingreso'][clamp((e.dificultad || 1) - 1, 0, 3)];
    return `<span class="exercise-tag">${e.area === 'matematica' ? 'Matemática' : 'Lengua'}</span><span class="exercise-tag">${school}</span><span class="exercise-tag">${level}</span>${skill ? `<span class="exercise-tag">${escapeHtml(skill.nombre)}</span>` : ''}`;
  }

  function showHint() {
    const e = currentExercise();
    if (!e || session.checked) return;
    session.hintUsed = true;
    const box = $('#exercise-feedback');
    box.hidden = false; box.className = 'feedback hint';
    box.innerHTML = `<strong>Pista</strong>${escapeHtml(e.pista || 'Volvé a leer la consigna y revisá el procedimiento.')}`;
  }

  function checkCurrentAnswer() {
    if (!session || session.checked) return;
    const e = currentExercise();
    if (e.tipo === 'selfcheck') {
      if (!session.selfcheckOpen) return openSelfCheck(e);
      return saveSelfCheck(e);
    }
    const answer = readAnswer(e);
    if (answer === null || answer === '') return toast('Elegí o escribí una respuesta antes de continuar.');
    const correct = isCorrect(e, answer);
    const profileId = currentResponderId();
    session.checked = true; session.correct += correct ? 1 : 0;
    recordAttempt(e, correct, 1, profileId);
    session.answers.push({ id: e.id, correct, answer, profileId });
    const extended = maybeExtendDiagnostic(e, correct);
    const feedback = $('#exercise-feedback');
    feedback.hidden = false;
    if (session.type === 'practica') {
      feedback.className = `feedback ${correct ? 'ok' : 'bad'}`;
      feedback.innerHTML = correct ? `<strong>¡Bien!</strong>${escapeHtml(e.explicacion)}` : `<strong>Revisemos.</strong>La respuesta esperada es <b>${escapeHtml(String(e.respuesta))}</b>. ${escapeHtml(e.explicacion)}`;
    } else if (session.type === 'diagnostico') {
      feedback.className = 'feedback hint';
      feedback.innerHTML = extended ? '<strong>Respuesta registrada.</strong>El diagnóstico ajustó la dificultad de esta habilidad. La corrección aparece al final.' : '<strong>Respuesta registrada.</strong>La corrección aparece al final.';
    } else {
      feedback.className = 'feedback hint'; feedback.innerHTML = '<strong>Respuesta registrada.</strong>La corrección completa aparece al terminar.';
    }
    lockCurrentInputs();
    $('#check-answer').hidden = true; $('#hint-button').hidden = true; $('#next-exercise').hidden = false;
    $('#exercise-progress').textContent = `${session.index + 1} de ${session.items.length}`;
  }

  function openSelfCheck(e) {
    session.selfcheckOpen = true;
    const box = $('#exercise-selfcheck');
    box.hidden = false;
    box.innerHTML = `<p><strong>Revisá tu producción antes de continuar:</strong></p>${e.criterios.map((c,i) => `<label><input type="checkbox" value="${i}"><span>${escapeHtml(c)}</span></label>`).join('')}`;
    $('#exercise-answer').hidden = true; $('#check-answer').textContent = 'Guardar revisión';
  }

  function saveSelfCheck(e) {
    const checked = $$('#exercise-selfcheck input:checked').length;
    if (!checked) return toast('Marcá los criterios que cumpliste después de revisar el texto.');
    const correct = checked >= Math.ceil(e.criterios.length * .7);
    const profileId = currentResponderId();
    session.checked = true; session.correct += correct ? 1 : 0;
    recordAttempt(e, correct, .65, profileId);
    session.answers.push({ id: e.id, correct, selfChecked: checked, profileId });
    $('#exercise-feedback').hidden = false; $('#exercise-feedback').className = 'feedback hint';
    $('#exercise-feedback').innerHTML = `<strong>Revisión guardada.</strong>Marcaste ${checked} de ${e.criterios.length} criterios. Conservá la producción para revisarla nuevamente más adelante.`;
    $('#check-answer').hidden = true; $('#hint-button').hidden = true; $('#next-exercise').hidden = false;
  }

  function readAnswer(e) {
    if (e.tipo === 'choice') return $('input[name="exercise-choice"]:checked')?.value ?? null;
    if (e.tipo === 'input') return $('#answer-input')?.value.trim() ?? '';
    return null;
  }

  function isCorrect(e, answer) {
    const accepted = [e.respuesta, ...(e.alternativas || [])].map(normalizeAnswer);
    return accepted.includes(normalizeAnswer(answer));
  }

  function normalizeAnswer(v) { return String(v ?? '').trim().toLocaleLowerCase('es').replace(/\s+/g,'').replace(/^\$/,''); }
  function lockCurrentInputs() { $$('#exercise-answer input').forEach(i => i.disabled = true); }

  function nextExercise() {
    if (!session) return;
    if (session.finished) { closeExercise(false); navigate('progreso'); return; }
    if (!session.checked) return;
    session.index += 1;
    if (activeMode === 'together') session.jointTurn += 1;
    if (session.index >= session.items.length) finishSession(); else renderExercise();
  }

  function finishSession() {
    if (!session) return;
    activeProfileIds().forEach(id => {
      const ownAnswers = session.answers.filter(a => a.profileId === id);
      const ownScore = ownAnswers.filter(a => a.correct).length;
      const ownTotal = ownAnswers.length;
      state.profiles[id].sessions = (state.profiles[id].sessions || 0) + 1;
      state.profiles[id].history = [...(state.profiles[id].history || []), {
        at: Date.now(), type: session.type, area: session.area, school: session.school,
        score: ownScore, total: ownTotal,
        durationSeconds: Math.max(1, Math.round((Date.now() - session.startedAt) / 1000)),
        adaptiveExtensions: session.type === 'diagnostico' ? session.diagnosticExtensions : 0
      }].slice(-60);
    });
    saveState();
    session.finished = true;
    $('#exercise-progress-bar').style.width = '100%';
    $('#exercise-tags').innerHTML = ''; $('#exercise-paper').hidden = true; $('#exercise-text').hidden = true;
    $('#exercise-prompt').textContent = session.type === 'diagnostico' ? 'Diagnóstico adaptativo completado' : session.type === 'simulacro' ? 'Simulacro completado' : '¡Sesión completada!';
    $('#exercise-answer').hidden = false; $('#exercise-answer').innerHTML = sessionSummaryHtml();
    $('#exercise-feedback').hidden = true; $('#exercise-selfcheck').hidden = true; $('#hint-button').hidden = true; $('#check-answer').hidden = true;
    $('#next-exercise').hidden = false; $('#next-exercise').textContent = 'Ver mi avance';
    renderAll();
  }

  function sessionSummaryHtml() {
    const total = session.answers.length;
    const correct = session.answers.filter(a => a.correct).length;
    const ratio = total ? correct / total : 0;
    let extra = '';
    if (session.type === 'diagnostico') extra = `<p>El diagnóstico agregó ${session.diagnosticExtensions} comprobación${session.diagnosticExtensions === 1 ? '' : 'es'} de dificultad para precisar el mapa.</p>`;
    if (session.type === 'simulacro' && session.school === 'monserrat' && session.area === 'lengua') extra += '<p>La producción escrita se incluye como revisión guiada; su ponderación todavía no equivale al puntaje oficial del examen.</p>';
    const review = session.type === 'practica' ? '' : sessionReviewHtml();
    const focus = sessionFocus();
    return `<div class="today-card session-summary-card"><strong>${correct} de ${total} respuestas logradas</strong><p>${summaryMessage(ratio)}</p>${focus}${extra}</div>${review}`;
  }

  function sessionFocus() {
    const grouped = {};
    session.answers.forEach(answer => {
      const exercise = exercises.find(e => e.id === answer.id);
      if (!exercise) return;
      (grouped[exercise.habilidad] ||= []).push({ answer, exercise });
    });
    const rows = Object.entries(grouped).map(([skillId, list]) => ({
      skill: skillsById.get(skillId), total: list.length, correct: list.filter(row => row.answer.correct).length
    })).filter(row => row.skill);
    if (!rows.length) return '';
    const best = [...rows].sort((a, b) => (b.correct / b.total) - (a.correct / a.total))[0];
    const focus = [...rows].sort((a, b) => (a.correct / a.total) - (b.correct / b.total))[0];
    const strength = best.correct / best.total >= .7 ? `Hoy avanzaste especialmente en <b>${escapeHtml(best.skill.nombre)}</b>. ` : '';
    return `<p class="session-focus">${strength}Próximo paso: la app va a volver sobre <b>${escapeHtml(focus.skill.nombre)}</b> en una práctica breve.</p>`;
  }

  function sessionReviewHtml() {
    const wrong = session.answers.filter(a => !a.correct).map(a => ({ a, e: exercises.find(e => e.id === a.id) })).filter(x => x.e && x.e.tipo !== 'selfcheck');
    if (!wrong.length) return '<div class="feedback ok"><strong>Corrección final</strong>No quedaron respuestas objetivas para revisar.</div>';
    return `<div class="progress-group"><h3>Para revisar</h3>${wrong.map(({e}) => `<div class="priority-item"><div><strong>${escapeHtml(skillsById.get(e.habilidad)?.nombre || 'Actividad')}</strong><small>Respuesta esperada: ${escapeHtml(String(e.respuesta))}. ${escapeHtml(e.explicacion || '')}</small></div></div>`).join('')}</div>`;
  }

  function summaryMessage(ratio) {
    if (ratio >= .8) return 'Muy buen desempeño. La app va a mantener repasos breves para que esos contenidos sigan firmes.';
    if (ratio >= .55) return 'Hay una buena base. Las próximas prácticas van a concentrarse en los temas que todavía necesitan afianzarse.';
    return 'Ya tenemos información útil para empezar. La app va a bajar la dificultad, reforzar conceptos y volver a probarlos más adelante.';
  }

  function closeExercise(confirmClose) {
    if (!session) { if ($('#exercise-dialog').open) $('#exercise-dialog').close(); return; }
    if (confirmClose && !session.finished && session.index < session.items.length - 1) {
      if (!window.confirm('¿Querés salir de esta sesión? Las respuestas ya registradas quedan guardadas.')) return;
    }
    session = null;
    if ($('#exercise-dialog').open) $('#exercise-dialog').close();
    renderAll();
  }

  function recordAttempt(e, correct, weight = 1, profileId = null) {
    const pid = profileId || currentResponderId();
    const profile = state.profiles[pid];
    const prev = profile.progress[e.habilidad] || { attempts: 0, correct: 0, mastery: 0, lastAt: 0 };
    let evidence = correct ? 52 + e.dificultad * 10 : Math.max(8, 38 - e.dificultad * 4);
    if (session?.hintUsed && correct) evidence -= 10;
    evidence = Math.round(evidence * weight);
    const mastery = prev.attempts === 0 ? evidence : Math.round(prev.mastery * .68 + evidence * .32);
    profile.progress[e.habilidad] = { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0), mastery: clamp(mastery, 0, 100), lastAt: Date.now() };
    markExerciseUsedToday(pid, e.id);
    saveState();
  }

  function aggregateSkill(ids, skillId) {
    const rows = ids.map(id => state.profiles[id]?.progress?.[skillId]).filter(Boolean);
    if (!rows.length) return { attempts: 0, correct: 0, mastery: 0, lastAt: 0 };
    return {
      attempts: rows.reduce((s,r) => s + (r.attempts || 0), 0),
      correct: rows.reduce((s,r) => s + (r.correct || 0), 0),
      mastery: Math.round(rows.reduce((s,r) => s + (r.mastery || 0), 0) / rows.length),
      lastAt: Math.max(...rows.map(r => r.lastAt || 0))
    };
  }

  function aggregateArea(ids, area) {
    const rows = skills.filter(s => s.area === area).map(s => aggregateSkill(ids, s.id)).filter(x => x.attempts > 0);
    if (!rows.length) return { seen: false, mastery: 0 };
    return { seen: true, mastery: Math.round(rows.reduce((sum,r) => sum + r.mastery, 0) / rows.length) };
  }

  function totalProfileAttempts(id) { return Object.values(state.profiles[id]?.progress || {}).reduce((sum, p) => sum + (p.attempts || 0), 0); }
  function masteryLabel(value) { if (value < 40) return 'Estoy aprendiendo'; if (value < 65) return 'Voy avanzando'; if (value < 85) return 'Lo tengo bastante claro'; return 'Lo domino'; }
  function levelClass(value) { if (value < 40) return 'low'; if (value < 70) return 'mid'; return 'high'; }

  function setupSupabase() {
    const cfg = window.INGRESO_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) { renderFamily(); return; }
    try {
      supa = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      supa.auth.getSession().then(({ data }) => { authUser = data.session?.user || null; if (authUser) loadRemoteState(); renderFamily(); });
      supa.auth.onAuthStateChange((_event, sessionData) => { authUser = sessionData?.user || null; if (authUser) loadRemoteState(); renderFamily(); });
    } catch (error) { console.error(error); supa = null; renderFamily(); }
  }

  async function signIn() {
    if (!supa) return;
    const email = $('#auth-email').value.trim(); const password = $('#auth-password').value;
    if (!email || password.length < 6) return toast('Completá correo y una contraseña de al menos 6 caracteres.');
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) toast('No se pudo ingresar: ' + error.message); else toast('Cuenta familiar conectada.');
  }

  async function signUp() {
    if (!supa) return;
    const email = $('#auth-email').value.trim(); const password = $('#auth-password').value;
    if (!email || password.length < 6) return toast('Completá correo y una contraseña de al menos 6 caracteres.');
    const { error } = await supa.auth.signUp({ email, password });
    if (error) toast('No se pudo crear la cuenta: ' + error.message);
    else toast('Cuenta creada. Si Supabase pide confirmación por correo, confirmala antes de ingresar.');
  }

  async function signOut() {
    if (!supa) return;
    await supa.auth.signOut(); authUser = null; renderFamily();
    toast('Sesión familiar cerrada. El progreso local se conserva.');
  }

  async function loadRemoteState() {
    if (!supa || !authUser) return;
    const { data, error } = await supa.from('study_state').select('payload,updated_at').eq('user_id', authUser.id).maybeSingle();
    if (error) { console.error(error); toast('Supabase está conectado, pero falta crear la tabla study_state o revisar sus permisos.'); return; }
    if (!data?.payload) { await syncRemoteState(); return; }
    const remote = hydrateState(data.payload);
    if ((remote.updatedAt || 0) > (state.updatedAt || 0)) {
      state = remote; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); refreshGateNames(); if (activeMode) renderAll();
      toast('Progreso actualizado desde la nube.');
    } else await syncRemoteState();
  }

  async function syncRemoteState() {
    if (!supa || !authUser) return;
    const { error } = await supa.from('study_state').upsert({ user_id: authUser.id, payload: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) console.error('Error de sincronización', error);
  }

  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast._timer); toast._timer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  function groupBy(list, key) { return list.reduce((acc, item) => { (acc[item[key]] ||= []).push(item); return acc; }, {}); }
  function shuffle(list) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function escapeAttr(value) { return escapeHtml(value); }
})();
