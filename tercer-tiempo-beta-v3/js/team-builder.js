(function exposeTeamBuilder(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoTeamBuilder = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createTeamBuilder() {
  const BALANCED_POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward'];
  const POSITION_ORDER = Object.freeze({
    goalkeeper: 0,
    defender: 1,
    midfielder: 2,
    forward: 3,
    versatile: 4
  });
  const MIXED_GROUP_VALUES = Object.freeze(['female', 'male', 'unspecified']);
  const FORMATION_OPTIONS = Object.freeze({
    5: [{ id: '2-2', label: '2-2', lines: [2, 2, 0] }, { id: '2-1-1', label: '2-1-1', lines: [2, 1, 1] }, { id: '1-2-1', label: '1-2-1', lines: [1, 2, 1] }],
    6: [{ id: '2-2-1', label: '2-2-1', lines: [2, 2, 1] }, { id: '2-1-2', label: '2-1-2', lines: [2, 1, 2] }, { id: '3-1-1', label: '3-1-1', lines: [3, 1, 1] }],
    7: [{ id: '2-3-1', label: '2-3-1', lines: [2, 3, 1] }, { id: '3-2-1', label: '3-2-1', lines: [3, 2, 1] }, { id: '2-2-2', label: '2-2-2', lines: [2, 2, 2] }],
    8: [{ id: '3-2-2', label: '3-2-2', lines: [3, 2, 2] }, { id: '2-3-2', label: '2-3-2', lines: [2, 3, 2] }, { id: '3-3-1', label: '3-3-1', lines: [3, 3, 1] }],
    9: [{ id: '3-3-2', label: '3-3-2', lines: [3, 3, 2] }, { id: '4-2-2', label: '4-2-2', lines: [4, 2, 2] }, { id: '3-2-3', label: '3-2-3', lines: [3, 2, 3] }],
    10: [{ id: '4-3-2', label: '4-3-2', lines: [4, 3, 2] }, { id: '3-4-2', label: '3-4-2', lines: [3, 4, 2] }, { id: '4-2-3', label: '4-2-3', lines: [4, 2, 3] }],
    11: [{ id: '4-3-3', label: '4-3-3', lines: [4, 3, 3] }, { id: '4-4-2', label: '4-4-2', lines: [4, 4, 2] }, { id: '3-5-2', label: '3-5-2', lines: [3, 5, 2] }]
  });

  const getMixedGroupValue = player => MIXED_GROUP_VALUES.includes(player?.mixedGroup)
    ? player.mixedGroup
    : 'unspecified';

  const getFormationOptions = playerCount => FORMATION_OPTIONS[Math.max(5, Math.min(11, Number(playerCount) || 5))] || [];
  const getFormation = (playerCount, formationId) => getFormationOptions(playerCount)
    .find(item => item.id === formationId) || getFormationOptions(playerCount)[0] || { id: 'libre', label: 'Libre', lines: [0, 0, Math.max(0, playerCount - 1)] };

  const getLineupRoleLabels = (formationId, playerCount) => {
    const formation = getFormation(playerCount, formationId);
    const makeRoles = (count, singular, variants) => Array.from({ length: count }, (_, index) => variants[index] || (count === 1 ? singular : `${singular} ${index + 1}`));
    const [defenders, midfielders, forwards] = formation.lines;
    return [
      'Arquero',
      ...makeRoles(defenders, 'Defensor', defenders === 4 ? ['Lateral derecho', 'Central derecho', 'Central izquierdo', 'Lateral izquierdo'] : defenders === 3 ? ['Central derecho', 'Central', 'Central izquierdo'] : defenders === 2 ? ['Central derecho', 'Central izquierdo'] : ['Defensor central']),
      ...makeRoles(midfielders, 'Mediocampista', midfielders === 3 ? ['Volante derecho', 'Volante central', 'Volante izquierdo'] : midfielders === 2 ? ['Volante derecho', 'Volante izquierdo'] : ['Volante central']),
      ...makeRoles(forwards, 'Delantero', forwards === 3 ? ['Extremo derecho', 'Centrodelantero', 'Extremo izquierdo'] : forwards === 2 ? ['Delantero derecho', 'Delantero izquierdo'] : ['Centrodelantero'])
    ];
  };

  const buildSuggestedLineup = (playersInput, formationId) => {
    const players = Array.isArray(playersInput) ? playersInput.filter(player => player?.id) : [];
    const actualGoalkeeper = players.find(player => player.preferredPosition === 'goalkeeper');
    const temporaryGoalkeeper = actualGoalkeeper || players.find(player => player.preferredPosition === 'versatile') || players[0] || null;
    const outfield = sortPlayersForLineup(players.filter(player => player.id !== temporaryGoalkeeper?.id));
    const formation = getFormation(players.length, formationId);
    return {
      formationId: formation.id,
      goalkeeperId: temporaryGoalkeeper?.id || null,
      playerIds: temporaryGoalkeeper ? [temporaryGoalkeeper.id, ...outfield.map(player => player.id)] : []
    };
  };

  const hashSeed = (value) => {
    const text = String(value ?? 'tercer-tiempo');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const createRandom = (seed) => {
    let state = hashSeed(seed) || 0x6d2b79f5;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  };

  const shuffle = (items, random) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  };

  const getRating = (player) => {
    const rating = Number(player?.rating);
    return Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 3;
  };

  const sortPlayersForLineup = (playersInput) => [...(Array.isArray(playersInput) ? playersInput : [])]
    .sort((left, right) => {
      const positionDifference = (POSITION_ORDER[left?.preferredPosition] ?? 4) - (POSITION_ORDER[right?.preferredPosition] ?? 4);
      if (positionDifference !== 0) return positionDifference;
      return String(left?.nickname || left?.name || '').localeCompare(String(right?.nickname || right?.name || ''), 'es-AR');
    });

  const getMetrics = (team) => ({
    size: team.length,
    rating: team.reduce((total, player) => total + getRating(player), 0),
    positions: BALANCED_POSITIONS.reduce((counts, position) => ({
      ...counts,
      [position]: team.filter(player => player.preferredPosition === position).length
    }), {}),
    mixedGroups: MIXED_GROUP_VALUES.reduce((counts, value) => ({ ...counts, [value]: team.filter(player => getMixedGroupValue(player) === value).length }), {})
  });

  const scoreTeams = (blue, red, totalGoalkeepers = 0) => {
    const blueMetrics = getMetrics(blue);
    const redMetrics = getMetrics(red);
    let score = Math.abs(blueMetrics.size - redMetrics.size) * 1000;
    score += Math.abs(blueMetrics.rating - redMetrics.rating) * 12;

    BALANCED_POSITIONS.forEach(position => {
      const weight = position === 'goalkeeper' ? 32 : 5;
      score += Math.abs(blueMetrics.positions[position] - redMetrics.positions[position]) * weight;
    });
    ['female', 'male'].forEach(value => {
      score += Math.abs(blueMetrics.mixedGroups[value] - redMetrics.mixedGroups[value]) * 18;
    });

    if (totalGoalkeepers >= 2 && (blueMetrics.positions.goalkeeper === 0 || redMetrics.positions.goalkeeper === 0)) {
      score += 300;
    }
    return score;
  };

  const improveWithSwaps = (blueInput, redInput, totalGoalkeepers) => {
    const blue = [...blueInput];
    const red = [...redInput];
    let currentScore = scoreTeams(blue, red, totalGoalkeepers);

    for (let pass = 0; pass < 6; pass += 1) {
      let best = null;
      for (let blueIndex = 0; blueIndex < blue.length; blueIndex += 1) {
        for (let redIndex = 0; redIndex < red.length; redIndex += 1) {
          const nextBlue = [...blue];
          const nextRed = [...red];
          [nextBlue[blueIndex], nextRed[redIndex]] = [nextRed[redIndex], nextBlue[blueIndex]];
          const nextScore = scoreTeams(nextBlue, nextRed, totalGoalkeepers);
          if (nextScore < currentScore && (!best || nextScore < best.score)) {
            best = { blueIndex, redIndex, score: nextScore };
          }
        }
      }
      if (!best) break;
      [blue[best.blueIndex], red[best.redIndex]] = [red[best.redIndex], blue[best.blueIndex]];
      currentScore = best.score;
    }

    return { blue, red, score: currentScore };
  };

  const buildCandidate = (players, random, trial) => {
    const largerTeamIsBlue = trial % 2 === 0;
    const blueCapacity = largerTeamIsBlue ? Math.ceil(players.length / 2) : Math.floor(players.length / 2);
    const redCapacity = players.length - blueCapacity;
    const goalkeepers = shuffle(players.filter(player => player.preferredPosition === 'goalkeeper'), random);
    const fieldPlayers = shuffle(players.filter(player => player.preferredPosition !== 'goalkeeper'), random)
      .map(player => ({ player, tieBreaker: random() }))
      .sort((left, right) => getRating(right.player) - getRating(left.player) || left.tieBreaker - right.tieBreaker)
      .map(item => item.player);
    const blue = [];
    const red = [];

    if (goalkeepers.length >= 2) {
      if (random() < 0.5) {
        blue.push(goalkeepers.shift());
        red.push(goalkeepers.shift());
      } else {
        red.push(goalkeepers.shift());
        blue.push(goalkeepers.shift());
      }
    } else if (goalkeepers.length === 1) {
      (random() < 0.5 ? blue : red).push(goalkeepers.shift());
    }

    const remaining = [...goalkeepers, ...fieldPlayers];
    remaining.forEach(player => {
      if (blue.length >= blueCapacity) {
        red.push(player);
        return;
      }
      if (red.length >= redCapacity) {
        blue.push(player);
        return;
      }
      const blueRating = getMetrics(blue).rating;
      const redRating = getMetrics(red).rating;
      if (blueRating === redRating) {
        (blue.length < red.length || (blue.length === red.length && random() < 0.5) ? blue : red).push(player);
      } else {
        (blueRating < redRating ? blue : red).push(player);
      }
    });

    return improveWithSwaps(blue, red, players.filter(player => player.preferredPosition === 'goalkeeper').length);
  };

  const buildBalancedTeams = (playersInput, seed = Date.now()) => {
    const players = (Array.isArray(playersInput) ? playersInput : [])
      .filter(player => player && player.id)
      .filter((player, index, list) => list.findIndex(item => item.id === player.id) === index);
    if (players.length < 2) return null;

    const random = createRandom(seed);
    const trialCount = players.length > 30 ? 12 : players.length > 20 ? 24 : 48;
    let best = null;
    for (let trial = 0; trial < trialCount; trial += 1) {
      const candidate = buildCandidate(players, random, trial);
      if (!best || candidate.score < best.score || (candidate.score === best.score && random() < 0.25)) {
        best = candidate;
      }
    }

    return {
      bluePlayerIds: sortPlayersForLineup(best.blue).map(player => player.id),
      redPlayerIds: sortPlayersForLineup(best.red).map(player => player.id),
      balanceScore: best.score,
      seed: String(seed),
      algorithmVersion: 1,
      manuallyEdited: false,
      generatedAt: new Date().toISOString()
    };
  };

  return {
    BALANCED_POSITIONS,
    POSITION_ORDER,
    FORMATION_OPTIONS,
    MIXED_GROUP_VALUES,
    buildBalancedTeams,
    buildSuggestedLineup,
    createRandom,
    getMetrics,
    getRating,
    hashSeed,
    getFormation,
    getFormationOptions,
    getLineupRoleLabels,
    scoreTeams,
    sortPlayersForLineup
  };
});
