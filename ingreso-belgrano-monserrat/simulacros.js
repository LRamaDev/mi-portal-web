(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const APP_VERSION = 3;
  const SCHOOL_LABEL = { belgrano: 'Manuel Belgrano', monserrat: 'Monserrat' };
  const AREA_LABEL = { matematica: 'Matemática', lengua: 'Lengua' };
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  let activeMode = null;
  let bank = null;
  let sim = null;
  let remoteTimer = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    decorateExamPanel();
    createDialog();

    document.addEventListener('click', e => {
      const profile = e.target.closest?.('.profile-card[data-profile]');
      if (profile) activeMode = profile.dataset.profile;
      if (e.target.closest?.('#profile-switch, #active-profile')) activeMode = null;
    });

    document.addEventListener('click', interceptExamClick, true);
  }

  function decorateExamPanel() {
    const panel = $('.exam-panel');
    if (!panel) return;
    const heading = panel.querySelector('h3');
    if (heading) heading.textContent = 'Simulacros completos · 100 puntos';
    const top = panel.querySelector('.panel-heading > div');
    if (top && !top.querySelector('.full-sim-note')) {
      const p = document.createElement('p');
      p.className = 'full-sim-note';
      p.textContent = 'Sin pistas · corrección al final · estructura diferenciada por colegio y materia.';
      top.appendChild(p);
    }
    $$('.exam-button', panel).forEach(button => {
      button.title = 'Simulacro completo sobre 100 puntos';
    });
  }

  async function interceptExamClick(event) {
    const button = event.target.closest?.('.exam-button[data-sim-school][data-sim-area]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!activeMode) return toast('Elegí un perfil antes de iniciar el simulacro.');
    if (activeMode === 'together') return toast('El simulacro completo es individual. Entrá con uno de los dos perfiles.');

    try {
      await ensureBank();
      openIntro(button.dataset.simSchool, button.dataset.simArea);
    } catch (error) {
      console.error('[Simulacros] No se pudo preparar el examen', error);
      toast('No se pudo preparar el simulacro. Recargá la página.');
    }
  }

  async function ensureBank() {
    if (bank) return bank;
    const [exerciseData, skillData] = await Promise.all([
      fetch('./data/ejercicios.json').then(r => { if (!r.ok) throw new Error('ejercicios'); return r.json(); }),
      fetch('./data/habilidades.json').then(r => { if (!r.ok) throw new Error('habilidades'); return r.json(); })
    ]);
    const exercises = exerciseData.ejercicios || [];
    const skills = skillData.habilidades || [];
    bank = { exercises, skills, skillsById: new Map(skills.map(s => [s.id, s])) };
    return bank;
  }

  function createDialog() {
    if ($('#full-sim-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'full-sim-dialog';
    dialog.className = 'exercise-dialog';
    dialog.innerHTML = `
      <div class="exercise-frame">
        <header class="exercise-header">
          <div><span id="fs-mode" class="mode-badge">Simulacro</span><strong id="fs-progress">100 puntos</strong></div>
          <button id="fs-close" class="icon-button" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="progress-track"><span id="fs-progress-bar"></span></div>
        <article class="exercise-content">
          <div id="fs-tags" class="exercise-tags"></div>
          <p id="fs-paper" class="paper-note" hidden>✎ Resolvelo en tu cuaderno antes de responder.</p>
          <blockquote id="fs-text" class="source-text" hidden></blockquote>
          <h2 id="fs-title"></h2>
          <div id="fs-body"></div>
          <div id="fs-feedback" class="feedback" hidden></div>
        </article>
        <footer class="exercise-footer">
          <button id="fs-secondary" class="secondary-button" type="button" hidden>Volver</button>
          <button id="fs-primary" class="primary-button" type="button">Comenzar simulacro</button>
        </footer>
      </div>`;
    document.body.appendChild(dialog);

    $('#fs-close').addEventListener('click', requestClose);
    $('#fs-secondary').addEventListener('click', requestClose);
    $('#fs-primary').addEventListener('click', handlePrimary);
    dialog.addEventListener('cancel', e => { e.preventDefault(); requestClose(); });
  }

  function openIntro(school, area) {
    const blueprint = examBlueprint(school, area);
    sim = {
      stage: 'intro', school, area, blueprint,
      entries: [], index: 0, answers: [], finished: false,
      startedAt: 0
    };
    const dialog = $('#full-sim-dialog');
    $('#fs-mode').textContent = `${SCHOOL_LABEL[school]} · ${AREA_LABEL[area]}`;
    $('#fs-progress').textContent = '100 puntos';
    $('#fs-progress-bar').style.width = '0%';
    $('#fs-tags').innerHTML = '<span class="exercise-tag">Modo ingreso</span><span class="exercise-tag">Sin pistas</span><span class="exercise-tag">Corrección al final</span>';
    $('#fs-paper').hidden = true;
    $('#fs-text').hidden = true;
    $('#fs-title').textContent = 'Simulacro completo';
    $('#fs-body').innerHTML = introHtml(blueprint);
    $('#fs-feedback').hidden = true;
    $('#fs-secondary').hidden = true;
    $('#fs-primary').hidden = false;
    $('#fs-primary').textContent = 'Comenzar simulacro';
    if (!dialog.open) dialog.showModal();
  }

  function introHtml(blueprint) {
    const blocks = blueprint.blocks.map(b => `<li><strong>${escapeHtml(b.label)}:</strong> ${b.points} puntos</li>`).join('');
    return `<div class="today-card">
      <strong>${escapeHtml(blueprint.summary)}</strong>
      <p>${escapeHtml(blueprint.note)}</p>
    </div>
    <div class="progress-group">
      <h3>Distribución</h3>
      <ul>${blocks}</ul>
      <p><strong>Total: 100 puntos.</strong> Las consignas son originales y no copian los exámenes aportados.</p>
    </div>`;
  }

  async function handlePrimary() {
    if (!sim) return;
    if (sim.stage === 'intro') return startFullSimulation();
    if (sim.stage === 'question') return checkCurrent();
    if (sim.stage === 'checked') return nextQuestion();
    if (sim.stage === 'finished') return finishAndReload();
  }

  function startFullSimulation() {
    sim.entries = buildEntries(sim.school, sim.area, sim.blueprint);
    if (!sim.entries.length) return toast('No hay suficientes actividades para este simulacro.');
    sim.index = 0;
    sim.answers = [];
    sim.startedAt = Date.now();
    sim.stage = 'question';
    renderQuestion();
  }

  function examBlueprint(school, area) {
    if (school === 'monserrat' && area === 'matematica') {
      return {
        summary: '7 ítems, como el modelo 2026 aportado, con la misma distribución total de puntajes.',
        note: 'La estructura 15/12/18/10/18/9/18 se conserva; las consignas digitales son nuevas y equivalentes por contenido, no reproducciones.',
        blocks: [
          block('Ítem 1 · Datos y fracciones', 15, [slot(15, ['Datos', 'Fracciones'])]),
          block('Ítem 2 · Secuencias', 12, [slot(12, ['Patrones'])]),
          block('Ítem 3 · Magnitudes', 18, [slot(18, ['Magnitudes'])]),
          block('Ítem 4 · Circunferencia', 10, [slot(10, null, ['MAT-CIRC'])]),
          block('Ítem 5 · Problema con fracciones', 18, [slot(18, null, ['MAT-FR-PROB', 'MAT-FR-OPS'])]),
          block('Ítem 6 · Numeración romana', 9, [slot(9, null, ['MAT-ROM'])]),
          block('Ítem 7 · Geometría y perímetro', 18, [slot(18, ['Geometría', 'Problemas'])])
        ]
      };
    }

    if (school === 'monserrat' && area === 'lengua') {
      return {
        summary: 'Cuatro bloques sobre 100 puntos, siguiendo la ponderación del examen de Ingreso 2026.',
        note: 'Ortografía 18, Morfosintaxis 15, Discurso 32 y Producción 35. La distribución interna de puntos dentro de cada bloque es de entrenamiento.',
        blocks: [
          block('I · Ortografía', 18, [slot(4, ['Ortografía']), slot(4, ['Ortografía']), slot(4, ['Ortografía']), slot(3, ['Ortografía', 'Puntuación']), slot(3, ['Ortografía', 'Puntuación'])]),
          block('II · Morfosintaxis', 15, [slot(4, ['Gramática', 'Sintaxis']), slot(4, ['Gramática', 'Sintaxis']), slot(4, ['Gramática', 'Sintaxis']), slot(3, ['Gramática', 'Sintaxis'])]),
          block('III · Discurso', 32, [slot(6, ['Comprensión', 'Texto y discurso']), slot(6, ['Comprensión', 'Texto y discurso']), slot(5, ['Cohesión', 'Semántica']), slot(5, ['Narración']), slot(5, ['Literatura']), slot(5, ['Comprensión', 'Narración', 'Texto y discurso'])]),
          block('IV · Producción escrita', 35, [slot(35, ['Producción escrita'], ['LEN-PROD'], true)])
        ]
      };
    }

    if (school === 'belgrano' && area === 'lengua') {
      const partI = Array.from({ length: 10 }, (_, i) => slot(5, i < 6 ? ['Comprensión', 'Narración', 'Literatura', 'Cohesión', 'Texto y discurso'] : ['Puntuación', 'Semántica', 'Texto y discurso']));
      const partII = Array.from({ length: 10 }, (_, i) => slot(5, i < 5 ? ['Gramática', 'Sintaxis', 'Ortografía'] : ['Comunicación', 'Texto y discurso', 'Semántica', 'Ortografía']));
      return {
        summary: 'Dos partes de 50 puntos, como el modelo 2025 aportado.',
        note: 'El modelo oficial divide Lengua en Parte I y Parte II de 50 puntos cada una. Este simulacro conserva ese equilibrio con consignas originales; la cantidad interna de actividades es una aproximación digital.',
        blocks: [block('Parte I · Lectura, comprensión y discurso', 50, partI), block('Parte II · Lengua, gramática y ortografía', 50, partII)]
      };
    }

    const belgranoMathWeights = [6,15,3,3,3,3,3,9,6,3,3,3,10,3,3,3,3,3,4,3,4,4];
    const belgranoMathGroups = [
      ['Números naturales','Geometría'], ['Números naturales','Decimales'], ['Números naturales','Decimales'], ['Números naturales','Decimales'], ['Números naturales','Decimales'], ['Números naturales','Decimales'], ['Números naturales','Decimales'],
      ['Divisibilidad'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'], ['Fracciones'],
      ['Geometría'], ['Geometría','Problemas'], ['Geometría','Problemas']
    ];
    return {
      summary: '22 consignas numeradas y 100 puntos, siguiendo el modelo 2025 aportado.',
      note: 'Se conserva la ponderación por número de consigna del modelo. Cuando el examen original tiene subapartados, la versión digital los representa de manera condensada en una actividad original.',
      blocks: [block('Prueba completa · 22 consignas', 100, belgranoMathWeights.map((points, i) => slot(points, belgranoMathGroups[i], null, false, `Consigna ${i + 1}`)))]
    };
  }

  function block(label, points, slots) { return { label, points, slots }; }
  function slot(points, groups = null, skills = null, selfcheck = false, label = null) { return { points, groups, skills, selfcheck, label }; }

  function buildEntries(school, area, blueprint) {
    const valid = bank.exercises.filter(e => e.area === area && (e.colegios.includes('comun') || e.colegios.includes(school)));
    const used = new Set();
    const entries = [];

    blueprint.blocks.forEach(blockDef => {
      blockDef.slots.forEach((slotDef, slotIndex) => {
        const exercise = chooseForSlot(valid, slotDef, used);
        if (!exercise) return;
        used.add(exercise.id);
        entries.push({
          exercise,
          points: slotDef.points,
          block: blockDef.label,
          blockPoints: blockDef.points,
          itemLabel: slotDef.label || `${blockDef.label} · ${slotIndex + 1}`
        });
      });
    });

    const planned = entries.reduce((sum, e) => sum + e.points, 0);
    if (planned !== 100 && entries.length) entries[entries.length - 1].points += 100 - planned;
    return entries;
  }

  function chooseForSlot(valid, slotDef, used) {
    const unused = valid.filter(e => !used.has(e.id));
    const isTypeOk = e => slotDef.selfcheck ? e.tipo === 'selfcheck' : e.tipo !== 'selfcheck';
    const matchesSkill = e => !slotDef.skills || slotDef.skills.includes(e.habilidad);
    const matchesGroup = e => !slotDef.groups || slotDef.groups.includes(bank.skillsById.get(e.habilidad)?.grupo);

    const tiers = [
      unused.filter(e => isTypeOk(e) && matchesSkill(e) && matchesGroup(e)),
      unused.filter(e => isTypeOk(e) && matchesSkill(e)),
      unused.filter(e => isTypeOk(e) && matchesGroup(e)),
      unused.filter(e => isTypeOk(e))
    ];
    const candidates = tiers.find(list => list.length) || [];
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => ((b.dificultad || 2) - (a.dificultad || 2)) || (Math.random() - .5))[0];
  }

  function renderQuestion() {
    const entry = sim.entries[sim.index];
    if (!entry) return finishSimulation();
    const e = entry.exercise;
    sim.stage = 'question';
    $('#fs-progress').textContent = `${sim.index + 1} de ${sim.entries.length} · ${entry.points} pts`;
    $('#fs-progress-bar').style.width = `${(sim.index / sim.entries.length) * 100}%`;
    $('#fs-tags').innerHTML = `<span class="exercise-tag">${escapeHtml(entry.block)}</span><span class="exercise-tag">${entry.points} puntos</span><span class="exercise-tag">${difficultyLabel(e.dificultad)}</span>`;
    $('#fs-paper').hidden = !e.papel && e.tipo !== 'selfcheck';
    $('#fs-text').hidden = !e.texto;
    $('#fs-text').textContent = e.texto || '';
    $('#fs-title').textContent = e.consigna;
    $('#fs-feedback').hidden = true;
    $('#fs-feedback').innerHTML = '';
    $('#fs-secondary').hidden = true;
    $('#fs-primary').hidden = false;
    $('#fs-primary').textContent = e.tipo === 'selfcheck' ? 'Abrir revisión' : 'Registrar respuesta';

    const body = $('#fs-body');
    if (e.tipo === 'choice') {
      body.innerHTML = `<div class="choice-list">${e.opciones.map(o => `<label class="choice-option"><input type="radio" name="fs-choice" value="${escapeAttr(o)}"><span>${escapeHtml(o)}</span></label>`).join('')}</div>`;
    } else if (e.tipo === 'input') {
      body.innerHTML = '<input class="answer-input" id="fs-input" autocomplete="off" inputmode="text" placeholder="Escribí tu respuesta">';
      setTimeout(() => $('#fs-input')?.focus(), 80);
    } else {
      body.innerHTML = '<p>Realizá la producción completa en el cuaderno. Cuando termines, abrí la revisión y marcá solamente lo que realmente cumpliste.</p>';
    }
  }

  async function checkCurrent() {
    const entry = sim.entries[sim.index];
    if (!entry) return;
    const e = entry.exercise;

    if (e.tipo === 'selfcheck') {
      if (!$('#fs-rubric')) return openProductionRubric(entry);
      return saveProductionRubric(entry);
    }

    const answer = e.tipo === 'choice' ? $('input[name="fs-choice"]:checked')?.value : $('#fs-input')?.value.trim();
    if (answer === undefined || answer === null || answer === '') return toast('Elegí o escribí una respuesta antes de continuar.');
    const correct = isCorrect(e, answer);
    sim.answers.push({ id: e.id, correct, answer, points: entry.points, earned: correct ? entry.points : 0, block: entry.block });
    updateProgress(e, correct, 1);
    await persistState(false);
    lockFullInputs();
    markChecked('Respuesta registrada. La corrección aparece cuando termines el simulacro.');
  }

  function openProductionRubric(entry) {
    const rubric = productionRubric(entry.points);
    $('#fs-body').innerHTML = `<div id="fs-rubric" class="selfcheck"><p><strong>Revisión guiada de la producción</strong></p>${rubric.map((r, i) => `<label><input type="checkbox" value="${i}"><span>${escapeHtml(r.label)} <small>(${r.points} pts)</small></span></label>`).join('')}<p><small>Esta distribución interna es una herramienta de entrenamiento basada en los criterios de corrección aportados; no pretende reproducir exactamente la grilla oficial.</small></p></div>`;
    $('#fs-primary').textContent = 'Guardar revisión';
  }

  async function saveProductionRubric(entry) {
    const rubric = productionRubric(entry.points);
    const checked = new Set($$('#fs-rubric input:checked').map(i => Number(i.value)));
    if (!checked.size) return toast('Marcá los criterios que cumpliste después de revisar el texto.');
    const earned = rubric.reduce((sum, r, i) => sum + (checked.has(i) ? r.points : 0), 0);
    const ratio = earned / entry.points;
    const correct = ratio >= .7;
    sim.answers.push({ id: entry.exercise.id, correct, selfcheck: true, points: entry.points, earned, block: entry.block, rubricChecked: [...checked] });
    updateProgress(entry.exercise, correct, .65);
    await persistState(false);
    lockFullInputs();
    markChecked('Revisión registrada. El puntaje de la producción se mostrará al final.');
  }

  function productionRubric(total) {
    if (total !== 35) {
      return [{ label: 'Cumplimiento global de los criterios de la actividad', points: total }];
    }
    return [
      { label: 'Título adecuado', points: 3 },
      { label: 'Extensión pedida y sin diálogo', points: 4 },
      { label: 'Coherencia con la situación inicial', points: 6 },
      { label: 'Complicación y resolución desarrolladas', points: 6 },
      { label: 'Recursos expresivos pertinentes', points: 4 },
      { label: 'Evita repeticiones innecesarias', points: 3 },
      { label: 'Morfosintaxis y concordancia revisadas', points: 4 },
      { label: 'Ortografía y presentación cuidadas', points: 5 }
    ];
  }

  function markChecked(message) {
    sim.stage = 'checked';
    $('#fs-feedback').hidden = false;
    $('#fs-feedback').className = 'feedback hint';
    $('#fs-feedback').innerHTML = `<strong>Guardado.</strong>${escapeHtml(message)}`;
    $('#fs-primary').textContent = sim.index === sim.entries.length - 1 ? 'Finalizar simulacro' : 'Siguiente';
  }

  function nextQuestion() {
    sim.index += 1;
    if (sim.index >= sim.entries.length) return finishSimulation();
    renderQuestion();
  }

  async function finishSimulation() {
    sim.finished = true;
    sim.stage = 'finished';
    $('#fs-progress-bar').style.width = '100%';
    const earned = sim.answers.reduce((sum, a) => sum + (a.earned || 0), 0);
    const state = loadState();
    const profile = state.profiles[activeMode];
    profile.sessions = (profile.sessions || 0) + 1;
    profile.history = [...(profile.history || []), {
      at: Date.now(), type: 'simulacro', area: sim.area, school: sim.school,
      score: earned, total: 100, fullExam: true,
      durationMinutes: Math.max(1, Math.round((Date.now() - sim.startedAt) / 60000))
    }].slice(-60);
    saveState(state);
    await syncRemoteNow(state);

    $('#fs-progress').textContent = `${earned} / 100`;
    $('#fs-tags').innerHTML = `<span class="exercise-tag">${escapeHtml(SCHOOL_LABEL[sim.school])}</span><span class="exercise-tag">${escapeHtml(AREA_LABEL[sim.area])}</span><span class="exercise-tag">Simulacro completo</span>`;
    $('#fs-paper').hidden = true;
    $('#fs-text').hidden = true;
    $('#fs-title').textContent = `Resultado: ${earned} de 100 puntos`;
    $('#fs-body').innerHTML = resultHtml(earned);
    $('#fs-feedback').hidden = true;
    $('#fs-secondary').hidden = true;
    $('#fs-primary').hidden = false;
    $('#fs-primary').textContent = 'Guardar y volver';
  }

  function resultHtml(earned) {
    const blocks = new Map();
    sim.blueprint.blocks.forEach(b => blocks.set(b.label, { earned: 0, total: b.points }));
    sim.answers.forEach(a => {
      if (!blocks.has(a.block)) blocks.set(a.block, { earned: 0, total: 0 });
      blocks.get(a.block).earned += a.earned || 0;
    });
    const blockHtml = [...blocks.entries()].map(([label, score]) => `<div class="progress-row"><strong>${escapeHtml(label)}</strong><div class="progress-bar"><span style="width:${score.total ? Math.round(score.earned / score.total * 100) : 0}%"></span></div><small>${score.earned}/${score.total}</small></div>`).join('');
    const wrong = sim.answers.filter(a => !a.correct && !a.selfcheck).map(a => ({ a, e: bank.exercises.find(e => e.id === a.id) })).filter(x => x.e);
    const review = wrong.length ? `<div class="progress-group"><h3>Para revisar</h3>${wrong.map(({a,e}) => `<div class="priority-item"><div><strong>${escapeHtml(bank.skillsById.get(e.habilidad)?.nombre || 'Actividad')}</strong><small>${a.points} pts · Respuesta esperada: ${escapeHtml(String(e.respuesta))}. ${escapeHtml(e.explicacion || '')}</small></div></div>`).join('')}</div>` : '<div class="feedback ok"><strong>Corrección final</strong>No quedaron respuestas objetivas incorrectas.</div>';
    return `<div class="today-card"><strong>${scoreMessage(earned)}</strong><p>El puntaje se calcula sobre 100 y queda guardado en el historial del perfil.</p></div><div class="progress-group"><h3>Puntaje por bloque</h3>${blockHtml}</div>${review}`;
  }

  function scoreMessage(score) {
    if (score >= 85) return 'Muy buen desempeño en formato ingreso.';
    if (score >= 70) return 'Buen desempeño, con algunos bloques para reforzar.';
    if (score >= 55) return 'Hay una base útil; conviene reforzar antes del próximo simulacro.';
    return 'Este resultado sirve como diagnóstico: conviene volver a entrenar los bloques más bajos.';
  }

  function requestClose() {
    if (!sim) return closeDialogOnly();
    if (!sim.finished && sim.stage !== 'intro') {
      if (!confirm('¿Salir del simulacro? Las respuestas ya registradas quedan guardadas como progreso, pero el simulacro incompleto no suma al historial.')) return;
      syncRemoteNow(loadState()).finally(() => location.reload());
      return;
    }
    if (sim.finished) return finishAndReload();
    closeDialogOnly();
  }

  function finishAndReload() {
    syncRemoteNow(loadState()).finally(() => location.reload());
  }

  function closeDialogOnly() {
    const dialog = $('#full-sim-dialog');
    if (dialog?.open) dialog.close();
    sim = null;
  }

  function updateProgress(exercise, correct, weight = 1) {
    const state = loadState();
    const profile = state.profiles[activeMode];
    const prev = profile.progress[exercise.habilidad] || { attempts: 0, correct: 0, mastery: 0, lastAt: 0 };
    let evidence = correct ? 52 + (exercise.dificultad || 2) * 10 : Math.max(8, 38 - (exercise.dificultad || 2) * 4);
    evidence = Math.round(evidence * weight);
    const mastery = prev.attempts === 0 ? evidence : Math.round(prev.mastery * .68 + evidence * .32);
    profile.progress[exercise.habilidad] = {
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      mastery: clamp(mastery, 0, 100),
      lastAt: Date.now()
    };
    saveState(state);
  }

  function loadState() {
    let parsed = {};
    try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { parsed = {}; }
    parsed.version = APP_VERSION;
    parsed.profiles ||= {};
    for (const id of ['p1', 'p2']) {
      parsed.profiles[id] ||= { name: id === 'p1' ? 'Perfil 1' : 'Perfil 2', progress: {}, history: [], sessions: 0 };
      parsed.profiles[id].progress ||= {};
      parsed.profiles[id].history ||= [];
      parsed.profiles[id].sessions ||= 0;
    }
    return parsed;
  }

  function saveState(state) {
    state.version = APP_VERSION;
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    clearTimeout(remoteTimer);
    remoteTimer = setTimeout(() => syncRemoteNow(state), 800);
  }

  async function persistState(immediate = false) {
    const state = loadState();
    if (immediate) await syncRemoteNow(state);
    return state;
  }

  async function syncRemoteNow(state) {
    try {
      if (!window.supabase || !window.INGRESO_CONFIG?.supabaseUrl || !window.INGRESO_CONFIG?.supabaseAnonKey) return;
      const client = window.supabase.createClient(window.INGRESO_CONFIG.supabaseUrl, window.INGRESO_CONFIG.supabaseAnonKey);
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      await client.from('study_state').upsert({ user_id: user.id, payload: state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('[Simulacros] Error de sincronización', error);
    }
  }

  function isCorrect(exercise, answer) {
    const accepted = [exercise.respuesta, ...(exercise.alternativas || [])].map(normalizeAnswer);
    return accepted.includes(normalizeAnswer(answer));
  }

  function normalizeAnswer(value) {
    return String(value ?? '').trim().toLocaleLowerCase('es').replace(/\s+/g, '').replace(/^\$/, '');
  }

  function lockFullInputs() {
    $$('#fs-body input').forEach(i => { i.disabled = true; });
  }

  function difficultyLabel(value) {
    return ['Descubrir', 'Practicar', 'Desafiarme', 'Modo ingreso'][clamp((value || 1) - 1, 0, 3)];
  }

  function toast(message) {
    const el = $('#toast');
    if (!el) return alert(message);
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'\"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '\"':'&quot;' }[c])); }
  function escapeAttr(value) { return escapeHtml(value); }
})();
