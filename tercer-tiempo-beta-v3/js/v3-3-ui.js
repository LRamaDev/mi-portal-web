(function installTercerTiempoV33(root) {
  const storage = root.TercerTiempoStorage;
  const teamBuilder = root.TercerTiempoTeamBuilder;
  const sync = root.TercerTiempoCloudSync;
  const config = root.TercerTiempoConfig || {};
  if (typeof document === 'undefined' || !storage) return;

  const normalize = value => String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR');

  const displayName = player => player?.nickname || player?.name || 'Jugador';

  let sorting = false;
  let scheduled = false;
  let syncRefreshToken = 0;

  const sortContainer = (container, selector, getLabel) => {
    if (!container) return;
    const nodes = Array.from(container.querySelectorAll(`:scope > ${selector}`));
    if (nodes.length < 2) return;
    const sorted = [...nodes].sort((left, right) => {
      const a = normalize(getLabel(left));
      const b = normalize(getLabel(right));
      return a.localeCompare(b, 'es-AR', { sensitivity: 'base', numeric: true });
    });
    if (nodes.every((node, index) => node === sorted[index])) return;
    sorting = true;
    sorted.forEach(node => container.appendChild(node));
    sorting = false;
  };

  const sortPlayerLists = () => {
    document.querySelectorAll('.participant-picker').forEach(container => {
      sortContainer(container, '.participant-button', node => node.querySelector('span')?.textContent || node.textContent);
    });
    document.querySelectorAll('.player-list').forEach(container => {
      sortContainer(container, '.player-card', node => {
        const strong = node.querySelector('.player-copy strong');
        return (strong?.textContent || node.textContent).split('·')[0].trim();
      });
    });
    document.querySelectorAll('.tt-third-player-grid').forEach(container => {
      sortContainer(container, '.tt-third-player', node => node.querySelector('span:nth-child(2)')?.textContent || node.textContent);
    });
  };

  const getFormationContext = () => {
    const state = storage.load();
    const group = state.groups.find(item => item.id === state.activeGroupId) || state.groups[0];
    if (!group) return null;
    const session = state.draftSessions.find(item => item.groupId === group.id);
    if (!session?.teamAssignments) return null;
    const players = state.players.filter(player => player.groupId === group.id);
    const byId = new Map(players.map(player => [player.id, player]));
    return { state, group, session, byId };
  };

  const orderedTeamPlayers = (context, team) => {
    const assignments = context.session.teamAssignments;
    const teamIds = assignments?.[`${team}PlayerIds`] || [];
    const lineup = assignments?.lineups?.[team];
    const ids = lineup?.playerIds?.length === teamIds.length ? lineup.playerIds : teamIds;
    return ids.map(id => context.byId.get(id)).filter(Boolean);
  };

  const buildWhatsAppText = () => {
    const context = getFormationContext();
    if (!context) return null;
    const { group, session } = context;

    const teamBlock = team => {
      const players = orderedTeamPlayers(context, team);
      const lineup = session.teamAssignments?.lineups?.[team];
      const formation = teamBuilder?.getFormation?.(players.length, lineup?.formationId);
      const label = session.teamNames?.[team] || (team === 'blue' ? 'Azul' : 'Rojo');
      const icon = team === 'blue' ? '🔵' : '🔴';
      const system = formation?.label ? ` · ${formation.label}` : '';
      const names = players.map(player => `• ${displayName(player)}`).join('\n');
      return `${icon} *${label}*${system}\n${names}`;
    };

    const version = config.versionLabel ? ` · ${config.versionLabel}` : '';
    return [
      `⚽ *${group.name || 'Tercer Tiempo'}*`,
      '',
      teamBlock('blue'),
      '',
      teamBlock('red'),
      '',
      `_Armado con Tercer Tiempo${version}_`
    ].join('\n');
  };

  const shareFormationOnWhatsApp = () => {
    const text = buildWhatsAppText();
    if (!text) {
      root.alert('Primero armá los equipos para compartir la formación por WhatsApp.');
      return;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const popup = root.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) root.location.href = url;
  };

  const mountWhatsAppButton = () => {
    const container = document.querySelector('.team-builder-card .share-card-actions');
    if (!container || container.querySelector('[data-v33-whatsapp]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-button tt-whatsapp-formation';
    button.dataset.v33Whatsapp = '1';
    button.innerHTML = '<span aria-hidden="true">💬</span> WhatsApp';
    button.title = 'Compartir la formación directamente por WhatsApp';
    button.addEventListener('click', shareFormationOnWhatsApp);
    container.appendChild(button);
  };

  const syncBadgeId = 'tt-sync-badge';

  const setSyncBadge = (mode, label, title) => {
    const badge = document.getElementById(syncBadgeId);
    if (!badge) return;
    badge.className = `tt-sync-badge is-${mode}`;
    badge.textContent = label;
    badge.title = title;
    badge.setAttribute('aria-label', title);
  };

  const mountSyncBadge = () => {
    if (document.getElementById(syncBadgeId)) return true;
    const brand = document.querySelector('.topbar .brand');
    if (!brand) return false;
    const badge = document.createElement('button');
    badge.id = syncBadgeId;
    badge.type = 'button';
    badge.className = 'tt-sync-badge is-checking';
    badge.textContent = 'Nube…';
    badge.title = 'Comprobando sincronización';
    badge.addEventListener('click', () => {
      document.querySelector('#tt-cloud-account .tt-cloud-trigger')?.click();
    });
    brand.appendChild(badge);
    return true;
  };

  const refreshSyncBadge = async () => {
    const token = ++syncRefreshToken;
    if (!mountSyncBadge()) return;
    if (!navigator.onLine) {
      setSyncBadge('offline', 'Sin conexión', 'Sin conexión. Los cambios quedan guardados en este dispositivo y se sincronizarán al volver Internet.');
      return;
    }
    if (!sync?.configured || typeof sync.getSession !== 'function') {
      setSyncBadge('local', 'Solo dispositivo', 'La sincronización en la nube no está configurada.');
      return;
    }
    setSyncBadge('checking', 'Nube…', 'Comprobando la cuenta de sincronización');
    try {
      const session = await sync.getSession();
      if (token !== syncRefreshToken) return;
      if (session?.user?.id) {
        setSyncBadge('online', 'Nube activa', 'Sincronización automática activa. Usá la misma cuenta en PC y celular para ver los mismos datos.');
      } else {
        setSyncBadge('local', 'Solo dispositivo', 'Iniciá sesión para sincronizar grupos, jugadores, partidos y gastos entre PC y celular.');
      }
    } catch (error) {
      if (token !== syncRefreshToken) return;
      setSyncBadge('error', 'Revisar nube', 'No se pudo comprobar la sincronización. Tocá acá para revisar la cuenta.');
    }
  };

  const originalSave = storage.save.bind(storage);
  storage.save = function saveWithVisibleSync(state) {
    const result = originalSave(state);
    if (document.getElementById(syncBadgeId) && navigator.onLine) {
      const badge = document.getElementById(syncBadgeId);
      if (badge?.classList.contains('is-online')) {
        setSyncBadge('saving', 'Guardando…', 'Guardando cambios en este dispositivo y preparando la copia en la nube.');
        root.setTimeout?.(refreshSyncBadge, 1200);
      }
    }
    return result;
  };

  const applyUiEnhancements = () => {
    if (sorting) return;
    sortPlayerLists();
    mountWhatsAppButton();
    mountSyncBadge();
  };

  const schedule = () => {
    if (sorting || scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || root.setTimeout)(() => {
      scheduled = false;
      applyUiEnhancements();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  root.addEventListener?.('tercer-tiempo-auth-change', refreshSyncBadge);
  root.addEventListener?.('tercer-tiempo-cloud-update', () => {
    setSyncBadge('online', 'Nube actualizada', 'Se recibieron datos actualizados desde la nube.');
    root.setTimeout?.(refreshSyncBadge, 1800);
  });
  root.addEventListener?.('online', refreshSyncBadge);
  root.addEventListener?.('offline', refreshSyncBadge);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshSyncBadge();
  });

  schedule();
  refreshSyncBadge();
  root.setInterval?.(refreshSyncBadge, 15000);

  root.TercerTiempoV33 = {
    sortPlayerLists,
    buildWhatsAppText,
    shareFormationOnWhatsApp,
    refreshSyncBadge
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
