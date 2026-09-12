(function exposeMatchHistory(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoMatchHistory = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createMatchHistoryApi() {
  const sortMatches = matchesInput => [...(Array.isArray(matchesInput) ? matchesInput : [])]
    .sort((left, right) => {
      const dateDifference = String(right?.playedOn || '').localeCompare(String(left?.playedOn || ''));
      if (dateDifference !== 0) return dateDifference;
      return String(right?.createdAt || '').localeCompare(String(left?.createdAt || ''));
    });

  const getPlayerSnapshot = (match, playerId) => (Array.isArray(match?.players) ? match.players : [])
    .find(player => player.id === playerId) || null;

  const getOutcome = (match) => {
    const blueScore = Number(match?.result?.blueScore) || 0;
    const redScore = Number(match?.result?.redScore) || 0;
    if (blueScore === redScore) return 'draw';
    return blueScore > redScore ? 'blue' : 'red';
  };

  const getOutcomeLabel = (match) => {
    const outcome = getOutcome(match);
    if (outcome === 'draw') return 'Empate';
    return `Ganó ${match?.teamNames?.[outcome] || (outcome === 'blue' ? 'Azul' : 'Rojo')}`;
  };

  const formatMatchDate = (playedOn) => {
    const date = new Date(`${playedOn}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return 'Fecha sin definir';
    const formatted = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date).replace(',', '');
    return formatted.charAt(0).toLocaleUpperCase('es-AR') + formatted.slice(1);
  };

  return {
    sortMatches,
    getPlayerSnapshot,
    getOutcome,
    getOutcomeLabel,
    formatMatchDate
  };
});
