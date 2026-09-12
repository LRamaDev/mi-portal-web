const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'tercer-tiempo-beta-v3');
const models = require(path.join(appRoot, 'js', 'models.js'));
const history = require(path.join(appRoot, 'js', 'match-history.js'));
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const matchPlayers = [
  { id: 'p1', name: 'Martín', nickname: 'Tincho', preferredPosition: 'goalkeeper' },
  { id: 'p2', name: 'Juan', preferredPosition: 'defender' },
  { id: 'p3', name: 'Pedro', preferredPosition: 'midfielder' },
  { id: 'p4', name: 'Lucas', preferredPosition: 'forward' }
];

test('un partido guarda resultado, equipos y una copia estable de los jugadores', () => {
  const match = models.createMatch({
    id: 'm1',
    groupId: 'g1',
    playedOn: '2026-09-09',
    venue: 'La Redonda',
    teamNames: { blue: 'Con pechera', red: 'Sin pechera' },
    players: matchPlayers,
    bluePlayerIds: ['p1', 'p3'],
    redPlayerIds: ['p2', 'p4'],
    result: { blueScore: 6, redScore: 4 },
    playerOfTheMatchId: 'p3',
    observations: 'Partido parejo y divertido.'
  });

  assert.equal(match.id, 'm1');
  assert.equal(match.playedOn, '2026-09-09');
  assert.equal(match.venue, 'La Redonda');
  assert.deepEqual(match.teamNames, { blue: 'Con pechera', red: 'Sin pechera' });
  assert.deepEqual(match.bluePlayerIds, ['p1', 'p3']);
  assert.deepEqual(match.redPlayerIds, ['p2', 'p4']);
  assert.deepEqual(match.result, { blueScore: 6, redScore: 4 });
  assert.equal(match.scorersRecorded, false);
  assert.equal(match.playerOfTheMatchId, 'p3');
  assert.equal(history.getPlayerSnapshot(match, 'p1').nickname, 'Tincho');
  assert.equal(history.getOutcomeLabel(match), 'Ganó Con pechera');
});

test('el modelo recupera datos dañados sin inventar jugadores ni resultados imposibles', () => {
  const match = models.createMatch({
    groupId: 'g1',
    playedOn: 'fecha-inválida',
    players: [...matchPlayers, matchPlayers[0], { id: '', name: '' }],
    bluePlayerIds: ['p1', 'desconocido'],
    redPlayerIds: ['p1', 'p2', 'desconocido'],
    result: { blueScore: -4, redScore: 150 },
    scorers: [{ playerId: 'p3', goals: 2 }, { playerId: 'desconocido', goals: 5 }],
    playerOfTheMatchId: 'desconocido'
  });

  assert.equal(match.players.length, 4);
  assert.deepEqual(match.bluePlayerIds, ['p1']);
  assert.deepEqual(match.redPlayerIds, ['p2']);
  assert.deepEqual(match.result, { blueScore: 0, redScore: 99 });
  assert.deepEqual(match.scorers, [{ playerId: 'p3', goals: 2 }]);
  assert.equal(match.scorersRecorded, true);
  assert.equal(match.playerOfTheMatchId, null);
  assert.match(match.playedOn, /^\d{4}-\d{2}-\d{2}$/);
});

test('los goleadores son opcionales y los partidos anteriores se conservan sin carga', () => {
  const registered = models.createMatch({
    groupId: 'g1',
    players: matchPlayers,
    bluePlayerIds: ['p1', 'p3'],
    redPlayerIds: ['p2', 'p4'],
    result: { blueScore: 3, redScore: 1 },
    scorersRecorded: true,
    scorers: [{ playerId: 'p3', goals: 2 }, { playerId: 'p4', goals: 1 }, { playerId: 'desconocido', goals: 9 }]
  });
  const withoutScorers = models.createMatch({
    groupId: 'g1',
    players: matchPlayers,
    bluePlayerIds: ['p1'],
    redPlayerIds: ['p2'],
    result: { blueScore: 0, redScore: 0 },
    scorersRecorded: true,
    scorers: []
  });

  assert.equal(registered.scorersRecorded, true);
  assert.deepEqual(registered.scorers, [{ playerId: 'p3', goals: 2 }, { playerId: 'p4', goals: 1 }]);
  assert.equal(withoutScorers.scorersRecorded, true);
  assert.deepEqual(withoutScorers.scorers, []);
});

test('la migración conserva el historial y vincula el partido guardado con la sesión actual', () => {
  const group = models.createGroup({ id: 'g1', name: 'Los del Miércoles' });
  const players = matchPlayers.map(player => models.createPlayer({ ...player, groupId: group.id }));
  const match = models.createMatch({
    id: 'm1',
    groupId: group.id,
    playedOn: '2026-09-09',
    players,
    bluePlayerIds: ['p1', 'p3'],
    redPlayerIds: ['p2', 'p4'],
    result: { blueScore: 6, redScore: 4 }
  });
  const migrated = models.sanitizeState({
    schemaVersion: 3,
    activeGroupId: group.id,
    groups: [group],
    players,
    draftSessions: [{
      groupId: group.id,
      participantIds: players.map(player => player.id),
      teamNames: { blue: 'Azul', red: 'Rojo' },
      teamAssignments: null,
      archivedMatchId: 'm1'
    }],
    matches: [match, { ...match, id: 'otro-grupo', groupId: 'g2' }]
  });

  assert.equal(migrated.schemaVersion, 5);
  assert.equal(migrated.matches.length, 1);
  assert.equal(migrated.matches[0].id, 'm1');
  assert.equal(migrated.matches[0].scorersRecorded, false);
  assert.equal(migrated.draftSessions[0].archivedMatchId, 'm1');
});

test('el historial ordena por fecha y presenta fechas recreativas en castellano', () => {
  const ordered = history.sortMatches([
    { id: 'viejo', playedOn: '2026-08-01', createdAt: '2026-08-01T10:00:00Z' },
    { id: 'nuevo', playedOn: '2026-09-09', createdAt: '2026-09-09T10:00:00Z' }
  ]);
  assert.deepEqual(ordered.map(match => match.id), ['nuevo', 'viejo']);
  assert.match(history.formatMatchDate('2026-09-09'), /^Miércoles 9 de septiembre de 2026$/);
});

test('la Etapa 4 mantiene Historial como base para las estadísticas posteriores', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  const app = read('tercer-tiempo-beta-v3/js/app.jsx');
  const config = read('tercer-tiempo-beta-v3/js/config.js');
  const css = read('tercer-tiempo-beta-v3/styles.css');

  assert.match(html, /\.\/js\/match-history\.js/);
  assert.match(config, /history: true/);
  assert.match(config, /statistics: true/);
  assert.match(app, /Guardar en el historial/);
  assert.match(app, /Figura del partido/);
  assert.match(app, /Cargar goleadores/);
  assert.match(app, /scorersRecorded/);
  assert.match(app, /Ver equipos y posiciones/);
  assert.match(app, /activeView === 'history'/);
  assert.match(css, /\.history-scoreboard/);
  assert.match(css, /\.history-scorers/);
  assert.match(css, /\.scorer-editor/);
  assert.match(css, /\.post-match-actions/);
});
