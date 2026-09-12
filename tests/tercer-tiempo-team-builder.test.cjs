const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'tercer-tiempo-beta-v3');
const models = require(path.join(appRoot, 'js', 'models.js'));
const teamBuilder = require(path.join(appRoot, 'js', 'team-builder.js'));
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const players = [
  { id: 'p1', name: 'Ari', rating: 5, preferredPosition: 'goalkeeper' },
  { id: 'p2', name: 'Beto', rating: 3, preferredPosition: 'goalkeeper' },
  { id: 'p3', name: 'Cami', rating: 5, preferredPosition: 'defender' },
  { id: 'p4', name: 'Dani', rating: 4, preferredPosition: 'defender' },
  { id: 'p5', name: 'Ema', rating: 4, preferredPosition: 'midfielder' },
  { id: 'p6', name: 'Fede', rating: 3, preferredPosition: 'midfielder' },
  { id: 'p7', name: 'Gabi', rating: 3, preferredPosition: 'forward' },
  { id: 'p8', name: 'Hugo', rating: 2, preferredPosition: 'forward' },
  { id: 'p9', name: 'Ian', rating: 2, preferredPosition: 'versatile' },
  { id: 'p10', name: 'Juan', rating: 1, preferredPosition: 'versatile' }
];

test('el balanceador reparte a cada jugador una sola vez y mantiene iguales las cantidades', () => {
  const result = teamBuilder.buildBalancedTeams(players, 'partido-del-miercoles');
  const allIds = [...result.bluePlayerIds, ...result.redPlayerIds];

  assert.equal(allIds.length, players.length);
  assert.equal(new Set(allIds).size, players.length);
  assert.deepEqual([...allIds].sort(), players.map(player => player.id).sort());
  assert.ok(Math.abs(result.bluePlayerIds.length - result.redPlayerIds.length) <= 1);
});

test('el balance considera nivel, posiciones y reparte los arqueros', () => {
  const result = teamBuilder.buildBalancedTeams(players, 'balance-completo');
  const blue = result.bluePlayerIds.map(id => players.find(player => player.id === id));
  const red = result.redPlayerIds.map(id => players.find(player => player.id === id));
  const blueMetrics = teamBuilder.getMetrics(blue);
  const redMetrics = teamBuilder.getMetrics(red);

  assert.equal(blueMetrics.positions.goalkeeper, 1);
  assert.equal(redMetrics.positions.goalkeeper, 1);
  assert.ok(Math.abs(blueMetrics.rating - redMetrics.rating) <= 1);
  assert.ok(result.balanceScore >= 0);
});

test('la misma semilla produce la misma formación y menos de dos jugadores no bloquea', () => {
  const first = teamBuilder.buildBalancedTeams(players, 'semilla-repetible');
  const second = teamBuilder.buildBalancedTeams(players, 'semilla-repetible');

  assert.deepEqual(first.bluePlayerIds, second.bluePlayerIds);
  assert.deepEqual(first.redPlayerIds, second.redPlayerIds);
  assert.equal(teamBuilder.buildBalancedTeams(players.slice(0, 1), 'insuficiente'), null);
});

test('el modelo migra sesiones anteriores y conserva formaciones válidas', () => {
  const group = models.createGroup({ id: 'g1', name: 'Los del Miércoles' });
  const roster = players.slice(0, 4).map(player => models.createPlayer({ ...player, groupId: group.id }));
  const assignments = teamBuilder.buildBalancedTeams(roster, 'persistencia');
  const state = models.sanitizeState({
    schemaVersion: 1,
    activeGroupId: group.id,
    groups: [group],
    players: roster,
    draftSessions: [{
      groupId: group.id,
      participantIds: roster.map(player => player.id),
      expenses: [],
      teamAssignments: assignments
    }],
    matches: []
  });

  assert.equal(state.schemaVersion, 2);
  assert.deepEqual(state.draftSessions[0].teamAssignments.bluePlayerIds, assignments.bluePlayerIds);
  assert.deepEqual(state.draftSessions[0].teamAssignments.redPlayerIds, assignments.redPlayerIds);

  const stale = models.createDraftSession(group.id, [...roster.map(player => player.id), 'jugador-nuevo'], [], assignments);
  assert.equal(stale.teamAssignments, null);
});

test('la interfaz permite regenerar, mover e intercambiar sin ocultar la edición manual', () => {
  const app = read('tercer-tiempo-beta-v3/js/app.jsx');
  const css = read('tercer-tiempo-beta-v3/styles.css');
  const config = read('tercer-tiempo-beta-v3/js/config.js');

  assert.match(config, /teamBuilder: true/);
  assert.match(app, /Armar equipos/);
  assert.match(app, /Regenerar/);
  assert.match(app, /Intercambiar elegidos/);
  assert.match(app, /moveTeamPlayer/);
  assert.match(app, /manuallyEdited: true/);
  assert.match(app, /posición y arqueros/);
  assert.match(css, /\.teams-grid/);
  assert.match(css, /@media \(min-width: 40rem\)/);
});
