(function exposeConfig(root) {
  root.TercerTiempoConfig = Object.freeze({
    schemaVersion: 1,
    storageKey: 'tt_app_v1',
    features: Object.freeze({
      groups: true,
      playerProfiles: true,
      multipleGroups: false,
      confirmations: false,
      teamBuilder: false,
      history: false,
      statistics: false,
      proEntitlements: false
    })
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
