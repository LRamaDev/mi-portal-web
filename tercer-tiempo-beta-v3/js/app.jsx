const { useEffect, useMemo, useRef, useState } = React;
const TTModels = TercerTiempoModels;
const TTStorage = TercerTiempoStorage;
const TTConfig = TercerTiempoConfig;
const TTEntitlements = TercerTiempoEntitlements;
const TTTeamBuilder = TercerTiempoTeamBuilder;
const TTMatchHistory = TercerTiempoMatchHistory;
const TTStatistics = TercerTiempoStatistics;

const IconHome = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>;
const IconUsers = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconShield = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>;
const IconPlus = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>;
const IconCheck = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m20 6-11 11-5-5"/></svg>;
const IconArrowLeft = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg>;
const IconArrowRight = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/><path d="M5 12h10"/></svg>;
const IconRefresh = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 7h-6V1"/><path d="m20 1-4.5 4.5A8 8 0 1 0 20 12"/></svg>;
const IconSwap = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M7 7h13l-3-3"/><path d="m20 7-3 3"/><path d="M17 17H4l3 3"/><path d="m4 17 3-3"/></svg>;
const IconDollar = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconBeer = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6M13 12v6"/><path d="M14 7.5a2.5 2.5 0 0 0-5 0M4 11h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8Z"/></svg>;
const IconSoda = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 3h8l-1 18H9L8 3Z"/><path d="M7 7h10M13 3l3-2"/></svg>;
const IconFood = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 2v8M9 2v8M6 6h3M7.5 10v12M16 2v20M16 2c3 2 3 7 0 10"/></svg>;
const IconCoins = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><circle cx="18" cy="18" r="4"/><path d="M12 18a6 6 0 0 0-6-6"/></svg>;
const IconReceipt = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>;
const IconShare = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>;
const IconCopy = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconDownload = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>;
const IconAlert = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>;
const IconCalendar = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const IconHistory = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>;
const IconStats = () => <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/><path d="M2 19h22"/></svg>;

const POSITION_LABELS = {
  goalkeeper: 'Arquero',
  defender: 'Defensor',
  midfielder: 'Mediocampista',
  forward: 'Delantero',
  versatile: 'Polifuncional'
};

const DAY_LABELS = {
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
  '7': 'Domingo'
};

const VIEW_FEATURES = {
  players: 'playerProfiles',
  history: 'history',
  group: 'groups',
  expenses: 'expenses'
};

const EXPENSE_CATEGORIES = {
  court: { label: 'Cancha', icon: <IconDollar /> },
  beer: { label: 'Cerveza', icon: <IconBeer /> },
  soda: { label: 'Gaseosa', icon: <IconSoda /> },
  food: { label: 'Comida', icon: <IconFood /> },
  other: { label: 'Otro', icon: <IconCoins /> },
  drinks: { label: 'Bebidas', icon: <IconBeer /> },
  water: { label: 'Agua', icon: <IconSoda /> },
  ice: { label: 'Hielo', icon: <IconSoda /> }
};

const QUICK_CONCEPTS = [
  { category: 'court', label: 'Cancha', description: 'Cancha ⚽', icon: <IconDollar /> },
  { category: 'beer', label: 'Cerveza', description: 'Cerveza 🍺', icon: <IconBeer /> },
  { category: 'soda', label: 'Gaseosa', description: 'Gaseosa 🥤', icon: <IconSoda /> },
  { category: 'food', label: 'Comida', description: 'Comida 🍕', icon: <IconFood /> },
  { category: 'other', label: 'Otro', description: '', icon: <IconCoins /> }
];

const formatCurrency = value => `$${Math.round(Number(value) || 0).toLocaleString('es-AR')}`;
const getTodayInputValue = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

