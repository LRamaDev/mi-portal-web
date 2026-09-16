(function mountAutonomousThirdTime(root) {
  const storage = root.TercerTiempoStorage;
  if (!storage || typeof document === 'undefined') return;

  const RESUME_KEY = 'tt_v32_resume_third_time';
  const CARD_ID = 'tt-autonomous-third-time';

  const escapeHtml = value => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const sameIds = (left, right) => {
    const a = [...left].sort();
    const b = [...right].sort();
    return a.length === b.length && a.every((id, index) => id === b[index]);
  };

  const getContext = () => {
    const state = storage.load();
    const group = state.groups.find(item => item.id === state.activeGroupId) || state.groups[0];
    if (!group) return null;
    const session = state.draftSessions.find(item => item.groupId === group.id);
    if (!session) return null;
    const selected = new Set(session.participantIds || []);
    const players = state.players
      .filter(player => player.groupId === group.id && (player.active || selected.has(player.id)))
      .sort((a, b) => String(a.nickname || a.name).localeCompare(String(b.nickname || b.name), 'es-AR'));
    return { state, group, session, players };
  };

  const findThirdTimeNavButton = () => Array.from(document.querySelectorAll('.nav-button'))
    .find(button => button.textContent.trim().toLocaleLowerCase('es-AR').includes('tercer tiempo'));

  const resumeThirdTimeIfNeeded = () => {
    if (root.sessionStorage?.getItem(RESUME_KEY) !== '1') return false;
    const button = findThirdTimeNavButton();
    if (!button) return false;
    root.sessionStorage.removeItem(RESUME_KEY);
    button.click();
    return true;
  };

  const isThirdTimeView = () => {
    const heading = document.querySelector('.main-content .view-header h1');
    return heading?.textContent.trim().toLocaleLowerCase('es-AR') === 'tercer tiempo';
  };

  const saveSelection = async (selectedIds, statusNode, saveButton) => {
    const context = getContext();
    if (!context) return;
    const { state, group, session, players } = context;
    const validIds = new Set(players.map(player => player.id));
    const nextIds = Array.from(new Set(selectedIds)).filter(id => validIds.has(id));
    const currentIds = session.participantIds || [];
    if (sameIds(nextIds, currentIds)) {
      if (statusNode) statusNode.textContent = 'La lista ya está actualizada.';
      return;
    }

    const removed = currentIds.filter(id => !nextIds.includes(id));
    const expensesAffected = (session.expenses || []).some(expense =>
      removed.includes(expense.paidById) || (expense.consumerIds || []).some(id => removed.includes(id))
    );
    if (expensesAffected) {
      const confirmed = root.confirm('Al quitar participantes se ajustarán los gastos donde aparezcan. ¿Continuar?');
      if (!confirmed) return;
    }

    if (session.teamAssignments) {
      const confirmed = root.confirm('Esta lista también está vinculada al partido actual. Al cambiar participantes habrá que volver a armar los equipos. ¿Continuar?');
      if (!confirmed) return;
    }

    const nextExpenses = (session.expenses || [])
      .filter(expense => !removed.includes(expense.paidById))
      .map(expense => ({
        ...expense,
        consumerIds: (expense.consumerIds || []).filter(id => nextIds.includes(id))
      }))
      .filter(expense => expense.consumerIds.length > 0);

    const nextState = {
      ...state,
      draftSessions: state.draftSessions.map(item => item.groupId === group.id
        ? {
          ...item,
          participantIds: nextIds,
          teamAssignments: sameIds(nextIds, currentIds) ? item.teamAssignments : null,
          expenses: nextExpenses
        }
        : item)
    };

    saveButton.disabled = true;
    if (statusNode) statusNode.textContent = 'Guardando participantes…';
    storage.save(nextState);

    try {
      if (root.TercerTiempoCloudSync?.configured) {
        const sessionInfo = await root.TercerTiempoCloudSync.getSession?.();
        if (sessionInfo?.user?.id) {
          await root.TercerTiempoCloudSync.uploadLocalNow();
        }
      }
      root.sessionStorage?.setItem(RESUME_KEY, '1');
      root.location.reload();
    } catch (error) {
      console.error('[TercerTiempoAutonomousThirdTime] sync failed', error);
      saveButton.disabled = false;
      if (statusNode) statusNode.textContent = 'Quedó guardado en este dispositivo, pero no se pudo confirmar la copia en la nube. Reintentá con conexión antes de recargar.';
    }
  };

  const renderCard = () => {
    if (!isThirdTimeView()) {
      document.getElementById(CARD_ID)?.remove();
      return;
    }
    if (document.getElementById(CARD_ID)) return;

    const context = getContext();
    const dashboard = document.querySelector('.main-content .dashboard-grid');
    if (!context || !dashboard) return;

    const { session, players } = context;
    const initialIds = (session.participantIds || []).filter(id => players.some(player => player.id === id));
    const selected = new Set(initialIds);
    const card = document.createElement('section');
    card.id = CARD_ID;
    card.className = 'card tt-third-time-participants';

    const playerButtons = players.length > 0
      ? players.map(player => {
        const checked = selected.has(player.id);
        return `<button class="tt-third-player ${checked ? 'is-selected' : ''}" type="button" data-player-id="${escapeHtml(player.id)}" aria-pressed="${checked}">
          <span class="tt-third-player-avatar">${escapeHtml((player.nickname || player.name).charAt(0).toUpperCase())}</span>
          <span>${escapeHtml(player.nickname || player.name)}</span>
          <span class="tt-third-player-check" aria-hidden="true">${checked ? '✓' : '+'}</span>
        </button>`;
      }).join('')
      : '<div class="empty-state">Primero sumá jugadores al grupo para poder repartir los gastos.</div>';

    card.innerHTML = `
      <div class="card-heading tt-third-time-heading">
        <div>
          <span class="eyebrow">También funciona por separado</span>
          <h2>¿Quiénes participan del tercer tiempo?</h2>
          <p>Si ya elegiste jugadores en Partido, aparecen marcados. También podés entrar directo acá, elegir participantes y hacer las cuentas sin armar equipos ni registrar un resultado.</p>
        </div>
        <span class="count-badge tt-third-count">${selected.size}</span>
      </div>
      <div class="tt-third-mode-note"><strong>Una sola lista, dos entradas.</strong><span>Podés definirla desde Partido o directamente desde Tercer tiempo.</span></div>
      <div class="tt-third-player-grid">${playerButtons}</div>
      ${players.length > 0 ? `<div class="tt-third-participant-actions">
        <div class="tt-third-shortcuts">
          <button class="text-button" type="button" data-action="all">Seleccionar activos</button>
          <button class="text-button" type="button" data-action="none">Limpiar</button>
        </div>
        <button class="primary-button" type="button" data-action="save">Guardar participantes</button>
      </div>
      <p class="tt-third-save-status" role="status">${initialIds.length > 0 ? 'Estos participantes también quedan vinculados al partido actual.' : 'Elegí participantes para empezar a cargar gastos.'}</p>` : ''}
    `;

    dashboard.parentNode.insertBefore(card, dashboard);

    const count = card.querySelector('.tt-third-count');
    const status = card.querySelector('.tt-third-save-status');
    const saveButton = card.querySelector('[data-action="save"]');
    const buttons = Array.from(card.querySelectorAll('.tt-third-player'));

    const refreshButtons = () => {
      buttons.forEach(button => {
        const isSelected = selected.has(button.dataset.playerId);
        button.classList.toggle('is-selected', isSelected);
        button.setAttribute('aria-pressed', String(isSelected));
        const check = button.querySelector('.tt-third-player-check');
        if (check) check.textContent = isSelected ? '✓' : '+';
      });
      if (count) count.textContent = String(selected.size);
      if (status) status.textContent = sameIds([...selected], initialIds)
        ? (selected.size ? 'Estos participantes también quedan vinculados al partido actual.' : 'Elegí participantes para empezar a cargar gastos.')
        : 'Hay cambios sin guardar.';
    };

    buttons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.playerId;
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      refreshButtons();
    }));

    card.querySelector('[data-action="all"]')?.addEventListener('click', () => {
      selected.clear();
      players.filter(player => player.active).forEach(player => selected.add(player.id));
      refreshButtons();
    });

    card.querySelector('[data-action="none"]')?.addEventListener('click', () => {
      selected.clear();
      refreshButtons();
    });

    saveButton?.addEventListener('click', () => saveSelection([...selected], status, saveButton));
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    root.requestAnimationFrame?.(() => {
      scheduled = false;
      if (!resumeThirdTimeIfNeeded()) renderCard();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', schedule);
  schedule();
})(typeof globalThis !== 'undefined' ? globalThis : window);
