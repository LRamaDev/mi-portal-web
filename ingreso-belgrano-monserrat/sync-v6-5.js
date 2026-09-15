(() => {
  'use strict';

  const STORAGE_KEY = 'ingreso-belgrano-monserrat-v1';
  const PROFILE_IDS = ['p1', 'p2'];
  const VERSION = '6.5';
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

      // safeSignOut consulta solo payload. Ahí forzamos el upsert virtual para que
      // cada perfil intente guardar su copia; la RPC rechaza automáticamente una copia vieja.
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
      select(columns = '') {
        selectedColumns = String(columns || '');
        return this;
      },
      eq(column, value) {
        if (column === 'user_id') requestedUserId = value;
        return this;
      },
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
      next.updatedAt = Math.max(...PROFILE_IDS.map(id => Number(next.profiles?.[id]?.updatedAt || 0)), Number(next.updatedAt || 0));
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

  window.INGRESO_PROFILE_SYNC = { version: VERSION, refresh: refreshFromCloud };
})();
