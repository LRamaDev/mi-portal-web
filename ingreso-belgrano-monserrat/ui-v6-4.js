(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const PROFILE_IDS = ['p1', 'p2'];
  const DISPLAY_VERSION = '6.5';
  let togetherMode = false;

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

          if (remoteProfile && (!localProfile || remoteStamp > localStamp)) mergedProfiles[profileId] = clone(remoteProfile);
          else if (localProfile) mergedProfiles[profileId] = clone(localProfile);
          else if (remoteProfile) mergedProfiles[profileId] = clone(remoteProfile);

          newest = Math.max(newest, Number(mergedProfiles[profileId]?.updatedAt || 0));
          if (row?.updated_at && (!newestDbTime || row.updated_at > newestDbTime)) newestDbTime = row.updated_at;
        });

        // app.js pide payload+updated_at al iniciar y necesita el máximo real.
        // ui-v6.js pide solo payload al cerrar; en ese caso dejamos que intente
        // guardar ambos perfiles y la RPC decide individualmente cuál es más nuevo.
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
            next.profiles[profileId] = clone(row.payload);
            changed = true;
          }
        });

        if (!changed) return;
        next.updatedAt = Math.max(
          ...PROFILE_IDS.map(id => Number(next.profiles?.[id]?.updatedAt || 0)),
          Number(next.updatedAt || 0)
        );
        nativeSetItem.call(localStorage, STORAGE_KEY, JSON.stringify(next));
        window.setTimeout(() => window.location.reload(), 80);
      } catch (error) {
        console.warn('[Ingreso 6.5] No se pudo refrescar el progreso por perfil', error);
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
    if (meta) meta.setAttribute('content', DISPLAY_VERSION);
    const badge = document.querySelector('.build-version');
    if (badge) {
      badge.textContent = `Versión ${DISPLAY_VERSION}`;
      badge.setAttribute('aria-label', `Versión instalada ${DISPLAY_VERSION}`);
      badge.title = `Versión ${DISPLAY_VERSION} · sincronización simultánea por perfil`;
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
    if (document.querySelector('#v6-4-together-styles')) return;
    const style = document.createElement('style');
    style.id = 'v6-4-together-styles';
    style.textContent = `
      .together-mode-note{margin:12px 0 0;padding:10px 12px;border-left:3px solid #7d68b8;border-radius:8px;background:#f7f3ff;color:#5e5277;font-size:.88rem;line-height:1.45}
      .together-training-note{display:grid;gap:4px;margin:18px 0;padding:16px 18px;border:1px solid #d8cfee;border-radius:16px;background:linear-gradient(145deg,#fff,#f8f4ff);color:#5d5174}
      .together-training-note strong{color:#4d3d70;font-size:1rem}.together-training-note span{font-size:.9rem;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

  function init() {
    setVisibleVersion();
    injectStyles();
    bindTogetherActions();
    watchProfileChanges();
    syncTogetherUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
