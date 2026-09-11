const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const betaV3Root = path.join(root, 'tercer-tiempo-beta-v3');
const models = require(path.join(betaV3Root, 'js', 'models.js'));
const storageApi = require(path.join(betaV3Root, 'js', 'storage.js'));

const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const createMemoryStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    dump: () => Object.fromEntries(values)
  };
};

test('la Etapa 1 vive en una Beta v3 separada y no reemplaza versiones anteriores', () => {
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo', 'index.html')));
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-beta', 'index.html')));
  assert.ok(fs.existsSync(path.join(root, 'tercer-tiempo-beta-v2', 'index.html')));
  assert.ok(fs.existsSync(path.join(betaV3Root, 'index.html')));
  assert.ok(fs.existsSync(path.join(betaV3Root, 'assets', 'cancha-fondo.jpg')));
  assert.ok(fs.existsSync(path.join(betaV3Root, 'icon.svg')));
  assert.doesNotMatch(read('index.html'), /tercer-tiempo-beta-v3/);
});

test('la Beta v3 separa interfaz, estilos, datos y almacenamiento', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  assert.match(html, /\.\/styles\.css/);
  assert.match(html, /\.\/js\/config\.js/);
  assert.match(html, /\.\/js\/models\.js/);
  assert.match(html, /\.\/js\/storage\.js/);
  assert.match(html, /\.\/js\/app\.jsx/);
  assert.doesNotMatch(html, /const \{ useState/);
});

test('el estado inicial crea un grupo y un plantel permanente preparado para estadísticas', () => {
  const state = models.createInitialState([
    { id: 'p_1', name: 'Martín', alias: 'martin.mp' }
  ]);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.groups.length, 1);
  assert.equal(state.activeGroupId, state.groups[0].id);
  assert.equal(state.groups[0].planCode, 'free');
  assert.equal(state.groups[0].ownerUserId, null);
  assert.equal(state.players.length, 1);
  assert.equal(state.players[0].groupId, state.groups[0].id);
  assert.equal(state.players[0].nickname, '');
  assert.equal(state.players[0].preferredPosition, 'versatile');
  assert.equal(state.players[0].rating, 3);
  assert.equal(state.players[0].paymentAlias, 'martin.mp');
  assert.equal(state.players[0].active, true);
  assert.deepEqual(state.players[0].stats, {
    played: 0,
    goals: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    playerOfTheMatch: 0
  });
});

test('la migración importa Beta v2 sin borrar ni modificar sus claves', () => {
  const legacyPlayers = [{ id: 'p_1', name: 'Lucho', alias: 'lucho.cobra' }];
  const legacyExpenses = [{
    id: 'e_1',
    description: 'Cancha',
    amount: 1000,
    paidById: 'p_1',
    consumerIds: ['p_1'],
    category: 'court'
  }];
  const memory = createMemoryStorage({
    tt_v2_players: JSON.stringify(legacyPlayers),
    tt_v2_expenses: JSON.stringify(legacyExpenses)
  });
  const storage = storageApi.createAdapter(memory);
  const migrated = storage.load();
  assert.equal(migrated.players[0].paymentAlias, 'lucho.cobra');
  assert.deepEqual(migrated.draftSessions[0].expenses, legacyExpenses);
  assert.equal(storage.save(migrated), true);
  const snapshot = memory.dump();
  assert.equal(snapshot.tt_v2_players, JSON.stringify(legacyPlayers));
  assert.equal(snapshot.tt_v2_expenses, JSON.stringify(legacyExpenses));
  assert.ok(snapshot.tt_app_v1);
});

test('el almacenamiento nuevo tiene prioridad y recupera datos dañados sin bloquear la app', () => {
  const saved = models.createInitialState([{ id: 'new', name: 'Nuevo' }]);
  const memory = createMemoryStorage({
    tt_app_v1: JSON.stringify(saved),
    tt_v2_players: JSON.stringify([{ id: 'old', name: 'Viejo' }])
  });
  assert.equal(storageApi.createAdapter(memory).load().players[0].name, 'Nuevo');

  const damaged = createMemoryStorage({ tt_app_v1: '{no-es-json' });
  const recovered = storageApi.createAdapter(damaged).load();
  assert.equal(recovered.groups.length, 1);
  assert.deepEqual(recovered.players, []);
});

test('la normalización evita duplicados por mayúsculas y tildes', () => {
  assert.equal(models.normalizeName('  Nicolás  '), models.normalizeName('NICOLAS'));
  assert.equal(models.normalizeName('Martín'), 'martin');
});

test('el motor de liquidación conserva el cálculo y utiliza el alias bancario migrado', () => {
  const players = [
    models.createPlayer({ id: 'a', groupId: 'g', name: 'Ana', paymentAlias: 'ana.mp' }),
    models.createPlayer({ id: 'b', groupId: 'g', name: 'Beto' })
  ];
  const expenses = [{
    id: 'e',
    description: 'Cancha',
    amount: 1000,
    paidById: 'a',
    consumerIds: ['a', 'b'],
    category: 'court'
  }];
  const result = models.calculateSettlement(players, expenses);
  assert.equal(result.totalSpent, 1000);
  assert.equal(result.transactions.length, 1);
  assert.deepEqual(result.transactions[0], {
    fromId: 'b',
    from: 'Beto',
    toId: 'a',
    to: 'Ana',
    toAlias: 'ana.mp',
    amountExact: 500,
    amountRounded: 500
  });
});

test('la interfaz incorpora Inicio, Jugadores y Grupo sin funciones futuras visibles', () => {
  const app = read('tercer-tiempo-beta-v3/js/app.jsx');
  const config = read('tercer-tiempo-beta-v3/js/config.js');
  assert.match(app, /label: 'Inicio'/);
  assert.match(app, /label: 'Jugadores'/);
  assert.match(app, /label: 'Grupo'/);
  assert.match(app, /Plantel permanente/);
  assert.match(app, /Nivel recreativo/);
  assert.match(app, /El plantel permanente no se borrará/);
  assert.match(config, /teamBuilder: false/);
  assert.match(config, /history: false/);
  assert.match(config, /statistics: false/);
  assert.match(config, /proEntitlements: false/);
  assert.doesNotMatch(app, /Tercer Tiempo Pro/);
});

test('la Beta v3 conserva gastos, WhatsApp, ticket y puente con la APK', () => {
  const app = read('tercer-tiempo-beta-v3/js/app.jsx');
  assert.match(app, /calculateSettlement/);
  assert.match(app, /api\.whatsapp\.com\/send/);
  assert.match(app, /window\.ReactNativeWebView/);
  assert.match(app, /type: 'SHARE_TEXT'/);
  assert.match(app, /type: 'DOWNLOAD_IMAGE'/);
  assert.match(app, /link\.download = `liquidacion-/);
  assert.match(app, /Cerveza/);
  assert.match(app, /Gaseosa/);
});

test('la interfaz mantiene controles grandes y diseños específicos para celular y escritorio', () => {
  const css = read('tercer-tiempo-beta-v3/styles.css');
  assert.match(css, /font-size: 16px/);
  assert.match(css, /min-height: 3rem/);
  assert.match(css, /@media \(min-width: 40rem\)/);
  assert.match(css, /@media \(min-width: 64rem\)/);
  assert.match(css, /max-width: 82rem/);
  assert.match(css, /\.bottom-nav/);
  assert.match(css, /prefers-reduced-motion/);
});