function App() {
  const [state, setState] = useState(() => TTStorage.load());
  const [activeView, setActiveView] = useState('home');
  const [toast, setToast] = useState(null);
  const [quickNames, setQuickNames] = useState('');
  const [rosterNames, setRosterNames] = useState('');
  const [rosterFilter, setRosterFilter] = useState('active');
  const [historyTab, setHistoryTab] = useState('matches');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [matchEditor, setMatchEditor] = useState(null);
  const [swapSelection, setSwapSelection] = useState({ blue: null, red: null });
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('Cancha ⚽');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseConsumers, setExpenseConsumers] = useState([]);
  const [expenseCategory, setExpenseCategory] = useState('court');
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const canvasRef = useRef(null);
  const toastTimerRef = useRef(null);

  const activeGroup = state.groups.find(group => group.id === state.activeGroupId) || state.groups[0];
  const groupAccess = useMemo(
    () => TTEntitlements.resolveGroupEntitlements(activeGroup, TTConfig),
    [activeGroup]
  );
  const canUse = groupAccess.canUse;
  const groupPlayers = useMemo(
    () => state.players.filter(player => player.groupId === activeGroup.id),
    [state.players, activeGroup.id]
  );
  const activeRoster = useMemo(() => groupPlayers.filter(player => player.active), [groupPlayers]);
  const draftSession = state.draftSessions.find(session => session.groupId === activeGroup.id)
    || TTModels.createDraftSession(activeGroup.id);
  const sessionPlayerIds = draftSession.participantIds;
  const sessionPlayers = sessionPlayerIds.map(id => groupPlayers.find(player => player.id === id)).filter(Boolean);
  const expenses = draftSession.expenses;
  const teamNames = draftSession.teamNames;
  const teamAssignments = draftSession.teamAssignments;
  const groupMatches = useMemo(
    () => TTMatchHistory.sortMatches(state.matches.filter(match => match.groupId === activeGroup.id)),
    [state.matches, activeGroup.id]
  );
  const groupStatistics = useMemo(
    () => TTStatistics.calculateStatistics(groupPlayers, groupMatches),
    [groupPlayers, groupMatches]
  );
  const archivedMatch = draftSession.archivedMatchId
    ? state.matches.find(match => match.id === draftSession.archivedMatchId) || null
    : null;
  const blueTeam = TTTeamBuilder.sortPlayersForLineup(
    (teamAssignments?.bluePlayerIds || []).map(id => groupPlayers.find(player => player.id === id)).filter(Boolean)
  );
  const redTeam = TTTeamBuilder.sortPlayersForLineup(
    (teamAssignments?.redPlayerIds || []).map(id => groupPlayers.find(player => player.id === id)).filter(Boolean)
  );
  const calculations = useMemo(
    () => TTModels.calculateSettlement(sessionPlayers, expenses),
    [sessionPlayers, expenses]
  );
  const courtSummary = useMemo(() => {
    const courtExpenses = expenses.filter(expense => expense.category === 'court');
    const total = courtExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const consumerIds = Array.from(new Set(courtExpenses.flatMap(expense => Array.isArray(expense.consumerIds) ? expense.consumerIds : [])
      .filter(id => sessionPlayerIds.includes(id))));
    const playerCount = consumerIds.length || sessionPlayers.length;
    return {
      total,
      playerCount,
      perPlayer: playerCount > 0 ? total / playerCount : 0
    };
  }, [expenses, sessionPlayerIds.join('|'), sessionPlayers.length]);
  const scheduleText = [
    DAY_LABELS[activeGroup.usualDay],
    activeGroup.usualTime,
    activeGroup.usualVenue
  ].filter(Boolean).join(' · ') || 'Completá el día, la hora y la cancha habitual';

  useEffect(() => {
    TTStorage.save(state);
  }, [state]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', Boolean(editingPlayer || matchEditor || isSettlementOpen));
    return () => document.body.classList.remove('is-locked');
  }, [editingPlayer, matchEditor, isSettlementOpen]);

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  useEffect(() => {
    if (sessionPlayers.length === 0) {
      setExpensePayer('');
      setExpenseConsumers([]);
      return;
    }
    if (!sessionPlayers.some(player => player.id === expensePayer)) {
      setExpensePayer(sessionPlayers[0].id);
    }
    setExpenseConsumers(current => current.filter(id => sessionPlayerIds.includes(id)));
  }, [sessionPlayerIds.join('|')]);

  const showToast = (message, type = 'success') => {
    window.clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  };

  const changeView = view => {
    const requiredFeature = VIEW_FEATURES[view];
    if (requiredFeature && !canUse(requiredFeature)) {
      showToast('Esta función no está habilitada para este grupo.', 'info');
      return;
    }
    setActiveView(view);
    setIsSettlementOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSession = updater => {
    setState(current => ({
      ...current,
      draftSessions: current.draftSessions.map(session => {
        if (session.groupId !== activeGroup.id) return session;
        return updater(session);
      })
    }));
  };

  const addPlayers = (rawNames, addToCurrentMatch) => {
    const names = String(rawNames || '')
      .split(/[,;\n]+/)
      .map(name => name.trim())
      .filter(Boolean);
    const existingNames = new Set(groupPlayers.map(player => TTModels.normalizeName(player.name)));
    const uniqueNames = names.filter((name, index) => {
      const normalized = TTModels.normalizeName(name);
      return normalized
        && !existingNames.has(normalized)
        && names.findIndex(item => TTModels.normalizeName(item) === normalized) === index;
    });
    if (uniqueNames.length === 0) {
      showToast('Esos nombres ya están en el plantel', 'info');
      return [];
    }
    const newPlayers = uniqueNames.map(name => TTModels.createPlayer({ groupId: activeGroup.id, name }));
    setState(current => ({
      ...current,
      players: [...current.players, ...newPlayers],
      draftSessions: current.draftSessions.map(session => session.groupId === activeGroup.id && addToCurrentMatch
        ? {
          ...session,
          participantIds: Array.from(new Set([...session.participantIds, ...newPlayers.map(player => player.id)])),
          teamAssignments: null
        }
        : session)
    }));
    showToast(newPlayers.length === 1 ? `${newPlayers[0].name} se sumó al plantel` : `${newPlayers.length} jugadores agregados`);
    return newPlayers;
  };

  const handleQuickAdd = event => {
    event.preventDefault();
    const created = addPlayers(quickNames, true);
    if (created.length > 0) setQuickNames('');
  };

  const handleRosterAdd = event => {
    event.preventDefault();
    const created = addPlayers(rosterNames, false);
    if (created.length > 0) setRosterNames('');
  };

  const toggleParticipant = playerId => {
    const isSelected = sessionPlayerIds.includes(playerId);
    if (isSelected) {
      const isReferenced = expenses.some(expense => expense.paidById === playerId || expense.consumerIds.includes(playerId));
      if (isReferenced && !window.confirm('Este jugador aparece en gastos cargados. Al quitarlo se ajustarán esos gastos. ¿Continuar?')) return;
      setSwapSelection({ blue: null, red: null });
      updateSession(session => ({
        ...session,
        participantIds: session.participantIds.filter(id => id !== playerId),
        teamAssignments: null,
        expenses: session.expenses
          .filter(expense => expense.paidById !== playerId)
          .map(expense => ({ ...expense, consumerIds: expense.consumerIds.filter(id => id !== playerId) }))
          .filter(expense => expense.consumerIds.length > 0)
      }));
      showToast('Jugador quitado del partido', 'info');
      return;
    }
    setSwapSelection({ blue: null, red: null });
    updateSession(session => ({
      ...session,
      participantIds: [...session.participantIds, playerId],
      teamAssignments: null
    }));
  };

  const scoreAssignment = (bluePlayerIds, redPlayerIds) => {
    const bluePlayers = bluePlayerIds.map(id => groupPlayers.find(player => player.id === id)).filter(Boolean);
    const redPlayers = redPlayerIds.map(id => groupPlayers.find(player => player.id === id)).filter(Boolean);
    const totalGoalkeepers = [...bluePlayers, ...redPlayers]
      .filter(player => player.preferredPosition === 'goalkeeper').length;
    return TTTeamBuilder.scoreTeams(bluePlayers, redPlayers, totalGoalkeepers);
  };

  const generateTeams = () => {
    const assignments = TTTeamBuilder.buildBalancedTeams(sessionPlayers, TTModels.createId('teams'));
    if (!assignments) {
      showToast('Elegí al menos dos jugadores para armar los equipos', 'error');
      return;
    }
    updateSession(session => ({ ...session, teamAssignments: assignments }));
    setSwapSelection({ blue: null, red: null });
    showToast(teamAssignments ? 'Equipos regenerados' : 'Equipos armados');
  };

  const updateTeamName = (team, value) => {
    updateSession(session => ({
      ...session,
      teamNames: {
        ...session.teamNames,
        [team]: String(value || '').slice(0, 24)
      }
    }));
  };

  const finishTeamNameEdit = () => {
    updateSession(session => ({ ...session, teamNames: TTModels.createTeamNames(session.teamNames) }));
  };

  const moveTeamPlayer = (playerId, fromTeam) => {
    if (!teamAssignments) return;
    const destinationTeam = fromTeam === 'blue' ? 'red' : 'blue';
    const bluePlayerIds = fromTeam === 'blue'
      ? teamAssignments.bluePlayerIds.filter(id => id !== playerId)
      : [...teamAssignments.bluePlayerIds, playerId];
    const redPlayerIds = fromTeam === 'red'
      ? teamAssignments.redPlayerIds.filter(id => id !== playerId)
      : [...teamAssignments.redPlayerIds, playerId];
    updateSession(session => ({
      ...session,
      teamAssignments: {
        ...session.teamAssignments,
        bluePlayerIds,
        redPlayerIds,
        balanceScore: scoreAssignment(bluePlayerIds, redPlayerIds),
        manuallyEdited: true
      }
    }));
    setSwapSelection({ blue: null, red: null });
    const player = groupPlayers.find(item => item.id === playerId);
    const destinationName = teamNames[destinationTeam] || TTModels.DEFAULT_TEAM_NAMES[destinationTeam];
    showToast(`${player?.nickname || player?.name || 'Jugador'} pasó a ${destinationName}`, 'info');
  };

  const selectPlayerForSwap = (team, playerId) => {
    setSwapSelection(current => ({
      ...current,
      [team]: current[team] === playerId ? null : playerId
    }));
  };

  const swapTeamPlayers = () => {
    if (!teamAssignments || !swapSelection.blue || !swapSelection.red) return;
    const bluePlayerIds = teamAssignments.bluePlayerIds.map(id => id === swapSelection.blue ? swapSelection.red : id);
    const redPlayerIds = teamAssignments.redPlayerIds.map(id => id === swapSelection.red ? swapSelection.blue : id);
    updateSession(session => ({
      ...session,
      teamAssignments: {
        ...session.teamAssignments,
        bluePlayerIds,
        redPlayerIds,
        balanceScore: scoreAssignment(bluePlayerIds, redPlayerIds),
        manuallyEdited: true
      }
    }));
    setSwapSelection({ blue: null, red: null });
    showToast('Jugadores intercambiados', 'info');
  };

  const openMatchEditor = () => {
    if (!teamAssignments) {
      showToast('Primero armá los equipos para guardar el resultado', 'error');
      return;
    }
    const existingScorers = archivedMatch?.scorers || [];
    const scorerGoals = Object.fromEntries(sessionPlayers.map(player => {
      const scorer = existingScorers.find(entry => entry.playerId === player.id);
      return [player.id, scorer ? String(scorer.goals) : ''];
    }));
    setMatchEditor({
      matchId: archivedMatch?.id || null,
      playedOn: archivedMatch?.playedOn || getTodayInputValue(),
      venue: archivedMatch?.venue ?? activeGroup.usualVenue,
      blueScore: archivedMatch ? String(archivedMatch.result.blueScore) : '',
      redScore: archivedMatch ? String(archivedMatch.result.redScore) : '',
      scorersEnabled: archivedMatch?.scorersRecorded === true || existingScorers.length > 0,
      scorerGoals,
      playerOfTheMatchId: archivedMatch?.playerOfTheMatchId || '',
      observations: archivedMatch?.observations || ''
    });
  };

  const saveCompletedMatch = event => {
    event.preventDefault();
    if (!teamAssignments || !matchEditor) {
      showToast('La formación ya no está disponible', 'error');
      return;
    }
    const blueScore = Number(matchEditor.blueScore);
    const redScore = Number(matchEditor.redScore);
    if (![blueScore, redScore].every(score => Number.isInteger(score) && score >= 0 && score <= 99)) {
      showToast('Ingresá un resultado válido entre 0 y 99', 'error');
      return;
    }
    const scorerGoals = matchEditor.scorerGoals && typeof matchEditor.scorerGoals === 'object'
      ? matchEditor.scorerGoals
      : {};
    const scorerEntries = matchEditor.scorersEnabled
      ? sessionPlayers.map(player => ({ playerId: player.id, rawGoals: scorerGoals[player.id] ?? '' }))
        .filter(entry => String(entry.rawGoals).trim() !== '')
        .map(entry => ({ playerId: entry.playerId, goals: Number(entry.rawGoals) }))
      : [];
    if (!scorerEntries.every(entry => Number.isInteger(entry.goals) && entry.goals >= 0 && entry.goals <= 99)) {
      showToast('Cada goleador debe tener entre 0 y 99 goles', 'error');
      return;
    }
    const countGoals = playerIds => scorerEntries
      .filter(entry => playerIds.includes(entry.playerId))
      .reduce((total, entry) => total + entry.goals, 0);
    const blueGoalsAssigned = countGoals(blueTeam.map(player => player.id));
    const redGoalsAssigned = countGoals(redTeam.map(player => player.id));
    if (blueGoalsAssigned > blueScore || redGoalsAssigned > redScore) {
      const teamName = blueGoalsAssigned > blueScore ? teamNames.blue : teamNames.red;
      showToast(`Los goles cargados de ${teamName} no pueden superar el resultado`, 'error');
      return;
    }
    const existingMatch = matchEditor.matchId
      ? state.matches.find(match => match.id === matchEditor.matchId) || null
      : null;
    const match = TTModels.createMatch({
      id: existingMatch?.id,
      groupId: activeGroup.id,
      playedOn: matchEditor.playedOn,
      venue: matchEditor.venue,
      teamNames,
      players: sessionPlayers,
      bluePlayerIds: blueTeam.map(player => player.id),
      redPlayerIds: redTeam.map(player => player.id),
      result: { blueScore, redScore },
      scorers: scorerEntries.filter(entry => entry.goals > 0),
      scorersRecorded: matchEditor.scorersEnabled === true,
      playerOfTheMatchId: matchEditor.playerOfTheMatchId || null,
      observations: matchEditor.observations,
      createdAt: existingMatch?.createdAt,
      updatedAt: new Date().toISOString()
    });
    setState(current => ({
      ...current,
      matches: existingMatch
        ? current.matches.map(item => item.id === match.id ? match : item)
        : [...current.matches, match],
      draftSessions: current.draftSessions.map(session => session.groupId === activeGroup.id
        ? { ...session, archivedMatchId: match.id }
        : session)
    }));
    setMatchEditor(null);
    changeView('history');
    showToast(existingMatch ? 'Resultado actualizado' : 'Partido guardado en el historial');
  };

  const handleNewMatch = () => {
    if (expenses.length > 0 && !window.confirm('¿Empezar un partido nuevo? Se borrarán los gastos actuales, pero el grupo y el plantel quedarán guardados.')) return;
    updateSession(session => ({
      ...session,
      participantIds: activeRoster.map(player => player.id),
      expenses: [],
      teamNames: TTModels.createTeamNames(),
      teamAssignments: null,
      archivedMatchId: null
    }));
    setSwapSelection({ blue: null, red: null });
    resetExpenseForm(activeRoster.map(player => player.id));
    setIsSettlementOpen(false);
    showToast('Partido nuevo listo. El plantel quedó guardado.', 'info');
  };

  const handleClearCurrentMatch = () => {
    if (!window.confirm('¿Vaciar el partido actual? El plantel permanente no se borrará.')) return;
    updateSession(session => ({
      ...session,
      participantIds: [],
      expenses: [],
      teamNames: TTModels.createTeamNames(),
      teamAssignments: null,
      archivedMatchId: null
    }));
    setSwapSelection({ blue: null, red: null });
    resetExpenseForm([]);
    showToast('Partido actual vacío. El plantel sigue guardado.', 'info');
  };

  const openPlayerEditor = player => {
    setEditingPlayer({ ...player, stats: { ...player.stats } });
  };

  const savePlayer = event => {
    event.preventDefault();
    const name = editingPlayer.name.trim();
    if (!name) {
      showToast('El jugador necesita un nombre', 'error');
      return;
    }
    const duplicate = groupPlayers.some(player => player.id !== editingPlayer.id && TTModels.normalizeName(player.name) === TTModels.normalizeName(name));
    if (duplicate) {
      showToast('Ya existe otro jugador con ese nombre', 'error');
      return;
    }
    const updated = TTModels.createPlayer({ ...editingPlayer, name, updatedAt: new Date().toISOString() });
    setState(current => ({
      ...current,
      players: current.players.map(player => player.id === updated.id ? updated : player),
      draftSessions: current.draftSessions.map(session => session.groupId === activeGroup.id && session.participantIds.includes(updated.id)
        ? { ...session, teamAssignments: null }
        : session)
    }));
    setSwapSelection({ blue: null, red: null });
    setEditingPlayer(null);
    showToast('Jugador actualizado');
  };

  const updatePlayerAlias = (playerId, paymentAlias) => {
    setState(current => ({
      ...current,
      players: current.players.map(player => player.id === playerId
        ? { ...player, paymentAlias, updatedAt: new Date().toISOString() }
        : player)
    }));
  };

  const saveGroup = event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('groupName') || '').trim();
    if (!name) {
      showToast('El grupo necesita un nombre', 'error');
      return;
    }
    setState(current => ({
      ...current,
      groups: current.groups.map(group => group.id === activeGroup.id ? TTModels.createGroup({
        ...group,
        name,
        adminPlayerId: form.get('adminPlayerId') || null,
        usualDay: form.get('usualDay'),
        usualTime: form.get('usualTime'),
        usualVenue: form.get('usualVenue'),
        usualPlayerCount: form.get('usualPlayerCount'),
        updatedAt: new Date().toISOString()
      }) : group)
    }));
    showToast('Datos del grupo guardados');
  };

  const resetExpenseForm = (consumerIds = sessionPlayerIds) => {
    setExpenseDescription('Cancha ⚽');
    setExpenseAmount('');
    setExpenseCategory('court');
    setExpenseConsumers([...consumerIds]);
    setShowSplitOptions(false);
    setEditingExpenseId(null);
  };

  const selectConcept = concept => {
    setExpenseCategory(concept.category);
    setExpenseDescription(concept.description);
    if (!concept.description) window.setTimeout(() => document.getElementById('expense-description')?.focus(), 0);
  };

  const toggleExpenseConsumer = playerId => {
    setExpenseConsumers(current => current.includes(playerId)
      ? current.filter(id => id !== playerId)
      : [...current, playerId]);
  };

  const toggleSplitOptions = () => {
    if (!showSplitOptions && expenseConsumers.length === 0) {
      setExpenseConsumers([...sessionPlayerIds]);
    }
    setShowSplitOptions(current => !current);
  };

  const handleAddExpense = event => {
    event.preventDefault();
    if (sessionPlayers.length === 0) {
      showToast('Primero elegí quiénes juegan', 'error');
      return;
    }
    if (!expenseDescription.trim()) {
      showToast('Contanos qué se pagó', 'error');
      return;
    }
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('El monto debe ser mayor a cero', 'error');
      return;
    }
    if (!expensePayer || !sessionPlayerIds.includes(expensePayer)) {
      showToast('Elegí quién pagó', 'error');
      return;
    }
    const consumerIds = showSplitOptions
      ? expenseConsumers.filter(id => sessionPlayerIds.includes(id))
      : [...sessionPlayerIds];
    if (consumerIds.length === 0) {
      showToast('Elegí al menos una persona para dividir el gasto', 'error');
      return;
    }
    const expense = {
      id: editingExpenseId || TTModels.createId('expense'),
      description: expenseDescription.trim(),
      amount,
      paidById: expensePayer,
      consumerIds,
      category: expenseCategory
    };
    updateSession(session => ({
      ...session,
      expenses: editingExpenseId
        ? session.expenses.map(item => item.id === editingExpenseId ? expense : item)
        : [...session.expenses, expense]
    }));
    resetExpenseForm(sessionPlayerIds);
    showToast(editingExpenseId ? 'Gasto actualizado' : 'Gasto guardado');
  };

  const editExpense = expense => {
    setEditingExpenseId(expense.id);
    setExpenseDescription(expense.description);
    setExpenseAmount(String(expense.amount));
    setExpensePayer(expense.paidById);
    setExpenseConsumers([...expense.consumerIds]);
    setExpenseCategory(expense.category || 'other');
    setShowSplitOptions(expense.consumerIds.length !== sessionPlayerIds.length);
    document.getElementById('expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteExpense = expenseId => {
    updateSession(session => ({ ...session, expenses: session.expenses.filter(expense => expense.id !== expenseId) }));
    if (editingExpenseId === expenseId) resetExpenseForm(sessionPlayerIds);
    showToast('Gasto eliminado', 'info');
  };

  const getSettlementText = () => {
    if (expenses.length === 0) return '';
    let text = `⚽ *TERCER TIEMPO - ${activeGroup.name.toLocaleUpperCase('es-AR')}*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Gasto total:* ${formatCurrency(calculations.totalSpent)}\n`;
    text += `👥 *Jugadores:* ${sessionPlayers.length}\n\n`;
    if (courtSummary.total > 0) {
      text += `⚽ *Cancha:* ${formatCurrency(courtSummary.total)} · ${courtSummary.playerCount} ${courtSummary.playerCount === 1 ? 'jugador' : 'jugadores'} · ${formatCurrency(courtSummary.perPlayer)} por persona\n\n`;
    }
    text += `👉 *¿QUIÉN LE PAGA A QUIÉN?*\n\n`;
    if (calculations.transactions.length === 0) {
      text += '✅ *Las cuentas ya están equilibradas.*\n';
    } else {
      calculations.transactions.forEach(transaction => {
        text += `🔴 *${transaction.from}* paga a *${transaction.to}*${transaction.toAlias ? ` (Alias: ${transaction.toAlias})` : ''}\n`;
        text += `💵 *${formatCurrency(transaction.amountRounded)}*\n`;
        text += `(Monto exacto: ${formatCurrency(transaction.amountExact)})\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      });
    }
    text += '\nGenerado con ⚽ *Tercer Tiempo*';
    return text;
  };

  const shareWhatsApp = () => {
    const text = getSettlementText();
    if (!text) return showToast('Todavía no hay gastos para compartir', 'error');
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SHARE_TEXT', payload: text }));
      return;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const copySettlement = () => {
    const text = getSettlementText();
    if (!text) return showToast('Todavía no hay gastos para copiar', 'error');
    if (!navigator.clipboard?.writeText) return showToast('El portapapeles no está disponible', 'error');
    navigator.clipboard.writeText(text)
      .then(() => showToast('Texto copiado. Ya podés enviarlo.'))
      .catch(() => showToast('No se pudo copiar el texto', 'error'));
  };

  const getDisplayName = player => String(player?.nickname || player?.name || 'Jugador').trim().slice(0, 26);

  const truncateCanvasText = (context, value, maxWidth) => {
    const text = String(value || '');
    if (context.measureText(text).width <= maxWidth) return text;
    let shortened = text;
    while (shortened.length > 1 && context.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1);
    return `${shortened}…`;
  };

  const drawShareCard = ({ kind, bluePlayers, redPlayers, teamLabels = teamNames, score = null, dateText, venue, figure, scorers = [] }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const context = canvas.getContext('2d');
    const width = 1080;
    const rosterRows = Math.max(bluePlayers.length, redPlayers.length, 1);
    const height = kind === 'formation' ? Math.max(1350, 720 + rosterRows * 72) : 1350;
    const pad = 64;
    const cardGap = 24;
    const teamWidth = (width - pad * 2 - cardGap) / 2;
    canvas.width = width;
    canvas.height = height;

    const background = context.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, '#062b20');
    background.addColorStop(0.5, '#0b5c42');
    background.addColorStop(1, '#073f2e');
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
    for (let stripe = 0; stripe < 9; stripe += 1) {
      context.fillStyle = stripe % 2 === 0 ? 'rgba(198, 244, 123, 0.055)' : 'rgba(0, 0, 0, 0.035)';
      context.fillRect(0, stripe * (height / 9), width, height / 9);
    }
    context.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    context.lineWidth = 3;
    context.strokeRect(32, 32, width - 64, height - 64);
    context.beginPath();
    context.moveTo(32, height / 2);
    context.lineTo(width - 32, height / 2);
    context.stroke();
    context.beginPath();
    context.arc(width / 2, height / 2, 112, 0, Math.PI * 2);
    context.stroke();

    context.textAlign = 'left';
    context.fillStyle = '#c6f47b';
    context.font = '900 25px sans-serif';
    context.fillText('⚽  TERCER TIEMPO', pad, 96);
    context.textAlign = 'right';
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.font = '700 20px sans-serif';
    context.fillText(kind === 'formation' ? 'FORMACIÓN' : 'RESULTADO FINAL', width - pad, 96);
    context.textAlign = 'left';
    context.fillStyle = 'white';
    context.font = '900 52px sans-serif';
    context.fillText(truncateCanvasText(context, activeGroup.name, width - pad * 2), pad, 166);
    context.fillStyle = 'rgba(255, 255, 255, 0.72)';
    context.font = '700 24px sans-serif';
    context.fillText(truncateCanvasText(context, [dateText, venue].filter(Boolean).join(' · ') || 'Partido del grupo', width - pad * 2), pad, 210);

    let contentTop = 276;
    if (score) {
      context.fillStyle = 'rgba(255, 255, 255, 0.12)';
      context.fillRect(pad, contentTop, width - pad * 2, 176);
      context.textAlign = 'center';
      context.fillStyle = '#75a8ef';
      context.font = '900 27px sans-serif';
      context.fillText(truncateCanvasText(context, teamLabels.blue, 250), 225, contentTop + 53);
      context.fillStyle = 'white';
      context.font = '900 88px sans-serif';
      context.fillText(String(score.blue), 225, contentTop + 137);
      context.fillStyle = 'rgba(255, 255, 255, 0.66)';
      context.font = '900 30px sans-serif';
      context.fillText('VS', width / 2, contentTop + 102);
      context.fillStyle = '#ff98a5';
      context.font = '900 27px sans-serif';
      context.fillText(truncateCanvasText(context, teamLabels.red, 250), width - 225, contentTop + 53);
      context.fillStyle = 'white';
      context.font = '900 88px sans-serif';
      context.fillText(String(score.red), width - 225, contentTop + 137);
      contentTop += 226;
    }

    const drawTeam = (team, title, players, x, color, accent) => {
      const panelHeight = kind === 'formation' ? Math.max(300, 110 + players.length * 62) : 270;
      context.fillStyle = color;
      context.fillRect(x, contentTop, teamWidth, panelHeight);
      context.fillStyle = accent;
      context.fillRect(x, contentTop, 12, panelHeight);
      context.fillStyle = 'white';
      context.font = '900 31px sans-serif';
      context.textAlign = 'left';
      context.fillText(truncateCanvasText(context, title, teamWidth - 56), x + 34, contentTop + 53);
      context.fillStyle = 'rgba(255, 255, 255, 0.62)';
      context.font = '700 18px sans-serif';
      context.fillText(`${players.length} ${players.length === 1 ? 'jugador' : 'jugadores'}`, x + 34, contentTop + 84);
      if (kind === 'formation') {
        players.forEach((player, index) => {
          const y = contentTop + 125 + index * 62;
          context.fillStyle = 'rgba(255, 255, 255, 0.1)';
          context.fillRect(x + 28, y - 29, teamWidth - 56, 48);
          context.fillStyle = 'rgba(255, 255, 255, 0.55)';
          context.font = '800 16px sans-serif';
          context.fillText(POSITION_LABELS[player.preferredPosition] || 'Jugador', x + 44, y - 1);
          context.fillStyle = 'white';
          context.font = '900 22px sans-serif';
          context.fillText(truncateCanvasText(context, getDisplayName(player), teamWidth - 86), x + 44, y + 21);
        });
      }
    };

    drawTeam('blue', teamLabels.blue, bluePlayers, pad, '#1d579d', '#75a8ef');
    drawTeam('red', teamLabels.red, redPlayers, pad + teamWidth + cardGap, '#a83246', '#ff98a5');

    if (kind === 'result') {
      let detailY = contentTop + 310;
      const detailLines = [];
      if (figure) detailLines.push(`Figura: ${getDisplayName(figure)}`);
      if (scorers.length > 0) detailLines.push(`Goleadores: ${scorers.join(' · ')}`);
      if (detailLines.length === 0) detailLines.push('Un partido más para el grupo.');
      context.fillStyle = 'rgba(255, 255, 255, 0.1)';
      context.fillRect(pad, detailY, width - pad * 2, 142);
      detailLines.slice(0, 2).forEach((line, index) => {
        context.textAlign = 'center';
        context.fillStyle = index === 0 ? '#c6f47b' : 'rgba(255, 255, 255, 0.76)';
        context.font = index === 0 ? '900 27px sans-serif' : '700 20px sans-serif';
        context.fillText(truncateCanvasText(context, line, width - pad * 2 - 50), width / 2, detailY + 51 + index * 48);
      });
    }

    context.textAlign = 'center';
    context.fillStyle = 'rgba(255, 255, 255, 0.62)';
    context.font = '800 18px sans-serif';
    context.fillText('Generado con Tercer Tiempo', width / 2, height - 64);
    return canvas;
  };

  const shareGeneratedCard = (canvas, filename) => {
    if (!canvas) return;
    const fallbackDownload = () => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Tarjeta guardada. Ya podés enviarla por WhatsApp.');
    };
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DOWNLOAD_IMAGE', payload: canvas.toDataURL('image/png') }));
      showToast('Tarjeta lista para compartir.');
      return;
    }
    if (!navigator.share || !canvas.toBlob || typeof File === 'undefined') {
      fallbackDownload();
      return;
    }
    canvas.toBlob(async blob => {
      if (!blob) return fallbackDownload();
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && !navigator.canShare({ files: [file] })) return fallbackDownload();
      try {
        await navigator.share({ files: [file], title: 'Tercer Tiempo' });
        showToast('Elegí WhatsApp para enviar la tarjeta.');
      } catch (error) {
        if (error?.name !== 'AbortError') fallbackDownload();
      }
    }, 'image/png');
  };

  const shareCurrentFormation = () => {
    if (!teamAssignments) return showToast('Primero armá los equipos', 'error');
    const card = drawShareCard({
      kind: 'formation',
      bluePlayers: blueTeam,
      redPlayers: redTeam,
      dateText: [DAY_LABELS[activeGroup.usualDay], activeGroup.usualTime].filter(Boolean).join(' · '),
      venue: activeGroup.usualVenue
    });
    shareGeneratedCard(card, `formacion-${Date.now()}.png`);
  };

  const shareMatchResult = match => {
    const getTeamPlayers = team => TTTeamBuilder.sortPlayersForLineup(
      (match[team === 'blue' ? 'bluePlayerIds' : 'redPlayerIds'] || [])
        .map(id => TTMatchHistory.getPlayerSnapshot(match, id))
        .filter(Boolean)
    );
    const figure = TTMatchHistory.getPlayerSnapshot(match, match.playerOfTheMatchId);
    const scorers = (match.scorers || []).map(entry => {
      const player = TTMatchHistory.getPlayerSnapshot(match, entry.playerId);
      return player && entry.goals > 0 ? `${getDisplayName(player)} (${entry.goals})` : '';
    }).filter(Boolean);
    const card = drawShareCard({
      kind: 'result',
      bluePlayers: getTeamPlayers('blue'),
      redPlayers: getTeamPlayers('red'),
      teamLabels: match.teamNames,
      score: { blue: match.result.blueScore, red: match.result.redScore },
      dateText: TTMatchHistory.formatMatchDate(match.playedOn),
      venue: match.venue,
      figure,
      scorers
    });
    shareGeneratedCard(card, `resultado-${match.playedOn}.png`);
  };

  const downloadReceipt = () => {
    const canvas = canvasRef.current;
    if (!canvas || expenses.length === 0) return;
    const context = canvas.getContext('2d');
    const width = 600;
    const rowHeight = 92;
    const height = 190 + Math.max(1, calculations.transactions.length) * rowHeight + 90;
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#073f2e';
    context.fillRect(0, 0, width, 16);
    context.textAlign = 'center';
    context.fillStyle = '#13241d';
    context.font = 'bold 26px sans-serif';
    context.fillText('⚽ TERCER TIEMPO', width / 2, 58);
    context.font = 'bold 18px sans-serif';
    context.fillText(activeGroup.name, width / 2, 88);
    context.fillStyle = '#66766e';
    context.font = '16px sans-serif';
    context.fillText(`${formatCurrency(calculations.totalSpent)} · ${sessionPlayers.length} jugadores`, width / 2, 118);
    context.font = '13px sans-serif';
    context.fillText('Montos sugeridos redondeados a la centena', width / 2, 143);
    let y = 180;
    if (calculations.transactions.length === 0) {
      context.fillStyle = '#11845d';
      context.font = 'bold 18px sans-serif';
      context.fillText('Las cuentas ya están equilibradas', width / 2, y + 35);
      y += rowHeight;
    } else {
      calculations.transactions.forEach(transaction => {
        context.fillStyle = '#f2f6f1';
        context.fillRect(30, y, width - 60, rowHeight - 12);
        context.textAlign = 'left';
        context.fillStyle = '#c83f4f';
        context.font = 'bold 16px sans-serif';
        context.fillText(transaction.from, 48, y + 31);
        context.fillStyle = '#66766e';
        context.font = '12px sans-serif';
        context.fillText('paga', 48, y + 51);
        context.textAlign = 'center';
        context.fillStyle = '#073f2e';
        context.font = 'bold 21px sans-serif';
        context.fillText(formatCurrency(transaction.amountRounded), width / 2, y + 42);
        context.textAlign = 'right';
        context.fillStyle = '#11845d';
        context.font = 'bold 16px sans-serif';
        context.fillText(transaction.to, width - 48, y + 31);
        context.fillStyle = '#66766e';
        context.font = '12px sans-serif';
        context.fillText(transaction.toAlias || 'sin alias cargado', width - 48, y + 51);
        y += rowHeight;
      });
    }
    context.textAlign = 'center';
    context.fillStyle = '#66766e';
    context.font = 'bold 13px sans-serif';
    context.fillText('Generado con Tercer Tiempo · Lea Rama Dev', width / 2, height - 38);
    const image = canvas.toDataURL('image/png');
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DOWNLOAD_IMAGE', payload: image }));
      return;
    }
    const link = document.createElement('a');
    link.download = `liquidacion-${Date.now()}.png`;
    link.href = image;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Imagen guardada. Ya podés compartirla.');
  };

  const navItems = [
    { id: 'home', label: 'Inicio', icon: <IconHome />, enabled: true },
    { id: 'match', label: 'Partido', icon: <IconCalendar />, enabled: true },
    { id: 'players', label: 'Jugadores', icon: <IconUsers />, enabled: canUse('playerProfiles') },
    { id: 'history', label: 'Historial', icon: <IconHistory />, enabled: canUse('history') },
    { id: 'group', label: 'Grupo', icon: <IconShield />, enabled: canUse('groups') }
  ].filter(item => item.enabled);

  const activeNavView = activeView === 'expenses' ? 'match' : activeView;

  const NavButtons = () => <>{navItems.map(item => (
    <button
      key={item.id}
      className={`nav-button ${activeNavView === item.id ? 'is-active' : ''}`}
      type="button"
      onClick={() => changeView(item.id)}
      aria-current={activeNavView === item.id ? 'page' : undefined}
    >
      <span className="nav-icon">{item.icon}</span>
      <span>{item.label}</span>
    </button>
  ))}</>;

  const CourtSummary = ({ compact = false }) => {
    if (courtSummary.total <= 0) return null;
    return <section className={`court-summary ${compact ? 'is-compact' : 'card'}`} aria-label="Resumen de cancha">
      <div className="court-summary-heading"><span>⚽ Cancha</span><strong>{formatCurrency(courtSummary.total)}</strong></div>
      <div className="court-summary-metrics">
        <div><small>Jugadores</small><strong>{courtSummary.playerCount}</strong></div>
        <div><small>Por persona</small><strong>{formatCurrency(courtSummary.perPlayer)}</strong></div>
      </div>
      <p>Referencia según quienes participan de la cancha.</p>
    </section>;
  };

  const SettlementContent = ({ closable = false }) => {
    const creditors = sessionPlayers.filter(player => calculations.transactions.some(transaction => transaction.toId === player.id));
    return <div className="sheet settlement-sheet">
      <div className="sheet-handle" aria-hidden="true"></div>
      <div className="editor-heading">
        <div>
          <span className="eyebrow">Liquidación en vivo</span>
          <h2>Así quedan las cuentas</h2>
          <p>Se actualiza con cada gasto.</p>
        </div>
        {closable && <button className="sheet-close" type="button" onClick={() => setIsSettlementOpen(false)} aria-label="Cerrar">×</button>}
      </div>
      <div className="scoreboard">
        <div className="score-cell"><span>Total</span><strong>{formatCurrency(calculations.totalSpent)}</strong></div>
        <div className="score-cell"><span>Juegan</span><strong>{sessionPlayers.length}</strong></div>
        <div className="score-cell"><span>Pagos</span><strong>{calculations.transactions.length}</strong></div>
      </div>
      <CourtSummary compact />
      {expenses.length === 0 ? (
        <div className="settlement-empty">Cargá un gasto y acá aparecerá quién le paga a quién.</div>
      ) : calculations.transactions.length === 0 ? (
        <div className="settlement-empty">Las cuentas ya están equilibradas. Nadie tiene que transferir.</div>
      ) : (
        <div className="transfer-list">
          {calculations.transactions.map((transaction, index) => (
            <div className="transfer-row" key={`${transaction.fromId}-${transaction.toId}-${index}`}>
              <div className="transfer-person"><strong>{transaction.from}</strong><span>paga</span></div>
              <div className="transfer-amount">{formatCurrency(transaction.amountRounded)} →</div>
              <div className="transfer-person"><strong>{transaction.to}</strong><span>recibe</span></div>
            </div>
          ))}
        </div>
      )}
      {creditors.length > 0 && <div className="alias-section">
        <h3>Alias para cobrar</h3>
        <p>Solo aparecen quienes reciben una transferencia.</p>
        {creditors.map(player => (
          <div className="alias-row" key={player.id}>
            <label htmlFor={`alias-${player.id}`}>{player.name}</label>
            <input id={`alias-${player.id}`} value={player.paymentAlias || ''} onChange={event => updatePlayerAlias(player.id, event.target.value)} placeholder="Alias, CBU o CVU" />
          </div>
        ))}
      </div>}
      {expenses.length > 0 && <div className="share-actions">
        <button className="primary-button is-whatsapp" type="button" onClick={shareWhatsApp}><IconShare /> Enviar por WhatsApp</button>
        <div className="share-actions-secondary">
          <button className="secondary-button" type="button" onClick={copySettlement}><IconCopy /> Copiar</button>
          <button className="secondary-button" type="button" onClick={downloadReceipt}><IconDownload /> Ticket</button>
        </div>
      </div>}
    </div>;
  };

  const TeamBuilderContent = () => {
    const blueMetrics = TTTeamBuilder.getMetrics(blueTeam);
    const redMetrics = TTTeamBuilder.getMetrics(redTeam);
    const ratingDifference = Math.abs(blueMetrics.rating - redMetrics.rating);
    const canSwap = Boolean(swapSelection.blue && swapSelection.red);

    const TeamPanel = ({ team, players, selectedId }) => <section className={`team-panel is-${team}`}>
      <div className="team-panel-heading">
        <label className="team-name-field">
          <span>{team === 'blue' ? 'Equipo azul' : 'Equipo rojo'} · Tocá para editar</span>
          <input
            aria-label={`Nombre del equipo ${team === 'blue' ? 'azul' : 'rojo'}`}
            maxLength="24"
            value={teamNames[team]}
            onChange={event => updateTeamName(team, event.target.value)}
            onBlur={finishTeamNameEdit}
          />
        </label>
        <div className="team-total"><strong>{players.length}</strong><span>jugadores</span></div>
      </div>
      {players.length === 0 ? <div className="team-empty">Mové un jugador a este equipo o regenerá la propuesta.</div> : <div className="team-player-list">
        {players.map(player => {
          const selected = selectedId === player.id;
          return <article className={`team-player ${selected ? 'is-selected' : ''}`} key={player.id}>
            <button className="team-player-select" type="button" onClick={() => selectPlayerForSwap(team, player.id)} aria-pressed={selected}>
              <span className="team-avatar">{player.name.charAt(0).toUpperCase()}</span>
              <span className="team-player-copy"><strong>{player.nickname || player.name}</strong><small>{POSITION_LABELS[player.preferredPosition]}</small></span>
              <span className="swap-check">{selected ? <IconCheck /> : <IconSwap />}</span>
            </button>
            <button className="team-move" type="button" onClick={() => moveTeamPlayer(player.id, team)} aria-label={`Mover ${player.name} a ${team === 'blue' ? teamNames.red : teamNames.blue}`}>
              {team === 'blue' ? <IconArrowRight /> : <IconArrowLeft />}
            </button>
          </article>;
        })}
      </div>}
    </section>;

    return <section className="card team-builder-card" id="team-builder">
      <div className="card-heading">
        <div><span className="eyebrow">Equipos equilibrados</span><h2>Armá los equipos</h2><p>La propuesta considera nivel, posición y arqueros. Después podés cambiar todo manualmente.</p></div>
        <span className="count-badge">{sessionPlayers.length}</span>
      </div>
      {sessionPlayers.length < 2 ? <div className="empty-state">Elegí al menos dos jugadores para generar una formación.</div> : !teamAssignments ? <div className="team-builder-start">
        <div className="team-builder-pitch"><IconShield /><strong>Listos para dividir</strong><span>{sessionPlayers.length} jugadores seleccionados</span></div>
        <button className="primary-button" type="button" onClick={generateTeams}><IconShield /> Armar equipos</button>
      </div> : <>
        <div className="balance-summary">
          <span>{teamAssignments.manuallyEdited ? 'Equipos editados manualmente' : 'Propuesta automática'}</span>
          <strong>{ratingDifference <= 1 ? 'Balance parejo' : 'Balance aproximado'}</strong>
        </div>
        <div className="teams-grid">
          <TeamPanel team="blue" players={blueTeam} selectedId={swapSelection.blue} />
          <div className="versus-badge" aria-hidden="true">VS</div>
          <TeamPanel team="red" players={redTeam} selectedId={swapSelection.red} />
        </div>
        <p className="swap-help">Para intercambiar, elegí un jugador de cada equipo. También podés moverlos directamente con la flecha.</p>
        <div className="team-builder-actions">
          <button className="secondary-button" type="button" onClick={generateTeams}><IconRefresh /> Regenerar</button>
          <button className="primary-button" type="button" onClick={swapTeamPlayers} disabled={!canSwap}><IconSwap /> Intercambiar elegidos</button>
          {canUse('shareCards') && <button className="secondary-button share-formation-button" type="button" onClick={shareCurrentFormation}><IconShare /> Compartir formación</button>}
        </div>
      </>}
    </section>;
  };

  const HomeView = () => {
    const administrator = groupPlayers.find(player => player.id === activeGroup.adminPlayerId);
    return <>
      <div className="view-header">
        <div>
          <span className="eyebrow">El grupo de fútbol</span>
          <h1>{activeGroup.name}</h1>
          <p>Tu punto de partida para organizar el próximo encuentro.</p>
        </div>
      </div>
      <div className="home-dashboard">
        <section className="group-hero home-match-hero">
          <span className="hero-kicker">Próximo partido</span>
          <strong>{DAY_LABELS[activeGroup.usualDay] || 'Día a definir'}{activeGroup.usualTime ? ` · ${activeGroup.usualTime}` : ''}</strong>
          <span>{activeGroup.usualVenue || 'Cancha a definir'}</span>
          <div className="group-metrics">
            <div className="group-metric"><small>Seleccionados</small><b>{sessionPlayers.length}</b></div>
            <div className="group-metric"><small>Habitual</small><b>{activeGroup.usualPlayerCount}</b></div>
            <div className="group-metric"><small>Plantel activo</small><b>{activeRoster.length}</b></div>
          </div>
          <button className="hero-button" type="button" onClick={() => changeView('match')}><IconCalendar /> Organizar partido</button>
        </section>

        <section className="card home-group-card">
          <div className="card-heading">
            <div><span className="eyebrow">Tu grupo</span><h2>Todo en su momento</h2><p>Primero se organiza el partido. El tercer tiempo aparece después de jugar.</p></div>
          </div>
          <div className="home-flow" aria-label="Recorrido del partido">
            <div className="flow-step is-current"><span>1</span><div><strong>Organizar</strong><small>Elegir quiénes juegan</small></div></div>
            <div className="flow-step"><span>2</span><div><strong>Jugar</strong><small>Disfrutar el partido</small></div></div>
            <div className="flow-step"><span>3</span><div><strong>Registrar</strong><small>Guardar resultado y figura</small></div></div>
            <div className="flow-step"><span>4</span><div><strong>Tercer tiempo</strong><small>Cargar y dividir gastos</small></div></div>
          </div>
          <div className="home-quick-actions">
            <button className="secondary-button" type="button" onClick={() => changeView('players')}><IconUsers /> Ver jugadores</button>
            <button className="secondary-button" type="button" onClick={() => changeView('group')}><IconShield /> Editar grupo</button>
          </div>
          <p className="home-admin">Administrador: <strong>{administrator?.nickname || administrator?.name || 'Sin asignar'}</strong></p>
        </section>

        {canUse('expenses') && expenses.length > 0 && <section className="card pending-third-time">
          <span className="expense-icon"><IconReceipt /></span>
          <div><span className="eyebrow">Tercer tiempo pendiente</span><strong>Hay {expenses.length} {expenses.length === 1 ? 'gasto cargado' : 'gastos cargados'}</strong><p>Podés retomar las cuentas sin perder lo que ya registraste.</p></div>
          <button className="secondary-button" type="button" onClick={() => changeView('expenses')}>Continuar</button>
        </section>}
      </div>
    </>;
  };

  const MatchView = () => {
    const selectablePlayers = groupPlayers.filter(player => player.active || sessionPlayerIds.includes(player.id));
    return <>
      <div className="view-header">
        <div>
          <span className="eyebrow">Antes de jugar</span>
          <h1>Próximo partido</h1>
          <p>Elegí quiénes juegan. Los gastos quedan para el tercer tiempo.</p>
        </div>
        <div className="group-pill"><span>Grupo activo</span><strong>{activeGroup.name}</strong></div>
      </div>
      <div className="match-layout is-roster-only">
        <section className="card">
            <div className="card-heading">
              <div><span className="eyebrow">Convocatoria</span><h2>¿Quiénes juegan hoy?</h2><p>El plantel queda guardado para los próximos partidos.</p></div>
              <span className="count-badge">{sessionPlayers.length}</span>
            </div>
            <div className="match-summary">
              <div className="match-stat"><span>Juegan</span><strong>{sessionPlayers.length}</strong></div>
              <div className="match-stat"><span>Plantel</span><strong>{activeRoster.length}</strong></div>
              <div className="match-stat is-highlight"><span>Meta</span><strong>{activeGroup.usualPlayerCount}</strong></div>
            </div>
            <div className="schedule-line"><IconCalendar /><span>{scheduleText}</span></div>
            <form className="inline-form" onSubmit={handleQuickAdd} style={{ marginTop: '0.8rem' }}>
              <input value={quickNames} onChange={event => setQuickNames(event.target.value)} placeholder="Mati, Lucho, Nico..." aria-label="Nombres para sumar al partido" />
              <button className="primary-button" type="submit"><IconPlus /> Sumar</button>
            </form>
            {selectablePlayers.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '0.8rem' }}>Sumá el primer jugador para empezar.</div>
            ) : (
              <div className="participant-picker" aria-label="Jugadores del partido">
                {selectablePlayers.map(player => {
                  const selected = sessionPlayerIds.includes(player.id);
                  return <button key={player.id} className={`participant-button ${selected ? 'is-selected' : ''}`} type="button" onClick={() => toggleParticipant(player.id)} aria-pressed={selected}>
                    <span>{player.nickname || player.name}</span>
                    <span className="participant-check">{selected && <IconCheck />}</span>
                  </button>;
                })}
              </div>
            )}
            {groupPlayers.length > 0 && <div className="section-actions">
              <button className="secondary-button" type="button" onClick={handleNewMatch}><IconPlus /> Nuevo partido</button>
              <button className="text-button" type="button" onClick={handleClearCurrentMatch}>Vaciar partido actual</button>
            </div>}
        </section>

      </div>
      {canUse('teamBuilder') && <TeamBuilderContent />}
      <div className="post-match-actions">
        {canUse('history') && <section className="card after-match-card match-result-card">
          <span className="post-match-icon"><IconHistory /></span>
          <div>
            <span className="eyebrow">Cuando termine</span>
            <h2>{archivedMatch ? 'Resultado guardado' : 'Guardar el resultado'}</h2>
            <p>Registrá el marcador, la figura y una nota para sumar el partido al historial.</p>
          </div>
          <button className="primary-button" type="button" onClick={openMatchEditor} disabled={!teamAssignments}>
            <IconHistory /> {archivedMatch ? 'Editar resultado' : 'Registrar partido'}
          </button>
          {!teamAssignments && <small>Primero armá los equipos para registrar el partido.</small>}
        </section>}
        {canUse('expenses') && <section className="card after-match-card match-third-time-card">
          <span className="post-match-icon"><IconReceipt /></span>
          <div>
            <span className="eyebrow">Después de jugar</span>
            <h2>Ahora sí: tercer tiempo</h2>
            <p>Cargá la cancha, las bebidas o la comida y dividí las cuentas.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => changeView('expenses')} disabled={sessionPlayers.length === 0}>
            <IconReceipt /> {expenses.length > 0 ? 'Continuar tercer tiempo' : 'Abrir tercer tiempo'}
          </button>
          {sessionPlayers.length === 0 && <small>Elegí al menos un jugador para continuar.</small>}
        </section>}
      </div>
    </>;
  };

  const ExpensesView = () => <>
    <div className="view-header">
      <div>
        <span className="eyebrow">Después de jugar</span>
        <h1>Tercer tiempo</h1>
        <p>Cargá los gastos del encuentro y cerrá las cuentas del grupo.</p>
      </div>
      <button className="secondary-button back-to-match" type="button" onClick={() => changeView('match')}><IconArrowLeft /> Partido</button>
    </div>
    <div className="dashboard-grid">
      <div className="expenses-column">
        <CourtSummary />
          <section id="expense-form" className="card">
            <div className="card-heading">
              <div><span className="eyebrow">Gastos</span><h2>¿Qué se pagó?</h2><p>Elegí el concepto, quién pagó y el monto.</p></div>
              {editingExpenseId && <span className="count-badge">Editando</span>}
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="concept-grid" aria-label="Conceptos rápidos">
                {QUICK_CONCEPTS.map(concept => <button key={concept.category} className={`concept-button ${expenseCategory === concept.category ? 'is-selected' : ''}`} type="button" onClick={() => selectConcept(concept)}>
                  {concept.icon}<span>{concept.label}</span>
                </button>)}
              </div>
              <div className="field-group">
                <label htmlFor="expense-description">Detalle</label>
                <input id="expense-description" value={expenseDescription} onChange={event => setExpenseDescription(event.target.value)} placeholder="Ej. Cancha, cerveza o comida" disabled={sessionPlayers.length === 0} />
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <label htmlFor="expense-payer">Pagó</label>
                  <select id="expense-payer" value={expensePayer} onChange={event => setExpensePayer(event.target.value)} disabled={sessionPlayers.length === 0}>
                    {sessionPlayers.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="expense-amount">Monto</label>
                  <input id="expense-amount" type="number" inputMode="decimal" min="0" step="0.01" value={expenseAmount} onChange={event => setExpenseAmount(event.target.value)} placeholder="$ 0" disabled={sessionPlayers.length === 0} />
                </div>
              </div>
              <button className="split-toggle" type="button" onClick={toggleSplitOptions} aria-expanded={showSplitOptions} disabled={sessionPlayers.length === 0}>
                <span>{showSplitOptions ? 'Elegí quiénes participan del gasto' : 'Se divide entre todo el equipo'}</span>
                <span>{showSplitOptions ? 'Ocultar' : 'Cambiar'}</span>
              </button>
              {showSplitOptions && <div className="participant-picker" aria-label="Participantes del gasto">
                {sessionPlayers.map(player => {
                  const selected = expenseConsumers.includes(player.id);
                  return <button key={player.id} className={`participant-button ${selected ? 'is-selected' : ''}`} type="button" onClick={() => toggleExpenseConsumer(player.id)} aria-pressed={selected}>
                    <span>{player.nickname || player.name}</span><span className="participant-check">{selected && <IconCheck />}</span>
                  </button>;
                })}
              </div>}
              <div className="composer-actions">
                <button className="primary-button" type="submit" disabled={sessionPlayers.length === 0}>{editingExpenseId ? <><IconCheck /> Guardar cambios</> : <><IconPlus /> Guardar gasto</>}</button>
                {editingExpenseId && <button className="secondary-button" type="button" onClick={() => resetExpenseForm(sessionPlayerIds)}>Cancelar</button>}
              </div>
            </form>
          </section>

          <section className="card expenses-card">
            <div className="card-heading">
              <div><span className="eyebrow">Movimientos</span><h2>Gastos del partido</h2><p>{expenses.length === 0 ? 'Todavía no cargaste ninguno.' : 'Podés corregir cualquier gasto.'}</p></div>
              <span className="count-badge">{expenses.length}</span>
            </div>
            {expenses.length === 0 ? <div className="empty-state">El primer gasto aparecerá acá y las cuentas se calcularán automáticamente.</div> : <div className="expense-list">
              {expenses.map(expense => {
                const payer = sessionPlayers.find(player => player.id === expense.paidById);
                const everyone = expense.consumerIds.length === sessionPlayerIds.length;
                return <article className="expense-row" key={expense.id}>
                  <span className="expense-icon">{EXPENSE_CATEGORIES[expense.category]?.icon || <IconCoins />}</span>
                  <div className="expense-copy"><strong>{expense.description}</strong><span>Pagó {payer?.name || 'Sin asignar'} · {everyone ? 'Entre todos' : `Entre ${expense.consumerIds.length}`}</span></div>
                  <div className="expense-end"><strong>{formatCurrency(expense.amount)}</strong><div className="expense-actions"><button className="expense-action" type="button" onClick={() => editExpense(expense)}>Editar</button><button className="expense-action is-danger" type="button" onClick={() => deleteExpense(expense.id)}>Borrar</button></div></div>
                </article>;
              })}
            </div>}
          </section>
      </div>
      <aside className="desktop-settlement">{SettlementContent({})}</aside>
    </div>
  </>;

  const HistoryView = () => {
    const HistoryTeam = ({ match, team }) => {
      const playerIds = team === 'blue' ? match.bluePlayerIds : match.redPlayerIds;
      const outcome = TTMatchHistory.getOutcome(match);
      return <div className={`history-team is-${team} ${outcome === team ? 'is-winner' : ''}`}>
        <div className="history-team-score">
          <span>{match.teamNames[team]}</span>
          <strong>{team === 'blue' ? match.result.blueScore : match.result.redScore}</strong>
        </div>
        <ol className="history-player-list">
          {playerIds.map(playerId => {
            const player = TTMatchHistory.getPlayerSnapshot(match, playerId);
            return player && <li key={playerId}><span>{player.nickname || player.name}</span><small>{POSITION_LABELS[player.preferredPosition]}</small></li>;
          })}
        </ol>
      </div>;
    };

    const StatisticsPanel = () => {
      const { summary, players, recognitions } = groupStatistics;
      const statsById = new Map(players.map(player => [player.playerId, player]));
      const getRecognitionNames = recognition => recognition.playerIds
        .map(playerId => {
          const player = statsById.get(playerId);
          return player ? player.nickname || player.name : '';
        })
        .filter(Boolean)
        .join(', ');
      const sortedPlayers = [...players].sort((left, right) => {
        if (left.active !== right.active) return left.active ? -1 : 1;
        return (left.nickname || left.name).localeCompare(right.nickname || right.name, 'es-AR');
      });
      const lastOutcomeLabel = {
        win: 'victoria',
        draw: 'empate',
        loss: 'derrota'
      };

      if (summary.matchesPlayed === 0) {
        return <section className="card history-empty statistics-empty">
          <span className="post-match-icon"><IconStats /></span>
          <h2>Las estadísticas arrancan con el primer resultado</h2>
          <p>Guardá un partido terminado y la app hará las cuentas automáticamente.</p>
          <button className="primary-button" type="button" onClick={() => changeView('match')}><IconCalendar /> Organizar partido</button>
        </section>;
      }

      return <div className="statistics-view">
        <section className="statistics-summary" aria-label="Resumen del grupo">
          <article><span>Partidos</span><strong>{summary.matchesPlayed}</strong></article>
          <article><span>Goles del grupo</span><strong>{summary.totalGoals}</strong></article>
          <article><span>Goles por partido</span><strong>{summary.goalsPerMatch.toLocaleString('es-AR')}</strong></article>
          <article><span>Figuras elegidas</span><strong>{summary.figuresChosen}</strong></article>
        </section>

        <section className="card recognition-section">
          <div className="card-heading"><div><span className="eyebrow">Distinciones del vestuario</span><h2>Para compartir y divertirse</h2><p>Sin tablas rígidas ni puestos: sólo pequeños reconocimientos del grupo.</p></div></div>
          <div className="recognition-grid">
            <article className="recognition-card">
              <span className="recognition-emoji" aria-hidden="true">👟</span>
              <div><small>Más presente</small><strong>{getRecognitionNames(recognitions.mostPresent) || 'A estrenar'}</strong><span>{recognitions.mostPresent.value > 0 ? `${recognitions.mostPresent.value} ${recognitions.mostPresent.value === 1 ? 'partido' : 'partidos'}` : 'Todavía sin partidos'}</span></div>
            </article>
            <article className="recognition-card">
              <span className="recognition-emoji" aria-hidden="true">⭐</span>
              <div><small>Más veces figura</small><strong>{getRecognitionNames(recognitions.mostFigures) || 'Sin elegir todavía'}</strong><span>{recognitions.mostFigures.value > 0 ? `${recognitions.mostFigures.value} ${recognitions.mostFigures.value === 1 ? 'distinción' : 'distinciones'}` : 'Podés elegirla al guardar un resultado'}</span></div>
            </article>
            <article className="recognition-card">
              <span className="recognition-emoji" aria-hidden="true">🔥</span>
              <div><small>Buena racha</small><strong>{getRecognitionNames(recognitions.currentUnbeaten) || 'Se está armando'}</strong><span>{recognitions.currentUnbeaten.value >= 2 ? `${recognitions.currentUnbeaten.value} partidos sin perder` : 'Aparece desde dos partidos sin perder'}</span></div>
            </article>
            {summary.matchesWithRegisteredScorers > 0 && <article className="recognition-card">
              <span className="recognition-emoji" aria-hidden="true">⚽</span>
              <div><small>Goleador registrado</small><strong>{getRecognitionNames(recognitions.topScorer) || 'Sin goles asignados'}</strong><span>{recognitions.topScorer.value > 0 ? `${recognitions.topScorer.value} ${recognitions.topScorer.value === 1 ? 'gol cargado' : 'goles cargados'}` : 'Hay partidos con registro abierto'}</span></div>
            </article>}
          </div>
        </section>

        <section className="card player-statistics-section">
          <div className="card-heading"><div><span className="eyebrow">La temporada del grupo</span><h2>Jugador por jugador</h2><p>Las cifras se recalculan cada vez que editás un resultado.</p></div><span className="count-badge">{players.filter(player => player.played > 0).length}</span></div>
          <div className="player-stat-list">
            {sortedPlayers.map(player => {
              const displayName = player.nickname || player.name;
              const streakText = player.played === 0
                ? 'Todavía sin partidos registrados'
                : player.currentUnbeatenStreak >= 2
                  ? `${player.currentUnbeatenStreak} partidos sin perder`
                  : `Último: ${lastOutcomeLabel[player.lastOutcome]}`;
              return <article className={`player-stat-card ${player.active ? '' : 'is-inactive'}`} key={player.playerId}>
                <div className="player-stat-heading">
                  <span className="avatar" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
                  <div><strong>{displayName}</strong><span>{POSITION_LABELS[player.preferredPosition] || 'Polifuncional'}{player.active ? '' : ' · Inactivo'}</span></div>
                  {summary.matchesWithRegisteredScorers > 0 && <span className="player-goal-tally" aria-label={`${player.registeredGoals} goles cargados`}>⚽ {player.registeredGoals}</span>}
                </div>
                <div className="player-stat-metrics">
                  <div><small>PJ</small><strong>{player.played}</strong></div>
                  <div><small>V-E-D</small><strong>{player.wins}-{player.draws}-{player.losses}</strong></div>
                  <div><small>Victorias</small><strong>{player.winPercentage}%</strong></div>
                  <div><small>Figuras</small><strong>{player.figures}</strong></div>
                </div>
                <p className="player-streak">{streakText}</p>
              </article>;
            })}
          </div>
          <p className="statistics-note">{summary.matchesWithRegisteredScorers > 0 ? `Hay goleadores cargados en ${summary.matchesWithRegisteredScorers} ${summary.matchesWithRegisteredScorers === 1 ? 'partido' : 'partidos'}. Los encuentros sin carga no se interpretan como cero goles.` : 'Todavía no se cargaron goleadores. Podés hacerlo de forma opcional al guardar o editar un resultado.'}</p>
        </section>
      </div>;
    };

    const showingStatistics = historyTab === 'statistics' && canUse('statistics');

    return <>
      <div className="view-header">
        <div><span className="eyebrow">Actividad del grupo</span><h1>{showingStatistics ? 'Estadísticas' : 'Historial'}</h1><p>{showingStatistics ? 'Números simples y recreativos, calculados desde los partidos guardados.' : 'Los resultados del grupo, sin convertir el fútbol en una planilla.'}</p></div>
        <div className="group-pill"><span>{showingStatistics ? 'Temporada' : 'Guardados'}</span><strong>{groupMatches.length} {groupMatches.length === 1 ? 'partido' : 'partidos'}</strong></div>
      </div>
      {canUse('statistics') && <div className="history-tabs" role="tablist" aria-label="Actividad del grupo">
        <button className={showingStatistics ? '' : 'is-active'} type="button" role="tab" aria-selected={!showingStatistics} onClick={() => setHistoryTab('matches')}><IconHistory /> Partidos</button>
        <button className={showingStatistics ? 'is-active' : ''} type="button" role="tab" aria-selected={showingStatistics} onClick={() => setHistoryTab('statistics')}><IconStats /> Estadísticas</button>
      </div>}
      {showingStatistics ? <StatisticsPanel /> : groupMatches.length === 0 ? <section className="card history-empty">
        <span className="post-match-icon"><IconHistory /></span>
        <h2>Todavía no hay partidos guardados</h2>
        <p>Cuando termine el próximo, registrá el resultado y aparecerá acá.</p>
        <button className="primary-button" type="button" onClick={() => changeView('match')}><IconCalendar /> Organizar partido</button>
      </section> : <div className="history-list">
        {groupMatches.map(match => {
          const figure = TTMatchHistory.getPlayerSnapshot(match, match.playerOfTheMatchId);
          const scorers = (match.scorers || []).map(entry => {
            const player = TTMatchHistory.getPlayerSnapshot(match, entry.playerId);
            return player ? `${player.nickname || player.name} (${entry.goals})` : '';
          }).filter(Boolean);
          const isCurrent = draftSession.archivedMatchId === match.id;
          return <article className={`history-card ${isCurrent ? 'is-current' : ''}`} key={match.id}>
            <header className="history-card-header">
              <div><span>{TTMatchHistory.formatMatchDate(match.playedOn)}</span><small>{match.venue || 'Cancha sin registrar'}</small></div>
              {isCurrent && <span className="history-current-badge">Partido actual</span>}
            </header>
            <div className="history-scoreboard" aria-label={`${match.teamNames.blue} ${match.result.blueScore}, ${match.teamNames.red} ${match.result.redScore}`}>
              <div className={`history-score-team is-blue ${TTMatchHistory.getOutcome(match) === 'blue' ? 'is-winner' : ''}`}><span>{match.teamNames.blue}</span><strong>{match.result.blueScore}</strong></div>
              <div className="history-final"><strong>Final</strong><span>{TTMatchHistory.getOutcomeLabel(match)}</span></div>
              <div className={`history-score-team is-red ${TTMatchHistory.getOutcome(match) === 'red' ? 'is-winner' : ''}`}><span>{match.teamNames.red}</span><strong>{match.result.redScore}</strong></div>
            </div>
            <div className="history-meta">
              <span><strong>Figura:</strong> {figure ? figure.nickname || figure.name : 'Sin elegir'}</span>
              <span><strong>Jugaron:</strong> {match.players.length}</span>
            </div>
            {match.scorersRecorded && <div className="history-scorers"><strong>⚽ Goleadores:</strong><span>{scorers.length > 0 ? scorers.join(' · ') : 'Sin goles asignados'}</span></div>}
            {match.observations && <p className="history-observations">{match.observations}</p>}
            <details className="history-details">
              <summary>Ver equipos y posiciones</summary>
              <div className="history-lineups"><HistoryTeam match={match} team="blue" /><HistoryTeam match={match} team="red" /></div>
            </details>
            <div className="history-card-actions">
              {canUse('shareCards') && <button className="secondary-button" type="button" onClick={() => shareMatchResult(match)}><IconShare /> Compartir resultado</button>}
              {isCurrent && <button className="secondary-button history-edit-button" type="button" onClick={openMatchEditor}>Editar este resultado</button>}
            </div>
          </article>;
        })}
      </div>}
    </>;
  };

  const PlayersView = () => {
    const visiblePlayers = groupPlayers.filter(player => rosterFilter === 'all' || (rosterFilter === 'active' ? player.active : !player.active));
    return <>
      <div className="view-header">
        <div><span className="eyebrow">Plantel permanente</span><h1>Jugadores</h1><p>Guardalos una vez y usalos en todos los partidos.</p></div>
        <div className="group-pill"><span>Activos</span><strong>{activeRoster.length} de {groupPlayers.length}</strong></div>
      </div>
      <section className="card">
        <div className="card-heading">
          <div><h2>Sumar jugadores</h2><p>Podés escribir varios nombres separados por comas.</p></div>
          <span className="count-badge">{groupPlayers.length}</span>
        </div>
        <div className="roster-toolbar">
          <form className="inline-form" onSubmit={handleRosterAdd}>
            <input value={rosterNames} onChange={event => setRosterNames(event.target.value)} placeholder="Juan, Pedro, Martín..." aria-label="Nombres para sumar al plantel" />
            <button className="primary-button" type="submit"><IconPlus /> Sumar</button>
          </form>
          <div className="filter-buttons" aria-label="Filtrar jugadores">
            {[['active', 'Activos'], ['inactive', 'Inactivos'], ['all', 'Todos']].map(([id, label]) => <button key={id} className={rosterFilter === id ? 'is-active' : ''} type="button" onClick={() => setRosterFilter(id)}>{label}</button>)}
          </div>
        </div>
        {visiblePlayers.length === 0 ? <div className="empty-state">{groupPlayers.length === 0 ? 'Todavía no hay jugadores en el plantel.' : 'No hay jugadores en esta categoría.'}</div> : <div className="player-list">
          {visiblePlayers.map(player => <article className={`player-card ${player.active ? '' : 'is-inactive'}`} key={player.id}>
            <span className="avatar" aria-hidden="true">{player.name.charAt(0).toUpperCase()}</span>
            <div className="player-copy">
              <strong>{player.name}{player.nickname ? ` · ${player.nickname}` : ''}</strong>
              <span>{POSITION_LABELS[player.preferredPosition]} · <span className="rating" aria-label={`Nivel ${player.rating} de 5`}>{'★'.repeat(player.rating)}{'☆'.repeat(5 - player.rating)}</span></span>
            </div>
            <button className="edit-button" type="button" onClick={() => openPlayerEditor(player)}>Editar</button>
          </article>)}
        </div>}
      </section>
    </>;
  };

  const GroupView = () => {
    const administrator = groupPlayers.find(player => player.id === activeGroup.adminPlayerId);
    return <>
      <div className="view-header">
        <div><span className="eyebrow">Tu equipo de siempre</span><h1>Grupo</h1><p>La información habitual queda lista para cada partido.</p></div>
      </div>
      <div className="group-layout">
        <section className="group-hero">
          <strong>{activeGroup.name}</strong>
          <span>{scheduleText}</span>
          <div className="group-metrics">
            <div className="group-metric"><small>Plantel</small><b>{activeRoster.length}</b></div>
            <div className="group-metric"><small>Habitual</small><b>{activeGroup.usualPlayerCount}</b></div>
            <div className="group-metric"><small>Admin</small><b>{administrator?.nickname || administrator?.name || 'Sin asignar'}</b></div>
          </div>
        </section>
        <section className="card">
          <div className="card-heading"><div><h2>Datos habituales</h2><p>Podés cambiarlos cuando quieras.</p></div><span className="status-badge">Grupo activo</span></div>
          <form className="group-form" onSubmit={saveGroup}>
            <div className="field-group"><label htmlFor="group-name">Nombre del grupo</label><input id="group-name" name="groupName" defaultValue={activeGroup.name} required /></div>
            <div className="field-grid">
              <div className="field-group"><label htmlFor="usual-day">Día habitual</label><select id="usual-day" name="usualDay" defaultValue={activeGroup.usualDay}>{Object.entries(DAY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="field-group"><label htmlFor="usual-time">Horario habitual</label><input id="usual-time" name="usualTime" type="time" defaultValue={activeGroup.usualTime} /></div>
            </div>
            <div className="field-group"><label htmlFor="usual-venue">Cancha habitual</label><input id="usual-venue" name="usualVenue" defaultValue={activeGroup.usualVenue} placeholder="Ej. La Redonda" /></div>
            <div className="field-grid">
              <div className="field-group"><label htmlFor="usual-count">Cantidad habitual</label><input id="usual-count" name="usualPlayerCount" type="number" min="2" max="60" defaultValue={activeGroup.usualPlayerCount} /></div>
              <div className="field-group"><label htmlFor="group-admin">Administrador</label><select id="group-admin" name="adminPlayerId" defaultValue={activeGroup.adminPlayerId || ''}><option value="">Sin asignar</option>{groupPlayers.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div>
            </div>
            <div className="composer-actions"><button className="primary-button" type="submit"><IconCheck /> Guardar grupo</button></div>
          </form>
          <p className="form-note">En esta etapa el administrador es un dato del grupo. Los permisos reales llegarán más adelante, junto con las cuentas de usuario.</p>
        </section>
      </div>
    </>;
  };

  return <div className="app-shell">
    {toast && <div className={`toast ${toast.type === 'error' ? 'is-error' : toast.type === 'info' ? 'is-info' : ''}`} role="status"><IconAlert /><span>{toast.message}</span></div>}
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand"><img className="brand-logo" src="./icon.svg" alt="" aria-hidden="true" /><div className="brand-copy"><strong>Tercer Tiempo</strong><span>{activeGroup.name} · Beta v3</span></div></div>
        <a className="portal-link" href="../" aria-label="Volver al portal de Lea Rama Dev"><IconArrowLeft /></a>
      </div>
    </header>
    <div className="workspace">
      <nav className="desktop-rail" aria-label="Secciones principales">{NavButtons()}<div className="rail-note">Grupo y plantel quedan guardados en este dispositivo. Las versiones anteriores siguen intactas.</div></nav>
      <main className={`main-content ${activeView === 'expenses' ? 'has-settle-cta' : ''}`}>
        {activeView === 'home' && HomeView()}
        {activeView === 'match' && MatchView()}
        {activeView === 'expenses' && ExpensesView()}
        {activeView === 'players' && PlayersView()}
        {activeView === 'history' && HistoryView()}
        {activeView === 'group' && GroupView()}
        <footer className="footer">Tercer Tiempo · Etapa 5 · Estadísticas del grupo</footer>
      </main>
    </div>
    {activeView === 'expenses' && <button className="settle-cta" type="button" onClick={() => setIsSettlementOpen(true)} disabled={expenses.length === 0}><IconReceipt /><span className="settle-cta-copy"><span>Resultado en vivo</span><strong>Cerrar las cuentas</strong></span><span className="settle-pill">{calculations.transactions.length} pagos</span></button>}
    <nav className="bottom-nav" aria-label="Secciones principales">{NavButtons()}</nav>

    {editingPlayer && <div className="overlay is-player-editor" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditingPlayer(null); }}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="player-editor-title">
        <div className="sheet-handle" aria-hidden="true"></div>
        <div className="editor-heading"><div><span className="eyebrow">Ficha del jugador</span><h2 id="player-editor-title">Editar jugador</h2><p>Estos datos se usan para equilibrar los equipos.</p></div><button className="sheet-close" type="button" onClick={() => setEditingPlayer(null)} aria-label="Cerrar">×</button></div>
        <form onSubmit={savePlayer}>
          <div className="field-group"><label htmlFor="player-name">Nombre</label><input id="player-name" value={editingPlayer.name} onChange={event => setEditingPlayer(current => ({ ...current, name: event.target.value }))} required /></div>
          <div className="field-group"><label htmlFor="player-nickname">Apodo opcional</label><input id="player-nickname" value={editingPlayer.nickname} onChange={event => setEditingPlayer(current => ({ ...current, nickname: event.target.value }))} placeholder="Ej. El Muro" /></div>
          <div className="field-grid">
            <div className="field-group"><label htmlFor="player-position">Posición preferida</label><select id="player-position" value={editingPlayer.preferredPosition} onChange={event => setEditingPlayer(current => ({ ...current, preferredPosition: event.target.value }))}>{Object.entries(POSITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="field-group"><label htmlFor="player-rating">Nivel recreativo</label><select id="player-rating" value={editingPlayer.rating} onChange={event => setEditingPlayer(current => ({ ...current, rating: Number(event.target.value) }))}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} de 5</option>)}</select></div>
          </div>
          <div className="field-group"><label htmlFor="player-payment-alias">Alias para cobrar</label><input id="player-payment-alias" value={editingPlayer.paymentAlias} onChange={event => setEditingPlayer(current => ({ ...current, paymentAlias: event.target.value }))} placeholder="Alias, CBU o CVU" /></div>
          <div className="switch-row"><div className="switch-copy"><strong>Jugador activo</strong><span>Los inactivos no se agregan automáticamente a partidos nuevos.</span></div><button className={`switch ${editingPlayer.active ? 'is-on' : ''}`} type="button" onClick={() => setEditingPlayer(current => ({ ...current, active: !current.active }))} role="switch" aria-checked={editingPlayer.active}><span className="sr-only">Cambiar estado del jugador</span></button></div>
          <div className="composer-actions"><button className="primary-button" type="submit"><IconCheck /> Guardar jugador</button><button className="secondary-button" type="button" onClick={() => setEditingPlayer(null)}>Cancelar</button></div>
        </form>
      </section>
    </div>}

    {matchEditor && <div className="overlay is-match-editor" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setMatchEditor(null); }}>
      <section className="sheet match-editor-sheet" role="dialog" aria-modal="true" aria-labelledby="match-editor-title">
        <div className="sheet-handle" aria-hidden="true"></div>
        <div className="editor-heading">
          <div><span className="eyebrow">Partido jugado</span><h2 id="match-editor-title">{matchEditor.matchId ? 'Editar resultado' : 'Guardar en el historial'}</h2><p>La formación queda guardada tal como está ahora.</p></div>
          <button className="sheet-close" type="button" onClick={() => setMatchEditor(null)} aria-label="Cerrar">×</button>
        </div>
        <form onSubmit={saveCompletedMatch}>
          <div className="field-grid">
            <div className="field-group"><label htmlFor="match-date">Fecha</label><input id="match-date" type="date" value={matchEditor.playedOn} onChange={event => setMatchEditor(current => ({ ...current, playedOn: event.target.value }))} required /></div>
            <div className="field-group"><label htmlFor="match-venue">Cancha</label><input id="match-venue" value={matchEditor.venue} onChange={event => setMatchEditor(current => ({ ...current, venue: event.target.value }))} maxLength="80" placeholder="Ej. La Redonda" /></div>
          </div>
          <div className="result-score-grid" aria-label="Resultado final">
            <label className="score-entry is-blue" htmlFor="blue-score"><span>{teamNames.blue}</span><input id="blue-score" type="number" inputMode="numeric" min="0" max="99" value={matchEditor.blueScore} onChange={event => setMatchEditor(current => ({ ...current, blueScore: event.target.value }))} required /></label>
            <span className="result-vs" aria-hidden="true">VS</span>
            <label className="score-entry is-red" htmlFor="red-score"><span>{teamNames.red}</span><input id="red-score" type="number" inputMode="numeric" min="0" max="99" value={matchEditor.redScore} onChange={event => setMatchEditor(current => ({ ...current, redScore: event.target.value }))} required /></label>
          </div>
          <div className="scorer-toggle">
            <div className="switch-copy"><strong>Cargar goleadores <span className="optional-label">opcional</span></strong><span>Podés asignar sólo los que recuerden; no hace falta completar todos los goles.</span></div>
            <button className={`switch ${matchEditor.scorersEnabled ? 'is-on' : ''}`} type="button" onClick={() => setMatchEditor(current => ({ ...current, scorersEnabled: !current.scorersEnabled }))} role="switch" aria-checked={matchEditor.scorersEnabled}><span className="sr-only">Cargar goleadores</span></button>
          </div>
          {matchEditor.scorersEnabled && <div className="scorer-editor">
            <div className="scorer-team-grid">
              {[{ id: 'blue', name: teamNames.blue, players: blueTeam }, { id: 'red', name: teamNames.red, players: redTeam }].map(team => <section className={`scorer-team is-${team.id}`} key={team.id}>
                <h3>{team.name}</h3>
                {team.players.map(player => <label className="scorer-player" htmlFor={`scorer-${team.id}-${player.id}`} key={player.id}>
                  <span>{player.nickname || player.name}</span>
                  <input id={`scorer-${team.id}-${player.id}`} type="number" inputMode="numeric" min="0" max="99" placeholder="0" value={matchEditor.scorerGoals?.[player.id] ?? ''} onChange={event => setMatchEditor(current => ({ ...current, scorerGoals: { ...current.scorerGoals, [player.id]: event.target.value } }))} />
                </label>)}
              </section>)}
            </div>
            <p className="scorer-help">No podés cargar más goles que los del resultado de cada equipo. Los goles no asignados pueden quedar en blanco.</p>
          </div>}
          <div className="field-group"><label htmlFor="match-figure">Figura del partido <span className="optional-label">opcional</span></label><select id="match-figure" value={matchEditor.playerOfTheMatchId} onChange={event => setMatchEditor(current => ({ ...current, playerOfTheMatchId: event.target.value }))}><option value="">Sin elegir</option>{sessionPlayers.map(player => <option key={player.id} value={player.id}>{player.nickname || player.name}</option>)}</select></div>
          <div className="field-group"><label htmlFor="match-observations">Observaciones <span className="optional-label">opcional</span></label><textarea id="match-observations" value={matchEditor.observations} onChange={event => setMatchEditor(current => ({ ...current, observations: event.target.value }))} maxLength="500" rows="3" placeholder="Un golazo, una atajada, algo para recordar…"></textarea></div>
          <div className="composer-actions"><button className="primary-button" type="submit"><IconCheck /> {matchEditor.matchId ? 'Actualizar resultado' : 'Guardar partido'}</button><button className="secondary-button" type="button" onClick={() => setMatchEditor(null)}>Cancelar</button></div>
        </form>
      </section>
    </div>}

    {isSettlementOpen && <div className="overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setIsSettlementOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Liquidación del partido" style={{ width: '100%' }}>{SettlementContent({ closable: true })}</section></div>}
    <canvas ref={canvasRef} hidden />
  </div>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
