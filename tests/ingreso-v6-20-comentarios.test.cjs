const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..', 'ingreso-belgrano-monserrat');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const testeo = fs.readFileSync(path.join(root, 'testeo.js'), 'utf8');

test('el panel familiar contiene una bandeja para comentarios', () => {
  assert.match(index, /id="family-feedback-inbox"/);
  assert.match(testeo, /function renderFeedbackInbox\(\)/);
  assert.match(testeo, /from\('study_feedback'\)/);
  assert.match(testeo, /Comentarios recibidos/);
});

test('la bandeja usa la sesión familiar y escapa el texto mostrado', () => {
  assert.match(testeo, /client\.auth\.getSession\(\)/);
  assert.match(testeo, /escapeHtml\(row\.note\.trim\(\)\)/);
  assert.match(testeo, /section\.hidden = true/);
});
