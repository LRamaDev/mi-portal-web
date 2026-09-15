(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const LOCAL_FEEDBACK_KEY = 'ingreso-belgrano-monserrat-feedback-v1';
  const PEDAGOGICAL_VERSION = '6.7';
  let activeProfile = null;
  let lastContext = { sessionType: 'otro', area: null, school: null };

  installPedagogicalCorrections();
  document.addEventListener('DOMContentLoaded', init);

  function installPedagogicalCorrections() {
    if (window.__INGRESO_V67_PEDAGOGICAL_PATCH__) return;
    window.__INGRESO_V67_PEDAGOGICAL_PATCH__ = true;
    const previousFetch = window.fetch.bind(window);

    window.fetch = async function ingresoV67PedagogicalFetch(input, initOptions) {
      const url = typeof input === 'string' ? input : (input?.url || '');
      const isBank = url === './data/ejercicios.json' || url.endsWith('/data/ejercicios.json');
      if (!isBank) return previousFetch(input, initOptions);

      const response = await previousFetch(input, initOptions);
      if (!response.ok) return response;

      try {
        const data = await response.clone().json();
        const fixes = {
          'V5-M047': exercise => ({
            ...exercise,
            alternativas: [],
            pista: 'Sumá 3 horas y después 50 minutos. Si superás 60 minutos, convertí esos minutos en una hora.',
            explicacion: '08:35 + 3 h = 11:35; + 50 min = 12:25.'
          }),
          'V5-L016': exercise => ({
            ...exercise,
            texto: 'Camila necesitaba el horario de la reunión. Sofía se lo envió por mensaje.',
            consigna: 'En «Sofía se lo envió», ¿a qué se refiere «lo»?',
            opciones: ['al horario de la reunión', 'a Sofía', 'a Camila', 'al mensaje'],
            respuesta: 'al horario de la reunión',
            pista: 'Buscá qué información necesitaba Camila y qué fue lo que Sofía envió.',
            explicacion: 'El pronombre «lo» retoma «el horario de la reunión» sin repetir esa expresión.'
          }),
          'V5-L027': exercise => ({
            ...exercise,
            texto: '«El viento cantaba entre las ramas».',
            consigna: '¿Qué recurso aparece?',
            opciones: ['Personificación', 'Comparación', 'Definición', 'Hipérbaton'],
            respuesta: 'Personificación',
            pista: 'Observá que se atribuye al viento una acción propia de seres humanos.',
            explicacion: '«Cantar» es una acción humana atribuida al viento: es una personificación.'
          }),
          'V5-L028': exercise => ({
            ...exercise,
            texto: '«Sus ojos brillaban como dos faros».',
            consigna: '¿Qué recurso aparece?',
            opciones: ['Comparación', 'Personificación', 'Onomatopeya', 'Enumeración'],
            respuesta: 'Comparación',
            pista: 'Buscá el nexo que relaciona dos elementos.',
            explicacion: 'El nexo «como» compara el brillo de los ojos con dos faros.'
          }),
          'V5-L029': exercise => ({
            ...exercise,
            texto: '«¡Pum! La puerta se cerró de golpe».',
            consigna: '¿Qué recurso aparece?',
            opciones: ['Onomatopeya', 'Comparación', 'Metáfora', 'Hipérbole'],
            respuesta: 'Onomatopeya',
            pista: 'Una palabra reproduce directamente un sonido.',
            explicacion: '«Pum» imita el sonido del golpe de la puerta: es una onomatopeya.'
          }),
          'V5-L030': exercise => ({
            ...exercise,
            texto: '«El aroma dulce del pan recién hecho llenó la cocina».',
            consigna: '¿Qué recurso predomina?',
            opciones: ['Imagen olfativa', 'Imagen visual', 'Onomatopeya', 'Diálogo'],
            respuesta: 'Imagen olfativa',
            pista: 'Identificá qué sentido se activa principalmente.',
            explicacion: 'La referencia al aroma apela principalmente al olfato.'
          }),
          'V4-L042': exercise => ({
            ...exercise,
            opciones: ['tuvo', 'tubo', 'tuvó', 'tubó'],
            respuesta: 'tuvo',
            pista: 'Es una forma del verbo «tener»: revisá la consonante y recordá que no lleva tilde.',
            explicacion: 'La forma correcta es «tuvo»: se escribe con v y no lleva tilde.'
          }),
          'V4-L051': exercise => ({
            ...exercise,
            consigna: 'Elegí el parónimo adecuado: «La periodista decidió ___ los resultados de la investigación».',
            opciones: ['revelar', 'rebelar', 'revelarse', 'rebelarse'],
            respuesta: 'revelar',
            pista: '«Revelar» significa dar a conocer; «rebelar(se)» significa sublevar(se).',
            explicacion: 'En este contexto corresponde «revelar», porque la periodista decide dar a conocer los resultados.'
          }),
          'V6-L037': exercise => ({
            ...exercise,
            consigna: 'Elegí el parónimo adecuado: «La ___ de estudio comenzará a las cinco».',
            opciones: ['sesión', 'cesión', 'sección', 'ocasión'],
            respuesta: 'sesión',
            pista: '«Sesión» es un período dedicado a una actividad; «cesión» significa transferencia o entrega.',
            explicacion: 'La expresión correcta es «sesión de estudio». «Sesión» y «cesión» suenan de manera semejante, pero tienen significados distintos.'
          })
        };

        let corrected = 0;
        data.ejercicios = (data.ejercicios || []).map(exercise => {
          const fix = fixes[exercise.id];
          if (!fix) return exercise;
          corrected += 1;
          return fix(exercise);
        });
        data.version = 7;
        data.auditoriaV67 = { corrected, ids: Object.keys(fixes) };

        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      } catch (error) {
        console.error('[Ingreso V6.7] No se pudieron aplicar las correcciones pedagógicas', error);
        return response;
      }
    };
  }

  function setVisibleVersion() {
    const meta = document.querySelector('meta[name="app-version"]');
    if (meta) meta.setAttribute('content', PEDAGOGICAL_VERSION);
    const badge = document.querySelector('.build-version');
    if (badge) {
      badge.textContent = `Versión ${PEDAGOGICAL_VERSION}`;
      badge.setAttribute('aria-label', `Versión instalada ${PEDAGOGICAL_VERSION}`);
      badge.title = `Versión ${PEDAGOGICAL_VERSION} · auditoría pedagógica y cobertura`;
    }
  }

  function init() {
    injectStyles();
    trackContext();
    addFeedbackButton();
    addFamilyTestPanel();
    addFeedbackDialog();
    window.setTimeout(setVisibleVersion, 0);
  }

  function trackContext() {
    document.querySelectorAll('.profile-card').forEach(button => {
      button.addEventListener('click', () => {
        activeProfile = button.dataset.profile || null;
      });
    });

    document.querySelector('#start-diagnostic')?.addEventListener('click', () => {
      lastContext = { sessionType: 'diagnostico', area: 'all', school: null };
    });

    document.querySelectorAll('[data-practice]').forEach(button => {
      button.addEventListener('click', () => {
        lastContext = { sessionType: 'practica', area: button.dataset.practice || null, school: null };
      });
    });

    document.querySelectorAll('[data-sim-school]').forEach(button => {
      button.addEventListener('click', () => {
        lastContext = {
          sessionType: 'simulacro',
          area: button.dataset.simArea || null,
          school: button.dataset.simSchool || null
        };
      });
    });
  }

  function addFeedbackButton() {
    if (document.querySelector('#test-feedback-fab')) return;
    const button = document.createElement('button');
    button.id = 'test-feedback-fab';
    button.type = 'button';
    button.className = 'test-feedback-fab';
    button.textContent = '💬 ¿Cómo fue?';
    button.addEventListener('click', openFeedbackDialog);
    document.body.appendChild(button);
  }

  function addFamilyTestPanel() {
    const grid = document.querySelector('.family-grid');
    if (!grid || document.querySelector('#family-test-panel')) return;
    const section = document.createElement('section');
    section.id = 'family-test-panel';
    section.className = 'panel';
    section.innerHTML = `
      <p class="eyebrow">Prueba familiar</p>
      <h3>Testeo de mañana</h3>
      <p>La idea es que cada perfil haga una prueba corta y deje una opinión al terminar.</p>
      <ol class="test-checklist">
        <li>Entrar al perfil individual.</li>
        <li>Hacer el diagnóstico o una práctica adaptativa.</li>
        <li>Probar un simulacro del colegio que corresponda.</li>
        <li>Tocar <strong>¿Cómo fue?</strong> y marcar si resultó fácil, bien, difícil o confuso.</li>
      </ol>
      <p><small>No hace falta poner nombres ni datos personales en el comentario.</small></p>
      <button id="family-open-feedback" class="secondary-button" type="button">Enviar opinión de prueba</button>`;
    grid.appendChild(section);
    section.querySelector('#family-open-feedback').addEventListener('click', openFeedbackDialog);
  }

  function addFeedbackDialog() {
    if (document.querySelector('#test-feedback-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'test-feedback-dialog';
    dialog.className = 'exercise-dialog';
    dialog.innerHTML = `
      <div class="exercise-frame test-feedback-frame">
        <header class="exercise-header">
          <div><span class="mode-badge">Testeo familiar</span><strong>Opinión rápida</strong></div>
          <button id="test-feedback-close" class="icon-button" type="button" aria-label="Cerrar">×</button>
        </header>
        <article class="exercise-content">
          <p>¿Cómo te resultó lo que acabás de hacer?</p>
          <div class="test-rating-grid">
            <button type="button" data-rating="facil">😊 Fácil</button>
            <button type="button" data-rating="bien">👍 Bien</button>
            <button type="button" data-rating="dificil">🧠 Difícil</button>
            <button type="button" data-rating="confuso">🤔 Confuso</button>
          </div>
          <label class="field">Comentario opcional
            <textarea id="test-feedback-note" maxlength="500" rows="4" placeholder="Ej.: no entendí una consigna, me gustó el formato, fue muy largo..."></textarea>
          </label>
          <p id="test-feedback-status" class="privacy-note">La opinión se guarda en la cuenta familiar. No escribas datos personales.</p>
        </article>
        <footer class="exercise-footer">
          <button id="test-feedback-submit" class="primary-button" type="button" disabled>Guardar opinión</button>
        </footer>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('#test-feedback-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
    dialog.querySelectorAll('[data-rating]').forEach(button => {
      button.addEventListener('click', () => selectRating(button.dataset.rating));
    });
    dialog.querySelector('#test-feedback-submit').addEventListener('click', submitFeedback);
  }

  function openFeedbackDialog() {
    const dialog = document.querySelector('#test-feedback-dialog');
    if (!dialog) return;
    dialog.dataset.rating = '';
    dialog.querySelectorAll('[data-rating]').forEach(button => button.classList.remove('selected'));
    const note = dialog.querySelector('#test-feedback-note');
    if (note) note.value = '';
    const submit = dialog.querySelector('#test-feedback-submit');
    if (submit) { submit.disabled = true; submit.textContent = 'Guardar opinión'; }
    const status = dialog.querySelector('#test-feedback-status');
    if (status) status.textContent = 'La opinión se guarda en la cuenta familiar. No escribas datos personales.';
    dialog.showModal();
  }

  function selectRating(rating) {
    const dialog = document.querySelector('#test-feedback-dialog');
    if (!dialog) return;
    dialog.dataset.rating = rating;
    dialog.querySelectorAll('[data-rating]').forEach(button => {
      button.classList.toggle('selected', button.dataset.rating === rating);
    });
    dialog.querySelector('#test-feedback-submit').disabled = false;
  }

  async function submitFeedback() {
    const dialog = document.querySelector('#test-feedback-dialog');
    const rating = dialog?.dataset.rating;
    if (!dialog || !rating) return;
    const button = dialog.querySelector('#test-feedback-submit');
    const status = dialog.querySelector('#test-feedback-status');
    const note = dialog.querySelector('#test-feedback-note')?.value.trim() || null;
    const row = {
      profile_id: activeProfile || inferProfile() || 'together',
      session_type: lastContext.sessionType || 'otro',
      area: lastContext.area,
      school: lastContext.school,
      rating,
      note,
      created_at: new Date().toISOString()
    };

    button.disabled = true;
    button.textContent = 'Guardando…';

    const savedCloud = await saveCloud(row);
    if (!savedCloud) saveLocal(row);

    status.textContent = savedCloud
      ? 'Opinión guardada. ¡Gracias por ayudar a mejorar la app!'
      : 'Opinión guardada en este dispositivo. Se podrá revisar desde acá aunque no haya conexión.';
    button.textContent = 'Listo';
    setTimeout(() => dialog.close(), 900);
  }

  async function saveCloud(row) {
    try {
      if (!window.supabase || !window.INGRESO_CONFIG?.supabaseUrl || !window.INGRESO_CONFIG?.supabaseAnonKey) return false;
      const client = window.supabase.createClient(window.INGRESO_CONFIG.supabaseUrl, window.INGRESO_CONFIG.supabaseAnonKey);
      const { data } = await client.auth.getSession();
      const user = data.session?.user;
      if (!user) return false;
      const { error } = await client.from('study_feedback').insert({
        user_id: user.id,
        profile_id: ['p1', 'p2', 'together'].includes(row.profile_id) ? row.profile_id : 'together',
        session_type: ['diagnostico', 'practica', 'simulacro', 'otro'].includes(row.session_type) ? row.session_type : 'otro',
        area: row.area,
        school: row.school,
        rating: row.rating,
        note: row.note
      });
      return !error;
    } catch (error) {
      console.error('[Testeo familiar] No se pudo guardar en nube', error);
      return false;
    }
  }

  function saveLocal(row) {
    let rows = [];
    try { rows = JSON.parse(localStorage.getItem(LOCAL_FEEDBACK_KEY) || '[]'); } catch { rows = []; }
    rows.push(row);
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(rows.slice(-100)));
  }

  function inferProfile() {
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const pill = document.querySelector('#active-profile')?.textContent?.trim();
      if (!pill) return null;
      if (pill === state.profiles?.p1?.name) return 'p1';
      if (pill === state.profiles?.p2?.name) return 'p2';
      if (pill.includes('+')) return 'together';
    } catch {}
    return null;
  }

  function injectStyles() {
    if (document.querySelector('#testeo-styles')) return;
    const style = document.createElement('style');
    style.id = 'testeo-styles';
    style.textContent = `
      .test-feedback-fab{position:fixed;right:18px;bottom:82px;z-index:30;border:0;border-radius:999px;padding:11px 15px;font:inherit;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;background:#fff;color:#173f6b}
      .test-rating-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0 18px}
      .test-rating-grid button{border:1px solid #c8d4df;border-radius:14px;background:#fff;padding:14px;font:inherit;font-weight:800;cursor:pointer}
      .test-rating-grid button.selected{outline:3px solid rgba(23,63,107,.22);border-color:#173f6b}
      .test-feedback-frame textarea{width:100%;resize:vertical;box-sizing:border-box;border:1px solid #c8d4df;border-radius:12px;padding:10px;font:inherit}
      .test-checklist{padding-left:20px;line-height:1.55}
      @media(max-width:700px){.test-feedback-fab{right:12px;bottom:76px;padding:9px 12px;font-size:.9rem}.test-rating-grid{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }
})();