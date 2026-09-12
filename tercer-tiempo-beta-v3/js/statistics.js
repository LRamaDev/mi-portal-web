(function exposeStatistics(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoStatistics = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createStatisticsApi() {
  const asList = value => Array.isArray(value) ? value : [];

  const compareMatchesNewestFirst = (left, right) => {
    const dateDifference = String(right?.playedOn || '').localeCompare(String(left?.playedOn || ''));
    if (dateDifference !== 0) return dateDifference;
    return String(right?.createdAt || '').localeCompare(String(left?.createdAt || ''));
  };

  const getTeamForPlayer = (match, playerId) => {
    if (asList(match?.bluePlayerIds).includes(playerId)) return 'blue';
    if (asList(match?.redPlayerIds).includes(playerId)) return 'red';
    return null;
  };

  const getPlayerOutcome = (match, playerId) => {
    const team = getTeamForPlayer(match, playerId);
    if (!team) return null;
    const blueScore = Number(match?.result?.blueScore) || 0;
    const redScore = Number(match?.result?.redScore) || 0;
    if (blueScore === redScore) return 'draw';
    const winningTeam = blueScore > redScore ? 'blue' : 'red';
    return team === winningTeam ? 'win' : 'loss';
  };

  const getLeaders = (players, field, minimum = 1) => {
    const highestValue = players.reduce((highest, player) => Math.max(highest, Number(player[field]) || 0), 0);
    return {
      value: highestValue,
      playerIds: highestValue >= minimum
        ? players.filter(player => player[field] === highestValue).map(player => player.playerId)
        : []
    };
  };

  const calculateStatistics = (playersInput, matchesInput) => {
    const players = asList(playersInput).filter(player => player && player.id);
    const matches = [...asList(matchesInput)].sort(compareMatchesNewestFirst);
    const playerStats = new Map(players.map(player => [player.id, {
      playerId: player.id,
      name: String(player.name || ''),
      nickname: String(player.nickname || ''),
      preferredPosition: player.preferredPosition || 'versatile',
      active: player.active !== false,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      figures: 0,
      registeredGoals: 0,
      outcomes: []
    }]));

    let totalGoals = 0;
    let drawnMatches = 0;
    let figuresChosen = 0;
    let matchesWithRegisteredScorers = 0;

    matches.forEach(match => {
      const blueScore = Math.max(0, Number(match?.result?.blueScore) || 0);
      const redScore = Math.max(0, Number(match?.result?.redScore) || 0);
      totalGoals += blueScore + redScore;
      if (blueScore === redScore) drawnMatches += 1;

      playerStats.forEach(stats => {
        const outcome = getPlayerOutcome(match, stats.playerId);
        if (!outcome) return;
        stats.played += 1;
        stats.outcomes.push(outcome);
        if (outcome === 'win') stats.wins += 1;
        if (outcome === 'draw') stats.draws += 1;
        if (outcome === 'loss') stats.losses += 1;
      });

      const figure = playerStats.get(match?.playerOfTheMatchId);
      if (figure && getTeamForPlayer(match, figure.playerId)) {
        figure.figures += 1;
        figuresChosen += 1;
      }

      const scorers = asList(match?.scorers);
      if (scorers.length > 0) matchesWithRegisteredScorers += 1;
      scorers.forEach(entry => {
        const scorer = playerStats.get(entry?.playerId);
        const goals = Math.max(0, Number(entry?.goals) || 0);
        if (scorer && getTeamForPlayer(match, scorer.playerId)) scorer.registeredGoals += goals;
      });
    });

    const calculatedPlayers = Array.from(playerStats.values()).map(stats => {
      const unbeatenStreak = stats.outcomes.findIndex(outcome => outcome === 'loss');
      const currentUnbeatenStreak = unbeatenStreak === -1 ? stats.outcomes.length : unbeatenStreak;
      const lastOutcome = stats.outcomes[0] || null;
      return {
        playerId: stats.playerId,
        name: stats.name,
        nickname: stats.nickname,
        preferredPosition: stats.preferredPosition,
        active: stats.active,
        played: stats.played,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        figures: stats.figures,
        registeredGoals: stats.registeredGoals,
        winPercentage: stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0,
        currentUnbeatenStreak,
        lastOutcome
      };
    });

    return {
      summary: {
        matchesPlayed: matches.length,
        totalGoals,
        goalsPerMatch: matches.length > 0 ? Number((totalGoals / matches.length).toFixed(1)) : 0,
        drawnMatches,
        figuresChosen,
        matchesWithRegisteredScorers
      },
      players: calculatedPlayers,
      recognitions: {
        mostPresent: getLeaders(calculatedPlayers, 'played'),
        mostFigures: getLeaders(calculatedPlayers, 'figures'),
        currentUnbeaten: getLeaders(calculatedPlayers, 'currentUnbeatenStreak', 2)
      }
    };
  };

  return {
    getTeamForPlayer,
    getPlayerOutcome,
    calculateStatistics
  };
});
