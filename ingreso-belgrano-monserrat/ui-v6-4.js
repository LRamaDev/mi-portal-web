(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const PROFILE_IDS = ['p1', 'p2'];
  const DISPLAY_VERSION = '6.6';
  let togetherMode = false;
  let lastSelectedProfile = null;

  // ---------------------------------------------------------------------------
  // V6.5 · Sincronización concurrente por perfil
  // ---------------------------------------------------------------------------
  function installConcurrentProfileSync() {
    const storageProto = window.Storage?.prototype;
    if (!storageProto || !window.supabase || window.__INGRESO_CONCURRENT_SYNC__) return;
    window.__INGRESO_CONCURRENT_SYNC__ = true;

    const nativeGetItem = storageProto.getItem;
    const nativeSetItem = storageProto.setItem;
    const originalCreateClient = window.supabase.createClient.bind(window.supabase);

    const safeParse = value => {
      try { return value ? JSON.parse(value) : null; } catch { return null; }
    };
    const clone = value => JSON.parse(JSON.stringify(value));

    function mergeEvidenceRows(...lists) {
      const byId = new Map();
      lists.flat().filter(Boolean).forEach(event => {
        const id = String(event?.eventId || '');
        if (!id) return;
        const previous = byId.get(id);
        if (!previous || Number(event.at || 0) >= Number(previous.at || 0)) byId.set(id, clone(event));
      });
      return [...byId.values()].sort((a, b) => Number(a.at || 0) - Number(b.at || 0));
    }

    function mergeProfilePayload(localProfile, remoteProfile, preferRemote = false) {
      if (!localProfile && !remoteProfile) return null;
      const primary = preferRemote ? remoteProfile : localProfile;
      const secondary = preferRemote ? localProfile : remoteProfile;
      const merged = clone(primary || secondary || {});
      merged.evidence = mergeEvidenceRows(localProfile?.evidence || [], remoteProfile?.evidence || []);
      merged.pendingEvidence = mergeEvidenceRows(localProfile?.pendingEvidence || [], remoteProfile?.pendingEvidence || []);
      return merged;
    }

    function comparableProfile(profile) {
      if (!profile || typeof profile !== 'object') return {};
      const copy = clone(profile);
      delete copy.updatedAt;
      return copy;
    }

    function sameProfile(a, b) {
      return JSON.stringify(comparableProfile(a)) === JSON.stringify(comparableProfile(b));
    }

    function getLocalState() {
      return safeParse(nativeGetItem.call(localStorage, STORAGE_KEY));
    }

    function stampStateForStorage(nextState, previousState) {
      if (!nextState?.profiles) return nextState;
      const now = Date.now();
      let newest = Number(nextState.updatedAt || 0);

      PROFILE_IDS.forEach(profileId => {
        const nextProfile = nextState.profiles[profileId];
        if (!nextProfile) return;
        const previousProfile = previousState?.profiles?.[profileId];
        const previousStamp = Number(previousProfile?.updatedAt || previousState?.updatedAt || 0);
        const incomingStamp = Number(nextProfile.updatedAt || 0);

        if (!previousProfile || !sameProfile(nextProfile, previousProfile)) {
          nextProfile.updatedAt = Math.max(now, previousStamp + 1, incomingStamp);
        } else {
          nextProfile.updatedAt = Math.max(incomingStamp, previousStamp);
        }
        newest = Math.max(newest, Number(nextProfile.updatedAt || 0));
      });

      nextState.updatedAt = newest || now;
      return nextState;
    }

    storageProto.setItem = function(key, value) {
      if (this === localStorage && key === STORAGE_KEY && typeof value === 'string') {
        const incoming = safeParse(value);
        if (incoming?.profiles) {
          const previous = getLocalState();
          const stamped = stampStateForStorage(incoming, previous);
          return nativeSetItem.call(this, key, JSON.stringify(stamped));
        }
      }
      return nativeSetItem.call(this, key, value);
    };

    function virtualStudyState(client, rawFrom) {
      let selectedColumns = '';
      let requestedUserId = null;

      async function readRows() {
        const { data, error } = await rawFrom('study_profile_state')
          .select('profile_id,payload,updated_at')
          .eq('user_id', requestedUserId);
        if (error) return { data: null, error };
        if (!data?.length) return { data: null, error: null };

        const local = getLocalState() || { version: 3, profiles: {} };
        const remoteByProfile = new Map(data.map(row => [row.profile_id, row]));
        const mergedProfiles = {};
        let newest = 0;
        let newestDbTime = null;

        PROFILE_IDS.forEach(profileId => {
          const localProfile = local.profiles?.[profileId] || null;
          const row = remoteByProfile.get(profileId);
          const remoteProfile = row?.payload || null;
          const localStamp = Number(localProfile?.updatedAt || local.updatedAt || 0);
          const remoteStamp = Number(remoteProfile?.updatedAt || 0);

          if (remoteProfile && localProfile) mergedProfiles[profileId] = mergeProfilePayload(localProfile, remoteProfile, remoteStamp > localStamp);
          else if (localProfile) mergedProfiles[profileId] = mergeProfilePayload(localProfile, null, false);
          else if (remoteProfile) mergedProfiles[profileId] = mergeProfilePayload(null, remoteProfile, true);

          newest = Math.max(newest, Number(mergedProfiles[profileId]?.updatedAt || 0));
          if (row?.updated_at && (!newestDbTime || row.updated_at > newestDbTime)) newestDbTime = row.updated_at;
        });

        const topLevelUpdatedAt = selectedColumns.includes('updated_at')
          ? newest
          : Number(local.updatedAt || newest || Date.now());

        return {
          data: {
            payload: {
              version: Number(local.version || 3),
              profiles: mergedProfiles,
              updatedAt: topLevelUpdatedAt
            },
            updated_at: newestDbTime
          },
          error: null
        };
      }

      async function savePayload(row) {
        const payload = row?.payload;
        if (!payload?.profiles) return { data: null, error: new Error('Estado de estudio inválido.') };
        const stored = getLocalState();
        const results = [];

        for (const profileId of PROFILE_IDS) {
          const incoming = payload.profiles?.[profileId];
          if (!incoming) continue;
          const storedProfile = stored?.profiles?.[profileId];
          let profilePayload;

          if (storedProfile && sameProfile(incoming, storedProfile)) {
            profilePayload = clone(storedProfile);
          } else {
            profilePayload = clone(incoming);
            profilePayload.updatedAt = Math.max(
              Number(profilePayload.updatedAt || 0),
              Number(payload.updatedAt || 0),
              Date.now()
            );
          }

          const { data, error } = await client.rpc('save_study_profile_state', {
            p_profile_id: profileId,
            p_payload: profilePayload
          });
          if (error) return { data: null, error };
          results.push({ profileId, saved: Boolean(data) });
        }

        return { data: results, error: null };
      }

      return {
        select(columns = '') { selectedColumns = String(columns || ''); return this; },
        eq(column, value) { if (column === 'user_id') requestedUserId = value; return this; },
        maybeSingle: readRows,
        single: readRows,
        upsert: savePayload
      };
    }

    function wrapClient(client) {
      if (client.__ingresoConcurrentSyncWrapped) return client;
      client.__ingresoConcurrentSyncWrapped = true;
      const rawFrom = client.from.bind(client);
      client.from = table => table === 'study_state' ? virtualStudyState(client, rawFrom) : rawFrom(table);
      return client;
    }

    window.supabase.createClient = (...args) => wrapClient(originalCreateClient(...args));

    async function refreshFromCloud() {
      if (!navigator.onLine || document.querySelector('dialog[open]')) return;
      const cfg = window.INGRESO_CONFIG || {};
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

      try {
        const client = wrapClient(originalCreateClient(cfg.supabaseUrl, cfg.supabaseAnonKey));
        const { data: sessionData } = await client.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) return;

        const { data, error } = await client
          .from('study_profile_state')
          .select('profile_id,payload,updated_at')
          .eq('user_id', user.id);
        if (error || !data?.length) return;

        const local = getLocalState();
        if (!local?.profiles) return;
        const next = clone(local);
        let changed = false;

        data.forEach(row => {
          const profileId = row.profile_id;
          if (!PROFILE_IDS.includes(profileId) || !row.payload) return;
          const localStamp = Number(next.profiles?.[profileId]?.updatedAt || next.updatedAt || 0);
          const remoteStamp = Number(row.payload.updatedAt || 0);
          if (remoteStamp > localStamp) {
            next.profiles[profileId] = mergeProfilePayload(next.profiles?.[profileId] || null, row.payload, true);
            changed = true;
          }
        });

        if (!changed) return;
        next.updatedAt = Math.max(
          ...PROFILE_IDS.map(id => Number(next.profiles?.[id]?.updatedAt || 0)),
          Number(next.updatedAt || 0)
        );
        nativeSetItem.call(localStorage, STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('ingreso:remote-state-updated', { detail: { source: 'cloud' } }));
      } catch (error) {
        console.warn('[Ingreso 6.6] No se pudo refrescar el progreso por perfil', error);
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshFromCloud();
    });
    window.addEventListener('online', refreshFromCloud);
    window.addEventListener('focus', refreshFromCloud);
    window.INGRESO_PROFILE_SYNC = { version: DISPLAY_VERSION, refresh: refreshFromCloud };
  }

  installConcurrentProfileSync();

  function setVisibleVersion() {
    const meta = document.querySelector('meta[name="app-version"]');
    const releaseVersion = meta?.getAttribute('content') || DISPLAY_VERSION;
    const badge = document.querySelector('.build-version');
    if (badge) {
      badge.textContent = `Versión ${releaseVersion}`;
      badge.setAttribute('aria-label', `Versión instalada ${releaseVersion}`);
      badge.title = `Versión ${releaseVersion} · identidad visual por perfil`;
    }
  }

  // ---------------------------------------------------------------------------
  // V6.6 · Identidad visual por perfil
  // ---------------------------------------------------------------------------
  function applyProfileTheme(profileId) {
    const allowed = ['p1', 'p2', 'together'];
    const theme = allowed.includes(profileId) ? profileId : '';
    if (theme) document.body.dataset.profileTheme = theme;
    else delete document.body.dataset.profileTheme;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const colors = { p1: '#dff7f3', p2: '#eee5f8', together: '#f1eef8' };
      themeMeta.setAttribute('content', colors[theme] || '#173f6b');
    }
  }

  function bindProfileThemes() {
    document.querySelectorAll('.profile-card[data-profile]').forEach(button => {
      button.addEventListener('click', () => {
        lastSelectedProfile = button.dataset.profile;
        applyProfileTheme(lastSelectedProfile);
      });
    });

    document.querySelectorAll('#profile-switch, #active-profile').forEach(button => {
      button.addEventListener('click', () => {
        lastSelectedProfile = null;
        window.setTimeout(() => {
          if (!document.querySelector('#profile-gate')?.hidden) applyProfileTheme(null);
        }, 0);
      });
    });

    window.addEventListener('ingreso:profile-changed', event => {
      lastSelectedProfile = event.detail?.mode || null;
      applyProfileTheme(lastSelectedProfile);
    });

    const shell = document.querySelector('#app-shell');
    if (shell) {
      new MutationObserver(() => {
        if (!shell.hidden && lastSelectedProfile) applyProfileTheme(lastSelectedProfile);
        if (shell.hidden && !lastSelectedProfile) applyProfileTheme(null);
      }).observe(shell, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function isTogetherActive() {
    const shell = document.querySelector('#app-shell');
    const pill = document.querySelector('#active-profile');
    if (!shell || shell.hidden || !pill) return false;
    return pill.textContent.includes(' + ');
  }

  function ensureTogetherNote() {
    const actions = document.querySelector('.hero-actions');
    if (!actions) return null;
    let note = document.querySelector('#together-mode-note');
    if (!note) {
      note = document.createElement('p');
      note.id = 'together-mode-note';
      note.className = 'together-mode-note';
      note.innerHTML = '<strong>Modo juntas:</strong> los diagnósticos y simulacros se hacen desde cada perfil individual. Acá pueden practicar alternando turnos.';
      actions.insertAdjacentElement('afterend', note);
    }
    return note;
  }

  function ensureTrainingNote() {
    const examPanel = document.querySelector('.exam-panel');
    if (!examPanel) return null;
    let note = document.querySelector('#together-training-note');
    if (!note) {
      note = document.createElement('div');
      note.id = 'together-training-note';
      note.className = 'together-training-note';
      note.innerHTML = '<strong>Práctica compartida</strong><span>Elijan Matemática o Lengua y la app alternará los turnos. Los simulacros completos quedan reservados para los perfiles individuales.</span>';
      examPanel.insertAdjacentElement('beforebegin', note);
    }
    return note;
  }

  function syncTogetherUi() {
    togetherMode = isTogetherActive();

    const recommended = document.querySelector('#start-recommended');
    const diagnostic = document.querySelector('#start-diagnostic');
    const welcomeCopy = document.querySelector('#welcome-copy');
    const examPanel = document.querySelector('.exam-panel');
    const heroNote = ensureTogetherNote();
    const trainingNote = ensureTrainingNote();

    if (recommended) recommended.textContent = togetherMode ? 'Elegir qué entrenar' : 'Empezar entrenamiento';
    if (diagnostic) diagnostic.hidden = togetherMode;
    if (heroNote) heroNote.hidden = !togetherMode;
    if (trainingNote) trainingNote.hidden = !togetherMode;
    if (examPanel) examPanel.hidden = togetherMode;

    if (togetherMode && welcomeCopy) {
      welcomeCopy.textContent = 'Practiquen juntas alternando turnos. El progreso de cada respuesta se atribuye al perfil que corresponde.';
    }
  }

  function bindTogetherActions() {
    const recommended = document.querySelector('#start-recommended');
    const diagnostic = document.querySelector('#start-diagnostic');

    recommended?.addEventListener('click', event => {
      if (!togetherMode) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const trainingNav = document.querySelector('.nav-button[data-nav="entrenar"]') || document.querySelector('.mobile-nav [data-nav="entrenar"]');
      trainingNav?.click();
    }, true);

    diagnostic?.addEventListener('click', event => {
      if (!togetherMode) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast('El diagnóstico es individual. Elegí uno de los dos perfiles para hacerlo.');
    }, true);
  }

  function watchProfileChanges() {
    const shell = document.querySelector('#app-shell');
    const pill = document.querySelector('#active-profile');
    if (!shell || !pill) return;

    const observer = new MutationObserver(syncTogetherUi);
    observer.observe(shell, { attributes: true, attributeFilter: ['hidden'] });
    observer.observe(pill, { childList: true, characterData: true, subtree: true });

    document.querySelectorAll('#profile-switch, #active-profile').forEach(button => {
      button.addEventListener('click', () => window.setTimeout(syncTogetherUi, 0));
    });
  }

  function injectStyles() {
    if (document.querySelector('#v6-6-profile-styles')) return;
    const style = document.createElement('style');
    style.id = 'v6-6-profile-styles';
    style.textContent = `
      .together-mode-note{margin:12px 0 0;padding:10px 12px;border-left:3px solid #7d68b8;border-radius:8px;background:#f7f3ff;color:#5e5277;font-size:.88rem;line-height:1.45}
      .together-training-note{display:grid;gap:4px;margin:18px 0;padding:16px 18px;border:1px solid #d8cfee;border-radius:16px;background:linear-gradient(145deg,#fff,#f8f4ff);color:#5d5174}
      .together-training-note strong{color:#4d3d70;font-size:1rem}.together-training-note span{font-size:.9rem;line-height:1.45}

      .profile-card[data-profile="p1"]{background:linear-gradient(145deg,#fff,#e4faf6);border-color:#a7ddd5}
      .profile-card[data-profile="p1"] .avatar{background:#cff3ed;color:#176f68}
      .profile-card[data-profile="p1"]:hover,.profile-card[data-profile="p1"]:focus-visible{border-color:#69bfb5;box-shadow:0 14px 30px rgba(42,128,120,.14)}
      .profile-card[data-profile="p2"]{background:linear-gradient(145deg,#fff,#f1e9fb);border-color:#d0bce9}
      .profile-card[data-profile="p2"] .avatar{background:#e8dcf7;color:#6b4d91}
      .profile-card[data-profile="p2"]:hover,.profile-card[data-profile="p2"]:focus-visible{border-color:#ad8dd2;box-shadow:0 14px 30px rgba(117,91,155,.14)}
      .profile-card[data-profile="together"]{background:linear-gradient(120deg,#e7faf7 0%,#fff 50%,#f2eafb 100%);border-color:#c8c8dd}

      body[data-profile-theme="p1"]{--brand:#287f78;--brand2:#42a59b;--surface2:#eaf9f6;background:radial-gradient(circle at 88% 0,#dff7f3 0,transparent 34%),#f4f9f8}
      body[data-profile-theme="p1"] .topbar{background:rgba(239,250,248,.92);border-bottom-color:#cfe8e3}
      body[data-profile-theme="p1"] .hero-panel{background:linear-gradient(135deg,#fff,#e7f9f5);border-color:#cbe9e3}
      body[data-profile-theme="p1"] .profile-pill{background:#e0f6f2;border-color:#abdcd4;color:#176f68}
      body[data-profile-theme="p1"] .today-card{border-color:#b9e2dc;background:rgba(248,255,253,.82)}
      body[data-profile-theme="p1"] .mobile-nav{border-color:#c9e5e0}

      body[data-profile-theme="p2"]{--brand:#755b9b;--brand2:#9576bc;--surface2:#f4eefb;background:radial-gradient(circle at 88% 0,#eee5f8 0,transparent 34%),#f8f6fb}
      body[data-profile-theme="p2"] .topbar{background:rgba(248,245,252,.93);border-bottom-color:#e0d5ed}
      body[data-profile-theme="p2"] .hero-panel{background:linear-gradient(135deg,#fff,#f1eafb);border-color:#dfd2ee}
      body[data-profile-theme="p2"] .profile-pill{background:#eee4f8;border-color:#cdb8e4;color:#684b8f}
      body[data-profile-theme="p2"] .today-card{border-color:#dac9eb;background:rgba(253,250,255,.84)}
      body[data-profile-theme="p2"] .mobile-nav{border-color:#dfd3eb}

      body[data-profile-theme="together"]{--brand:#5f6f93;--brand2:#7f76a5;--surface2:#f0f4f7;background:radial-gradient(circle at 20% 0,#e2f8f4 0,transparent 29%),radial-gradient(circle at 88% 0,#eee5f8 0,transparent 31%),#f6f7fa}
      body[data-profile-theme="together"] .topbar{background:rgba(247,247,251,.94)}
      body[data-profile-theme="together"] .hero-panel{background:linear-gradient(120deg,#eefaf8,#fff 48%,#f4eefb)}
      body[data-profile-theme="together"] .profile-pill{background:linear-gradient(90deg,#def5f1,#eee4f8);border-color:#c9c8dc;color:#59607b}
    `;
    document.head.appendChild(style);
  }

  function init() {
    setVisibleVersion();
    injectStyles();
    bindProfileThemes();
    bindTogetherActions();
    watchProfileChanges();
    syncTogetherUi();
    applyProfileTheme(null);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

(() => {
  'use strict';
  const VERSION = '6.8.1';
  const MAX_VIEWS = 2;
  const COPY = {
    p1: {
      title: 'Un mensaje antes de empezar',
      paragraphs: [
        'Hoy no necesitás demostrar que sabés todo. Lo importante es animarte a pensar, probar y volver a intentar cuando algo no sale de una.',
        'Cada ejercicio difícil es una oportunidad para descubrir una forma nueva de resolver. Equivocarte no te hace menos capaz: te da información para aprender mejor.',
        'Confiá en tu esfuerzo y en tus ideas. Desafiate un poquito más de lo que creés posible, sin apurarte ni compararte. Todo avance cuenta.'
      ],
      closing: 'Tenés mucho por descubrir. Andá paso a paso y creé en vos.'
    },
    p2: {
      title: 'Antes de abrir el primer desafío',
      paragraphs: [
        'Hay desafíos que se entienden rápido y otros que piden paciencia. Los dos sirven, porque aprender también es quedarse un rato con una pregunta hasta encontrarle la vuelta.',
        'Cuando algo parezca complicado, hacé lugar a la curiosidad: preguntate qué sabés, qué podrías probar distinto y qué pista te puede ayudar a seguir.',
        'No busques hacerlo perfecto. Buscá avanzar con valentía, celebrar lo que descubrís y volver a intentar lo que cuesta. Tu capacidad crece cada vez que te animás a ir un poco más lejos.'
      ],
      closing: 'Confiá en vos y disfrutá el desafío. Podés aprender muchísimo.'
    }
  };
  let introClient = null;

  function setIntroVersion() {
    const meta = document.querySelector('meta[name="app-version"]');
    const releaseVersion = meta?.getAttribute('content') || VERSION;
    const badge = document.querySelector('.build-version');
    if (badge) {
      badge.textContent = `Versión ${releaseVersion}`;
      badge.setAttribute('aria-label', `Versión instalada ${releaseVersion}`);
      badge.title = `Versión ${releaseVersion} · bienvenida motivacional inicial`;
    }
  }

  function getIntroClient() {
    if (introClient) return introClient;
    const cfg = window.INGRESO_CONFIG || {};
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    introClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return introClient;
  }

  async function consumeIntro(profileId) {
    const client = getIntroClient();
    if (!client) return null;
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return null;
    const { data: row, error } = await client
      .from('study_profile_intro_state')
      .select('recipient_name,motivation_views')
      .eq('user_id', user.id)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error || !row) return null;
    const current = Number(row.motivation_views || 0);
    if (current >= MAX_VIEWS) return null;
    const next = current + 1;
    const { error: writeError } = await client
      .from('study_profile_intro_state')
      .update({ motivation_views: next, last_shown_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('profile_id', profileId);
    if (writeError) return null;
    return { name: row.recipient_name || '', viewNumber: next };
  }

  function ensureIntroDialog() {
    let dialog = document.querySelector('#motivation-dialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.id = 'motivation-dialog';
    dialog.innerHTML = `
      <article class="mot-card">
        <span class="mot-star">✦</span>
        <p class="eyebrow">Para empezar con confianza</p>
        <h2 id="mot-title"></h2>
        <div id="mot-copy"></div>
        <p id="mot-end"></p>
        <button id="mot-close" class="primary-button" type="button">Estoy lista</button>
      </article>`;
    document.body.appendChild(dialog);
    dialog.querySelector('#mot-close').addEventListener('click', () => dialog.close());

    const style = document.createElement('style');
    style.id = 'motivation-v6-8-1-style';
    style.textContent = `
      #motivation-dialog{border:0;padding:0;border-radius:22px;background:transparent;max-width:min(92vw,600px)}
      #motivation-dialog::backdrop{background:rgba(18,35,52,.48);backdrop-filter:blur(3px)}
      .mot-card{padding:28px;border-radius:22px;background:linear-gradient(145deg,#fff,#effbf8);box-shadow:0 24px 70px rgba(13,35,55,.25)}
      #motivation-dialog[data-profile="p2"] .mot-card{background:linear-gradient(145deg,#fff,#f7f1fc)}
      .mot-card h2{color:#173f6b;margin:.3rem 0 1rem}.mot-card #mot-copy{display:grid;gap:10px;color:#4c6071;line-height:1.6}.mot-card #mot-copy p{margin:0}
      .mot-card #mot-end{font-weight:800;color:#29495f;padding:11px 13px;border-radius:12px;background:#dff7f3}.mot-star{font-size:1.6rem}
      #motivation-dialog[data-profile="p2"] .mot-card #mot-end{background:#eee5f8}.mot-card .primary-button{width:100%}
      @media(max-width:620px){.mot-card{padding:22px}.mot-card #mot-copy{font-size:.96rem}}
    `;
    document.head.appendChild(style);
    return dialog;
  }

  async function maybeShowIntro(profileId) {
    if (!COPY[profileId]) return;
    const key = `ingreso-intro-seen-${profileId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const result = await consumeIntro(profileId);
    if (!result) return;
    const copy = COPY[profileId];
    const dialog = ensureIntroDialog();
    dialog.dataset.profile = profileId;
    dialog.querySelector('#mot-title').textContent = result.name ? `${copy.title}, ${result.name}` : copy.title;
    dialog.querySelector('#mot-copy').innerHTML = copy.paragraphs.map(text => `<p>${text}</p>`).join('');
    dialog.querySelector('#mot-end').textContent = copy.closing;
    if (!dialog.open) dialog.showModal();
  }

  function initIntro() {
    ensureIntroDialog();
    window.setTimeout(setIntroVersion, 100);
    window.setTimeout(setIntroVersion, 700);
    document.querySelectorAll('.profile-card[data-profile]').forEach(button => {
      button.addEventListener('click', () => {
        const profileId = button.dataset.profile;
        if (!COPY[profileId]) return;
        window.setTimeout(() => maybeShowIntro(profileId), 360);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initIntro, { once: true });
  else initIntro();
})();
