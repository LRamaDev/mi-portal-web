const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..', 'ingreso-belgrano-monserrat');
const security = fs.readFileSync(path.join(root, 'seguridad.js'), 'utf8');
const sync = fs.readFileSync(path.join(root, 'ui-v6-4.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

const modeWriter = security.match(/^  function writeAccessMode\(mode\) \{[\s\S]*?^  \}/m)?.[0];
assert.ok(modeWriter, 'No se encontró writeAccessMode');

function switchAndUnload(initialMode, nextMode) {
  const FAMILY = 'ingreso-belgrano-monserrat-v1';
  const VISITOR = 'ingreso-belgrano-monserrat-visitor-v1';
  const storage = new Map([[FAMILY, 'familia-original'], [VISITOR, 'visitante-original']]);
  const nativeStorage = {
    setItem(key, value) { storage.set(key, String(value)); }
  };
  const script = `let accessMode = ${JSON.stringify(initialMode)};
    const window = { INGRESO_ACCESS_MODE: accessMode };
    ${modeWriter}
    writeAccessMode(${JSON.stringify(nextMode)});
    ({ current: accessMode, visible: window.INGRESO_ACCESS_MODE });`;
  const result = vm.runInNewContext(script, {
    nativeStorage,
    localStorage: {},
    ACCESS_MODE_KEY: 'ingreso-access-mode-v1',
    console
  });
  // Simular el saveState del evento pagehide con el modo todavía activo.
  const destination = result.current === 'visitor' ? VISITOR : FAMILY;
  storage.set(destination, 'avance-del-modo-actual');
  return { ...result, storage, FAMILY, VISITOR };
}

test('al salir de visitante pagehide no escribe sobre el perfil familiar', () => {
  const result = switchAndUnload('visitor', 'family');
  assert.equal(result.current, 'visitor');
  assert.equal(result.visible, 'visitor');
  assert.equal(result.storage.get('ingreso-access-mode-v1'), 'family');
  assert.equal(result.storage.get(result.FAMILY), 'familia-original');
  assert.equal(result.storage.get(result.VISITOR), 'avance-del-modo-actual');
});

test('al entrar como visitante pagehide tampoco sobrescribe el progreso invitado', () => {
  const result = switchAndUnload('family', 'visitor');
  assert.equal(result.current, 'family');
  assert.equal(result.visible, 'family');
  assert.equal(result.storage.get('ingreso-access-mode-v1'), 'visitor');
  assert.equal(result.storage.get(result.FAMILY), 'avance-del-modo-actual');
  assert.equal(result.storage.get(result.VISITOR), 'visitante-original');
});

test('si una copia conserva el nombre familiar, la sincronización lo restaura', () => {
  const merger = sync.match(/^    function mergeProfilePayload\(localProfile, remoteProfile, preferRemote = false\) \{[\s\S]*?^    \}/m)?.[0];
  assert.ok(merger, 'No se encontró mergeProfilePayload');
  const sandbox = {
    window: { INGRESO_ACCESS_MODE: 'family' },
    clone: value => JSON.parse(JSON.stringify(value)),
    mergeProgressMaps: (a, b) => ({ ...a, ...b }),
    mergeHistoryRows: (...rows) => rows.flat(),
    mergeEvidenceRows: (...rows) => rows.flat(),
    mergeVideoLearning: (a, b) => ({ viewed: [...(a.viewed || []), ...(b.viewed || [])], practiced: [...(a.practiced || []), ...(b.practiced || [])] })
  };
  const restored = vm.runInNewContext(`${merger}
    mergeProfilePayload(
      { name: 'Invitado', history: [{ id: 1 }], evidence: [{ id: 1 }], progress: { lengua: { attempts: 12 } } },
      { name: 'Perfil A', history: [{ id: 2 }], evidence: [{ id: 2 }] },
      false
    )`, sandbox);
  assert.equal(restored.name, 'Perfil A');
  assert.equal(restored.history.length, 2);
  assert.equal(restored.evidence.length, 2);
  assert.equal(restored.progress.lengua.attempts, 12);

  sandbox.window.INGRESO_ACCESS_MODE = 'visitor';
  const visitor = vm.runInNewContext(`${merger}
    mergeProfilePayload({ name: 'Invitado' }, { name: 'Perfil A' }, false)`, sandbox);
  assert.equal(visitor.name, 'Invitado');
});

test('la versión y el cache son coherentes', () => {
  assert.match(html, /meta name="app-version" content="6\.25\.0"/);
  assert.match(html, /seguridad\.js\?v=6\.25\.0/);
  assert.match(sw, /const VERSION='6\.25\.0'/);
  assert.match(sw, /ingreso-bm-v6-25-aislamiento-perfiles/);
});
