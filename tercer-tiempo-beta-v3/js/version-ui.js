(function mountVersionBadge(root) {
  const config = root.TercerTiempoConfig || {};
  if (typeof document === 'undefined') return;

  const version = String(config.appVersion || '3.4.1');
  const label = String(config.versionLabel || `Beta v${version}`);
  const badgeId = 'tt-version-badge';

  document.documentElement.dataset.appVersion = version;
  document.title = `Tercer Tiempo ${label} | Lea Rama Dev`;

  const mount = () => {
    if (document.getElementById(badgeId)) return true;
    const brand = document.querySelector('.topbar .brand');
    if (!brand) return false;

    const badge = document.createElement('span');
    badge.id = badgeId;
    badge.className = 'tt-version-badge';
    badge.textContent = label;
    badge.title = `Versión instalada: ${label}`;
    badge.setAttribute('aria-label', `Versión de la aplicación: ${label}`);
    brand.appendChild(badge);
    return true;
  };

  if (mount()) return;

  const observer = new MutationObserver(() => {
    if (!mount()) return;
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})(typeof globalThis !== 'undefined' ? globalThis : window);
