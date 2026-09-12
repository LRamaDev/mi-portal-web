const { useEffect, useMemo, useRef, useState } = React;
const TTModels = TercerTiempoModels;
const TTStorage = TercerTiempoStorage;
const TTConfig = TercerTiempoConfig;
const TTTeamBuilder = TercerTiempoTeamBuilder;

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

function App() {
  const [state, setState] = useState(() => TTStorage.load());
  const [activeView, setActiveView] = useState('home');
  const [toast, setToast] = useState(null);
  const [quickNames, setQuickNames] = useState('');
  const [rosterNames, setRosterNames] = useState('');
  const [rosterFilter, setRosterFilter] = useState('active');
  const [editingPlayer, setEditingPlayer] = useState(null);
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
  const teamAssignments = draftSession.teamAssignments;
  const blueTeam = (teamAssignments?.bluePlayerIds || []).map(id => groupPlayers.find(player => player.id === id)).filter(Boolean);
  const redTeam = (teamAssignments?.redPlayerIds || []).map(id => groupPlayers.find(player => player.id === id)).filter(Boolean);
  const calculations = useMemo(
    () => TTModels.calculateSettlement(sessionPlayers, expenses),
    [sessionPlayers, expenses]
  );

  const scheduleText = [
    DAY_LABELS[activeGroup.usualDay],
    activeGroup.usualTime,
    activeGroup.usualVenue
  ].filter(Boolean).join(' · ') || 'Completá el día, la hora y la cancha habitual';

  useEffect(() => {
    TTStorage.save(state);
  }, [state]);

  useEffect(() => {
    document.body.classList.toggle('is-locked', Boolean(editingPlayer || isSettlementOpen));
    return () => document.body.classList.remove('is-locked');
  }, [editingPlayer, isSettlementOpen]);

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
    showToast(`${player?.nickname || player?.name || 'Jugador'} pasó a ${destinationTeam === 'blue' ? 'Azules' : 'Rojos'}`, 'info');
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

  const handleNewMatch = () => {
    if (expenses.length > 0 && !window.confirm('¿Empezar un partido nuevo? Se borrarán los gastos actuales, pero el grupo y el plantel quedarán guardados.')) return;
    updateSession(session => ({
      ...session,
      participantIds: activeRoster.map(player => player.id),
      expenses: [],
      teamAssignments: null
    }));
    setSwapSelection({ blue: null, red: null });
    resetExpenseForm(activeRoster.map(player => player.id));
    setIsSettlementOpen(false);
    showToast('Partido nuevo listo. El plantel quedó guardado.', 'info');
  };

  const handleClearCurrentMatch = () => {
    if (!window.confirm('¿Vaciar el partido actual? El plantel permanente no se borrará.')) return;
    updateSession(session => ({ ...session, participantIds: [], expenses: [], teamAssignments: null }));
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
    { id: 'players', label: 'Jugadores', icon: <IconUsers />, enabled: TTConfig.features.playerProfiles },
    { id: 'group', label: 'Grupo', icon: <IconShield />, enabled: TTConfig.features.groups }
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

    const TeamPanel = ({ team, title, players, selectedId }) => <section className={`team-panel is-${team}`}>
      <div className="team-panel-heading">
        <div><span>{team === 'blue' ? 'Equipo azul' : 'Equipo rojo'}</span><h3>{title}</h3></div>
        <div className="team-total"><strong>{players.length}</strong><span>Nivel {TTTeamBuilder.getMetrics(players).rating}</span></div>
      </div>
      {players.length === 0 ? <div className="team-empty">Mové un jugador a este equipo o regenerá la propuesta.</div> : <div className="team-player-list">
        {players.map(player => {
          const selected = selectedId === player.id;
          return <article className={`team-player ${selected ? 'is-selected' : ''}`} key={player.id}>
            <button className="team-player-select" type="button" onClick={() => selectPlayerForSwap(team, player.id)} aria-pressed={selected}>
              <span className="team-avatar">{player.name.charAt(0).toUpperCase()}</span>
              <span className="team-player-copy"><strong>{player.nickname || player.name}</strong><small>{POSITION_LABELS[player.preferredPosition]} · Nivel {player.rating}</small></span>
              <span className="swap-check">{selected ? <IconCheck /> : <IconSwap />}</span>
            </button>
            <button className="team-move" type="button" onClick={() => moveTeamPlayer(player.id, team)} aria-label={`Mover ${player.name} a ${team === 'blue' ? 'Rojos' : 'Azules'}`}>
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
          <strong>{ratingDifference === 0 ? 'Nivel parejo' : `Diferencia de nivel: ${ratingDifference}`}</strong>
        </div>
        <div className="teams-grid">
          <TeamPanel team="blue" title="Azules" players={blueTeam} selectedId={swapSelection.blue} />
          <div className="versus-badge" aria-hidden="true">VS</div>
          <TeamPanel team="red" title="Rojos" players={redTeam} selectedId={swapSelection.red} />
        </div>
        <p className="swap-help">Para intercambiar, elegí un jugador de cada equipo. También podés moverlos directamente con la flecha.</p>
        <div className="team-builder-actions">
          <button className="secondary-button" type="button" onClick={generateTeams}><IconRefresh /> Regenerar</button>
          <button className="primary-button" type="button" onClick={swapTeamPlayers} disabled={!canSwap}><IconSwap /> Intercambiar elegidos</button>
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
            <div className="flow-step"><span>3</span><div><strong>Tercer tiempo</strong><small>Cargar y dividir gastos</small></div></div>
          </div>
          <div className="home-quick-actions">
            <button className="secondary-button" type="button" onClick={() => changeView('players')}><IconUsers /> Ver jugadores</button>
            <button className="secondary-button" type="button" onClick={() => changeView('group')}><IconShield /> Editar grupo</button>
          </div>
          <p className="home-admin">Administrador: <strong>{administrator?.nickname || administrator?.name || 'Sin asignar'}</strong></p>
        </section>

        {expenses.length > 0 && <section className="card pending-third-time">
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
      {TTConfig.features.teamBuilder && <TeamBuilderContent />}
      <section className="card after-match-card match-third-time-card">
        <span className="expense-icon"><IconReceipt /></span>
        <div>
          <span className="eyebrow">Después de jugar</span>
          <h2>Ahora sí: tercer tiempo</h2>
          <p>Cuando termine el partido, cargá la cancha, las bebidas o la comida y dividí las cuentas.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => changeView('expenses')} disabled={sessionPlayers.length === 0}>
          <IconReceipt /> {expenses.length > 0 ? 'Continuar tercer tiempo' : 'Abrir tercer tiempo'}
        </button>
        {sessionPlayers.length === 0 && <small>Elegí al menos un jugador para continuar.</small>}
      </section>
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
        {activeView === 'group' && GroupView()}
        <footer className="footer">Tercer Tiempo · Etapa 3 · Equipos equilibrados</footer>
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

    {isSettlementOpen && <div className="overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setIsSettlementOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Liquidación del partido" style={{ width: '100%' }}>{SettlementContent({ closable: true })}</section></div>}
    <canvas ref={canvasRef} hidden />
  </div>;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
