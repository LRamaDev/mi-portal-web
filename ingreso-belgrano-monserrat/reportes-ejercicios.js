(() => {
  'use strict';

  const QUEUE_FAMILY = 'ingreso-exercise-reports-pending-v1';
  const QUEUE_VISITOR = 'ingreso-exercise-reports-visitor-v1';
  const ISSUE_LABELS = {
    respuesta: 'Respuesta o corrección incorrecta',
    consigna: 'Consigna confusa o incompleta',
    opciones: 'Opciones incorrectas o repetidas',
    contenido: 'Contenido o dato equivocado',
    otro: 'Otro problema'
  };
  const contexts = new Map();
  let selected = null;
  let syncing = false;

  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[c]);

  function isVisitor() {
    return window.INGRESO_ACCESS_MODE === 'visitor';
  }

  function queueKey() {
    return isVisitor() ? QUEUE_VISITOR : QUEUE_FAMILY;
  }

  function pending(key = queueKey()) {
    try {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  function writePending(rows, key = queueKey()) {
    localStorage.setItem(key, JSON.stringify(rows.slice(-150)));
  }

  function createClient() {
    const cfg = window.INGRESO_CONFIG;
    if (!window.supabase?.createClient || !cfg?.supabaseUrl || !cfg?.supabaseAnonKey) return null;
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  }

  function reportContext(detail) {
    if (!detail || !['exercise-dialog', 'full-sim-dialog'].includes(detail.dialogId) || !detail.exercise?.id) return null;
    const e = detail.exercise;
    return {
      dialogId: detail.dialogId,
      profile_id: ['p1', 'p2'].includes(detail.profileId) ? detail.profileId : 'p1',
      session_type: ['diagnostico', 'practica', 'simulacro'].includes(detail.sessionType) ? detail.sessionType : 'practica',
      exercise_id: String(e.id).slice(0, 100),
      skill_id: String(e.habilidad || '').slice(0, 100) || null,
      area: e.area === 'matematica' ? 'matematica' : 'lengua',
      school: ['belgrano', 'monserrat'].includes(detail.school) ? detail.school : null,
      snapshot: {
        consigna: String(e.consigna || '').slice(0, 2500),
        texto: String(e.texto || '').slice(0, 5000),
        tipo: e.tipo || null,
        opciones: Array.isArray(e.opciones) ? e.opciones.slice(0, 20).map(x => String(x).slice(0, 500)) : [],
        respuesta: e.respuesta ?? null,
        explicacion: String(e.explicacion || '').slice(0, 2500)
      }
    };
  }

  function installButtons() {
    [['exercise-dialog', 'exercise-answer'], ['full-sim-dialog', 'fs-body']].forEach(([dialogId, anchorId]) => {
      const anchor = byId(anchorId);
      if (!anchor || byId('exercise-report-' + dialogId)) return;
      const holder = document.createElement('div');
      holder.id = 'exercise-report-' + dialogId;
      holder.className = 'exercise-report-action';
      holder.hidden = true;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary-button';
      button.textContent = '⚑ Avisar un error en este ejercicio';
      button.addEventListener('click', () => openDialog(contexts.get(dialogId)));
      holder.appendChild(button);
      anchor.insertAdjacentElement('afterend', holder);
    });

    document.addEventListener('ingreso:exercise-visible', event => {
      const context = reportContext(event.detail);
      if (!context) return;
      contexts.set(context.dialogId, context);
      const holder = byId('exercise-report-' + context.dialogId);
      if (holder) holder.hidden = false;
    });

    document.addEventListener('ingreso:exercise-hidden', event => {
      const dialogId = event.detail?.dialogId;
      if (!dialogId) return;
      contexts.delete(dialogId);
      const holder = byId('exercise-report-' + dialogId);
      if (holder) holder.hidden = true;
    });
  }

  function installDialog() {
    if (byId('exercise-report-dialog')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'exercise-report-dialog';
    dialog.className = 'exercise-dialog';
    dialog.setAttribute('aria-labelledby', 'exercise-report-title');
    dialog.innerHTML =
      '<div class="exercise-frame exercise-report-frame">' +
      '<header class="exercise-header"><div><span class="mode-badge">Ayudanos a mejorar</span>' +
      '<strong id="exercise-report-title">Avisar un error</strong></div>' +
      '<button type="button" class="icon-button" id="exercise-report-close" aria-label="Cerrar">×</button></header>' +
      '<div class="exercise-content">' +
      '<p id="exercise-report-reference" class="exercise-report-reference"></p>' +
      '<label class="field">¿Qué problema encontraste?' +
      '<select id="exercise-report-kind" required><option value="">Elegí una opción</option>' +
      Object.entries(ISSUE_LABELS).map(([key, label]) =>
        '<option value="' + key + '">' + escapeHtml(label) + '</option>').join('') +
      '</select></label>' +
      '<label class="field">Contanos qué encontraste (opcional, salvo para «Otro problema»)' +
      '<textarea id="exercise-report-note" rows="4" maxlength="500" placeholder="Ej.: la opción correcta debería ser..."></textarea></label>' +
      '<p class="privacy-note">No escribas datos personales. Guardamos el código y la consigna automáticamente.</p>' +
      '<p id="exercise-report-status" role="status" aria-live="polite"></p></div>' +
      '<footer class="exercise-footer"><button class="primary-button" type="button" id="exercise-report-send">Enviar aviso</button></footer></div>';
    document.body.appendChild(dialog);
    byId('exercise-report-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
    byId('exercise-report-send').addEventListener('click', submitReport);
  }

  function openDialog(context) {
    if (!context) return;
    selected = { ...context, snapshot: { ...context.snapshot } };
    byId('exercise-report-kind').value = '';
    byId('exercise-report-note').value = '';
    byId('exercise-report-status').textContent = '';
    byId('exercise-report-send').disabled = false;
    byId('exercise-report-send').textContent = 'Enviar aviso';
    byId('exercise-report-reference').textContent =
      'Ejercicio ' + selected.exercise_id + ' · ' + selected.snapshot.consigna;
    byId('exercise-report-dialog').showModal();
  }

  async function submitReport() {
    if (!selected) return;
    const issue = byId('exercise-report-kind').value;
    const note = byId('exercise-report-note').value.trim();
    const status = byId('exercise-report-status');
    if (!ISSUE_LABELS[issue]) {
      status.textContent = 'Primero elegí qué problema encontraste.';
      return;
    }
    if (issue === 'otro' && !note) {
      status.textContent = 'Contanos qué ocurrió para poder revisarlo.';
      return;
    }
    const row = {
      id: crypto.randomUUID(),
      profile_id: selected.profile_id,
      session_type: selected.session_type,
      exercise_id: selected.exercise_id,
      skill_id: selected.skill_id,
      area: selected.area,
      school: selected.school,
      issue_type: issue,
      note: note || null,
      snapshot: selected.snapshot,
      status: 'pendiente',
      created_at: new Date().toISOString()
    };
    const key = queueKey();
    const button = byId('exercise-report-send');
    button.disabled = true;
    button.textContent = 'Guardando…';
    try {
      writePending([...pending(key), row], key);
      const synced = !isVisitor() && await syncPending();
      status.textContent = synced
        ? '¡Gracias! El aviso quedó guardado en la cuenta familiar.'
        : isVisitor()
          ? 'Aviso guardado solo en este dispositivo (modo visitante).'
          : 'Aviso guardado en este dispositivo. Se enviará al recuperar la conexión familiar.';
      button.textContent = 'Aviso registrado';
      renderInbox();
      window.setTimeout(() => { if (byId('exercise-report-dialog').open) byId('exercise-report-dialog').close(); }, 950);
    } catch (error) {
      console.error('[Reportes de ejercicios] No se pudo guardar localmente', error);
      status.textContent = 'No se pudo guardar el aviso. Probá nuevamente.';
      button.disabled = false;
      button.textContent = 'Reintentar';
    }
  }

  async function syncPending() {
    if (syncing || isVisitor()) return false;
    const rows = pending(QUEUE_FAMILY);
    if (!rows.length) return true;
    const client = createClient();
    if (!client) return false;
    syncing = true;
    try {
      const { data: sessionData, error: authError } = await client.auth.getSession();
      if (authError || !sessionData?.session?.user) return false;
      const userId = sessionData.session.user.id;
      const upload = rows.map(row => ({ ...row, user_id: userId }));
      const { error } = await client.from('study_exercise_reports')
        .upsert(upload, { onConflict: 'id', ignoreDuplicates: true });
      if (error) {
        console.warn('[Reportes de ejercicios] Quedaron avisos pendientes', error);
        return false;
      }
      const sent = new Set(rows.map(row => row.id));
      writePending(pending(QUEUE_FAMILY).filter(row => !sent.has(row.id)), QUEUE_FAMILY);
      return true;
    } catch (error) {
      console.warn('[Reportes de ejercicios] Sincronización pendiente', error);
      return false;
    } finally {
      syncing = false;
    }
  }

  function profileName(id) {
    try {
      const state = JSON.parse(localStorage.getItem('ingreso-belgrano-monserrat-v1') || '{}');
      return state.profiles?.[id]?.name || (id === 'p2' ? 'Perfil 2' : 'Perfil 1');
    } catch {
      return id === 'p2' ? 'Perfil 2' : 'Perfil 1';
    }
  }

  function setupInbox() {
    const grid = document.querySelector('.family-grid');
    if (!grid || byId('family-exercise-reports')) return;
    const section = document.createElement('section');
    section.className = 'panel family-exercise-reports';
    section.id = 'family-exercise-reports';
    section.hidden = true;
    grid.insertBefore(section, byId('family-feedback-inbox'));
    section.addEventListener('click', async event => {
      if (event.target.closest('[data-report-refresh]')) {
        await syncPending();
        renderInbox();
      }
      const button = event.target.closest('[data-report-status]');
      if (button) await updateStatus(button.dataset.id, button.dataset.reportStatus, button);
    });
    document.querySelectorAll('[data-nav="familia"]').forEach(button => {
      button.addEventListener('click', () => {
        syncPending().then(renderInbox);
      });
    });
  }

  function reportHtml(row) {
    const waiting = row.pending;
    const date = new Date(row.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    const desc = row.snapshot?.consigna || '';
    const status = waiting ? 'Pendiente de enviar' : (row.status || 'pendiente');
    const buttons = waiting ? '' :
      '<div class="exercise-report-manage">' +
      (row.status !== 'revisado' ? '<button class="secondary-button" type="button" data-report-status="revisado" data-id="' + escapeHtml(row.id) + '">Marcar revisado</button>' : '') +
      (row.status !== 'corregido' ? '<button class="secondary-button" type="button" data-report-status="corregido" data-id="' + escapeHtml(row.id) + '">Marcar corregido</button>' : '') +
      '</div>';
    return '<article class="exercise-report-item">' +
      '<div class="exercise-report-row"><strong>' + escapeHtml(row.exercise_id) + ' · ' + escapeHtml(ISSUE_LABELS[row.issue_type] || 'Aviso') +
      '</strong><small>' + escapeHtml(status) + '</small></div>' +
      '<p>' + escapeHtml(desc) + '</p>' +
      (row.note ? '<blockquote>' + escapeHtml(row.note) + '</blockquote>' : '') +
      '<small>' + escapeHtml(profileName(row.profile_id)) + ' · ' + escapeHtml(row.session_type) +
      (row.school ? ' · ' + escapeHtml(row.school) : '') + ' · ' + escapeHtml(date) + '</small>' +
      buttons + '</article>';
  }

  async function renderInbox() {
    const section = byId('family-exercise-reports');
    if (!section || isVisitor()) {
      if (section) section.hidden = true;
      return;
    }
    section.hidden = false;
    const localRows = pending(QUEUE_FAMILY).map(row => ({ ...row, pending: true }));
    section.innerHTML = '<p class="eyebrow">Revisión de ejercicios</p><h3>Errores informados</h3><p>Cargando avisos…</p>';
    const client = createClient();
    let rows = [];
    let warning = '';
    if (client) {
      try {
        const { data: sessionData } = await client.auth.getSession();
        if (sessionData?.session?.user) {
          const { data, error } = await client.from('study_exercise_reports')
            .select('id,profile_id,session_type,exercise_id,area,school,issue_type,note,snapshot,status,created_at')
            .order('created_at', { ascending: false }).limit(100);
          if (error) warning = 'No se pudieron consultar los avisos en Supabase.';
          else rows = data || [];
        } else warning = 'Ingresá con la cuenta familiar para ver los avisos de otros dispositivos.';
      } catch {
        warning = 'No hay conexión con Supabase.';
      }
    } else warning = 'Sin conexión a Supabase.';
    const unique = new Map([...rows, ...localRows].map(row => [row.id, row]));
    const ordered = [...unique.values()].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    section.innerHTML =
      '<p class="eyebrow">Revisión de ejercicios</p><h3>Errores informados</h3>' +
      '<p class="family-activity-intro">' + ordered.length + ' aviso(s) · ' + localRows.length +
      ' pendiente(s) de enviar. <button type="button" class="secondary-button" data-report-refresh>Actualizar</button></p>' +
      (warning ? '<p class="privacy-note">' + escapeHtml(warning) + '</p>' : '') +
      (ordered.length ? '<div class="exercise-report-list">' + ordered.map(reportHtml).join('') + '</div>' :
        '<p>Todavía no se informaron errores en los ejercicios.</p>');
  }

  async function updateStatus(id, nextStatus, button) {
    if (!['revisado', 'corregido'].includes(nextStatus) || !id || isVisitor()) return;
    const client = createClient();
    if (!client) return;
    button.disabled = true;
    const { error } = await client.from('study_exercise_reports').update({ status: nextStatus }).eq('id', id);
    if (error) {
      console.error('[Reportes de ejercicios] No se pudo actualizar el estado', error);
      button.disabled = false;
      return;
    }
    renderInbox();
  }

  function installStyles() {
    const style = document.createElement('style');
    style.textContent =
      '.exercise-report-action{margin:14px 0 8px;text-align:left}' +
      '.exercise-report-action[hidden]{display:none!important}' +
      '.exercise-report-action .secondary-button{font-size:.91rem;padding:9px 12px}' +
      '.exercise-report-frame{max-height:min(90vh,790px)}' +
      '.exercise-report-frame .exercise-content{overflow:auto}' +
      '.exercise-report-reference{font-size:.9rem;color:#354b5f;max-height:100px;overflow:auto}' +
      '.exercise-report-frame select,.exercise-report-frame textarea{box-sizing:border-box;width:100%;padding:10px;border:1px solid #bac9d5;border-radius:10px;font:inherit;background:#fff;color:#173f6b}' +
      '#exercise-report-status{color:#173f6b;font-size:.9rem}' +
      '.family-exercise-reports{grid-column:1/-1}' +
      '.exercise-report-list{display:grid;gap:11px;margin-top:12px}' +
      '.exercise-report-item{border:1px solid #d5e0e9;border-radius:12px;padding:13px;background:#f9fcff;overflow-wrap:anywhere}' +
      '.exercise-report-item p{margin:.45rem 0}.exercise-report-item blockquote{margin:8px 0;padding:8px 10px;border-left:3px solid #6387b0;background:white}' +
      '.exercise-report-row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}' +
      '.exercise-report-row small{color:#6b7280}.exercise-report-manage{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
      '.exercise-report-manage button{font-size:.82rem;padding:7px 9px}' +
      '@media(max-width:700px){.exercise-report-action .secondary-button{width:100%}}';
    document.head.appendChild(style);
  }

  function init() {
    installStyles();
    installButtons();
    installDialog();
    setupInbox();
    window.addEventListener('online', () => syncPending().then(renderInbox));
    document.addEventListener('ingreso:authorized', () => syncPending().then(renderInbox));
    syncPending().then(renderInbox);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
