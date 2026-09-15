const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'ingreso-belgrano-monserrat');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('los módulos V5 son JavaScript válido', () => {
  assert.doesNotThrow(() => new vm.Script(read('seguridad.js'), { filename: 'seguridad.js' }));
  assert.doesNotThrow(() => new vm.Script(read('banco-v5.js'), { filename: 'banco-v5.js' }));
});

test('el banco V5 agrega exactamente 120 actividades con IDs únicos', () => {
  const code = read('banco-v5.js');
  const ids = [...code.matchAll(/['"](V5-[ML]\d{3})['"]/g)].map(m => m[1]);
  const unique = new Set(ids);
  assert.equal(unique.size, 120);
  assert.equal([...unique].filter(id => id.startsWith('V5-M')).length, 60);
  assert.equal([...unique].filter(id => id.startsWith('V5-L')).length, 60);
});

test('la página carga seguridad antes de la aplicación y ambos bancos antes del motor', () => {
  const html = read('index.html');
  const security = html.indexOf('./seguridad.js');
  const v4 = html.indexOf('./banco-v4.js');
  const v5 = html.indexOf('./banco-v5.js');
  const app = html.indexOf('./app.js');
  assert.ok(security > 0 && v4 > 0 && v5 > 0 && app > 0);
  assert.ok(security < app);
  assert.ok(v4 < app && v5 < app);
  assert.match(html, /body class="security-pending"/);
});

test('el acceso exige sesión y allowlist study_access', () => {
  const security = read('seguridad.js');
  const sql = read('supabase-study-access.sql');
  assert.match(security, /signInWithPassword/);
  assert.match(security, /from\('study_access'\)/);
  assert.doesNotMatch(security, /signUp/);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\) = user_id/);
});

test('la PWA cachea los módulos V5', () => {
  const sw = read('sw.js');
  assert.match(sw, /ingreso-bm-v5-seguridad-banco/);
  assert.match(sw, /\.\/seguridad\.js/);
  assert.match(sw, /\.\/banco-v5\.js/);
});
