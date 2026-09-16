(() => {
  'use strict';

  const cfg = window.INGRESO_CONFIG || {};
  const hasSupabase = Boolean(window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey);

  const ACCESS_MODE_KEY = 'ingreso-access-mode-v1';
  const FAMILY_STATE_KEY = 'ingreso-belgrano-monserrat-v1';
  const VISITOR_STATE_KEY = 'ingreso-belgrano-monserrat-visitor-v1';
  const FAMILY_FEEDBACK_KEY = 'ingreso-belgrano-monserrat-feedback-v1';
  const VISITOR_FEEDBACK_KEY = 'ingreso-belgrano-monserrat-visitor-feedback-v1';

  const nativeStorage = window.Storage?.prototype ? {
    getItem: window.Storage.prototype.getItem,
    setItem: window.Storage.prototype.setItem,
    removeItem: window.Storage.prototype.removeItem
  } : null;

  let accessMode = readAccessMode();
  let client = null;
  let gate = null;

  installStorageIsolation();
  installVisitorSupabaseIsolation();
  window.INGRESO_ACCESS_MODE = accessMode;

  function readAccessMode() {
    try {
      const mode = nativeStorage
        ? nativeStorage.getItem.call(localStorage, ACCESS_MODE_KEY)
        : localStorage.getItem(ACCESS_MODE_KEY);
      return mode === 'visitor' ? 'visitor' : 'family';
    } catch {
      return 'family';
    }
  }

  function writeAccessMode(mode) {
    accessMode = mode === 'visitor' ? 'visitor' : 'family';
    window.INGRESO_ACCESS_MODE = accessMode;
    try {
      if (nativeStorage) nativeStorage.setItem.call(localStorage, ACCESS_MODE_KEY, accessMode);
      else localStorage.setItem(ACCESS_MODE_KEY, accessMode);
    } catch (error) {
      console.warn('[Ingreso] No se pudo guardar el modo de acceso', error);
    }
  }

  function redirectedKey(key) {
    if (accessMode !== 'visitor') return key;
    if (key === FAMILY_STATE_KEY) return VISITOR_STATE_KEY;
    if (key === FAMILY_FEEDBACK_KEY) return VISITOR_FEEDBACK_KEY;
    return key;
  }

  function installStorageIsolation() {
    const proto = window.Storage?.prototype;
    if (!proto || !nativeStorage || window.__INGRESO_VISITOR_STORAGE_ROUTER__) return;
    window.__INGRESO_VISITOR_STORAGE_ROUTER__ = true;

    proto.getItem = function(key) {
      if (this === localStorage) return nativeStorage.getItem.call(this, redirectedKey(String(key)));
      return nativeStorage.getItem.call(this, key);
    };

    proto.setItem = function(key, value) {
      if (this === localStorage) return nativeStorage.setItem.call(this, redirectedKey(String(key)), value);
      return nativeStorage.setItem.call(this, key, value);
    };

    proto.removeItem = function(key) {
      if (this === localStorage) return nativeStorage.removeItem.call(this, redirectedKey(String(key)));
      return nativeStorage.removeItem.call(this, key);
    };
  }

  function installVisitorSupabaseIsolation() {
    if (accessMode !== 'visitor' || !window.supabase?.createClient || window.__INGRESO_VISITOR_SUPABASE_ISOLATION__) return;
    window.__INGRESO_VISITOR_SUPABASE_ISOLATION__ = true;

    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = (url, key, options = {}) => {
      const memory = new Map();
      const memoryStorage = {
        getItem(storageKey) { return memory.has(storageKey) ? memory.get(storageKey) : null; },
        setItem(storageKey, value) { memory.set(storageKey, String(value)); },
        removeItem(storageKey) { memory.delete(storageKey); }
      };
      return originalCreateClient(url, key, {
        ...options,
        auth: {
          ...(options.auth || {}),
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: memoryStorage
        }
      });
    };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function mountGate() {
    if (gate) return gate;
    gate = document.createElement('section');
    gate.id = 'family-access-gate';
    gate.setAttribute('aria-live', 'polite');
    gate.innerHTML = `
      <div class="family-access-card">
        <div class="family-access-mark">∑A</div>
        <p class="eyebrow">Preparación de ingreso</p>
        <h1>Belgrano · Monserrat</h1>
        <p id="family-access-copy">Verificando acceso…</p>
        <div id="family-access-form" hidden>
          <label class="field">Correo familiar<input id="family-access-email" type="email" autocomplete="email"></label>
          <label class="field">Contraseña<input id="family-access-password" type="password" minlength="6" autocomplete="current-password"></label>
          <button id="family-access-login" class="primary-button" type="button">Ingresar con cuenta familiar</button>
        </div>
        <div class="access-divider" aria-hidden="true"><span>o</span></div>
        <button id="family-access-visitor" class="visitor-button" type="button">🎓 Continuar como visitante</button>
        <p class="visitor-note">Como visitante podés hacer diagnósticos, prácticas y simulacros. Tu progreso queda guardado solamente en este navegador y nunca se mezcla con el progreso familiar.</p>
        <button id="family-access-logout" class="secondary-button" type="button" hidden>Cerrar sesión</button>
        <p class="privacy-note">La cuenta familiar sincroniza entre dispositivos. El modo visitante no necesita registro ni contraseña.</p>
      </div>`;
    document.body.prepend(gate);

    const style = document.createElement('style');
    style.id = 'family-access-style';
    style.textContent = `
      #family-access-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:22px;background:linear-gradient(145deg,#eaf3fb,#f8fbff);font-family:inherit;overflow:auto}
      .family-access-card{width:min(470px,100%);background:#fff;border:1px solid rgba(23,63,107,.14);border-radius:24px;padding:28px;box-shadow:0 24px 70px rgba(23,63,107,.18)}
      .family-access-mark{display:grid;place-items:center;width:48px;height:48px;margin-bottom:12px;border-radius:15px;background:#173f6b;color:#fff;font-weight:900;font-size:18px}.family-access-card h1{margin:.2rem 0 .7rem;color:#173f6b}.family-access-card .field{display:grid;gap:6px;margin:14px 0}.family-access-card input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #bcc9d6;border-radius:12px;font:inherit}.family-access-card button{width:100%;margin-top:10px}.family-access-card .privacy-note{margin:18px 0 0;font-size:.86rem;color:#617080;line-height:1.45}
      .access-divider{display:flex;align-items:center;gap:10px;margin:16px 0 4px;color:#8794a2;font-size:.82rem;font-weight:800}.access-divider::before,.access-divider::after{content:"";height:1px;flex:1;background:#dde5ed}.access-divider span{padding:0 3px}
      .visitor-button{padding:12px 14px;border:1px solid #83bcae;border-radius:12px;background:#ecf9f5;color:#155f50;font:inherit;font-weight:850;cursor:pointer}.visitor-button:hover,.visitor-button:focus-visible{background:#def4ed;border-color:#5fa894}.visitor-note{margin:9px 2px 0;color:#5c6d76;font-size:.84rem;line-height:1.45}
      .security-pending #profile-gate,.security-pending #app-shell{display:none!important}
      body.ingreso-visitor .sync-panel{display:none!important}
      .visitor-local-panel{border-color:rgba(22,120,97,.2)!important;background:linear-gradient(145deg,#fff,#f1fbf7)!important}.visitor-local-panel h3{margin-bottom:8px}.visitor-local-panel p{color:#526679;line-height:1.5}.visitor-local-panel .visitor-warning{padding:10px 12px;border-radius:10px;background:#fff8e8;color:#76551b;font-size:.86rem}.visitor-mode-badge{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #b9ddd3;border-radius:999px;background:#effaf6;color:#176653;font-size:.78rem;font-weight:850;white-space:nowrap}
      body.ingreso-visitor #safe-sign-out{border-color:#b9ddd3;color:#176653;background:#f5fcf9}
      @media(max-width:540px){.family-access-card{padding:22px}.visitor-mode-badge{display:none}}
    `;
    document.head.appendChild(style);

    gate.querySelector('#family-access-login').addEventListener('click', login);
    gate.querySelector('#family-access-visitor').addEventListener('click', enterVisitor);
    gate.querySelector('#family-access-logout').addEventListener('click', logout);
    gate.querySelector('#family-access-password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
    return gate;
  }

  function setView({ message, form = false, logout = false, busy = false }) {
    mountGate();
    gate.querySelector('#family-access-copy').innerHTML = message;
    gate.querySelector('#family-access-form').hidden = !form;
    gate.querySelector('#family-access-logout').hidden = !logout;
    const btn = gate.querySelector('#family-access-login');
    btn.disabled = busy;
    btn.textContent = busy ? 'Ingresando…' : 'Ingresar con cuenta familiar';
  }

  function authorizeFamily(session) {
    document.body.classList.remove('security-pending', 'ingreso-visitor');
    if (gate) gate.remove();
    gate = null;
    document.dispatchEvent(new CustomEvent('ingreso:authorized', { detail: { mode: 'family', userId: session.user.id } }));
    return true;
  }

  function authorizeVisitor() {
    document.body.classList.remove('security-pending');
    document.body.classList.add('ingreso-visitor');
    if (gate) gate.remove();
    gate = null;
    decorateVisitorUi();
    document.dispatchEvent(new CustomEvent('ingreso:authorized', { detail: { mode: 'visitor', userId: null } }));
    return true;
  }

  async function checkAccess(session) {
    if (!session?.user) {
      setView({ message: 'Ingresá con la cuenta familiar habilitada o continuá como visitante.', form: true });
      return false;
    }

    setView({ message: 'Verificando que esta cuenta esté habilitada…', busy: true });
    const { data, error } = await client
      .from('study_access')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('[Ingreso] Error al verificar acceso', error);
      setView({ message: 'No se pudo verificar el acceso. Podés reintentar o usar el modo visitante.', logout: true });
      return false;
    }

    if (!data?.user_id) {
      setView({ message: `La cuenta <strong>${escapeHtml(session.user.email || 'actual')}</strong> inició sesión, pero no está habilitada para esta app. Podés cerrar esa sesión o continuar como visitante.`, logout: true });
      return false;
    }

    return authorizeFamily(session);
  }

  async function login() {
    if (!client) return;
    const email = gate.querySelector('#family-access-email').value.trim();
    const password = gate.querySelector('#family-access-password').value;
    if (!email || password.length < 6) {
      setView({ message: 'Completá correo y contraseña, o usá el modo visitante.', form: true });
      return;
    }
    setView({ message: 'Ingresando y verificando autorización…', form: true, busy: true });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setView({ message: 'Correo o contraseña incorrectos, o acceso no disponible. También podés continuar como visitante.', form: true });
      return;
    }
    await checkAccess(data.session);
  }

  async function enterVisitor() {
    const button = gate?.querySelector('#family-access-visitor');
    if (button) {
      button.disabled = true;
      button.textContent = 'Preparando modo visitante…';
    }

    try {
      if (client) await client.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.warn('[Ingreso] No se pudo cerrar la sesión local antes de entrar como visitante', error);
    }

    writeAccessMode('visitor');
    window.location.reload();
  }

  function leaveVisitor() {
    writeAccessMode('family');
    window.location.reload();
  }

  async function logout() {
    if (client) await client.auth.signOut({ scope: 'local' });
    writeAccessMode('family');
    setView({ message: 'Ingresá con la cuenta familiar habilitada o continuá como visitante.', form: true });
  }

  function decorateVisitorUi() {
    const apply = () => {
      if (accessMode !== 'visitor') return;
      document.body.classList.add('ingreso-visitor');

      const privacy = document.querySelector('#profile-gate .privacy-note');
      if (privacy) privacy.textContent = 'Modo visitante: estos perfiles y su progreso se guardan únicamente en este navegador y están separados de cualquier cuenta familiar.';

      const actions = document.querySelector('.top-actions');
      if (actions && !actions.querySelector('#visitor-mode-badge')) {
        const badge = document.createElement('span');
        badge.id = 'visitor-mode-badge';
        badge.className = 'visitor-mode-badge';
        badge.textContent = '🎓 Visitante · local';
        actions.prepend(badge);
      }

      const grid = document.querySelector('.family-grid');
      if (grid && !grid.querySelector('#visitor-local-panel')) {
        const panel = document.createElement('section');
        panel.id = 'visitor-local-panel';
        panel.className = 'panel visitor-local-panel';
        panel.innerHTML = `
          <p class="eyebrow">Modo visitante</p>
          <h3>Progreso guardado en este dispositivo</h3>
          <p>Podés usar el diagnóstico, la práctica adaptativa, los simulacros y el seguimiento sin crear una cuenta.</p>
          <p class="visitor-warning"><strong>Importante:</strong> si cambiás de dispositivo, borrás los datos del navegador o usás una ventana privada, este progreso no se transfiere.</p>
          <button id="visitor-switch-family" class="secondary-button" type="button">Ingresar con cuenta familiar</button>`;
        grid.appendChild(panel);
        panel.querySelector('#visitor-switch-family').addEventListener('click', leaveVisitor);
      }

      const exit = document.querySelector('#safe-sign-out');
      if (exit) {
        exit.title = 'Salir del modo visitante y volver al acceso familiar';
        exit.innerHTML = '<span class="exit-icon" aria-hidden="true">↩</span><span class="exit-long">Salir del modo visitante</span><span class="exit-short">Salir</span>';
      }
    };

    apply();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
    window.setTimeout(apply, 0);
    window.setTimeout(apply, 500);

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(apply);
      const start = () => observer.observe(document.body, { childList: true, subtree: true });
      if (document.body) start();
      else document.addEventListener('DOMContentLoaded', start, { once: true });
    }
  }

  document.addEventListener('click', event => {
    if (accessMode !== 'visitor') return;
    const exit = event.target.closest?.('#safe-sign-out');
    if (!exit) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    leaveVisitor();
  }, true);

  async function init() {
    document.body.classList.add('security-pending');

    if (accessMode === 'visitor') {
      authorizeVisitor();
      return;
    }

    mountGate();
    if (!hasSupabase) {
      setView({ message: 'La cuenta familiar no está disponible en este momento, pero podés continuar como visitante.' });
      return;
    }

    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data } = await client.auth.getSession();
    await checkAccess(data.session);
    client.auth.onAuthStateChange((_event, session) => {
      if (accessMode !== 'family') return;
      if (!session) {
        document.body.classList.add('security-pending');
        mountGate();
        setView({ message: 'Ingresá con la cuenta familiar habilitada o continuá como visitante.', form: true });
      }
    });
  }

  init().catch(error => {
    console.error('[Ingreso] Error en acceso', error);
    if (accessMode === 'visitor') authorizeVisitor();
    else setView({ message: 'Ocurrió un error al preparar el acceso. Podés recargar la página o usar el modo visitante.', form: true });
  });
})();