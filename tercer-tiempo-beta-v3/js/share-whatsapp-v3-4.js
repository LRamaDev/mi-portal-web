(function installTercerTiempoShareV34(root) {
  const storage = root.TercerTiempoStorage;
  const teamBuilder = root.TercerTiempoTeamBuilder;
  const config = root.TercerTiempoConfig || {};
  if (!storage || typeof document === 'undefined') return;

  const VERSION_LABEL = config.versionLabel || 'Beta v3.4.0';
  const BLUE = '#1f64b5';
  const BLUE_LIGHT = '#4f91de';
  const RED = '#c51f38';
  const RED_LIGHT = '#ea5267';
  const GREEN = '#0b6b4a';
  const DARK = '#173f34';
  const MUTED = '#65736d';
  const TRIM = '#20252b';

  const displayName = player => player?.nickname || player?.name || 'Jugador';
  const alpha = players => [...players].sort((a, b) =>
    displayName(a).localeCompare(displayName(b), 'es-AR', { sensitivity: 'base', numeric: true })
  );

  const getContext = () => {
    const state = storage.load();
    const group = state.groups.find(item => item.id === state.activeGroupId) || state.groups[0];
    if (!group) return null;
    const session = state.draftSessions.find(item => item.groupId === group.id);
    if (!session) return null;
    const players = state.players.filter(player => player.groupId === group.id);
    const byId = new Map(players.map(player => [player.id, player]));
    const participantIds = Array.isArray(session.participantIds) ? session.participantIds : [];
    const participants = participantIds.map(id => byId.get(id)).filter(Boolean);
    return { state, group, session, players, byId, participants };
  };

  const orderedTeamPlayers = (context, team) => {
    const assignments = context.session.teamAssignments;
    if (!assignments) return [];
    const teamIds = assignments[`${team}PlayerIds`] || [];
    const lineup = assignments.lineups?.[team];
    const orderedIds = lineup?.playerIds?.length === teamIds.length ? lineup.playerIds : teamIds;
    return orderedIds.map(id => context.byId.get(id)).filter(Boolean);
  };

  const roundedRect = (ctx, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  };

  const drawHeader = (ctx, width, title, subtitle) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 210);
    gradient.addColorStop(0, '#073f2e');
    gradient.addColorStop(1, '#0d7654');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, 210);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 54px system-ui, -apple-system, sans-serif';
    ctx.fillText('Tercer Tiempo', 72, 82);
    ctx.font = '800 33px system-ui, -apple-system, sans-serif';
    ctx.fillText(title, 72, 132);
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '700 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(subtitle, 72, 173);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#dff275';
    ctx.font = '900 19px system-ui, -apple-system, sans-serif';
    ctx.fillText(VERSION_LABEL, width - 72, 74);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(new Date().toLocaleDateString('es-AR'), width - 72, 108);
  };

  const drawFooter = (ctx, width, height, text) => {
    ctx.fillStyle = '#f0f4f1';
    ctx.fillRect(0, height - 92, width, 92);
    ctx.textAlign = 'center';
    ctx.fillStyle = MUTED;
    ctx.font = '700 18px system-ui, -apple-system, sans-serif';
    ctx.fillText(text, width / 2, height - 46);
  };

  const jerseyPath = ctx => {
    ctx.beginPath();
    ctx.moveTo(-31, -43);
    ctx.lineTo(-58, -35);
    ctx.lineTo(-91, 19);
    ctx.lineTo(-68, 34);
    ctx.lineTo(-50, 8);
    ctx.lineTo(-45, 83);
    ctx.lineTo(45, 83);
    ctx.lineTo(50, 8);
    ctx.lineTo(68, 34);
    ctx.lineTo(91, 19);
    ctx.lineTo(58, -35);
    ctx.lineTo(31, -43);
    ctx.quadraticCurveTo(19, -35, 0, -35);
    ctx.quadraticCurveTo(-19, -35, -31, -43);
    ctx.closePath();
  };

  const drawJersey = (ctx, player, x, y, color, light, scale = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.save();
    ctx.translate(5, 7);
    jerseyPath(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.20)';
    ctx.fill();
    ctx.restore();

    const gradient = ctx.createLinearGradient(-80, -45, 70, 90);
    gradient.addColorStop(0, light);
    gradient.addColorStop(0.32, color);
    gradient.addColorStop(1, color);
    jerseyPath(ctx);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,24,28,0.86)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = TRIM;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-88, 18);
    ctx.lineTo(-67, 31);
    ctx.moveTo(88, 18);
    ctx.lineTo(67, 31);
    ctx.stroke();

    ctx.fillStyle = TRIM;
    ctx.beginPath();
    ctx.moveTo(-23, -42);
    ctx.quadraticCurveTo(0, -24, 23, -42);
    ctx.lineTo(18, -32);
    ctx.quadraticCurveTo(0, -18, -18, -32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 23px system-ui, -apple-system, sans-serif';
    const label = displayName(player);
    const textWidth = Math.min(180, ctx.measureText(label).width + 28);
    roundedRect(ctx, x - textWidth / 2, y + 72, textWidth, 42, 17);
    ctx.fillStyle = 'rgba(5,25,18,0.84)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    const visible = ctx.measureText(label).width <= textWidth - 20
      ? label
      : `${label.slice(0, 11)}…`;
    ctx.fillText(visible, x, y + 101);
    ctx.restore();
  };

  const buildRows = (players, lineup) => {
    if (!players.length) return [];
    const goalkeeperId = lineup?.goalkeeperId || players[0]?.id;
    const goalkeeper = players.find(player => player.id === goalkeeperId) || players[0];
    const outfield = players.filter(player => player.id !== goalkeeper?.id);
    const formation = teamBuilder?.getFormation?.(players.length, lineup?.formationId);
    const counts = formation?.lines || [0, 0, outfield.length];
    const rows = goalkeeper ? [[goalkeeper]] : [];
    let cursor = 0;
    counts.forEach(count => {
      if (count <= 0) return;
      const row = outfield.slice(cursor, cursor + count);
      if (row.length) rows.push(row);
      cursor += count;
    });
    if (cursor < outfield.length) {
      if (rows.length > 1) rows[rows.length - 1].push(...outfield.slice(cursor));
      else rows.push(outfield.slice(cursor));
    }
    return rows.filter(Boolean);
  };

  const drawPitch = ctx => {
    const width = 1200;
    const top = 260;
    const bottom = 1710;
    const left = 82;
    const right = width - 82;
    const pitchWidth = right - left;
    const pitchHeight = bottom - top;
    const grass = ctx.createLinearGradient(0, top, 0, bottom);
    grass.addColorStop(0, '#2b9556');
    grass.addColorStop(1, '#16683e');
    ctx.fillStyle = grass;
    roundedRect(ctx, left, top, pitchWidth, pitchHeight, 34);
    ctx.fill();

    const stripeHeight = pitchHeight / 10;
    for (let index = 0; index < 10; index += 1) {
      if (index % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.035)';
        ctx.fillRect(left, top + stripeHeight * index, pitchWidth, stripeHeight);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.84)';
    ctx.lineWidth = 5;
    ctx.strokeRect(left + 28, top + 28, pitchWidth - 56, pitchHeight - 56);
    const centerY = (top + bottom) / 2;
    ctx.beginPath();
    ctx.moveTo(left + 28, centerY);
    ctx.lineTo(right - 28, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width / 2, centerY, 118, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width / 2, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    const areaWidth = 520;
    const areaDepth = 150;
    ctx.strokeRect((width - areaWidth) / 2, top + 28, areaWidth, areaDepth);
    ctx.strokeRect((width - areaWidth) / 2, bottom - 28 - areaDepth, areaWidth, areaDepth);
  };

  const drawTeamRows = (ctx, rows, side, label) => {
    const isBlue = side === 'blue';
    const color = isBlue ? BLUE : RED;
    const light = isBlue ? BLUE_LIGHT : RED_LIGHT;
    const yMap = isBlue ? [390, 555, 720, 885] : [1570, 1405, 1240, 1075];
    const tagY = isBlue ? 292 : 1745;

    ctx.fillStyle = 'rgba(5,25,18,0.84)';
    roundedRect(ctx, 390, tagY - 30, 420, 58, 24);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(label, 600, tagY + 9);

    rows.slice(0, 4).forEach((row, rowIndex) => {
      const y = yMap[rowIndex] ?? yMap[yMap.length - 1];
      const usableWidth = 860;
      const start = (1200 - usableWidth) / 2;
      const step = usableWidth / Math.max(1, row.length);
      row.forEach((player, index) => {
        const x = start + step * index + step / 2;
        const scale = row.length >= 5 ? 0.78 : row.length === 4 ? 0.86 : 0.92;
        drawJersey(ctx, player, x, y, color, light, scale);
      });
    });
  };

  const createFormationCanvas = context => {
    if (!context?.session?.teamAssignments) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1900;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eef3ef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawHeader(ctx, canvas.width, context.group.name || 'Partido', 'Distribución en cancha');
    drawPitch(ctx);

    const blue = orderedTeamPlayers(context, 'blue');
    const red = orderedTeamPlayers(context, 'red');
    const blueRows = buildRows(blue, context.session.teamAssignments.lineups?.blue);
    const redRows = buildRows(red, context.session.teamAssignments.lineups?.red);
    drawTeamRows(ctx, blueRows, 'blue', context.session.teamNames?.blue || 'Azul');
    drawTeamRows(ctx, redRows, 'red', context.session.teamNames?.red || 'Rojo');
    drawFooter(ctx, canvas.width, canvas.height, `${blue.length + red.length} jugadores · Distribución orientativa`);
    return canvas;
  };

  const drawPlayerRow = (ctx, x, y, width, player, accent, index) => {
    ctx.fillStyle = index % 2 === 0 ? '#f8faf8' : '#f1f5f2';
    roundedRect(ctx, x, y, width, 58, 16);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + 30, y + 29, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '900 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(displayName(player).charAt(0).toUpperCase(), x + 30, y + 35);
    ctx.textAlign = 'left';
    ctx.fillStyle = DARK;
    ctx.font = '800 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(displayName(player), x + 62, y + 36);
  };

  const createListCanvas = context => {
    if (!context || context.participants.length === 0) return null;
    const hasTeams = Boolean(context.session.teamAssignments);
    const blue = hasTeams ? alpha(orderedTeamPlayers(context, 'blue')) : [];
    const red = hasTeams ? alpha(orderedTeamPlayers(context, 'red')) : [];
    const participants = alpha(context.participants);
    const maxRows = hasTeams ? Math.max(blue.length, red.length) : Math.ceil(participants.length / 2);
    const height = Math.max(920, 430 + maxRows * 72);
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eef3ef';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawHeader(ctx, canvas.width, context.group.name || 'Partido', hasTeams ? 'Lista de equipos' : 'Lista de convocados');

    const bodyTop = 260;
    if (hasTeams) {
      const columns = [
        { x: 72, label: context.session.teamNames?.blue || 'Azul', players: blue, color: BLUE },
        { x: 620, label: context.session.teamNames?.red || 'Rojo', players: red, color: RED }
      ];
      columns.forEach(column => {
        ctx.fillStyle = '#ffffff';
        roundedRect(ctx, column.x, bodyTop, 508, height - bodyTop - 140, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(23,63,52,0.10)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = column.color;
        roundedRect(ctx, column.x + 24, bodyTop + 24, 460, 64, 20);
        ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 29px system-ui, -apple-system, sans-serif';
        ctx.fillText(column.label, column.x + 48, bodyTop + 66);
        column.players.forEach((player, index) => {
          drawPlayerRow(ctx, column.x + 24, bodyTop + 112 + index * 68, 460, player, column.color, index);
        });
      });
    } else {
      ctx.fillStyle = '#ffffff';
      roundedRect(ctx, 72, bodyTop, 1056, height - bodyTop - 140, 28);
      ctx.fill();
      ctx.fillStyle = GREEN;
      roundedRect(ctx, 96, bodyTop + 24, 1008, 64, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = '900 29px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Convocados · ${participants.length}`, 124, bodyTop + 66);
      const split = Math.ceil(participants.length / 2);
      participants.forEach((player, index) => {
        const column = index >= split ? 1 : 0;
        const localIndex = column ? index - split : index;
        const x = column ? 620 : 96;
        drawPlayerRow(ctx, x, bodyTop + 112 + localIndex * 68, 484, player, GREEN, localIndex);
      });
    }

    drawFooter(ctx, canvas.width, canvas.height, `${context.participants.length} convocados · Generado con Tercer Tiempo`);
    return canvas;
  };

  const canvasToBlobSync = canvas => {
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = root.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: 'image/png' });
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    root.setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const showToast = message => {
    let toast = document.getElementById('tt-v34-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tt-v34-toast';
      toast.className = 'tt-v34-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    root.clearTimeout(toast._hideTimer);
    toast._hideTimer = root.setTimeout(() => toast.classList.remove('is-visible'), 4200);
  };

  const whatsappText = (context, kind) => {
    const groupName = context.group.name || 'Tercer Tiempo';
    return kind === 'formation'
      ? `⚽ ${groupName}\nDistribución en cancha · ${VERSION_LABEL}`
      : `⚽ ${groupName}\nLista de jugadores · ${VERSION_LABEL}`;
  };

  const desktopWhatsappFallback = async ({ blob, filename, text }) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    root.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    let copied = false;

    try {
      if (root.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([new root.ClipboardItem({ 'image/png': blob })]);
        copied = true;
      }
    } catch (error) {
      console.warn('[TercerTiempoV34] clipboard image unavailable', error);
    }

    if (!copied) downloadBlob(blob, filename);

    showToast(copied
      ? 'Imagen copiada. Se abrió WhatsApp: pegala en el chat con Ctrl+V.'
      : 'Imagen descargada. Se abrió WhatsApp: adjuntala al chat.');
  };

  const shareCanvasToWhatsApp = ({ canvas, filename, title, text }) => {
    const blob = canvasToBlobSync(canvas);
    const file = new File([blob], filename, { type: 'image/png' });
    const canShareFiles = Boolean(navigator.share && navigator.canShare?.({ files: [file] }));

    if (canShareFiles) {
      navigator.share({ files: [file], title, text }).catch(error => {
        if (error?.name === 'AbortError') return;
        desktopWhatsappFallback({ blob, filename, text });
      });
      return;
    }

    desktopWhatsappFallback({ blob, filename, text });
  };

  const handleShare = kind => {
    const context = getContext();
    if (!context) return;
    const canvas = kind === 'formation' ? createFormationCanvas(context) : createListCanvas(context);
    if (!canvas) {
      root.alert(kind === 'formation'
        ? 'Primero armá los equipos para compartir la distribución en cancha.'
        : 'Primero elegí jugadores para compartir la lista.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const filename = kind === 'formation'
      ? `tercer-tiempo-cancha-${date}.png`
      : `tercer-tiempo-lista-${date}.png`;
    const text = whatsappText(context, kind);
    shareCanvasToWhatsApp({
      canvas,
      filename,
      title: kind === 'formation' ? 'Distribución en cancha' : 'Lista de jugadores',
      text
    });
  };

  const mountButtons = () => {
    const container = document.querySelector('.team-builder-card .share-card-actions');
    if (!container) return false;

    const oldTextButton = container.querySelector('[data-v33-whatsapp]');
    if (oldTextButton) oldTextButton.hidden = true;

    if (!container.querySelector('[data-v34-share="formation"]')) {
      const formation = document.createElement('button');
      formation.type = 'button';
      formation.className = 'secondary-button tt-v34-whatsapp';
      formation.dataset.v34Share = 'formation';
      formation.innerHTML = '<span aria-hidden="true">💬</span> WhatsApp · Cancha';
      formation.title = 'Compartir la distribución en cancha como imagen por WhatsApp';
      formation.addEventListener('click', () => handleShare('formation'));
      container.appendChild(formation);
    }

    if (!container.querySelector('[data-v34-share="list"]')) {
      const list = document.createElement('button');
      list.type = 'button';
      list.className = 'secondary-button tt-v34-whatsapp';
      list.dataset.v34Share = 'list';
      list.innerHTML = '<span aria-hidden="true">💬</span> WhatsApp · Lista';
      list.title = 'Compartir la lista de jugadores como imagen por WhatsApp';
      list.addEventListener('click', () => handleShare('list'));
      container.appendChild(list);
    }
    return true;
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || root.setTimeout)(() => {
      scheduled = false;
      mountButtons();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', schedule);
  schedule();

  root.TercerTiempoShareV34 = {
    createFormationCanvas,
    createListCanvas,
    shareCanvasToWhatsApp,
    handleShare
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
