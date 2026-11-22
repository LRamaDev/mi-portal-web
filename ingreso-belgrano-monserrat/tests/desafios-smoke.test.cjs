'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const challenges = fs.readFileSync(path.join(root, 'desafios-fracciones.js'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const count = (text, fragment) => text.split(fragment).length - 1;

test('el nuevo acceso está en una pestaña central y es visible en escritorio y móvil', () => {
  assert.equal(count(html, 'data-view="desafios"'), 1);
  assert.equal(count(html, 'data-start-fractions'), 1);
  assert.equal(count(html, 'data-start-model="R"'), 1);
  assert.equal(count(html, 'data-start-model="P"'), 1);
  assert.match(html, /class="nav-button" data-nav="desafios"/);
  assert.match(html, /<nav class="mobile-nav"[\s\S]*data-nav="desafios"/);
  assert.match(html, /app-version" content="6\.30\.0"/);
  assert.match(sw, /const VERSION='6\.30\.0'/);
  assert.match(sw, /desafios-modelo\.json\?v=6\.30\.0/);
});

test('app y motor tienen sintaxis JS válida y no reaparece $.forEach', () => {
  new vm.Script(app, {filename: 'app.js'});
  new vm.Script(challenges, {filename: 'desafios-fracciones.js'});
  new vm.Script(sw, {filename: 'sw.js'});
  assert.doesNotMatch(app, /(?<!\$)\$\([^\n]*\)\.forEach\s*\(/);
});

function setup() {
  const listeners = new Map();
  const registry = new Map();
  function node(id) {
    if (!registry.has(id)) registry.set(id, {
      dataset: {}, value: '', textContent: '', innerHTML: '', disabled: false,
      hidden: false, title: '', handlers: {},
      classList: {toggle() {}, add() {}, remove() {}},
      addEventListener(type, cb) { (this.handlers[type] ||= []).push(cb); },
      querySelectorAll() { return []; }
    });
    return registry.get(id);
  }
  const fraction = node('fraction');
  fraction.hasAttribute = attr => attr === 'data-start-fractions';
  const R = node('R'), P = node('P');
  R.dataset.startModel = 'R';
  P.dataset.startModel = 'P';
  const rLabel = node('rLabel'), pLabel = node('pLabel');
  rLabel.dataset.modelStatus = 'R';
  pLabel.dataset.modelStatus = 'P';
  const nav = node('nav'); nav.dataset.nav = 'desafios';
  const view = node('view'); view.dataset.view = 'desafios';
  const document = {
    addEventListener(type, cb) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(cb);
    },
    querySelector: node,
    querySelectorAll(selector) {
      const mapping = {
        '[data-start-fractions]': [fraction],
        '[data-start-model]': [R, P],
        '[data-model-status]': [rLabel, pLabel],
        '[data-fraction-status]': [node('fraction-status')],
        '[data-nav]': [nav],
        '.view': [view],
        '.nav-button, .mobile-nav button': [nav]
      };
      return mapping[selector] || [];
    }
  };
  const initial = {
    profiles: {
      p1: {name: 'Perfil A', progress: {}, history: [
        {type:'desafios_modelo',blockId:'R',roundId:'A',at:1}
      ], evidence: [], pendingEvidence: []},
      p2: {name: 'Perfil V',progress: {},history: [],evidence: [],pendingEvidence: []}
    }
  };
  const localStorage = {
    getItem(key) { return key === 'ingreso-belgrano-monserrat-v1' ? JSON.stringify(initial) : null; },
    setItem() {}, removeItem() {}
  };
  const opened = [];
  const window = {
    INGRESO_ACCESS_MODE: 'family',
    addEventListener() {}, scrollTo() {},
    IngresoFractionChallenges: {
      open: async args => { opened.push({block:args.block || null,round:args.round}); },
      close() {}
    }
  };
  const anchor = '  function startRecommended() {';
  assert.ok(app.includes(anchor), 'No se encontró el punto de prueba');
  const source = app.replace(anchor,
    '  window.__challengeTest = { bind:bindUI, mode:v => {activeMode=v}, render:() => {renderFractionEntry();renderModelEntries()} };\n' + anchor);
  vm.runInNewContext(source, {window,document,localStorage,console}, {filename:'app.js'});
  const click = button => (listeners.get('click') || []).forEach(cb => cb({
    target:{closest:()=>button}, preventDefault() {}
  }));
  return {window, listeners, nodes:{fraction,R,P,nav,rLabel,pLabel}, opened, click};
}

test('bindUI se completa y los tres botones funcionan por clic real', () => {
  const t = setup();
  assert.doesNotThrow(() => t.window.__challengeTest.bind());
  t.window.__challengeTest.mode('p1');
  t.window.__challengeTest.render();
  t.click(t.nodes.fraction);
  t.click(t.nodes.R);
  t.click(t.nodes.P);
  assert.deepEqual(t.opened, [
    {block:null, round:'A'},
    {block:'R', round:'B'},
    {block:'P', round:'A'}
  ]);
  const before = t.opened.length;
  t.nodes.fraction.disabled = true;
  t.click(t.nodes.fraction);
  assert.equal(t.opened.length, before);
});

test('perfil independiente y acceso a pestaña Desafíos', () => {
  const t = setup();
  t.window.__challengeTest.bind();
  t.window.__challengeTest.mode('p2');
  t.window.__challengeTest.render();
  t.click(t.nodes.R);
  assert.equal(t.opened.at(-1).round,'A');
  assert.doesNotThrow(() => {
    for (const handler of t.nodes.nav.handlers.click || []) handler({preventDefault(){}});
  });
});
