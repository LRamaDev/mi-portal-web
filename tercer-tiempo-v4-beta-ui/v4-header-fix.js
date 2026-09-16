(function fixV4Header(root) {
  if (typeof document === 'undefined') return;

  let scheduled = false;

  function refreshHeader() {
    const config = root.TercerTiempoConfig || {};
    const storage = root.TercerTiempoStorage;
    const logo = document.querySelector('.topbar .brand-logo');
    if (logo && logo.getAttribute('src') !== './icon.svg') logo.setAttribute('src', './icon.svg');

    const subtitle = document.querySelector('.topbar .brand-copy span');
    if (subtitle && storage) {
      const state = storage.load();
      const group = state.groups?.find(item => item.id === state.activeGroupId) || state.groups?.[0];
      const next = group?.name || 'Grupo activo';
      if (subtitle.textContent !== next) subtitle.textContent = next;
    }

    const badge = document.getElementById('tt-v4-badge');
    if (badge && config.versionLabel && badge.textContent !== config.versionLabel) {
      badge.textContent = config.versionLabel;
      badge.title = `Versión instalada: ${config.versionLabel}`;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || root.setTimeout)(() => {
      scheduled = false;
      refreshHeader();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  root.addEventListener?.('tercer-tiempo-cloud-update', schedule);
  root.addEventListener?.('tercer-tiempo-auth-change', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  schedule();
})(typeof globalThis !== 'undefined' ? globalThis : window);
