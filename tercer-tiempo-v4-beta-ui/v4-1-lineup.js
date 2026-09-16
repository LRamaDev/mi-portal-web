(function installTercerTiempoV41Lineup(root) {
  if (typeof document === 'undefined') return;

  const storage = root.TercerTiempoStorage;
  const teamBuilder = root.TercerTiempoTeamBuilder;
  let scheduled = false;
  let drag = null;

  const teamList = team => document.querySelector(`.team-panel.is-${team} .team-player-list`);
  const teamRows = team => Array.from(teamList(team)?.querySelectorAll(':scope > .team-player') || []);

  const rowName = row => row?.querySelector('.team-player-copy strong')?.textContent?.trim() || 'jugador';

  const mountHandles = () => {
    document.querySelectorAll('.team-panel .team-player-list').forEach(list => {
      const panel = list.closest('.team-panel');
      const team = panel?.classList.contains('is-red') ? 'red' : 'blue';
      const rows = Array.from(list.querySelectorAll(':scope > .team-player'));

      rows.forEach((row, index) => {
        row.dataset.v41Index = String(index);
        row.dataset.v41Team = team;
        row.classList.toggle('tt-v41-goalkeeper-row', index === 0);

        let handle = row.querySelector(':scope > .tt-v41-drag-handle');
        if (!handle) {
          handle = document.createElement('button');
          handle.type = 'button';
          handle.className = 'tt-v41-drag-handle';
          handle.innerHTML = '<span aria-hidden="true">⋮⋮</span>';
          row.insertBefore(handle, row.firstChild);
        }

        const name = rowName(row);
        handle.disabled = index === 0;
        handle.setAttribute('aria-label', index === 0
          ? `${name}: el arquero se cambia desde el selector de arquero`
          : `Reordenar a ${name}. Arrastrá o usá flecha arriba y abajo del teclado.`);
        handle.title = index === 0 ? 'Arquero fijo en la primera posición' : 'Mantener y arrastrar para cambiar posición';
      });

      if (!panel?.querySelector('.tt-v41-drag-hint')) {
        const controls = panel?.querySelector('.lineup-controls');
        const hint = document.createElement('p');
        hint.className = 'tt-v41-drag-hint';
        hint.innerHTML = '<span aria-hidden="true">⋮⋮</span> Mantené y arrastrá un jugador para subirlo o bajarlo en la formación.';
        if (controls) controls.insertAdjacentElement('afterend', hint);
        else list.insertAdjacentElement('beforebegin', hint);
      }
    });
  };

  const scheduleMount = () => {
    if (scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || root.setTimeout)(() => {
      scheduled = false;
      mountHandles();
    });
  };

  const markCurrentRow = () => {
    if (!drag) return;
    document.querySelectorAll('.team-player.is-dragging').forEach(row => row.classList.remove('is-dragging'));
    const row = teamRows(drag.team)[drag.currentIndex];
    row?.classList.add('is-dragging');
  };

  const finishDrag = () => {
    document.body.classList.remove('tt-v41-lineup-dragging');
    document.querySelectorAll('.team-player.is-dragging').forEach(row => row.classList.remove('is-dragging'));
    drag = null;
  };

  const processDragStep = () => {
    if (!drag || drag.processing) return;
    if (drag.currentIndex === drag.targetIndex) {
      if (drag.released) finishDrag();
      return;
    }

    const direction = drag.targetIndex > drag.currentIndex ? 1 : -1;
    const rows = teamRows(drag.team);
    const row = rows[drag.currentIndex];
    const moveButtons = row?.querySelectorAll('.team-move.is-lineup-move');
    const button = direction < 0 ? moveButtons?.[0] : moveButtons?.[1];

    if (!button || button.disabled) {
      drag.targetIndex = drag.currentIndex;
      if (drag.released) finishDrag();
      return;
    }

    drag.processing = true;
    button.click();
    drag.currentIndex += direction;

    root.setTimeout(() => {
      if (!drag) return;
      drag.processing = false;
      mountHandles();
      markCurrentRow();
      processDragStep();
    }, 55);
  };

  const targetIndexForY = (team, clientY) => {
    const rows = teamRows(team);
    if (rows.length <= 1) return 0;
    let bestIndex = 1;
    let bestDistance = Number.POSITIVE_INFINITY;
    rows.forEach((row, index) => {
      if (index === 0) return;
      const rect = row.getBoundingClientRect();
      const distance = Math.abs(clientY - (rect.top + rect.height / 2));
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    return bestIndex;
  };

  document.addEventListener('pointerdown', event => {
    const handle = event.target.closest?.('.tt-v41-drag-handle');
    if (!handle || handle.disabled) return;
    const row = handle.closest('.team-player');
    const team = row?.dataset.v41Team;
    const index = Number(row?.dataset.v41Index);
    if (!team || !Number.isFinite(index) || index <= 0) return;

    event.preventDefault();
    drag = {
      team,
      currentIndex: index,
      targetIndex: index,
      processing: false,
      released: false,
      pointerId: event.pointerId
    };
    document.body.classList.add('tt-v41-lineup-dragging');
    row.classList.add('is-dragging');
  }, true);

  document.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    drag.targetIndex = targetIndexForY(drag.team, event.clientY);
    processDragStep();
  }, { capture: true, passive: false });

  const releasePointer = event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.released = true;
    if (!drag.processing && drag.currentIndex === drag.targetIndex) finishDrag();
  };
  document.addEventListener('pointerup', releasePointer, true);
  document.addEventListener('pointercancel', releasePointer, true);

  document.addEventListener('keydown', event => {
    const handle = event.target.closest?.('.tt-v41-drag-handle');
    if (!handle || handle.disabled || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const row = handle.closest('.team-player');
    const buttons = row?.querySelectorAll('.team-move.is-lineup-move');
    const button = event.key === 'ArrowUp' ? buttons?.[0] : buttons?.[1];
    if (!button || button.disabled) return;
    event.preventDefault();
    button.click();
    root.setTimeout(() => {
      mountHandles();
      const team = row?.dataset.v41Team;
      const currentRows = teamRows(team);
      const focusIndex = Math.max(1, Math.min(currentRows.length - 1, Number(row?.dataset.v41Index) + (event.key === 'ArrowUp' ? -1 : 1)));
      currentRows[focusIndex]?.querySelector('.tt-v41-drag-handle')?.focus();
    }, 60);
  });

  const buildShareContext = () => {
    if (!storage) return null;
    const state = storage.load();
    const group = state.groups?.find(item => item.id === state.activeGroupId) || state.groups?.[0];
    if (!group) return null;
    const session = state.draftSessions?.find(item => item.groupId === group.id);
    if (!session?.teamAssignments) return null;
    const players = (state.players || []).filter(player => player.groupId === group.id);
    const byId = new Map(players.map(player => [player.id, player]));
    const participants = (session.participantIds || []).map(id => byId.get(id)).filter(Boolean);
    return { state, group, session, players, byId, participants };
  };

  const mirrorRedLineupByRows = context => {
    const assignments = context?.session?.teamAssignments;
    const redLineup = assignments?.lineups?.red;
    const redTeamIds = assignments?.redPlayerIds || [];
    if (!redLineup || redTeamIds.length < 2 || !teamBuilder) return context;

    const orderedIds = redLineup.playerIds?.length === redTeamIds.length
      ? [...redLineup.playerIds]
      : [...redTeamIds];
    const goalkeeperId = redLineup.goalkeeperId || orderedIds[0];
    const outfield = orderedIds.filter(id => id !== goalkeeperId);
    const formation = teamBuilder.getFormation(redTeamIds.length, redLineup.formationId);
    const counts = formation?.lines || [0, 0, outfield.length];
    const mirroredOutfield = [];
    let cursor = 0;

    counts.forEach(count => {
      if (count <= 0) return;
      mirroredOutfield.push(...outfield.slice(cursor, cursor + count).reverse());
      cursor += count;
    });
    if (cursor < outfield.length) mirroredOutfield.push(...outfield.slice(cursor).reverse());

    const mirroredAssignments = {
      ...assignments,
      lineups: {
        ...assignments.lineups,
        red: {
          ...redLineup,
          playerIds: [goalkeeperId, ...mirroredOutfield]
        }
      }
    };

    return {
      ...context,
      session: {
        ...context.session,
        teamAssignments: mirroredAssignments
      }
    };
  };

  const patchFormationShare = () => {
    const shareApi = root.TercerTiempoShareV34;
    if (!shareApi || shareApi.__v41MirroredRed) return false;
    const originalHandleShare = shareApi.handleShare.bind(shareApi);
    const originalCreateFormationCanvas = shareApi.createFormationCanvas.bind(shareApi);

    shareApi.createFormationCanvas = context => originalCreateFormationCanvas(mirrorRedLineupByRows(context));
    shareApi.handleShare = kind => {
      if (kind !== 'formation') return originalHandleShare(kind);
      const context = buildShareContext();
      if (!context) {
        root.alert('Primero armá los equipos para compartir la formación.');
        return;
      }
      const canvas = shareApi.createFormationCanvas(context);
      if (!canvas) {
        root.alert('No se pudo preparar la distribución en cancha.');
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const version = root.TercerTiempoConfig?.versionLabel || 'V4.1 Beta UI';
      return shareApi.shareCanvasToWhatsApp({
        canvas,
        filename: `tercer-tiempo-cancha-${date}.png`,
        title: 'Distribución en cancha',
        text: `⚽ ${context.group.name || 'Tercer Tiempo'}\nDistribución en cancha · ${version}`
      });
    };
    shareApi.__v41MirroredRed = true;
    return true;
  };

  const observer = new MutationObserver(scheduleMount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scheduleMount);
  root.setTimeout(() => {
    patchFormationShare();
    scheduleMount();
  }, 0);
  root.setTimeout(patchFormationShare, 300);
  scheduleMount();

  root.TercerTiempoV41Lineup = {
    mount: mountHandles,
    patchFormationShare,
    mirrorRedLineupByRows
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
