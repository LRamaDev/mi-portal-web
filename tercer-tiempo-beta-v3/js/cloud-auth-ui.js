(function mountTercerTiempoCloudAuth(root) {
  const sync = root.TercerTiempoCloudSync;
  if (!sync?.configured || typeof document === 'undefined') return;

  const escapeHtml = value => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const shell = document.createElement('div');
  shell.id = 'tt-cloud-account';
  shell.innerHTML = `
    <button class="tt-cloud-trigger" type="button" aria-expanded="false" aria-controls="tt-cloud-panel">
      <span class="tt-cloud-dot" aria-hidden="true"></span>
      <span class="tt-cloud-trigger-label">Cuenta</span>
    </button>
    <section id="tt-cloud-panel" class="tt-cloud-panel" hidden aria-label="Cuenta y sincronización">
      <div class="tt-cloud-head">
        <div>
          <strong>Tu cuenta</strong>
          <small>Sincronizá Tercer Tiempo entre dispositivos</small>
        </div>
        <button class="tt-cloud-close" type="button" aria-label="Cerrar">×</button>
      </div>
      <div class="tt-cloud-body">
        <div class="tt-cloud-loading">Comprobando sesión…</div>
      </div>
    </section>`;
  document.body.appendChild(shell);

  const trigger = shell.querySelector('.tt-cloud-trigger');
  const triggerLabel = shell.querySelector('.tt-cloud-trigger-label');
  const dot = shell.querySelector('.tt-cloud-dot');
  const panel = shell.querySelector('.tt-cloud-panel');
  const closeButton = shell.querySelector('.tt-cloud-close');
  const body = shell.querySelector('.tt-cloud-body');

  let currentSession = null;
  let busy = false;

  const setOpen = open => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
  };

  const message = (text, kind = 'info') => {
    const box = body.querySelector('.tt-cloud-message');
    if (!box) return;
    box.className = `tt-cloud-message is-${kind}`;
    box.textContent = text;
    box.hidden = !text;
  };

  function renderSignedOut() {
    triggerLabel.textContent = 'Cuenta';
    dot.classList.remove('is-online');
    body.innerHTML = `
      <p class="tt-cloud-intro">Creá una cuenta o iniciá sesión para ver los mismos grupos, jugadores e historial en tu PC y celular.</p>
      <div class="tt-cloud-tabs" role="tablist">
        <button type="button" class="is-active" data-mode="signin">Ingresar</button>
        <button type="button" data-mode="signup">Crear cuenta</button>
      </div>
      <form class="tt-cloud-form" data-mode="signin">
        <label>Email<input name="email" type="email" autocomplete="email" required placeholder="tu@email.com"></label>
        <label>Contraseña<input name="password" type="password" autocomplete="current-password" required minlength="6" placeholder="••••••••"></label>
        <button class="tt-cloud-primary" type="submit">Iniciar sesión</button>
      </form>
      <div class="tt-cloud-message" hidden></div>
      <p class="tt-cloud-note">Tus datos siguen guardándose también en este dispositivo como respaldo.</p>`;

    const tabs = Array.from(body.querySelectorAll('.tt-cloud-tabs button'));
    const form = body.querySelector('.tt-cloud-form');
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      tabs.forEach(item => item.classList.toggle('is-active', item === tab));
      form.dataset.mode = mode;
      const password = form.elements.password;
      password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
      form.querySelector('.tt-cloud-primary').textContent = mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión';
      message('');
    }));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      const submit = form.querySelector('.tt-cloud-primary');
      const mode = form.dataset.mode;
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      submit.disabled = true;
      submit.textContent = mode === 'signup' ? 'Creando…' : 'Ingresando…';
      message('');
      try {
        const result = mode === 'signup'
          ? await sync.signUp(email, password)
          : await sync.signIn(email, password);
        if (result?.session) {
          message('Cuenta conectada. Actualizando tus datos…', 'success');
          setTimeout(() => root.location.reload(), 350);
          return;
        }
        if (mode === 'signup') {
          message('Cuenta creada. Revisá tu email para confirmar el registro y después iniciá sesión.', 'success');
        } else {
          message('No se pudo iniciar la sesión.', 'error');
        }
      } catch (error) {
        console.error('[TercerTiempoCloudAuth]', error);
        message(error?.message || 'No se pudo completar la operación.', 'error');
      } finally {
        busy = false;
        submit.disabled = false;
        submit.textContent = mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión';
      }
    });
  }

  function renderSignedIn(session) {
    const email = session?.user?.email || 'Cuenta conectada';
    triggerLabel.textContent = 'Sincronizado';
    dot.classList.add('is-online');
    body.innerHTML = `
      <div class="tt-cloud-user">
        <span class="tt-cloud-status-icon">✓</span>
        <div><strong>Sincronización automática</strong><small>${escapeHtml(email)}</small></div>
      </div>
      <p class="tt-cloud-auto-note">No tenés que hacer nada: los cambios se guardan en este dispositivo y se sincronizan con la nube automáticamente.</p>
      <div class="tt-cloud-message" hidden></div>
      <details class="tt-cloud-advanced">
        <summary>Opciones avanzadas de sincronización</summary>
        <div class="tt-cloud-actions">
          <button type="button" class="tt-cloud-primary" data-action="upload">Forzar copia de este dispositivo</button>
          <button type="button" class="tt-cloud-secondary" data-action="download">Recuperar copia de la nube</button>
        </div>
        <p class="tt-cloud-note">Usá estas opciones sólo si necesitás resolver manualmente una sincronización. La copia elegida puede reemplazar datos de la otra ubicación.</p>
      </details>
      <button type="button" class="tt-cloud-link" data-action="signout">Cerrar sesión</button>`;

    body.querySelector('[data-action="upload"]').addEventListener('click', async event => {
      if (busy) return;
      const confirmed = root.confirm('¿Forzar la copia de este dispositivo en la nube?\n\nUsalo sólo si estás seguro de que estos son los datos que querés conservar.');
      if (!confirmed) return;
      busy = true;
      event.currentTarget.disabled = true;
      message('Guardando esta copia en la nube…');
      try {
        await sync.uploadLocalNow();
        message('Copia de este dispositivo guardada en la nube.', 'success');
      } catch (error) {
        message(error?.message || 'No se pudieron subir los datos.', 'error');
      } finally {
        busy = false;
        event.currentTarget.disabled = false;
      }
    });

    body.querySelector('[data-action="download"]').addEventListener('click', async event => {
      if (busy) return;
      const confirmed = root.confirm('¿Recuperar la copia guardada en la nube?\n\nLa copia de la nube reemplazará los datos locales de este dispositivo.');
      if (!confirmed) return;
      busy = true;
      event.currentTarget.disabled = true;
      message('Recuperando la copia de la nube…');
      try {
        const found = await sync.downloadRemoteNow();
        if (!found) {
          message('Todavía no hay una copia guardada en la nube.', 'info');
        } else {
          message('Copia recuperada. Actualizando la app…', 'success');
          setTimeout(() => root.location.reload(), 350);
        }
      } catch (error) {
        message(error?.message || 'No se pudieron descargar los datos.', 'error');
      } finally {
        busy = false;
        event.currentTarget.disabled = false;
      }
    });

    body.querySelector('[data-action="signout"]').addEventListener('click', async event => {
      if (busy) return;
      busy = true;
      event.currentTarget.disabled = true;
      message('Cerrando sesión…');
      try {
        await sync.signOut();
        currentSession = null;
        renderSignedOut();
      } catch (error) {
        message(error?.message || 'No se pudo cerrar la sesión.', 'error');
      } finally {
        busy = false;
      }
    });
  }

  async function refreshSession() {
    try {
      currentSession = await sync.getSession();
      if (currentSession) renderSignedIn(currentSession);
      else renderSignedOut();
    } catch (error) {
      body.innerHTML = `<div class="tt-cloud-message is-error">No se pudo conectar con la sincronización. ${escapeHtml(error?.message || '')}</div>`;
    }
  }

  trigger.addEventListener('click', () => setOpen(panel.hidden));
  closeButton.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
  root.addEventListener('tercer-tiempo-auth-change', event => {
    if (!event.detail?.signedIn && currentSession) {
      currentSession = null;
      renderSignedOut();
    }
  });

  refreshSession();
})(typeof globalThis !== 'undefined' ? globalThis : window);
