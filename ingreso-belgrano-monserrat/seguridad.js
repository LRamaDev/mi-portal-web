(() => {
  'use strict';

  const cfg = window.INGRESO_CONFIG || {};
  const hasSupabase = Boolean(window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey);
  let client = null;
  let gate = null;

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
        <div class="family-access-mark">🔒</div>
        <p class="eyebrow">Acceso familiar</p>
        <h1>Ingreso Belgrano · Monserrat</h1>
        <p id="family-access-copy">Verificando acceso…</p>
        <div id="family-access-form" hidden>
          <label class="field">Correo familiar<input id="family-access-email" type="email" autocomplete="email"></label>
          <label class="field">Contraseña<input id="family-access-password" type="password" minlength="6" autocomplete="current-password"></label>
          <button id="family-access-login" class="primary-button" type="button">Ingresar</button>
        </div>
        <button id="family-access-logout" class="secondary-button" type="button" hidden>Cerrar sesión</button>
        <p class="privacy-note">El acceso está limitado a cuentas previamente habilitadas. No hay registro público desde esta pantalla.</p>
      </div>`;
    document.body.prepend(gate);

    const style = document.createElement('style');
    style.id = 'family-access-style';
    style.textContent = `
      #family-access-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:22px;background:linear-gradient(145deg,#eaf3fb,#f8fbff);font-family:inherit}
      .family-access-card{width:min(440px,100%);background:#fff;border:1px solid rgba(23,63,107,.14);border-radius:24px;padding:28px;box-shadow:0 24px 70px rgba(23,63,107,.18)}
      .family-access-mark{font-size:34px;margin-bottom:10px}.family-access-card h1{margin:.2rem 0 .7rem;color:#173f6b}.family-access-card .field{display:grid;gap:6px;margin:14px 0}.family-access-card input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #bcc9d6;border-radius:12px;font:inherit}.family-access-card button{width:100%;margin-top:10px}.family-access-card .privacy-note{margin-top:18px;font-size:.86rem;color:#617080}
      .security-pending #profile-gate,.security-pending #app-shell{display:none!important}
    `;
    document.head.appendChild(style);

    gate.querySelector('#family-access-login').addEventListener('click', login);
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
    btn.textContent = busy ? 'Ingresando…' : 'Ingresar';
  }

  async function checkAccess(session) {
    if (!session?.user) {
      setView({ message: 'Ingresá con la cuenta familiar habilitada para continuar.', form: true });
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
      setView({ message: 'No se pudo verificar el acceso. Revisá la conexión e intentá nuevamente.', logout: true });
      return false;
    }

    if (!data?.user_id) {
      setView({ message: `La cuenta <strong>${escapeHtml(session.user.email || 'actual')}</strong> inició sesión, pero no está habilitada para esta app.`, logout: true });
      return false;
    }

    document.body.classList.remove('security-pending');
    gate.remove();
    gate = null;
    document.dispatchEvent(new CustomEvent('ingreso:authorized', { detail: { userId: session.user.id } }));
    return true;
  }

  async function login() {
    if (!client) return;
    const email = gate.querySelector('#family-access-email').value.trim();
    const password = gate.querySelector('#family-access-password').value;
    if (!email || password.length < 6) {
      setView({ message: 'Completá correo y contraseña.', form: true });
      return;
    }
    setView({ message: 'Ingresando y verificando autorización…', form: true, busy: true });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setView({ message: 'Correo o contraseña incorrectos, o acceso no disponible.', form: true });
      return;
    }
    await checkAccess(data.session);
  }

  async function logout() {
    if (client) await client.auth.signOut();
    setView({ message: 'Ingresá con la cuenta familiar habilitada para continuar.', form: true });
  }

  async function init() {
    document.body.classList.add('security-pending');
    mountGate();
    if (!hasSupabase) {
      setView({ message: 'La protección de acceso no está configurada. Revisá la conexión con Supabase.' });
      return;
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const { data } = await client.auth.getSession();
    await checkAccess(data.session);
    client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        document.body.classList.add('security-pending');
        mountGate();
        setView({ message: 'Ingresá con la cuenta familiar habilitada para continuar.', form: true });
      }
    });
  }

  init().catch(error => {
    console.error('[Ingreso] Error en acceso familiar', error);
    setView({ message: 'Ocurrió un error al preparar el acceso. Recargá la página.' });
  });
})();