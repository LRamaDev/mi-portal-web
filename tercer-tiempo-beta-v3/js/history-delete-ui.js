(function initHistoryDeleteUI(root) {
  const storage = root.TercerTiempoStorage;
  const historyApi = root.TercerTiempoMatchHistory;
  if (!storage || !historyApi) return;

  const getVisibleMatches = () => {
    const state = storage.load();
    const activeGroupId = state.activeGroupId;
    const matches = historyApi.sortMatches(
      (state.matches || []).filter(match => match.groupId === activeGroupId)
    );
    return { state, matches };
  };

  const deleteMatch = async (matchId) => {
    const { state } = getVisibleMatches();
    const match = (state.matches || []).find(item => item.id === matchId);
    if (!match) return;

    const label = `${match.teamNames?.blue || 'Azul'} ${match.result?.blueScore ?? 0} - ${match.result?.redScore ?? 0} ${match.teamNames?.red || 'Rojo'}`;
    const confirmed = root.confirm(`¿Eliminar este resultado?\n\n${label}\n\nEsta acción quitará el partido del historial y recalculará las estadísticas.`);
    if (!confirmed) return;

    const nextState = {
      ...state,
      matches: (state.matches || []).filter(item => item.id !== matchId),
      draftSessions: (state.draftSessions || []).map(session =>
        session.archivedMatchId === matchId
          ? { ...session, archivedMatchId: null }
          : session
      )
    };

    storage.save(nextState);

    try {
      if (root.TercerTiempoCloudSync?.configured && root.TercerTiempoCloudSync.uploadLocalNow) {
        await root.TercerTiempoCloudSync.uploadLocalNow();
      }
    } catch (error) {
      console.error('[TercerTiempoHistoryDelete] cloud sync failed', error);
      root.alert('El resultado se eliminó de este dispositivo, pero no se pudo confirmar la sincronización con la nube. Volvé a intentar sincronizar cuando tengas conexión.');
    }

    root.location.reload();
  };

  const enhanceHistoryCards = () => {
    const cards = Array.from(document.querySelectorAll('.history-card'));
    if (!cards.length) return;

    const { matches } = getVisibleMatches();
    cards.forEach((card, index) => {
      const match = matches[index];
      if (!match) return;

      const actions = card.querySelector('.history-card-actions');
      if (!actions) return;

      let button = actions.querySelector('.tt-history-delete');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'danger-button tt-history-delete';
        button.textContent = 'Eliminar resultado';
        button.addEventListener('click', () => deleteMatch(button.dataset.matchId));
        actions.appendChild(button);
      }
      button.dataset.matchId = match.id;
    });
  };

  let scheduled = false;
  const scheduleEnhance = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhanceHistoryCards();
    });
  };

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scheduleEnhance);
  scheduleEnhance();
})(typeof globalThis !== 'undefined' ? globalThis : window);
