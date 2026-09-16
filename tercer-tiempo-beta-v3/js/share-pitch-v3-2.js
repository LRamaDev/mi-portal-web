(function installPitchShareV32(root) {
  const storage = root.TercerTiempoStorage;
  const teamBuilder = root.TercerTiempoTeamBuilder;
  if (!storage || !teamBuilder || typeof document === 'undefined') return;

  const WIDTH = 1200;
  const HEIGHT = 1900;
  const BLUE = '#1f64b5';
  const BLUE_LIGHT = '#4f91de';
  const RED = '#c51f38';
  const RED_LIGHT = '#ea5267';
  const TRIM = '#20252b';

  const displayName = player => player?.nickname || player?.name || 'Jugador';

  const truncate = (context, text, maxWidth) => {
    const value = String(text || '');
    if (context.measureText(value).width <= maxWidth) return value;
    let result = value;
    while (result.length > 1 && context.measureText(`${result}…`).width > maxWidth) {
      result = result.slice(0, -1);
    }
    return `${result}…`;
  };

  const getContext = () => {
    const state = storage.load();
    const group = state.groups.find(item => item.id === state.activeGroupId) || state.groups[0];
    if (!group) return null;
    const session = state.draftSessions.find(item => item.groupId === group.id);
    if (!session?.teamAssignments) return null;
    const players = state.players.filter(player => player.groupId === group.id);
    return { state, group, session, players };
  };

  const buildRows = (players, lineup) => {
    if (!players.length) return [];
    const orderedIds = lineup?.playerIds?.length === players.length
      ? lineup.playerIds
      : players.map(player => player.id);
    const byId = new Map(players.map(player => [player.id, player]));
    const ordered = orderedIds.map(id => byId.get(id)).filter(Boolean);
    const goalkeeperId = lineup?.goalkeeperId || ordered[0]?.id;
    const goalkeeper = byId.get(goalkeeperId) || ordered[0];
    const outfield = ordered.filter(player => player.id !== goalkeeper?.id);
    const formation = teamBuilder.getFormation(players.length, lineup?.formationId);
    const counts = formation?.lines || [0, 0, outfield.length];
    const rows = goalkeeper ? [[goalkeeper]] : [];
    let cursor = 0;
    counts.forEach(count => {
      if (count <= 0) return;
      rows.push(outfield.slice(cursor, cursor + count));
      cursor += count;
    });
    if (cursor < outfield.length) {
      if (rows.length > 1) rows[rows.length - 1].push(...outfield.slice(cursor));
      else rows.push(outfield.slice(cursor));
    }
    return rows.filter(row => row.length > 0);
  };

  const drawRoundedRect = (context, x, y, width, height, radius) => {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  };

  const jerseyPath = context => {
    context.beginPath();
    context.moveTo(-31, -43);
    context.lineTo(-58, -35);
    context.lineTo(-91, 19);
    context.lineTo(-68, 34);
    context.lineTo(-50, 8);
    context.lineTo(-45, 83);
    context.lineTo(45, 83);
    context.lineTo(50, 8);
    context.lineTo(68, 34);
    context.lineTo(91, 19);
    context.lineTo(58, -35);
    context.lineTo(31, -43);
    context.quadraticCurveTo(19, -35, 0, -35);
    context.quadraticCurveTo(-19, -35, -31, -43);
    context.closePath();
  };

  const drawJersey = (context, player, x, y, color, light, scale = 1) => {
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);

    context.save();
    context.translate(5, 7);
    jerseyPath(context);
    context.fillStyle = 'rgba(0,0,0,0.22)';
    context.fill();
    context.restore();

    const gradient = context.createLinearGradient(-80, -45, 70, 90);
    gradient.addColorStop(0, light);
    gradient.addColorStop(0.32, color);
    gradient.addColorStop(1, color);
    jerseyPath(context);
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = 'rgba(20,24,28,0.86)';
    context.lineWidth = 3;
    context.stroke();

    context.save();
    context.strokeStyle = TRIM;
    context.lineWidth = 9;
    context.lineCap = 'butt';
    context.beginPath();
    context.moveTo(-88, 18);
    context.lineTo(-67, 31);
    context.moveTo(88, 18);
    context.lineTo(67, 31);
    context.stroke();
    context.strokeStyle = 'rgba(255,255,255,0.78)';
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(-86, 14);
    context.lineTo(-66, 27);
    context.moveTo(86, 14);
    context.lineTo(66, 27);
    context.stroke();
    context.restore();

    context.save();
    context.fillStyle = TRIM;
    context.beginPath();
    context.moveTo(-23, -42);
    context.quadraticCurveTo(0, -24, 23, -42);
    context.lineTo(18, -32);
    context.quadraticCurveTo(0, -18, -18, -32);
    context.closePath();
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,0.74)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(-18, -34);
    context.quadraticCurveTo(0, -20, 18, -34);
    context.stroke();
    context.restore();

    context.restore();

    context.save();
    context.textAlign = 'center';
    context.font = '900 24px system-ui, -apple-system, sans-serif';
    const label = truncate(context, displayName(player), 170);
    const width = Math.max(86, context.measureText(label).width + 28);
    drawRoundedRect(context, x - width / 2, y + 72, width, 42, 17);
    context.fillStyle = 'rgba(5,25,18,0.80)';
    context.fill();
    context.fillStyle = '#fff';
    context.fillText(label, x, y + 101);
    context.restore();
  };

  const drawPitch = context => {
    const pitchTop = 245;
    const pitchBottom = 1690;
    const pitchLeft = 82;
    const pitchRight = WIDTH - 82;
    const pitchWidth = pitchRight - pitchLeft;
    const pitchHeight = pitchBottom - pitchTop;

    const grass = context.createLinearGradient(0, pitchTop, 0, pitchBottom);
    grass.addColorStop(0, '#278f52');
    grass.addColorStop(1, '#16683e');
    context.fillStyle = grass;
    drawRoundedRect(context, pitchLeft, pitchTop, pitchWidth, pitchHeight, 34);
    context.fill();

    const stripeHeight = pitchHeight / 10;
    for (let index = 0; index < 10; index += 1) {
      if (index % 2 === 0) {
        context.fillStyle = 'rgba(255,255,255,0.035)';
        context.fillRect(pitchLeft, pitchTop + stripeHeight * index, pitchWidth, stripeHeight);
      }
    }

    context.strokeStyle = 'rgba(255,255,255,0.83)';
    context.lineWidth = 5;
    context.strokeRect(pitchLeft + 28, pitchTop + 28, pitchWidth - 56, pitchHeight - 56);
    const centerY = (pitchTop + pitchBottom) / 2;
    context.beginPath();
    context.moveTo(pitchLeft + 28, centerY);
    context.lineTo(pitchRight - 28, centerY);
    context.stroke();
    context.beginPath();
    context.arc(WIDTH / 2, centerY, 118, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(WIDTH / 2, centerY, 6, 0, Math.PI * 2);
    context.fillStyle = 'rgba(255,255,255,0.9)';
    context.fill();

    const areaWidth = 520;
    const areaDepth = 150;
    context.strokeRect((WIDTH - areaWidth) / 2, pitchTop + 28, areaWidth, areaDepth);
    context.strokeRect((WIDTH - areaWidth) / 2, pitchBottom - 28 - areaDepth, areaWidth, areaDepth);
  };

  const drawTeamRows = (context, rows, side, teamName) => {
    const isBlue = side === 'blue';
    const color = isBlue ? BLUE : RED;
    const light = isBlue ? BLUE_LIGHT : RED_LIGHT;
    const yMap = isBlue
      ? [365, 535, 705, 875]
      : [1570, 1400, 1230, 1060];

    const headerY = isBlue ? 210 : 1725;
    context.save();
    context.textAlign = 'center';
    context.fillStyle = 'rgba(5,25,18,0.84)';
    drawRoundedRect(context, 390, headerY - 30, 420, 58, 24);
    context.fill();
    context.fillStyle = '#fff';
    context.font = '900 28px system-ui, -apple-system, sans-serif';
    context.fillText(teamName, WIDTH / 2, headerY + 9);
    context.restore();

    rows.slice(0, 4).forEach((row, rowIndex) => {
      const y = yMap[rowIndex] ?? yMap[yMap.length - 1];
      const usableWidth = 860;
      const start = (WIDTH - usableWidth) / 2;
      const step = usableWidth / Math.max(1, row.length);
      row.forEach((player, index) => {
        const x = start + step * index + step / 2;
        const scale = row.length >= 5 ? 0.78 : row.length === 4 ? 0.86 : 0.92;
        drawJersey(context, player, x, y, color, light, scale);
      });
    });
  };

  const generateCard = async () => {
    const data = getContext();
    if (!data) {
      root.alert('Primero armá los equipos para compartir la formación en cancha.');
      return;
    }
    const { group, session, players } = data;
    const assignments = session.teamAssignments;
    const byId = new Map(players.map(player => [player.id, player]));
    const getTeamPlayers = team => (assignments[`${team}PlayerIds`] || []).map(id => byId.get(id)).filter(Boolean);
    const bluePlayers = getTeamPlayers('blue');
    const redPlayers = getTeamPlayers('red');
    const blueRows = buildRows(bluePlayers, assignments.lineups?.blue);
    const redRows = buildRows(redPlayers, assignments.lineups?.red);

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext('2d');

    const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
    background.addColorStop(0, '#f4f7f3');
    background.addColorStop(1, '#e6ece8');
    context.fillStyle = background;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.textAlign = 'center';
    context.fillStyle = '#083d2f';
    context.font = '900 54px system-ui, -apple-system, sans-serif';
    context.fillText('Tercer Tiempo', WIDTH / 2, 78);
    context.font = '800 31px system-ui, -apple-system, sans-serif';
    context.fillText(group.name || 'Partido', WIDTH / 2, 126);
    context.fillStyle = '#5d6d65';
    context.font = '700 22px system-ui, -apple-system, sans-serif';
    context.fillText('Formación del partido', WIDTH / 2, 166);

    drawPitch(context);
    drawTeamRows(context, blueRows, 'blue', session.teamNames?.blue || 'Azul');
    drawTeamRows(context, redRows, 'red', session.teamNames?.red || 'Rojo');

    context.fillStyle = '#5d6d65';
    context.font = '700 19px system-ui, -apple-system, sans-serif';
    context.fillText('Formación orientativa · Tercer Tiempo', WIDTH / 2, 1810);
    context.fillStyle = '#173f34';
    context.font = '900 21px system-ui, -apple-system, sans-serif';
    context.fillText(`${bluePlayers.length + redPlayers.length} jugadores`, WIDTH / 2, 1850);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.95));
    if (!blob) return;
    const fileName = `tercer-tiempo-formacion-${new Date().toISOString().slice(0, 10)}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Formación · Tercer Tiempo' });
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.warn('[TercerTiempoSharePitchV32] native share failed', error);
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('button');
    if (!button) return;
    const label = button.textContent.trim().toLocaleLowerCase('es-AR');
    if (!label.includes('compartir en cancha')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    generateCard().catch(error => {
      console.error('[TercerTiempoSharePitchV32]', error);
      root.alert('No se pudo generar la imagen de la formación.');
    });
  }, true);

  root.TercerTiempoSharePitchV32 = { generateCard };
})(typeof globalThis !== 'undefined' ? globalThis : window);
