(function initTercerTiempoCloudSync(root) {
  const config = root.TercerTiempoCloudConfig || {};
  const storage = root.TercerTiempoStorage;
  const supabaseLib = root.supabase;

  const configured = Boolean(
    config.enabled &&
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    supabaseLib &&
    typeof supabaseLib.createClient === 'function' &&
    storage
  );

  if (!configured) {
    root.TercerTiempoCloudSync = {
      configured: false,
      status: 'disabled'
    };
    return;
  }

  const client = supabaseLib.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const tableName = config.tableName || 'user_app_state';
  const localSave = storage.save.bind(storage);
  let currentSession = null;
  let pendingTimer = null;
  let suppressRemoteWrite = false;

  const getUserId = () => currentSession?.user?.id || null;

  async function loadRemoteState() {
    const userId = getUserId();
    if (!userId) return null;
    const { data, error } = await client
      .from(tableName)
      .select('state, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async function saveRemoteState(state) {
    const userId = getUserId();
    if (!userId) return false;
    const sanitized = root.TercerTiempoModels?.sanitizeState
      ? root.TercerTiempoModels.sanitizeState(state)
      : state;
    const { error } = await client
      .from(tableName)
      .upsert({
        user_id: userId,
        state: sanitized,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    if (error) throw error;
    return true;
  }

  function scheduleRemoteSave(state) {
    if (!getUserId() || suppressRemoteWrite) return;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      saveRemoteState(state).catch(err => console.error('[TercerTiempoCloudSync] save failed', err));
    }, 500);
  }

  storage.save = function saveWithCloud(state) {
    const ok = localSave(state);
    scheduleRemoteSave(state);
    return ok;
  };

  async function syncOnLogin() {
    const remote = await loadRemoteState();
    const localState = storage.load();
    if (remote?.state) {
      suppressRemoteWrite = true;
      try {
        localSave(remote.state);
      } finally {
        suppressRemoteWrite = false;
      }
      return { direction: 'download', state: remote.state };
    }
    await saveRemoteState(localState);
    return { direction: 'upload', state: localState };
  }

  async function signUp(email, password) {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    currentSession = data.session || null;
    if (currentSession) await syncOnLogin();
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentSession = data.session || null;
    const sync = currentSession ? await syncOnLogin() : null;
    return { ...data, sync };
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    currentSession = null;
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentSession = data.session || null;
    return currentSession;
  }

  async function uploadLocalNow() {
    return saveRemoteState(storage.load());
  }

  async function downloadRemoteNow() {
    const remote = await loadRemoteState();
    if (!remote?.state) return false;
    suppressRemoteWrite = true;
    try {
      localSave(remote.state);
    } finally {
      suppressRemoteWrite = false;
    }
    return true;
  }

  client.auth.onAuthStateChange((_event, session) => {
    currentSession = session || null;
  });

  getSession().catch(err => console.error('[TercerTiempoCloudSync] session load failed', err));

  root.TercerTiempoCloudSync = {
    configured: true,
    client,
    signUp,
    signIn,
    signOut,
    getSession,
    loadRemoteState,
    uploadLocalNow,
    downloadRemoteNow,
    syncOnLogin
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
