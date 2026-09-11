(function exposeStorage(root, factory) {
  const models = typeof module === 'object' && module.exports
    ? require('./models.js')
    : root.TercerTiempoModels;
  const api = factory(models);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createStorageApi(models) {
  const STORAGE_KEY = 'tt_app_v1';
  const LEGACY_PLAYER_KEYS = ['tt_v2_players', 'tt_players'];
  const LEGACY_EXPENSE_KEYS = ['tt_v2_expenses', 'tt_expenses'];

  const safeParse = (value, fallback) => {
    try {
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const readPreferredList = (storage, keys) => {
    for (const key of keys) {
      try {
        const raw = storage.getItem(key);
        if (raw !== null) {
          const parsed = safeParse(raw, []);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch {
        return [];
      }
    }
    return [];
  };

  const createAdapter = (storage) => ({
    load() {
      try {
        const saved = safeParse(storage.getItem(STORAGE_KEY), null);
        if (saved) return models.sanitizeState(saved);
      } catch {
        return models.createInitialState();
      }
      const legacyPlayers = readPreferredList(storage, LEGACY_PLAYER_KEYS);
      const legacyExpenses = readPreferredList(storage, LEGACY_EXPENSE_KEYS);
      return models.createInitialState(legacyPlayers, legacyExpenses);
    },

    save(state) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(models.sanitizeState(state)));
        return true;
      } catch {
        return false;
      }
    }
  });

  let browserAdapter = null;
  try {
    if (typeof localStorage !== 'undefined') browserAdapter = createAdapter(localStorage);
  } catch {
    browserAdapter = null;
  }

  return {
    STORAGE_KEY,
    LEGACY_PLAYER_KEYS,
    LEGACY_EXPENSE_KEYS,
    safeParse,
    readPreferredList,
    createAdapter,
    load: () => browserAdapter ? browserAdapter.load() : models.createInitialState(),
    save: state => browserAdapter ? browserAdapter.save(state) : false
  };
});
