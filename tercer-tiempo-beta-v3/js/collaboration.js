(function initTercerTiempoCollaboration(root) {
  const sync = root.TercerTiempoCloudSync;
  const storage = root.TercerTiempoStorage;
  const models = root.TercerTiempoModels;
  if (!sync?.configured || !sync.client || !storage || !models) {
    root.TercerTiempoCollaboration = { configured: false };
    return;
  }

  const client = sync.client;
  const localSave = storage.save.bind(storage);
  const POLL_MS = 7000;
  let ready = false;
  let currentSession = null;
  let currentContext = null;
  let saveTimer = null;
  let pollTimer = null;
  let checking = false;
  let lastSharedFingerprint = '';
  let lastActiveGroupId = null;

  const roleLabels = Object.freeze({
    owner: 'Propietario',
    admin: 'Administrador',
    organizer: 'Organizador',
    match_collaborator: 'Colaborador de partido',
    third_time: 'Responsable de tercer tiempo',
    player: 'Jugador'
  });

  const roleOptions = Object.freeze([
    ['admin', 'Administrador'],
    ['organizer', 'Organizador'],
    ['match_collaborator', 'Colaborador de partido'],
    ['third_time', 'Responsable de tercer tiempo'],
    ['player', 'Jugador']
  ]);

  const responsibilityLabels = Object.freeze({
    organizer: 'Armar equipos',
    result: 'Resultado, goleadores, figura y crónica',
    third_time: 'Tercer tiempo'
  });

  const getSession = async () => {
    currentSession = await sync.getSession();
    return currentSession;
  };

  const getUserId = () => currentSession?.user?.id || null;
  const getUserEmail = () => currentSession?.user?.email || '';

  const getLocalState = () => storage.load();
  const getActiveGroup = (state = getLocalState()) => {
    const groups = Array.isArray(state.groups) ? state.groups : [];
    return groups.find(group => group.id === state.activeGroupId) || groups[0] || null;
  };

  const extractGroupBundle = (state, groupId) => {
    const group = (state.groups || []).find(item => item.id === groupId);
    if (!group) return null;
    return {
      schemaVersion: Number(state.schemaVersion) || models.SCHEMA_VERSION,
      group,
      players: (state.players || []).filter(player => player.groupId === groupId),
      draftSession: (state.draftSessions || []).find(session => session.groupId === groupId)
        || models.createDraftSession(groupId),
      matches: (state.matches || []).filter(match => match.groupId === groupId)
    };
  };

  const mergeGroupBundle = (state, bundle) => {
    if (!bundle?.group?.id) return state;
    const groupId = bundle.group.id;
    const candidate = {
      ...state,
      activeGroupId: groupId,
      groups: [...(state.groups || []).filter(group => group.id !== groupId), bundle.group],
      players: [
        ...(state.players || []).filter(player => player.groupId !== groupId),
        ...(Array.isArray(bundle.players) ? bundle.players : [])
      ],
      draftSessions: [
        ...(state.draftSessions || []).filter(session => session.groupId !== groupId),
        bundle.draftSession || models.createDraftSession(groupId)
      ],
      matches: [
        ...(state.matches || []).filter(match => match.groupId !== groupId),
        ...(Array.isArray(bundle.matches) ? bundle.matches : [])
      ]
    };
    return models.sanitizeState(candidate);
  };

  const bundleFingerprint = bundle => JSON.stringify(bundle || null);

  async function ensureGroupShared(group, state) {
    const bundle = extractGroupBundle(state, group.id);
    const { error } = await client.rpc('tt_ensure_shared_group', {
      p_group_id: group.id,
      p_name: group.name || 'Mi grupo',
      p_state: bundle
    });
    if (error) throw error;
    return true;
  }

  async function ensureLocalGroupsShared() {
    const state = getLocalState();
    for (const group of state.groups || []) {
      try {
        await ensureGroupShared(group, state);
      } catch (error) {
        console.warn('[TercerTiempoCollaboration] group bootstrap skipped', group.id, error?.message || error);
      }
    }
  }

  async function loadMembers(groupId) {
    const { data, error } = await client
      .from('tt_group_members')
      .select('group_id,user_id,email,display_name,role,created_at,updated_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function loadResponsibilities(groupId) {
    const { data, error } = await client
      .from('tt_group_responsibilities')
      .select('group_id,responsibility,user_id,assigned_by,updated_at')
      .eq('group_id', groupId);
    if (error) throw error;
    return data || [];
  }

  async function loadSharedGroup(groupId) {
    const { data, error } = await client
      .from('tt_shared_groups')
      .select('group_id,owner_user_id,name,state,updated_at')
      .eq('group_id', groupId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  const calculateCapabilities = (role, responsibilities, userId) => {
    const assigned = new Set(
      (responsibilities || [])
        .filter(item => item.user_id === userId)
        .map(item => item.responsibility)
    );
    const manage = role === 'owner' || role === 'admin';
    const organize = manage || role === 'organizer' || assigned.has('organizer');
    const result = manage || role === 'match_collaborator' || assigned.has('result');
    const thirdTime = manage || role === 'third_time' || assigned.has('third_time');
    return {
      manage,
      organize,
      result,
      thirdTime,
      editAny: manage || organize || result || thirdTime,
      transferOwnership: role === 'owner',
      deleteGroup: role === 'owner'
    };
  };

  async function refreshContext(groupId = null) {
    await getSession();
    const state = getLocalState();
    const activeGroup = groupId
      ? (state.groups || []).find(group => group.id === groupId)
      : getActiveGroup(state);
    if (!activeGroup || !getUserId()) {
      currentContext = null;
      return null;
    }

    const [members, responsibilities, sharedGroup] = await Promise.all([
      loadMembers(activeGroup.id),
      loadResponsibilities(activeGroup.id),
      loadSharedGroup(activeGroup.id)
    ]);
    const me = members.find(member => member.user_id === getUserId()) || null;
    const role = me?.role || 'player';
    const capabilities = calculateCapabilities(role, responsibilities, getUserId());
    currentContext = {
      groupId: activeGroup.id,
      groupName: sharedGroup?.name || activeGroup.name,
      ownerUserId: sharedGroup?.owner_user_id || activeGroup.ownerUserId || null,
      me,
      role,
      roleLabel: roleLabels[role] || role,
      members,
      responsibilities,
      capabilities,
      updatedAt: sharedGroup?.updated_at || null
    };
    lastActiveGroupId = activeGroup.id;
    root.dispatchEvent?.(new CustomEvent('tercer-tiempo-collaboration-change', { detail: currentContext }));
    return currentContext;
  }

  async function saveActiveSharedGroup(state = getLocalState()) {
    if (!ready || !getUserId()) return false;
    const activeGroup = getActiveGroup(state);
    if (!activeGroup) return false;
    if (!currentContext || currentContext.groupId !== activeGroup.id) {
      try { await refreshContext(activeGroup.id); } catch (error) { return false; }
    }
    if (!currentContext?.capabilities?.editAny) return false;
    const bundle = extractGroupBundle(state, activeGroup.id);
    const fp = bundleFingerprint(bundle);
    if (fp === lastSharedFingerprint) return true;
    const { data, error } = await client.rpc('tt_save_shared_group_state', {
      p_group_id: activeGroup.id,
      p_name: activeGroup.name || 'Mi grupo',
      p_state: bundle
    });
    if (error) throw error;
    lastSharedFingerprint = fp;
    if (currentContext) currentContext.updatedAt = data || currentContext.updatedAt;
    return true;
  }

  function scheduleSharedSave(state) {
    clearTimeout(saveTimer);
    saveTimer = root.setTimeout?.(() => {
      saveTimer = null;
      saveActiveSharedGroup(state).catch(error => {
        console.error('[TercerTiempoCollaboration] shared save failed', error);
      });
    }, 650);
  }

  storage.save = function saveWithCollaboration(state) {
    const ok = localSave(state);
    if (!ready) return ok;
    const activeGroupId = state?.activeGroupId || null;
    if (activeGroupId && activeGroupId !== lastActiveGroupId) {
      refreshContext(activeGroupId)
        .then(() => scheduleSharedSave(state))
        .catch(error => console.error('[TercerTiempoCollaboration] context switch failed', error));
    } else {
      scheduleSharedSave(state);
    }
    return ok;
  };

  async function applySharedGroup(shared, { reload = true } = {}) {
    if (!shared?.state?.group?.id) return false;
    const localState = getLocalState();
    const merged = mergeGroupBundle(localState, shared.state);
    lastSharedFingerprint = bundleFingerprint(shared.state);
    localSave(merged);
    if (reload && root.location?.reload) root.location.reload();
    return true;
  }

  async function checkSharedForChanges() {
    if (!ready || checking || saveTimer || !getUserId()) return false;
    const activeGroup = getActiveGroup();
    if (!activeGroup) return false;
    checking = true;
    try {
      if (!currentContext || currentContext.groupId !== activeGroup.id) {
        await refreshContext(activeGroup.id);
      }
      const shared = await loadSharedGroup(activeGroup.id);
      if (!shared?.state) return false;
      const localBundle = extractGroupBundle(getLocalState(), activeGroup.id);
      const remoteFp = bundleFingerprint(shared.state);
      const localFp = bundleFingerprint(localBundle);
      lastSharedFingerprint = remoteFp;
      if (remoteFp === localFp) return false;
      await applySharedGroup(shared, { reload: true });
      return true;
    } catch (error) {
      console.error('[TercerTiempoCollaboration] shared check failed', error);
      return false;
    } finally {
      checking = false;
    }
  }

  function startPolling() {
    if (pollTimer) root.clearInterval?.(pollTimer);
    pollTimer = root.setInterval?.(() => checkSharedForChanges(), POLL_MS) || null;
  }

  async function createInvite(role = 'player') {
    const group = getActiveGroup();
    if (!group) throw new Error('No hay un grupo activo.');
    if (!currentContext?.capabilities?.manage) throw new Error('No tenés permiso para invitar miembros.');
    const { data, error } = await client.rpc('tt_create_group_invite', {
      p_group_id: group.id,
      p_role: role
    });
    if (error) throw error;
    const base = `${root.location.origin}${root.location.pathname}`;
    return `${base}?invite=${encodeURIComponent(data)}`;
  }

  async function acceptInvite(token) {
    await getSession();
    if (!getUserId()) throw new Error('Iniciá sesión para aceptar la invitación.');
    const { data: groupId, error } = await client.rpc('tt_accept_group_invite', { p_token: token });
    if (error) throw error;
    const shared = await loadSharedGroup(groupId);
    if (!shared?.state) throw new Error('No se pudo cargar el grupo compartido.');
    await applySharedGroup(shared, { reload: false });
    await refreshContext(groupId);
    const cleanUrl = `${root.location.origin}${root.location.pathname}`;
    root.history?.replaceState?.({}, '', cleanUrl);
    root.location?.reload?.();
    return groupId;
  }

  async function setMemberRole(userId, role) {
    const group = getActiveGroup();
    if (!group) throw new Error('No hay un grupo activo.');
    const { error } = await client.rpc('tt_set_member_role', {
      p_group_id: group.id,
      p_user_id: userId,
      p_role: role
    });
    if (error) throw error;
    return refreshContext(group.id);
  }

  async function removeMember(userId) {
    const group = getActiveGroup();
    if (!group) throw new Error('No hay un grupo activo.');
    const { error } = await client.rpc('tt_remove_group_member', {
      p_group_id: group.id,
      p_user_id: userId
    });
    if (error) throw error;
    return refreshContext(group.id);
  }

  async function setResponsibility(responsibility, userId) {
    const group = getActiveGroup();
    if (!group) throw new Error('No hay un grupo activo.');
    const { error } = await client.rpc('tt_set_group_responsibility', {
      p_group_id: group.id,
      p_responsibility: responsibility,
      p_user_id: userId || null
    });
    if (error) throw error;
    return refreshContext(group.id);
  }

  async function transferOwnership(userId) {
    const group = getActiveGroup();
    if (!group) throw new Error('No hay un grupo activo.');
    const { error } = await client.rpc('tt_transfer_group_ownership', {
      p_group_id: group.id,
      p_new_owner: userId
    });
    if (error) throw error;
    return refreshContext(group.id);
  }

  const can = capability => Boolean(currentContext?.capabilities?.[capability]);
  const getContext = () => currentContext;

  async function processInviteFromUrl() {
    const params = new URLSearchParams(root.location?.search || '');
    const token = params.get('invite');
    if (!token) return false;
    if (!getUserId()) {
      root.dispatchEvent?.(new CustomEvent('tercer-tiempo-invite-pending', { detail: { token } }));
      return false;
    }
    try {
      await acceptInvite(token);
      return true;
    } catch (error) {
      console.error('[TercerTiempoCollaboration] invite failed', error);
      root.dispatchEvent?.(new CustomEvent('tercer-tiempo-invite-error', {
        detail: { message: error?.message || 'No se pudo aceptar la invitación.' }
      }));
      return false;
    }
  }

  async function bootstrap() {
    try {
      await getSession();
      if (!getUserId()) {
        ready = true;
        await processInviteFromUrl();
        return;
      }
      await ensureLocalGroupsShared();
      const invited = await processInviteFromUrl();
      if (invited) return;
      const activeGroup = getActiveGroup();
      if (activeGroup) {
        await refreshContext(activeGroup.id);
        const shared = await loadSharedGroup(activeGroup.id);
        if (shared?.state) {
          const localBundle = extractGroupBundle(getLocalState(), activeGroup.id);
          lastSharedFingerprint = bundleFingerprint(shared.state);
          if (lastSharedFingerprint !== bundleFingerprint(localBundle)) {
            await applySharedGroup(shared, { reload: true });
            return;
          }
        }
      }
      ready = true;
      startPolling();
      root.dispatchEvent?.(new CustomEvent('tercer-tiempo-collaboration-ready', { detail: currentContext }));
    } catch (error) {
      ready = true;
      console.error('[TercerTiempoCollaboration] bootstrap failed', error);
      root.dispatchEvent?.(new CustomEvent('tercer-tiempo-collaboration-error', {
        detail: { message: error?.message || 'No se pudo iniciar la colaboración.' }
      }));
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkSharedForChanges();
    });
  }
  root.addEventListener?.('focus', () => checkSharedForChanges());
  root.addEventListener?.('online', () => checkSharedForChanges());
  root.addEventListener?.('tercer-tiempo-auth-change', event => {
    if (event.detail?.signedIn) bootstrap();
    else {
      currentSession = null;
      currentContext = null;
      ready = true;
      if (pollTimer) root.clearInterval?.(pollTimer);
    }
  });

  root.TercerTiempoCollaboration = {
    configured: true,
    roleLabels,
    roleOptions,
    responsibilityLabels,
    getContext,
    refreshContext,
    loadMembers,
    loadResponsibilities,
    loadSharedGroup,
    createInvite,
    acceptInvite,
    setMemberRole,
    removeMember,
    setResponsibility,
    transferOwnership,
    saveActiveSharedGroup,
    checkSharedForChanges,
    can,
    getUserId,
    getUserEmail
  };

  bootstrap();
})(typeof globalThis !== 'undefined' ? globalThis : window);
