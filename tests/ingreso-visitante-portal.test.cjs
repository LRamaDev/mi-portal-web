const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('seguridad.js mantiene el acceso familiar y agrega modo visitante aislado', () => {
  const source = read('ingreso-belgrano-monserrat/seguridad.js');

  assert.doesNotThrow(() => new vm.Script(source));
  assert.match(source, /signInWithPassword/);
  assert.match(source, /study_access/);
  assert.doesNotMatch(source, /\.signUp\s*\(/);

  assert.match(source, /Continuar como visitante/);
  assert.match(source, /ingreso-access-mode-v1/);
  assert.match(source, /ingreso-belgrano-monserrat-visitor-v1/);
  assert.match(source, /ingreso-belgrano-monserrat-visitor-feedback-v1/);
  assert.match(source, /redirectedKey/);
  assert.match(source, /FAMILY_STATE_KEY[\s\S]*VISITOR_STATE_KEY/);
  assert.match(source, /persistSession:\s*false/);
  assert.match(source, /autoRefreshToken:\s*false/);
  assert.match(source, /detectSessionInUrl:\s*false/);
});

test('la PWA fuerza una nueva caché que incluye seguridad.js', () => {
  const sw = read('ingreso-belgrano-monserrat/sw.js');
  assert.match(sw, /ingreso-bm-v6-18-1-interacciones/);
  assert.match(sw, /\.\/seguridad\.js/);
});

test('el portal principal publica un acceso directo al proyecto educativo', () => {
  const html = read('index.html');
  assert.match(html, /href="\.\/ingreso-belgrano-monserrat\/">Ingreso escolar<\/a>/);
  assert.match(html, /data-category="educacion" href="\.\/ingreso-belgrano-monserrat\/"/);
  assert.match(html, /Ingreso Belgrano · Monserrat/);
  assert.match(html, /También se puede usar como visitante sin registro/);
});
