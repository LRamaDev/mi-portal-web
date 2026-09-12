const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'tercer-tiempo-beta-v3');
const statistics = require(path.join(appRoot, 'js', 'statistics.js'));
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const players = [
  { id: 'p1', name: 'Ana', preferredPosition: 'goalkeeper', active: true },
  { id: 'p2', name: 'Beto', nickname: 'Beto', preferredPosition: 'defender', active: true },
  { id: 'p3', name: 'Carlos', preferredPosition: 'forward', active: false }
];

const matches = [
  {
    id: 'm3', playedOn: '2026-09-10', createdAt: '2026-09-10T23:00:00Z',
    bluePlayerIds: ['p1'], redPlayerIds: ['p2'],
    result: { blueScore: 3, redScore: 1 }, playerOfTheMatchId: 'p1',
    scorers: [{ playerId: 'p1', goals: 2 }]
  },
  {
    id: 'm2', playedOn: '2026-09-03', createdAt: '2026-09-03T23:00:00Z',
    bluePlayerIds: ['p1', 'p3'], redPlayerIds: ['p2'],
    result: { blueScore: 2, redScore: 2 }, playerOfTheMatchId: 'p2', scorers: []
  },
  {
    id: 'm1', playedOn: '2026-08-27', createdAt: '2026-08-27T23:00:00Z',
    bluePlayerIds: ['p2'], redPlayerIds: ['p1', 'p3'],
    result: { blueScore: 4, redScore: 0 }, playerOfTheMatchId: null, scorers: []
  }
];

test('calcula el resumen del grupo directamente desde el historial', () => {
  const result = statistics.calculateStatistics(players, matches);
  assert.deepEqual(result.summary, {
    matchesPlayed: 3,
    totalGoals: 12,
    goalsPerMatch: 4,
    drawnMatches: 1,
    figuresChosen: 2,
    matchesWithRegisteredScorers: 1
  });
});

test('calcula partidos, balance, figuras y goles registrados por jugador', () => {
  const result = statistics.calculateStatistics(players, matches);
  const ana = result.players.find(player => player.playerId === 'p1');
  const beto = result.players.find(player => player.playerId === 'p2');
  const carlos = result.players.find(player => player.playerId === 'p3');

  assert.deepEqual(
    { played: ana.played, wins: ana.wins, draws: ana.draws, losses: ana.losses, figures: ana.figures, goals: ana.registeredGoals },
    { played: 3, wins: 1, draws: 1, losses: 1, figures: 1, goals: 2 }
  );
  assert.equal(ana.winPercentage, 33);
  assert.equal(ana.lastOutcome, 'win');
  assert.equal(ana.currentUnbeatenStreak, 2);
  assert.deepEqual(
    { played: beto.played, wins: beto.wins, draws: beto.draws, losses: beto.losses, figures: beto.figures },
    { played: 3, wins: 1, draws: 1, losses: 1, figures: 1 }
  );
  assert.deepEqual(
    { played: carlos.played, wins: carlos.wins, draws: carlos.draws, losses: carlos.losses, active: carlos.active },
    { played: 2, wins: 0, draws: 1, losses: 1, active: false }
  );
});

test('no inventa participaciones para jugadores que no integraron ningún equipo', () => {
  const result = statistics.calculateStatistics(players, [{
    id: 'm1', playedOn: '2026-09-10', players,
    bluePlayerIds: ['p1'], redPlayerIds: [], result: { blueScore: 1, redScore: 0 },
    playerOfTheMatchId: 'p3', scorers: [{ playerId: 'p3', goals: 5 }]
  }]);
  const carlos = result.players.find(player => player.playerId === 'p3');
  assert.equal(carlos.played, 0);
  assert.equal(carlos.figures, 0);
  assert.equal(carlos.registeredGoals, 0);
  assert.equal(result.summary.figuresChosen, 0);
});

test('reconoce empates y conserva todos los líderes cuando comparten una marca', () => {
  const result = statistics.calculateStatistics(players, matches);
  assert.deepEqual(result.recognitions.mostPresent, { value: 3, playerIds: ['p1', 'p2'] });
  assert.deepEqual(result.recognitions.mostFigures, { value: 1, playerIds: ['p1', 'p2'] });
  assert.deepEqual(result.recognitions.currentUnbeaten, { value: 2, playerIds: ['p1'] });
  assert.deepEqual(result.recognitions.topScorer, { value: 2, playerIds: ['p1'] });
  assert.equal(statistics.getPlayerOutcome(matches[1], 'p1'), 'draw');
  assert.equal(statistics.getPlayerOutcome(matches[1], 'ausente'), null);
});

test('distingue un registro de goleadores abierto de un partido sin carga de goles', () => {
  const result = statistics.calculateStatistics(players, [{
    id: 'm1', playedOn: '2026-09-10',
    bluePlayerIds: ['p1'], redPlayerIds: ['p2'], result: { blueScore: 0, redScore: 0 },
    scorersRecorded: true, scorers: []
  }]);
  assert.equal(result.summary.matchesWithRegisteredScorers, 1);
  assert.deepEqual(result.recognitions.topScorer, { value: 0, playerIds: [] });
});

test('la Etapa 5 habilita estadísticas sin sumar un sexto acceso principal', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  const app = read('tercer-tiempo-beta-v3/js/app.jsx');
  const config = read('tercer-tiempo-beta-v3/js/config.js');
  const css = read('tercer-tiempo-beta-v3/styles.css');

  assert.match(html, /\.\/js\/statistics\.js/);
  assert.match(config, /statistics: true/);
  assert.match(app, /Partidos/);
  assert.match(app, /Estadísticas/);
  assert.match(app, /V-E-D/);
  assert.match(app, /Más presente/);
  assert.match(app, /Goleador registrado/);
  assert.match(app, /goles cargados/i);
  assert.match(app, /TTStatistics\.calculateStatistics/);
  assert.doesNotMatch(app, /id: 'statistics'/);
  assert.match(css, /\.statistics-summary/);
  assert.match(css, /\.player-stat-card/);
  assert.match(css, /\.player-goal-tally/);
});
