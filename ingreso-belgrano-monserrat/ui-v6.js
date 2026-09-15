(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  let signingOut = false;
  let profileTransitionInFlight = false;
  let bypassProfileTransition = false;

  function mountRoadmap() {
    const home = document.querySelector('[data-view="inicio"]');
    const hero = home?.querySelector('.hero-panel');
    if (!home || !hero || home.querySelector('.study-roadmap')) return;

    const roadmap = document.createElement('section');
    roadmap.className = 'study-roadmap';
    roadmap.setAttribute('aria-label', 'Ruta de estudio recomendada');
    roadmap.innerHTML = `
      <div class="study-roadmap-head">
        <div>
          <p class="eyebrow">Tu ruta de estudio</p>
          <h3>Primero descubrir, después entrenar y por último simular</h3>
          <p>No hace falta hacer todo el mismo día. La app va ajustando el recorrido según tus respuestas.</p>
        </div>
      </div>
      <div class="study-roadmap-grid">
        <article class="road-step"><span class="road-number">1</span><strong>Diagnóstico</strong><p>Sirve para saber qué temas ya están firmes y cuáles necesitan práctica.</p></article>
        <article class="road-step"><span class="road-number">2</span><strong>Entrenamiento</strong><p>Vas a recibir más ejercicios de lo que te cuesta, sin dejar de repasar lo que ya sabés.</p></article>
        <article class="road-step"><span class="road-number">3</span><strong>Simulacro</strong><p>Se parece más a una situación de ingreso: sin pistas y con corrección al final.</p></article>
      </div>`;
    hero.insertAdjacentElement('afterend', roadmap);
  }

  function mountGuide() {
    const training = document.querySelector('[data-view="entrenar"]');
    const heading = training?.querySelector('.page-heading');
    if (!training || !heading || training.querySelector('.quick-guide')) return;

    const guide = document.createElement('details');
    guide.className = 'quick-guide';
    guide.innerHTML = `
      <summary>¿Cómo conviene usar esta sección?</summary>
      <div class="quick-guide-content">
        <p><strong>Práctica:</strong> podés usar pistas y recibís devolución inmediata. Hacé las cuentas, esquemas o textos en el cuaderno.</p>
        <p><strong>Simulacro:</strong> no hay pistas ni corrección durante el recorrido. El resultado aparece recién al final.</p>
        <p><strong>Si algo resulta raro:</strong> usá “¿Cómo fue?” y marcá si fue fácil, difícil o confuso. Eso nos ayuda a mejorar la página.</p>
      </div>`;
    heading.insertAdjacentElement('afterend', guide);
  }

  function improveLabels() {
    document.querySelectorAll('.exam-button').forEach(button => {
      const school = button.dataset.simSchool;
      const area = button.dataset.simArea;
      const label = `${school === 'belgrano' ? 'Manuel Belgrano' : 'Monserrat'} · ${area === 'matematica' ? 'Matemática' : 'Lengua'} · simulacro sobre 100 puntos`;
      button.setAttribute('aria-label', label);
    });
  }

  function injectInteractionStyles() {
    if (document.querySelector('#v6-interaction-styles')) return;
    const style = document.createElement('style');
    style.id = 'v6-interaction-styles';
    style.textContent = `
      .session-exit-button{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #d4dde7;border-radius:11px;background:#fff;color:#7f3030;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap;transition:transform .16s ease,border-color .16s ease,background .16s ease,opacity .16s ease}
      .session-exit-button:hover,.session-exit-button:focus-visible{transform:translateY(-1px);border-color:#d6a5a5;background:#fff8f8}.session-exit-button:disabled{cursor:wait;opacity:.68;transform:none}
      .session-exit-button .exit-short{display:none}.session-exit-button .exit-icon{font-size:1rem;line-height:1}
      #profile-gate{transform-origin:top center}.profile-card.v6-selected-profile{border-color:#6b9dc4!important;box-shadow:0 16px 38px rgba(23,63,107,.17)!important;transform:translateY(-5px) scale(.985)!important}
      #profile-gate.v6-profile-leaving{animation:v6GateContract .24s cubic-bezier(.4,0,.2,1) forwards;pointer-events:none}
      #app-shell.v6-shell-rising{animation:v6ShellRise .46s cubic-bezier(.2,.72,.25,1) both}
      #profile-gate.v6-gate-returning{animation:v6GateReturn .34s cubic-bezier(.2,.72,.25,1) both}
      @keyframes v6GateContract{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-28px) scale(.965)}}
      @keyframes v6ShellRise{0%{opacity:0;transform:translateY(34px)}100%{opacity:1;transform:translateY(0)}}
      @keyframes v6GateReturn{0%{opacity:0;transform:translateY(-18px) scale(.98)}100%{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:700px){.top-actions{gap:6px}.profile-pill{max-width:118px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.session-exit-button{padding:8px 10px}.session-exit-button .exit-long{display:none}.session-exit-button .exit-short{display:inline}}
      @media(prefers-reduced-motion:reduce){#profile-gate.v6-profile-leaving,#app-shell.v6-shell-rising,#profile-gate.v6-gate-returning{animation:none!important}.profile-card.v6-selected-profile{transform:none!important}}
    `;
    document.head.appendChild(style);
  }

  function mountSessionExit() {
    const actions = document.querySelector('.top-actions');
    if (!actions || actions.querySelector('#safe-sign-out')) return;

    const button = document.createElement('button');
    button.id = 'safe-sign-out';
    button.className = 'session-exit-button';
    button.type = 'button';
    button.title = 'Actualizar el avance en la nube y cerrar esta sesión';
    button.innerHTML = '<span class="exit-icon" aria-hidden="true">⏻</span><span class="exit-long">Guardar y cerrar sesión</span><span class="exit-short">Salir</span>';
    button.addEventListener('click', safeSignOut);
    actions.appendChild(button);

    const familyButton = document.querySelector('#sign-out');
    if (familyButton) {
      familyButton.textContent = 'Guardar avance y cerrar sesión';
      familyButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        safeSignOut();
      }, true);
    }
  }

  function setExitButtonsState(busy, label = '') {
    const topButton = document.querySelector('#safe-sign-out');
    const familyButton = document.querySelector('#sign-out');
    [topButton, familyButton].filter(Boolean).forEach(button => {
      button.disabled = busy;
    });
    if (topButton) {
      topButton.innerHTML = busy
        ? `<span class="exit-icon" aria-hidden="true">↻</span><span>${label || 'Guardando…'}</span>`
        : '<span class="exit-icon" aria-hidden="true">⏻</span><span class="exit-long">Guardar y cerrar sesión</span><span class="exit-short">Salir</span>';
    }
    if (familyButton) familyButton.textContent = busy ? (label || 'Guardando avance…') : 'Guardar avance y cerrar sesión';
  }

  function showExitMessage(message) {
    const toast = document.querySelector('#toast');
    if (!toast) return window.alert(message);
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 3200);
  }

  async function safeSignOut() {
    if (signingOut) return;
    if (document.querySelector('#exercise-dialog[open]')) {
      showExitMessage('Terminá o cerrá la actividad antes de cerrar la sesión.');
      return;
    }

    signingOut = true;
    setExitButtonsState(true, 'Actualizando avance…');

    try {
      const cfg = window.INGRESO_CONFIG || {};
      if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error('Supabase no está disponible.');
      if (!navigator.onLine) throw new Error('No hay conexión. Conectate a internet para actualizar el avance antes de salir.');

      const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData?.session?.user;
      if (!user) {
        await client.auth.signOut({ scope: 'local' });
        window.location.reload();
        return;
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error('No se encontró el progreso local para actualizar.');
      const localState = JSON.parse(raw);
      const localUpdatedAt = Number(localState?.updatedAt || 0);

      const { data: remoteRow, error: remoteError } = await client
        .from('study_state')
        .select('payload')
        .eq('user_id', user.id)
        .maybeSingle();
      if (remoteError) throw remoteError;

      const remoteUpdatedAt = Number(remoteRow?.payload?.updatedAt || 0);
      if (remoteUpdatedAt <= localUpdatedAt) {
        const { error: syncError } = await client
          .from('study_state')
          .upsert({ user_id: user.id, payload: localState, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (syncError) throw syncError;
      }

      setExitButtonsState(true, 'Avance actualizado ✓');
      await new Promise(resolve => window.setTimeout(resolve, 420));
      const { error: signOutError } = await client.auth.signOut({ scope: 'local' });
      if (signOutError) throw signOutError;
      window.location.reload();
    } catch (error) {
      console.error('[Ingreso V6] No se pudo guardar y cerrar sesión', error);
      signingOut = false;
      setExitButtonsState(false);
      showExitMessage(error?.message || 'No se pudo actualizar el avance. La sesión quedó abierta para no arriesgar datos.');
    }
  }

  function bindProfileTransitions() {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('click', event => {
      const profileButton = event.target.closest?.('.profile-card[data-profile]');
      if (!profileButton || bypassProfileTransition || profileTransitionInFlight || reducedMotion) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      profileTransitionInFlight = true;

      const gate = document.querySelector('#profile-gate');
      const shell = document.querySelector('#app-shell');
      profileButton.classList.add('v6-selected-profile');
      gate?.classList.add('v6-profile-leaving');

      window.setTimeout(() => {
        bypassProfileTransition = true;
        profileButton.click();
        bypassProfileTransition = false;
        shell?.classList.add('v6-shell-rising');
        window.setTimeout(() => {
          gate?.classList.remove('v6-profile-leaving');
          profileButton.classList.remove('v6-selected-profile');
          shell?.classList.remove('v6-shell-rising');
          profileTransitionInFlight = false;
        }, 520);
      }, 230);
    }, true);

    document.addEventListener('click', event => {
      if (!event.target.closest?.('#profile-switch, #active-profile') || reducedMotion) return;
      window.setTimeout(() => {
        const gate = document.querySelector('#profile-gate');
        gate?.classList.add('v6-gate-returning');
        window.setTimeout(() => gate?.classList.remove('v6-gate-returning'), 380);
      }, 0);
    });
  }

  function init() {
    mountRoadmap();
    mountGuide();
    improveLabels();
    injectInteractionStyles();
    mountSessionExit();
    bindProfileTransitions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
