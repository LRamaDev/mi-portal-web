(function loadTercerTiempoCollaboration(root) {
  if (typeof document === 'undefined') return;
  const sync = root.TercerTiempoCloudSync;

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });

  const start = async () => {
    try {
      if (sync?.configured && typeof sync.whenReady === 'function') {
        await sync.whenReady();
      }
      await loadScript('./js/collaboration.js');
      await loadScript('./js/collaboration-ui.js');
      await loadScript('./js/permission-guard.js');
    } catch (error) {
      console.error('[TercerTiempoCollaborationLoader]', error);
    }
  };

  start();
})(typeof globalThis !== 'undefined' ? globalThis : window);
