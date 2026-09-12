(function exposeTeamBuilder(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoTeamBuilder = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createTeamBuilder() {
  const BALANCED_POSITIONS = ['goalkeeper', 'defender', 'midfielder', 'forward'];

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

  const getMetrics = (team) => ({
    size: team.length,
    rating: team.reduce((total, player) => total + getRating(player), 0),
    positions: BALANCED_POSITIONS.reduce((counts, position) => ({
      ...counts,
      [position]: team.filter(player => player.preferredPosition === position).length
    }), {})
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
      bluePlayerIds: best.blue.map(player => player.id),
      redPlayerIds: best.red.map(player => player.id),
      balanceScore: best.score,
      seed: String(seed),
      algorithmVersion: 1,
      manuallyEdited: false,
      generatedAt: new Date().toISOString()
    };
  };

  return {
    BALANCED_POSITIONS,
    buildBalancedTeams,
    createRandom,
    getMetrics,
    getRating,
    hashSeed,
    scoreTeams
  };
});
