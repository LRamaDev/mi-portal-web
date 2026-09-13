(function exposeConfig(root) {
  root.TercerTiempoConfig = Object.freeze({
    schemaVersion: 5,
    storageKey: 'tt_app_v1',
    features: Object.freeze({
      groups: true,
      playerProfiles: true,
      multipleGroups: false,
      confirmations: false,
      teamBuilder: true,
      tacticalFormations: false,
      history: true,
      statistics: true,
      expenses: true,
      shareCards: true,
      proEntitlements: true
    }),
    access: Object.freeze({
      enforcementMode: 'preview',
      paidScope: 'group_admin',
      defaultPlanCode: 'free',
      plans: Object.freeze({
        free: Object.freeze({
          label: 'Gratis',
          groupLimit: 1,
          features: Object.freeze({
            groups: true,
            playerProfiles: true,
            teamBuilder: true,
            history: true,
            statistics: true,
            expenses: true,
            shareCards: true,
            multipleGroups: false,
            tacticalFormations: false,
            advancedExports: false,
            personalization: false
          })
        }),
        pro_group: Object.freeze({
          label: 'Tercer Tiempo Pro — Grupo',
          groupLimit: null,
          features: Object.freeze({
            groups: true,
            playerProfiles: true,
            teamBuilder: true,
            history: true,
            statistics: true,
            expenses: true,
            shareCards: true,
            multipleGroups: true,
            tacticalFormations: true,
            advancedExports: true,
            personalization: true
          })
        })
      })
    })
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
