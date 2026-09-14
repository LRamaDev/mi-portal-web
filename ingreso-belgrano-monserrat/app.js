(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const DEFAULT_STATE = {
    version: 1,
    updatedAt: 0,
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
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
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
    $('#exercise-dialog').addEventListener('cancel', e => { e.preventDefault(); closeExercise(true); });
  }

  function cloneDefault() { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefault();
      const parsed = JSON.parse(raw);
      const base = cloneDefault();
      return {
        ...base,
        ...parsed,
        profiles: {
          p1: { ...base.profiles.p1, ...(parsed.profiles?.p1 || {}) },
          p2: { ...base.profiles.p2, ...(parsed.profiles?.p2 || {}) }
        }
      };
    } catch { return cloneDefault(); }
  }

  function saveState({ sync = true } = {}) {
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

  function updateActiveProfilePill() {
    const label = activeMode === 'together'
      ? `${state.profiles.p1.name} + ${state.profiles.p2.name}`
      : state.profiles[primaryProfileId()].name;
    $('#active-profile').textContent = label;
  }

  function navigate(view) {
    if (!view) return;
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
    $$('.nav-button, .mobile-nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
    if (view === 'contenidos') renderSkills($('.chip.active')?.dataset.skillFilter || 'all');
    if (view === 'progreso') renderProgress();
    if (view === 'familia') renderFamily();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() {
    renderDashboard();
    renderSkills('all');
    renderProgress();
    renderFamily();
  }

  function renderDashboard() {
    const ids = activeProfileIds();
    const title = activeMode === 'together'
      ? `¡Hola, ${state.profiles.p1.name} y ${state.profiles.p2.name}!`
      : `¡Hola, ${state.profiles[primaryProfileId()].name}!`;
    $('#welcome-title').textContent = title;
    const totalAttempts = ids.reduce((sum, id) => sum + totalProfileAttempts(id), 0);
    $('#welcome-copy').textContent = totalAttempts === 0
      ? 'Primero vamos a descubrir qué contenidos ya están firmes y cuáles conviene reforzar.'
      : 'La práctica de hoy combina temas a reforzar con un repaso de contenidos que ya vienen bien.';

    renderAreaStat('math', aggregateArea(ids, 'matematica'));
    renderAreaStat('lang', aggregateArea(ids, 'lengua'));
    $('#stat-sessions').textContent = ids.reduce((sum, id) => sum + (state.profiles[id].sessions || 0), 0);
    renderPriorities(ids);
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

  function renderFamily() {
    refreshGateNames();
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

  function saveProfileNames() {
    state.profiles.p1.name = $('#profile-name-p1').value.trim() || 'Perfil 1';
    state.profiles.p2.name = $('#profile-name-p2').value.trim() || 'Perfil 2';
    saveState();
    refreshGateNames();
    updateActiveProfilePill();
    renderDashboard();
    toast('Nombres guardados.');
  }

  function startRecommended() {
    const ids = activeProfileIds();
    const attempts = ids.reduce((sum, id) => sum + totalProfileAttempts(id), 0);
    if (attempts < 8) startSession({ type: 'diagnostico', area: 'all' });
    else startSession({ type: 'practica', area: 'all' });
  }

  function startSession({ type, area, school = null }) {
    if (!exercises.length) return toast('Todavía se están cargando los ejercicios.');
    const pool = buildSessionPool(type, area, school);
    if (!pool.length) return toast('No hay ejercicios disponibles para esta selección.');
    session = { type, area, school, items: pool, index: 0, correct: 0, answers: [], hintUsed: false, checked: false, finished: false, jointTurn: 0, selfcheckOpen: false };
    $('#exercise-dialog').showModal();
    renderExercise();
  }

  function buildSessionPool(type, area, school) {
    let pool = exercises.filter(e => area === 'all' || e.area === area);
    if (school) pool = pool.filter(e => e.colegios.includes('comun') || e.colegios.includes(school));
    if (type === 'diagnostico') {
      const math = shuffle(pool.filter(e => e.area === 'matematica' && e.tipo !== 'selfcheck')).slice(0, 8);
      const lang = shuffle(pool.filter(e => e.area === 'lengua' && e.tipo !== 'selfcheck')).slice(0, 8);
      return shuffle([...math, ...lang]);
    }
    if (type === 'simulacro') return shuffle(pool.filter(e => e.tipo !== 'selfcheck')).slice(0, 8);
    const ids = activeProfileIds();
    return pool.map(e => {
      const agg = aggregateSkill(ids, e.habilidad);
      return { e, weakness: agg.attempts ? 100 - agg.mastery : 55, rnd: Math.random() * 28 };
    }).sort((a,b) => (b.weakness + b.rnd) - (a.weakness + a.rnd)).slice(0, 8).map(x => x.e);
  }

  function currentExercise() { return session?.items[session.index]; }

  function renderExercise() {
    const e = currentExercise();
    if (!e) return finishSession();
    session.hintUsed = false;
    session.checked = false;
    session.selfcheckOpen = false;

    $('#exercise-mode').textContent = session.type === 'diagnostico' ? 'Diagnóstico' : session.type === 'simulacro' ? 'Simulacro' : 'Práctica';
    $('#exercise-progress').textContent = `${session.index + 1} de ${session.items.length}`;
    $('#exercise-progress-bar').style.width = `${(session.index / session.items.length) * 100}%`;
    $('#exercise-tags').innerHTML = exerciseTags(e);
    $('#exercise-paper').hidden = !e.papel;
    $('#exercise-text').hidden = !e.texto;
    $('#exercise-text').textContent = e.texto || '';
    $('#exercise-prompt').textContent = e.consigna;
    $('#exercise-feedback').hidden = true;
    $('#exercise-feedback').className = 'feedback';
    $('#exercise-feedback').innerHTML = '';
    $('#exercise-selfcheck').hidden = true;
    $('#exercise-selfcheck').innerHTML = '';
    $('#hint-button').hidden = session.type !== 'practica';
    $('#check-answer').hidden = false;
    $('#check-answer').textContent = 'Comprobar';
    $('#next-exercise').hidden = true;
    $('#next-exercise').textContent = 'Siguiente';

    if (activeMode === 'together') {
      const pid = session.jointTurn % 2 === 0 ? 'p1' : 'p2';
      $('#turn-banner').hidden = false;
      $('#turn-banner').textContent = `Turno de ${state.profiles[pid].name}`;
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
    return `<span class="exercise-tag">${e.area === 'matematica' ? 'Matemática' : 'Lengua'}</span><span class="exercise-tag">${school}</span><span class="exercise-tag">Nivel ${e.dificultad}</span>${skill ? `<span class="exercise-tag">${escapeHtml(skill.nombre)}</span>` : ''}`;
  }

  function showHint() {
    const e = currentExercise();
    if (!e || session.checked) return;
    session.hintUsed = true;
    const box = $('#exercise-feedback');
    box.hidden = false;
    box.className = 'feedback hint';
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
    session.checked = true;
    session.correct += correct ? 1 : 0;
    recordAttempt(e, correct);
    session.answers.push({ id: e.id, correct, answer });

    const feedback = $('#exercise-feedback');
    feedback.hidden = false;
    if (session.type === 'practica') {
      feedback.className = `feedback ${correct ? 'ok' : 'bad'}`;
      feedback.innerHTML = correct
        ? `<strong>¡Bien!</strong>${escapeHtml(e.explicacion)}`
        : `<strong>Revisemos.</strong>La respuesta esperada es <b>${escapeHtml(String(e.respuesta))}</b>. ${escapeHtml(e.explicacion)}`;
    } else {
      feedback.className = 'feedback hint';
      feedback.innerHTML = '<strong>Respuesta registrada.</strong>La corrección completa aparece al terminar.';
    }
    lockCurrentInputs();
    $('#check-answer').hidden = true;
    $('#hint-button').hidden = true;
    $('#next-exercise').hidden = false;
  }

  function openSelfCheck(e) {
    session.selfcheckOpen = true;
    const box = $('#exercise-selfcheck');
    box.hidden = false;
    box.innerHTML = `<p><strong>Revisá tu producción antes de continuar:</strong></p>${e.criterios.map((c,i) => `<label><input type="checkbox" value="${i}"><span>${escapeHtml(c)}</span></label>`).join('')}`;
    $('#exercise-answer').hidden = true;
    $('#check-answer').textContent = 'Guardar revisión';
  }

  function saveSelfCheck(e) {
    const checked = $$('#exercise-selfcheck input:checked').length;
    if (!checked) return toast('Marcá los criterios que cumpliste después de revisar el texto.');
    const correct = checked >= Math.ceil(e.criterios.length * .7);
    session.checked = true;
    session.correct += correct ? 1 : 0;
    recordAttempt(e, correct, .65);
    session.answers.push({ id: e.id, correct, selfChecked: checked });
    $('#exercise-feedback').hidden = false;
    $('#exercise-feedback').className = 'feedback hint';
    $('#exercise-feedback').innerHTML = `<strong>Revisión guardada.</strong>Marcaste ${checked} de ${e.criterios.length} criterios. Conservá la producción para revisarla nuevamente más adelante.`;
    $('#check-answer').hidden = true;
    $('#hint-button').hidden = true;
    $('#next-exercise').hidden = false;
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
      state.profiles[id].sessions = (state.profiles[id].sessions || 0) + 1;
      state.profiles[id].history = [...(state.profiles[id].history || []), {
        at: Date.now(), type: session.type, area: session.area, school: session.school, score: session.correct, total: session.items.length
      }].slice(-60);
    });
    saveState();
    session.finished = true;
    $('#exercise-progress-bar').style.width = '100%';
    $('#exercise-tags').innerHTML = '';
    $('#exercise-paper').hidden = true;
    $('#exercise-text').hidden = true;
    $('#exercise-prompt').textContent = session.type === 'diagnostico' ? 'Diagnóstico inicial completado' : session.type === 'simulacro' ? 'Simulacro completado' : '¡Sesión completada!';
    $('#exercise-answer').hidden = false;
    $('#exercise-answer').innerHTML = `<div class="today-card"><strong>${session.correct} de ${session.items.length} respuestas correctas</strong><p>${summaryMessage(session.correct / session.items.length)}</p></div>`;
    $('#exercise-feedback').hidden = true;
    $('#exercise-selfcheck').hidden = true;
    $('#hint-button').hidden = true;
    $('#check-answer').hidden = true;
    $('#next-exercise').hidden = false;
    $('#next-exercise').textContent = 'Ver mi progreso';
    renderAll();
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

  function recordAttempt(e, correct, weight = 1) {
    const pid = activeMode === 'together' ? (session.jointTurn % 2 === 0 ? 'p1' : 'p2') : primaryProfileId();
    const profile = state.profiles[pid];
    const prev = profile.progress[e.habilidad] || { attempts: 0, correct: 0, mastery: 0, lastAt: 0 };
    let evidence = correct ? 52 + e.dificultad * 10 : Math.max(8, 38 - e.dificultad * 4);
    if (session?.hintUsed && correct) evidence -= 10;
    evidence = Math.round(evidence * weight);
    const mastery = prev.attempts === 0 ? evidence : Math.round(prev.mastery * .68 + evidence * .32);
    profile.progress[e.habilidad] = { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0), mastery: clamp(mastery, 0, 100), lastAt: Date.now() };
    saveState();
  }

  function aggregateSkill(ids, skillId) {
    const rows = ids.map(id => state.profiles[id]?.progress?.[skillId]).filter(Boolean);
    if (!rows.length) return { attempts: 0, correct: 0, mastery: 0 };
    return {
      attempts: rows.reduce((s,r) => s + r.attempts, 0),
      correct: rows.reduce((s,r) => s + r.correct, 0),
      mastery: Math.round(rows.reduce((s,r) => s + r.mastery, 0) / rows.length)
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
      supa.auth.getSession().then(({ data }) => {
        authUser = data.session?.user || null;
        if (authUser) loadRemoteState();
        renderFamily();
      });
      supa.auth.onAuthStateChange((_event, sessionData) => {
        authUser = sessionData?.user || null;
        if (authUser) loadRemoteState();
        renderFamily();
      });
    } catch (error) { console.error(error); supa = null; renderFamily(); }
  }

  async function signIn() {
    if (!supa) return;
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    if (!email || password.length < 6) return toast('Completá correo y una contraseña de al menos 6 caracteres.');
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) toast('No se pudo ingresar: ' + error.message); else toast('Cuenta familiar conectada.');
  }

  async function signUp() {
    if (!supa) return;
    const email = $('#auth-email').value.trim();
    const password = $('#auth-password').value;
    if (!email || password.length < 6) return toast('Completá correo y una contraseña de al menos 6 caracteres.');
    const { error } = await supa.auth.signUp({ email, password });
    if (error) toast('No se pudo crear la cuenta: ' + error.message);
    else toast('Cuenta creada. Si Supabase pide confirmación por correo, confirmala antes de ingresar.');
  }

  async function signOut() {
    if (!supa) return;
    await supa.auth.signOut();
    authUser = null;
    renderFamily();
    toast('Sesión familiar cerrada. El progreso local se conserva.');
  }

  async function loadRemoteState() {
    if (!supa || !authUser) return;
    const { data, error } = await supa.from('study_state').select('payload,updated_at').eq('user_id', authUser.id).maybeSingle();
    if (error) { console.error(error); toast('Supabase está conectado, pero falta crear la tabla study_state o revisar sus permisos.'); return; }
    if (!data?.payload) { await syncRemoteState(); return; }
    const remote = data.payload;
    if ((remote.updatedAt || 0) > (state.updatedAt || 0)) {
      state = remote;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      refreshGateNames();
      if (activeMode) renderAll();
      toast('Progreso actualizado desde la nube.');
    } else await syncRemoteState();
  }

  async function syncRemoteState() {
    if (!supa || !authUser) return;
    const { error } = await supa.from('study_state').upsert({ user_id: authUser.id, payload: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) console.error('Error de sincronización', error);
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function groupBy(list, key) { return list.reduce((acc, item) => { (acc[item[key]] ||= []).push(item); return acc; }, {}); }
  function shuffle(list) { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function escapeAttr(value) { return escapeHtml(value); }
})();
