'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const badges = require(path.resolve(__dirname, '../ingreso-belgrano-monserrat/badges-v6-9.js'));

function byId(list, id) {
  return list.find(item => item.id === id);
}

test('V6.9 define una colección estable de 12 insignias', () => {
  assert.equal(badges.BADGES.length, 12);
  assert.equal(new Set(badges.BADGES.map(item => item.id)).size, 12);
  for (const badge of badges.BADGES) {
    assert.ok(badge.title);
    assert.ok(badge.description);
    assert.ok(badge.target > 0);
  }
});

test('la constancia y el esfuerzo pueden generar logros sin exigir respuestas perfectas', () => {
  const base = Date.UTC(2026, 8, 10, 15, 0, 0);
  const profile = {
    sessions: 10,
    history: [
      { at: base, type: 'diagnostico' },
      { at: base + 86400000, type: 'practica' },
      { at: base + 2 * 86400000, type: 'practica' }
    ],
    progress: {
      'MAT-A': { attempts: 25, correct: 8, mastery: 42 },
      'LEN-A': { attempts: 25, correct: 9, mastery: 45 },
      'MAT-B': { attempts: 8, correct: 2, mastery: 38 }
    }
  };
  const skills = new Map([
    ['MAT-A', { area: 'matematica' }],
    ['LEN-A', { area: 'lengua' }],
    ['MAT-B', { area: 'matematica' }]
  ]);
  const result = badges.evaluateProfile(profile, skills);

  assert.equal(byId(result, 'primer-paso').earned, true);
  assert.equal(byId(result, 'en-marcha').earned, true);
  assert.equal(byId(result, 'constancia').earned, true);
  assert.equal(byId(result, 'racha').earned, true);
  assert.equal(byId(result, 'mate-activa').earned, true);
  assert.equal(byId(result, 'lengua-activa').earned, true);
  assert.equal(byId(result, 'equilibrio').earned, true);
  assert.equal(byId(result, 'persistente').earned, true);
  assert.equal(byId(result, 'temas-firmes').earned, false);
});

test('las insignias de aprendizaje piden evidencia sostenida de dominio', () => {
  const profile = {
    sessions: 4,
    history: [],
    progress: {
      A: { attempts: 3, mastery: 80 },
      B: { attempts: 5, mastery: 91 },
      C: { attempts: 4, mastery: 84 },
      D: { attempts: 2, mastery: 100 }
    }
  };
  const result = badges.evaluateProfile(profile, new Map());
  assert.equal(byId(result, 'temas-firmes').earned, true);
  assert.equal(byId(result, 'temas-firmes').current, 3);
});

test('los simulacros distinguen participación, ambos colegios y puntaje', () => {
  const profile = {
    sessions: 2,
    progress: {},
    history: [
      { at: Date.UTC(2026, 8, 1), type: 'simulacro', fullExam: true, total: 100, school: 'belgrano', score: 72 },
      { at: Date.UTC(2026, 8, 2), type: 'simulacro', fullExam: true, total: 100, school: 'monserrat', score: 86 }
    ]
  };
  const result = badges.evaluateProfile(profile, new Map());
  assert.equal(byId(result, 'primer-simulacro').earned, true);
  assert.equal(byId(result, 'doble-desafio').earned, true);
  assert.equal(byId(result, 'ochenta-puntos').earned, true);
});
