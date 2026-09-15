(function initTercerTiempoCloudSync(root) {
  const config = root.TercerTiempoCloudConfig || {};
  const storage = root.TercerTiempoStorage;
  const supabaseLib = root.supabase;

  const publicKey = config.supabasePublishableKey || config.supabaseAnonKey || '';
  const configured = Boolean(
    config.enabled &&
    config.supabaseUrl &&
    publicKey &&
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

  const client = supabaseLib.createClient(config.supabaseUrl, publicKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const tableName = config.tableName || 'user_app_state';
  const localSave = storage.save.bind(storage);
  const POLL_INTERVAL_MS = 8000;
  const LOCAL_GRACE_MS = 1800;

  let currentSession = null;
  let pendingTimer = null;
  let pollTimer = null;
  let polling = false;
  let suppressRemoteWrite = false;
  let initialSyncComplete = false;
  let localDirty = false;
  let lastLocalSaveAt = 0;
  let resolveInitialSync = null;
  const initialSyncPromise = new Promise(resolve => { resolveInitialSync = resolve; });

  const getUserId = () => currentSession?.user?.id || null;
  const getUserEmail = () => currentSession?.user?.email || null;
  const sanitizeState = state => root.TercerTiempoModels?.sanitizeState
    ? root.TercerTiempoModels.sanitizeState(state)
    : state;
  const fingerprint = state => JSON.stringify(sanitizeState(state));

  const markInitialSyncComplete = () => {
    initialSyncComplete = true;
    if (resolveInitialSync) {
      resolveInitialSync(true);
      resolveInitialSync = null;
    }
    root.dispatchEvent?.(new CustomEvent('tercer-tiempo-cloud-ready'));
  };

  async function ensureSession() {
    if (currentSession?.user?.id) return currentSession;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentSession = data.session || null;
    return currentSession;
  }

  async function loadRemoteState() {
    await ensureSession();
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
    await ensureSession();
    const userId = getUserId();
    if (!userId) return false;
    const sanitized = sanitizeState(state);
    const { error } = await client
      .from(tableName)
      .upsert({
        user_id: userId,
        state: sanitized,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    if (error) throw error;

    if (fingerprint(storage.load()) === fingerprint(sanitized)) {
      localDirty = false;
    }
    return true;
  }

  function scheduleRemoteSave(state) {
    lastLocalSaveAt = Date.now();
    localDirty = true;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      if (suppressRemoteWrite || !initialSyncComplete) return;
      saveRemoteState(state).catch(err => console.error('[TercerTiempoCloudSync] save failed', err));
    }, 500);
  }

  storage.save = function saveWithCloud(state) {
    const ok = localSave(state);
    if (!suppressRemoteWrite) scheduleRemoteSave(state);
    return ok;
  };

  async function applyRemoteState(remoteState, { reload = true } = {}) {
    if (!remoteState) return false;
    suppressRemoteWrite = true;
    try {
      localSave(remoteState);
      localDirty = false;
    } finally {
      suppressRemoteWrite = false;
    }
    root.dispatchEvent?.(new CustomEvent('tercer-tiempo-cloud-update', {
      detail: { source: 'remote' }
    }));
    if (reload && root.location?.reload) root.location.reload();
    return true;
  }

  async function syncOnLogin() {
    const remote = await loadRemoteState();
    const localState = storage.load();

    if (remote?.state) {
      await applyRemoteState(remote.state, { reload: false });
      markInitialSyncComplete();
      return { direction: 'download', state: remote.state, updatedAt: remote.updated_at || null };
    }

    await saveRemoteState(localState);
    markInitialSyncComplete();
    return { direction: 'upload', state: localState, updatedAt: new Date().toISOString() };
  }

  async function signUp(email, password) {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    currentSession = data.session || null;
    const sync = currentSession ? await syncOnLogin() : null;
    return { ...data, sync };
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentSession = data.session || null;
    const sync = currentSession ? await syncOnLogin() : null;
    startAutoSync();
    return { ...data, sync };
  }

  async function signOut() {
    stopAutoSync();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    currentSession = null;
    markInitialSyncComplete();
    localDirty = false;
  }

  async function getSession() {
    return ensureSession();
  }

  async function uploadLocalNow() {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    markInitialSyncComplete();
    return saveRemoteState(storage.load());
  }

  async function downloadRemoteNow() {
    const remote = await loadRemoteState();
    if (!remote?.state) return false;
    await applyRemoteState(remote.state, { reload: false });
    markInitialSyncComplete();
    return true;
  }

  async function checkRemoteForChanges() {
    if (!initialSyncComplete || polling || suppressRemoteWrite || pendingTimer || localDirty) return false;
    if (Date.now() - lastLocalSaveAt < LOCAL_GRACE_MS) return false;
    await ensureSession();
    if (!getUserId()) return false;

    polling = true;
    try {
      const remote = await loadRemoteState();
      if (!remote?.state) return false;
      const localState = storage.load();
      if (fingerprint(remote.state) === fingerprint(localState)) return false;
      await applyRemoteState(remote.state, { reload: true });
      return true;
    } catch (error) {
      console.error('[TercerTiempoCloudSync] remote check failed', error);
      return false;
    } finally {
      polling = false;
    }
  }

  async function bootstrapSync() {
    try {
      const session = await ensureSession();
      if (!session) {
        localDirty = false;
        markInitialSyncComplete();
        return;
      }

      const remote = await loadRemoteState();
      const localState = storage.load();
      if (remote?.state) {
        if (fingerprint(remote.state) !== fingerprint(localState)) {
          markInitialSyncComplete();
          await applyRemoteState(remote.state, { reload: true });
          return;
        }
        localDirty = false;
        markInitialSyncComplete();
      } else {
        markInitialSyncComplete();
        await saveRemoteState(localState);
      }

      startAutoSync();
    } catch (error) {
      markInitialSyncComplete();
      console.error('[TercerTiempoCloudSync] bootstrap failed', error);
    }
  }

  function startAutoSync() {
    stopAutoSync();
    if (!getUserId() || !initialSyncComplete) return;
    pollTimer = root.setInterval?.(() => {
      checkRemoteForChanges();
    }, POLL_INTERVAL_MS) || null;
  }

  function stopAutoSync() {
    if (pollTimer) root.clearInterval?.(pollTimer);
    pollTimer = null;
  }

  client.auth.onAuthStateChange((_event, session) => {
    currentSession = session || null;
    if (currentSession && initialSyncComplete) startAutoSync();
    else if (!currentSession) stopAutoSync();
    root.dispatchEvent?.(new CustomEvent('tercer-tiempo-auth-change', {
      detail: {
        signedIn: Boolean(currentSession),
        email: getUserEmail()
      }
    }));
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (localDirty) uploadLocalNow().catch(err => console.error('[TercerTiempoCloudSync] resume upload failed', err));
      else checkRemoteForChanges();
    });
  }

  root.addEventListener?.('focus', () => {
    if (localDirty) uploadLocalNow().catch(err => console.error('[TercerTiempoCloudSync] focus upload failed', err));
    else checkRemoteForChanges();
  });

  root.addEventListener?.('online', () => {
    const task = localDirty ? uploadLocalNow() : checkRemoteForChanges();
    Promise.resolve(task).catch(err => console.error('[TercerTiempoCloudSync] reconnect sync failed', err));
  });

  bootstrapSync();

  root.TercerTiempoCloudSync = {
    configured: true,
    status: 'ready',
    client,
    signUp,
    signIn,
    signOut,
    getSession,
    loadRemoteState,
    uploadLocalNow,
    downloadRemoteNow,
    syncOnLogin,
    checkRemoteForChanges,
    startAutoSync,
    stopAutoSync,
    getUserEmail,
    isInitialSyncComplete: () => initialSyncComplete,
    whenReady: () => initialSyncPromise
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
