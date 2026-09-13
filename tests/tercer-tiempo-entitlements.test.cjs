const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const appRoot = path.join(root, 'tercer-tiempo-beta-v3');
const entitlements = require(path.join(appRoot, 'js', 'entitlements.js'));
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

const config = mode => ({
  features: {
    history: true,
    shareCards: true,
    multipleGroups: false,
    advancedExports: false
  },
  access: {
    enforcementMode: mode,
    paidScope: 'group_admin',
    defaultPlanCode: 'free',
    plans: {
      free: { label: 'Gratis', groupLimit: 1, features: { history: false, shareCards: true, multipleGroups: false } },
      pro_group: { label: 'Pro', groupLimit: null, features: { history: true, shareCards: true, multipleGroups: true } }
    }
  }
});

test('los permisos se resuelven por grupo y en modo preview no bloquean funciones publicadas', () => {
  const access = entitlements.resolveGroupEntitlements({ planCode: 'free', ownerUserId: 'admin_1' }, config('preview'));
  assert.equal(access.planCode, 'free');
  assert.equal(access.paidScope, 'group_admin');
  assert.equal(access.ownerUserId, 'admin_1');
  assert.equal(access.isPreview, true);
  assert.equal(access.canUse('history'), true);
  assert.equal(access.canUse('shareCards'), true);
  assert.equal(access.canUse('multipleGroups'), false);
});

test('el modo de cobro futuro respeta el plan y no habilita capacidades no publicadas', () => {
  const freeAccess = entitlements.resolveGroupEntitlements({ planCode: 'free' }, config('enforced'));
  const proAccess = entitlements.resolveGroupEntitlements({ planCode: 'pro_group' }, config('enforced'));
  assert.equal(freeAccess.canUse('history'), false);
  assert.equal(proAccess.canUse('history'), true);
  assert.equal(proAccess.canUse('multipleGroups'), false);
  assert.equal(entitlements.normalizePlanCode('desconocido', config('preview')), 'free');
});

test('la interfaz registra el resolver sin exponer bloqueos Pro en el producto actual', () => {
  const html = read('tercer-tiempo-beta-v3/index.html');
  const app = read('tercer-tiempo-beta-v3/js/app.jsx');
  const configSource = read('tercer-tiempo-beta-v3/js/config.js');
  assert.match(html, /\.\/js\/entitlements\.js/);
  assert.match(app, /resolveGroupEntitlements/);
  assert.match(app, /const VIEW_FEATURES/);
  assert.match(app, /canUse\('shareCards'\)/);
  assert.match(configSource, /enforcementMode: 'preview'/);
  assert.match(configSource, /paidScope: 'group_admin'/);
  assert.match(configSource, /pro_group/);
  assert.doesNotMatch(app, /Suscribite|Desbloquear Pro|Tercer Tiempo Pro/);
});
