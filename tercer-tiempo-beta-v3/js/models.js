(function exposeModels(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoModels = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createModels() {
  const SCHEMA_VERSION = 3;
  const POSITION_VALUES = ['goalkeeper', 'defender', 'midfielder', 'forward', 'versatile'];
  const DEFAULT_TEAM_NAMES = Object.freeze({ blue: 'Azul', red: 'Rojo' });
  const EMPTY_STATS = Object.freeze({
    played: 0,
    goals: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    playerOfTheMatch: 0
  });

  const nowIso = () => new Date().toISOString();

  const createId = (prefix) => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };

  const normalizeName = (value) => String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR');

  const clampRating = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 3;
    return Math.min(5, Math.max(1, Math.round(parsed)));
  };

  const createGroup = (input = {}) => {
    const timestamp = nowIso();
    return {
      id: input.id || createId('group'),
      name: String(input.name || 'Mi grupo').trim() || 'Mi grupo',
      adminPlayerId: input.adminPlayerId || null,
      ownerUserId: input.ownerUserId || null,
      usualDay: input.usualDay === undefined ? '3' : String(input.usualDay),
      usualTime: input.usualTime === undefined ? '21:00' : String(input.usualTime),
      usualVenue: String(input.usualVenue || ''),
      usualPlayerCount: Math.max(2, Number(input.usualPlayerCount) || 10),
      planCode: input.planCode || 'free',
      createdAt: input.createdAt || timestamp,
      updatedAt: input.updatedAt || timestamp
    };
  };

  const createPlayer = (input = {}) => {
    const timestamp = nowIso();
    const position = POSITION_VALUES.includes(input.preferredPosition)
      ? input.preferredPosition
      : 'versatile';
    return {
      id: input.id || createId('player'),
      groupId: input.groupId || null,
      name: String(input.name || '').trim(),
      nickname: String(input.nickname || ''),
      preferredPosition: position,
      rating: clampRating(input.rating),
      paymentAlias: String(input.paymentAlias || input.alias || ''),
      active: input.active !== false,
      stats: {
        ...EMPTY_STATS,
        ...(input.stats && typeof input.stats === 'object' ? input.stats : {})
      },
      createdAt: input.createdAt || timestamp,
      updatedAt: input.updatedAt || timestamp
    };
  };

  const sanitizeTeamName = (value, fallback) => String(value || '').trim().slice(0, 24) || fallback;

  const createTeamNames = (input = {}) => {
    const source = input && typeof input === 'object' ? input : {};
    return {
      blue: sanitizeTeamName(source.blue, DEFAULT_TEAM_NAMES.blue),
      red: sanitizeTeamName(source.red, DEFAULT_TEAM_NAMES.red)
    };
  };

  const sanitizeTeamAssignments = (input, participantIds = []) => {
    if (!input || typeof input !== 'object') return null;
    const validIds = new Set(participantIds);
    const bluePlayerIds = Array.from(new Set(Array.isArray(input.bluePlayerIds) ? input.bluePlayerIds : []))
      .filter(id => validIds.has(id));
    const blueIds = new Set(bluePlayerIds);
    const redPlayerIds = Array.from(new Set(Array.isArray(input.redPlayerIds) ? input.redPlayerIds : []))
      .filter(id => validIds.has(id) && !blueIds.has(id));
    if (bluePlayerIds.length + redPlayerIds.length !== validIds.size) return null;
    return {
      bluePlayerIds,
      redPlayerIds,
      balanceScore: Number.isFinite(Number(input.balanceScore)) ? Number(input.balanceScore) : null,
      seed: String(input.seed || ''),
      algorithmVersion: Math.max(1, Number(input.algorithmVersion) || 1),
      manuallyEdited: input.manuallyEdited === true,
      generatedAt: input.generatedAt || nowIso()
    };
  };

  const createDraftSession = (groupId, participantIds = [], expenses = [], teamAssignments = null, teamNames = DEFAULT_TEAM_NAMES) => {
    const uniqueParticipantIds = Array.from(new Set(participantIds.filter(Boolean)));
    return {
      groupId,
      participantIds: uniqueParticipantIds,
      expenses: Array.isArray(expenses) ? expenses.map(expense => ({
        ...expense,
        consumerIds: Array.isArray(expense.consumerIds) ? [...expense.consumerIds] : []
      })) : [],
      teamNames: createTeamNames(teamNames),
      teamAssignments: sanitizeTeamAssignments(teamAssignments, uniqueParticipantIds)
    };
  };

  const createInitialState = (legacyPlayers = [], legacyExpenses = []) => {
    const group = createGroup();
    const players = (Array.isArray(legacyPlayers) ? legacyPlayers : [])
      .map(player => createPlayer({ ...player, groupId: group.id }));
    return {
      schemaVersion: SCHEMA_VERSION,
      activeGroupId: group.id,
      groups: [group],
      players,
      draftSessions: [createDraftSession(group.id, players.map(player => player.id), legacyExpenses)],
      matches: []
    };
  };

  const sanitizeState = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return createInitialState();
    const rawGroups = Array.isArray(candidate.groups) ? candidate.groups : [];
    const groups = rawGroups.length > 0 ? rawGroups.map(createGroup) : [createGroup()];
    const groupIds = new Set(groups.map(group => group.id));
    const activeGroupId = groupIds.has(candidate.activeGroupId) ? candidate.activeGroupId : groups[0].id;
    const players = (Array.isArray(candidate.players) ? candidate.players : [])
      .filter(player => player && groupIds.has(player.groupId))
      .map(createPlayer);
    const playerIds = new Set(players.map(player => player.id));
    const draftSessions = groups.map(group => {
      const existing = (Array.isArray(candidate.draftSessions) ? candidate.draftSessions : [])
        .find(session => session && session.groupId === group.id);
      if (!existing) {
        return createDraftSession(group.id, players.filter(player => player.groupId === group.id && player.active).map(player => player.id));
      }
      return createDraftSession(
        group.id,
        (existing.participantIds || []).filter(id => playerIds.has(id)),
        existing.expenses || [],
        existing.teamAssignments,
        existing.teamNames
      );
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      activeGroupId,
      groups,
      players,
      draftSessions,
      matches: Array.isArray(candidate.matches) ? candidate.matches : []
    };
  };

  const roundUpToStep = (value, step = 100) => Math.ceil(value / step) * step;

  const calculateSettlement = (players, expenses) => {
    const balances = {};
    const individualSpending = {};
    const individualPaid = {};
    const playerUsageDetails = {};

    players.forEach(player => {
      balances[player.id] = 0;
      individualSpending[player.id] = 0;
      individualPaid[player.id] = 0;
      playerUsageDetails[player.id] = [];
    });

    expenses.forEach(expense => {
      const consumerIds = Array.isArray(expense.consumerIds)
        ? expense.consumerIds.filter(id => balances[id] !== undefined)
        : [];
      if (consumerIds.length === 0) return;
      const amount = Number(expense.amount) || 0;
      if (balances[expense.paidById] !== undefined) {
        balances[expense.paidById] += amount;
        individualPaid[expense.paidById] += amount;
      }
      const share = amount / consumerIds.length;
      consumerIds.forEach(id => {
        balances[id] -= share;
        individualSpending[id] += share;
        playerUsageDetails[id].push({
          description: expense.description,
          totalAmount: amount,
          consumersCount: consumerIds.length,
          yourShare: share
        });
      });
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([id, balance]) => {
      const player = players.find(item => item.id === id);
      if (!player) return;
      if (balance < -0.01) debtors.push({ id, name: player.name, balance: Math.abs(balance) });
      if (balance > 0.01) creditors.push({ id, name: player.name, balance });
    });
    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const transactions = [];
    let debtorIndex = 0;
    let creditorIndex = 0;
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const amount = Math.min(debtor.balance, creditor.balance);
      const creditorPlayer = players.find(player => player.id === creditor.id);
      transactions.push({
        fromId: debtor.id,
        from: debtor.name,
        toId: creditor.id,
        to: creditor.name,
        toAlias: creditorPlayer?.paymentAlias || '',
        amountExact: amount,
        amountRounded: roundUpToStep(amount)
      });
      debtor.balance -= amount;
      creditor.balance -= amount;
      if (debtor.balance < 0.01) debtorIndex += 1;
      if (creditor.balance < 0.01) creditorIndex += 1;
    }

    return {
      balances,
      individualSpending,
      individualPaid,
      playerUsageDetails,
      totalSpent: expenses.reduce((total, expense) => total + (Number(expense.amount) || 0), 0),
      transactions
    };
  };

  return {
    SCHEMA_VERSION,
    POSITION_VALUES,
    DEFAULT_TEAM_NAMES,
    EMPTY_STATS,
    createId,
    normalizeName,
    clampRating,
    createGroup,
    createPlayer,
    createTeamNames,
    sanitizeTeamAssignments,
    createDraftSession,
    createInitialState,
    sanitizeState,
    calculateSettlement,
    roundUpToStep
  };
});
