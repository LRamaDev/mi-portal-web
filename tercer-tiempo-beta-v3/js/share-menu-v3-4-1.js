(function installTercerTiempoShareMenuV341(root) {
  if (typeof document === 'undefined') return;

  const shareApi = root.TercerTiempoShareV34;
  let sheet = null;
  let lastTrigger = null;
  let scheduled = false;

  const closeSheet = () => {
    if (!sheet) return;
    sheet.hidden = true;
    document.body.classList.remove('tt-share-sheet-open');
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  };

  const ensureSheet = () => {
    if (sheet && document.body.contains(sheet)) return sheet;

    sheet = document.createElement('div');
    sheet.className = 'tt-share-sheet-backdrop';
    sheet.hidden = true;
    sheet.innerHTML = `
      <section class="tt-share-sheet" role="dialog" aria-modal="true" aria-labelledby="tt-share-sheet-title">
        <div class="tt-share-sheet-handle" aria-hidden="true"></div>
        <header class="tt-share-sheet-head">
          <div>
            <strong id="tt-share-sheet-title">Compartir formación</strong>
            <small>Elegí qué imagen querés enviar por WhatsApp</small>
          </div>
          <button class="tt-share-sheet-close" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="tt-share-sheet-options">
          <button type="button" class="tt-share-option" data-share-kind="formation">
            <span class="tt-share-option-icon" aria-hidden="true">⚽</span>
            <span class="tt-share-option-copy">
              <strong>Distribución en cancha</strong>
              <small>Camisetas, posiciones y sistema de juego</small>
            </span>
            <span class="tt-share-option-arrow" aria-hidden="true">›</span>
          </button>
          <button type="button" class="tt-share-option" data-share-kind="list">
            <span class="tt-share-option-icon" aria-hidden="true">📋</span>
            <span class="tt-share-option-copy">
              <strong>Lista de jugadores</strong>
              <small>Equipos o convocados en una imagen</small>
            </span>
            <span class="tt-share-option-arrow" aria-hidden="true">›</span>
          </button>
        </div>
        <p class="tt-share-sheet-note">En celular se abre el menú para compartir la imagen. En PC se prepara para WhatsApp Web.</p>
      </section>`;

    document.body.appendChild(sheet);

    sheet.querySelector('.tt-share-sheet-close').addEventListener('click', closeSheet);
    sheet.addEventListener('click', event => {
      if (event.target === sheet) closeSheet();
    });

    sheet.querySelectorAll('[data-share-kind]').forEach(button => {
      button.addEventListener('click', async () => {
        const kind = button.dataset.shareKind;
        closeSheet();
        if (!shareApi || typeof shareApi.handleShare !== 'function') {
          root.alert('No se pudo abrir la opción de compartir. Recargá la página e intentá de nuevo.');
          return;
        }
        try {
          await Promise.resolve(shareApi.handleShare(kind));
        } catch (error) {
          console.error('[TercerTiempoShareMenuV341]', error);
          root.alert('No se pudo preparar la imagen para compartir.');
        }
      });
    });

    return sheet;
  };

  const openSheet = trigger => {
    lastTrigger = trigger || null;
    const panel = ensureSheet();
    panel.hidden = false;
    document.body.classList.add('tt-share-sheet-open');
    panel.querySelector('[data-share-kind]')?.focus();
  };

  const mountShareMenu = () => {
    const container = document.querySelector('.team-builder-card .share-card-actions');
    if (!container) return false;

    document.body.classList.add('tt-v341-ready');
    container.classList.add('tt-share-menu-managed');

    let trigger = container.querySelector('[data-v341-share-menu]');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'primary-button tt-share-main-button';
      trigger.dataset.v341ShareMenu = '1';
      trigger.innerHTML = '<span class="tt-share-main-icon" aria-hidden="true">↗</span><span>Compartir</span>';
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.title = 'Compartir la cancha o la lista como imagen';
      trigger.addEventListener('click', () => openSheet(trigger));
      container.appendChild(trigger);
    }

    return true;
  };

  const scheduleMount = () => {
    if (scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || root.setTimeout)(() => {
      scheduled = false;
      mountShareMenu();
    });
  };

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sheet && !sheet.hidden) closeSheet();
  });

  const observer = new MutationObserver(scheduleMount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scheduleMount);
  scheduleMount();

  root.TercerTiempoShareMenuV341 = {
    open: openSheet,
    close: closeSheet,
    mount: mountShareMenu
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
