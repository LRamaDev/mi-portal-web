(() => {
  'use strict';

  const DISPLAY_VERSION = '6.8.2';

  function shuffleArray(values, random = Math.random) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  const core = { shuffleArray };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
    return;
  }

  function shuffleChoiceList(list) {
    if (!list || list.dataset.v682Shuffled === 'true') return;
    const options = [...list.children];
    if (options.length < 2) return;
    list.dataset.v682Shuffled = 'true';
    shuffleArray(options).forEach(option => list.appendChild(option));
  }

  function scan(root = document) {
    if (root?.matches?.('.choice-list')) shuffleChoiceList(root);
    root?.querySelectorAll?.('.choice-list').forEach(shuffleChoiceList);
  }

  function setVisibleVersion() {
    const meta = document.querySelector('meta[name="app-version"]');
    if (meta) meta.setAttribute('content', DISPLAY_VERSION);
    const badge = document.querySelector('.build-version');
    if (badge) {
      badge.textContent = `Versión ${DISPLAY_VERSION}`;
      badge.setAttribute('aria-label', `Versión instalada ${DISPLAY_VERSION}`);
      badge.title = `Versión ${DISPLAY_VERSION} · opciones múltiples aleatorizadas`;
    }
  }

  function init() {
    setVisibleVersion();
    scan(document);
    const target = document.body || document.documentElement;
    if (!target || typeof MutationObserver === 'undefined') return;
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === 1) scan(node);
      }));
    }).observe(target, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
