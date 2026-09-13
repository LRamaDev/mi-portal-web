(function exposeEntitlements(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TercerTiempoEntitlements = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function createEntitlements() {
  const getAccessConfig = config => config?.access && typeof config.access === 'object'
    ? config.access
    : { enforcementMode: 'preview', defaultPlanCode: 'free', plans: {} };

  const normalizePlanCode = (value, config) => {
    const access = getAccessConfig(config);
    const plans = access.plans && typeof access.plans === 'object' ? access.plans : {};
    const requested = String(value || '').trim();
    return plans[requested] ? requested : access.defaultPlanCode || 'free';
  };

  const resolveGroupEntitlements = (group, config) => {
    const access = getAccessConfig(config);
    const runtimeFeatures = config?.features && typeof config.features === 'object' ? config.features : {};
    const planCode = normalizePlanCode(group?.planCode, config);
    const plan = access.plans?.[planCode] || { label: planCode, groupLimit: null, features: {} };
    const planFeatures = plan.features && typeof plan.features === 'object' ? plan.features : {};
    const isPreview = access.enforcementMode !== 'enforced';
    const featureNames = new Set([...Object.keys(runtimeFeatures), ...Object.keys(planFeatures)]);
    const features = {};
    featureNames.forEach(feature => {
      const shipped = runtimeFeatures[feature] === true;
      features[feature] = shipped && (isPreview || planFeatures[feature] === true);
    });

    return {
      planCode,
      planLabel: plan.label || planCode,
      groupLimit: plan.groupLimit ?? null,
      paidScope: access.paidScope || 'group_admin',
      ownerUserId: group?.ownerUserId || null,
      isPreview,
      features: Object.freeze(features),
      canUse: feature => features[feature] === true
    };
  };

  return {
    normalizePlanCode,
    resolveGroupEntitlements
  };
});
