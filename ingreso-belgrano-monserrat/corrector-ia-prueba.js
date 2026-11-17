(() => {
  'use strict';

  // Esta página NO carga app.js ni seguridad.js. Solo crea un cliente Supabase
  // en su propio documento, sin interferir con el cliente de la app familiar.
  const ui = id => document.getElementById(id);
  const button = ui('run-check');
  const accessStatus = ui('connection-status');
  const testStatus = ui('test-status');
  const resultPanel = ui('result-panel');
  let client = null;
  let running = false;

  function message(element, text, state) {
    element.textContent = text;
    element.dataset.state = state;
  }

  async function checkAccess() {
    button.disabled = true;
    try {
      if (localStorage.getItem('ingreso-access-mode-v1') === 'visitor') {
        message(accessStatus, 'La aplicación está en modo visitante. Ingresá con la cuenta familiar para hacer esta prueba.', 'error');
        return;
      }
      const config = window.INGRESO_CONFIG;
      if (!window.supabase?.createClient || !config?.supabaseUrl || !config?.supabaseAnonKey) {
        message(accessStatus, 'No se pudo cargar la configuración de Supabase. Actualizá la página.', 'error');
        return;
      }
      client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: { detectSessionInUrl: false }
      });
      const { data: userData, error: authError } = await client.auth.getUser();
      if (authError || !userData?.user?.id) {
        message(accessStatus, 'No hay una sesión familiar válida. Abrí la aplicación, iniciá sesión y volvé aquí.', 'error');
        return;
      }
      const { data: authorized, error: accessError } = await client.from('study_access')
        .select('user_id').eq('user_id', userData.user.id).maybeSingle();
      if (accessError || !authorized?.user_id) {
        message(accessStatus, 'La cuenta no figura entre las autorizadas para esta aplicación.', 'error');
        return;
      }
      button.disabled = false;
      message(accessStatus, 'Sesión familiar autorizada. Podés realizar la prueba.', 'ok');
      message(testStatus, 'Listo para comprobar la conexión.', 'idle');
    } catch {
      message(accessStatus, 'No fue posible comprobar la sesión. Revisá la conexión y actualizá la página.', 'error');
    }
  }

  function showStrengths(items) {
    const list = ui('result-strengths');
    list.replaceChildren();
    for (const item of items) {
      const element = document.createElement('li');
      element.textContent = item;
      list.appendChild(element);
    }
  }

  async function runCheck() {
    if (running || !client || button.disabled) return;
    running = true;
    button.disabled = true;
    resultPanel.hidden = true;
    message(testStatus, 'Consultando la función experimental de Supabase…', 'busy');
    try {
      const { data, error } = await client.functions.invoke('corrector-ia-poc', {
        body: { fixtureId: 'ficcion-01', modelo: 'qwen' }
      });
      if (error) {
        const status = Number(error?.context?.status);
        const detail = status === 401 ? 'La sesión no fue aceptada.'
          : status === 403 ? 'La cuenta no está autorizada.'
          : status === 503 ? 'La función está deshabilitada o no está en modo de prueba.'
          : Number.isInteger(status) && status > 0 ? 'La función respondió con HTTP ' + status + '.'
          : 'No se pudo establecer conexión con la función.';
        message(testStatus, 'No se completó la prueba. ' + detail, 'error');
        return;
      }
      if (data?.modo !== 'simulado' || data?.fixtureId !== 'ficcion-01' ||
          data?.resultado?.puntajeEstimado !== 23 || data?.resultado?.maximo !== 35 ||
          !Array.isArray(data?.resultado?.fortalezas)) {
        message(testStatus, 'Respuesta inesperada: no se confirmó el modo simulado. No usamos esta respuesta como una evaluación.', 'error');
        return;
      }
      ui('result-mode').textContent = 'Simulado';
      ui('result-score').textContent = '23 / 35';
      showStrengths(data.resultado.fortalezas);
      resultPanel.hidden = false;
      message(testStatus, 'Conexión verificada: GitHub Pages → Supabase → corrector-ia-poc.', 'ok');
    } catch {
      message(testStatus, 'La prueba no pudo completarse. No se enviaron datos personales.', 'error');
    } finally {
      running = false;
      button.disabled = false;
    }
  }

  button.addEventListener('click', runCheck);
  checkAccess();
})();
