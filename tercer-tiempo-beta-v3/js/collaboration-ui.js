(function mountTercerTiempoCollaborationUI(root) {
  const collab = root.TercerTiempoCollaboration;
  if (!collab?.configured || typeof document === 'undefined') return;

  const escapeHtml = value => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const roleOptionsHtml = selected => collab.roleOptions
    .map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`)
    .join('');

  const shell = document.createElement('div');
  shell.id = 'tt-collab-shell';
  shell.innerHTML = `
    <div class="tt-collab-overlay" hidden>
      <section class="tt-collab-modal" role="dialog" aria-modal="true" aria-label="Miembros y permisos">
        <header class="tt-collab-head">
          <div><span>Grupo compartido</span><strong>Miembros y permisos</strong></div>
          <button class="tt-collab-close" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="tt-collab-body"><div class="tt-collab-loading">Cargando miembros…</div></div>
      </section>
    </div>`;
  document.body.appendChild(shell);

  const overlay = shell.querySelector('.tt-collab-overlay');
  const body = shell.querySelector('.tt-collab-body');
  const closeButton = shell.querySelector('.tt-collab-close');
  let busy = false;

  const setOpen = open => {
    overlay.hidden = !open;
    document.body.classList.toggle('tt-collab-open', open);
    if (open) render().catch(showFatal);
  };

  const showFatal = error => {
    console.error('[TercerTiempoCollaborationUI]', error);
    body.innerHTML = `<div class="tt-collab-message is-error">${escapeHtml(error?.message || 'No se pudo cargar la colaboración.')}</div>`;
  };

  const memberLabel = member => member.display_name || member.email || 'Miembro';

  const getResponsibilityUser = (context, responsibility) =>
    context.responsibilities.find(item => item.responsibility === responsibility)?.user_id || '';

  function renderMember(context, member) {
    const isMe = member.user_id === collab.getUserId();
    const isOwner = member.role === 'owner';
    const canManage = context.capabilities.manage;
    const canTransfer = context.capabilities.transferOwnership && !isOwner;
    const roleControl = isOwner
      ? `<span class="tt-member-role is-owner">Propietario</span>`
      : canManage
        ? `<select class="tt-member-role-select" data-role-user="${member.user_id}" aria-label="Rol de ${escapeHtml(memberLabel(member))}">${roleOptionsHtml(member.role)}</select>`
        : `<span class="tt-member-role">${escapeHtml(collab.roleLabels[member.role] || member.role)}</span>`;

    return `
      <article class="tt-member-row" data-user-id="${member.user_id}">
        <div class="tt-member-avatar">${escapeHtml(memberLabel(member).slice(0, 1).toUpperCase())}</div>
        <div class="tt-member-copy">
          <strong>${escapeHtml(memberLabel(member))}${isMe ? ' <small>(vos)</small>' : ''}</strong>
          <span>${escapeHtml(member.email || '')}</span>
        </div>
        <div class="tt-member-role-wrap">${roleControl}</div>
        ${canManage && !isOwner ? `<div class="tt-member-actions">
          ${canTransfer ? `<button type="button" class="tt-member-action" data-transfer-user="${member.user_id}">Hacer propietario</button>` : ''}
          <button type="button" class="tt-member-action is-danger" data-remove-user="${member.user_id}">Quitar</button>
        </div>` : ''}
      </article>`;
  }

  function renderResponsibility(context, key) {
    const selectedUserId = getResponsibilityUser(context, key);
    const selectedMember = context.members.find(member => member.user_id === selectedUserId);
    const label = collab.responsibilityLabels[key];
    if (!context.capabilities.manage) {
      return `<div class="tt-responsibility-row"><div><strong>${escapeHtml(label)}</strong><span>Responsable de este partido</span></div><b>${escapeHtml(selectedMember ? memberLabel(selectedMember) : 'Sin asignar')}</b></div>`;
    }
    const options = [`<option value="">Sin asignar</option>`]
      .concat(context.members.map(member => `<option value="${member.user_id}" ${member.user_id === selectedUserId ? 'selected' : ''}>${escapeHtml(memberLabel(member))}</option>`))
      .join('');
    return `<label class="tt-responsibility-field"><span>${escapeHtml(label)}</span><select data-responsibility="${key}">${options}</select></label>`;
  }

  async function render() {
    const state = root.TercerTiempoStorage?.load?.();
    const activeGroupId = state?.activeGroupId || null;
    let context = collab.getContext();
    if (!context || (activeGroupId && context.groupId !== activeGroupId)) {
      context = await collab.refreshContext(activeGroupId);
    }
    if (!context) {
      body.innerHTML = `<div class="tt-collab-message">Iniciá sesión para compartir este grupo con otras personas.</div>`;
      return;
    }

    const manageBlock = context.capabilities.manage ? `
      <section class="tt-collab-section tt-invite-section">
        <div class="tt-section-heading"><div><strong>Invitar al grupo</strong><span>El enlace dura 7 días y se usa una sola vez.</span></div></div>
        <div class="tt-invite-controls">
          <select data-invite-role>${roleOptionsHtml('player')}</select>
          <button type="button" class="tt-collab-primary" data-create-invite>Crear enlace</button>
        </div>
        <div class="tt-invite-result" hidden>
          <input type="text" readonly data-invite-link aria-label="Enlace de invitación">
          <div class="tt-invite-actions">
            <button type="button" class="tt-collab-secondary" data-copy-invite>Copiar enlace</button>
            <button type="button" class="tt-collab-secondary" data-share-invite>Compartir</button>
          </div>
        </div>
      </section>` : '';

    body.innerHTML = `
      <section class="tt-collab-summary">
        <div><span>Grupo</span><strong>${escapeHtml(context.groupName)}</strong></div>
        <div><span>Tu permiso</span><strong>${escapeHtml(context.roleLabel)}</strong></div>
      </section>

      <section class="tt-collab-section">
        <div class="tt-section-heading"><div><strong>Responsables del próximo partido</strong><span>Se pueden cambiar en cada fecha sin modificar el rol permanente.</span></div></div>
        <div class="tt-responsibilities">
          ${renderResponsibility(context, 'organizer')}
          ${renderResponsibility(context, 'result')}
          ${renderResponsibility(context, 'third_time')}
        </div>
      </section>

      <section class="tt-collab-section">
        <div class="tt-section-heading"><div><strong>Miembros</strong><span>${context.members.length} ${context.members.length === 1 ? 'persona' : 'personas'} en este grupo</span></div></div>
        <div class="tt-member-list">${context.members.map(member => renderMember(context, member)).join('')}</div>
      </section>

      ${manageBlock}
      <div class="tt-collab-message" hidden></div>`;

    bindActions(context);
  }

  const setMessage = (text, kind = 'info') => {
    const message = body.querySelector('.tt-collab-message');
    if (!message) return;
    message.hidden = !text;
    message.className = `tt-collab-message is-${kind}`;
    message.textContent = text;
  };

  function bindActions(context) {
    body.querySelectorAll('[data-role-user]').forEach(select => {
      select.addEventListener('change', async () => {
        if (busy) return;
        busy = true;
        select.disabled = true;
        try {
          await collab.setMemberRole(select.dataset.roleUser, select.value);
          setMessage('Rol actualizado.', 'success');
          await render();
        } catch (error) {
          setMessage(error?.message || 'No se pudo cambiar el rol.', 'error');
          select.value = context.members.find(member => member.user_id === select.dataset.roleUser)?.role || 'player';
        } finally {
          busy = false;
          select.disabled = false;
        }
      });
    });

    body.querySelectorAll('[data-responsibility]').forEach(select => {
      select.addEventListener('change', async () => {
        if (busy) return;
        busy = true;
        select.disabled = true;
        try {
          await collab.setResponsibility(select.dataset.responsibility, select.value || null);
          setMessage('Responsable actualizado.', 'success');
          await render();
        } catch (error) {
          setMessage(error?.message || 'No se pudo asignar la responsabilidad.', 'error');
        } finally {
          busy = false;
          select.disabled = false;
        }
      });
    });

    body.querySelectorAll('[data-remove-user]').forEach(button => {
      button.addEventListener('click', async () => {
        if (busy) return;
        const member = context.members.find(item => item.user_id === button.dataset.removeUser);
        if (!root.confirm(`¿Quitar a ${memberLabel(member || {})} del grupo?`)) return;
        busy = true;
        button.disabled = true;
        try {
          await collab.removeMember(button.dataset.removeUser);
          await render();
        } catch (error) {
          setMessage(error?.message || 'No se pudo quitar al miembro.', 'error');
        } finally {
          busy = false;
          button.disabled = false;
        }
      });
    });

    body.querySelectorAll('[data-transfer-user]').forEach(button => {
      button.addEventListener('click', async () => {
        if (busy) return;
        const member = context.members.find(item => item.user_id === button.dataset.transferUser);
        if (!root.confirm(`¿Transferir la propiedad del grupo a ${memberLabel(member || {})}?\n\nVos pasarás a ser administrador.`)) return;
        busy = true;
        button.disabled = true;
        try {
          await collab.transferOwnership(button.dataset.transferUser);
          await render();
        } catch (error) {
          setMessage(error?.message || 'No se pudo transferir la propiedad.', 'error');
        } finally {
          busy = false;
          button.disabled = false;
        }
      });
    });

    const createButton = body.querySelector('[data-create-invite]');
    if (createButton) {
      createButton.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        createButton.disabled = true;
        setMessage('');
        try {
          const role = body.querySelector('[data-invite-role]').value;
          const link = await collab.createInvite(role);
          const result = body.querySelector('.tt-invite-result');
          const input = body.querySelector('[data-invite-link]');
          input.value = link;
          result.hidden = false;
          setMessage('Enlace listo para compartir.', 'success');
        } catch (error) {
          setMessage(error?.message || 'No se pudo crear la invitación.', 'error');
        } finally {
          busy = false;
          createButton.disabled = false;
        }
      });

      body.querySelector('[data-copy-invite]')?.addEventListener('click', async () => {
        const link = body.querySelector('[data-invite-link]')?.value || '';
        if (!link) return;
        try {
          await navigator.clipboard.writeText(link);
          setMessage('Enlace copiado.', 'success');
        } catch (_) {
          body.querySelector('[data-invite-link]')?.select();
          setMessage('Seleccioné el enlace para que puedas copiarlo.', 'info');
        }
      });

      body.querySelector('[data-share-invite]')?.addEventListener('click', async () => {
        const link = body.querySelector('[data-invite-link]')?.value || '';
        if (!link) return;
        if (navigator.share) {
          try {
            await navigator.share({ title: `Tercer Tiempo · ${context.groupName}`, text: `Sumate a ${context.groupName} en Tercer Tiempo`, url: link });
          } catch (_) {}
        } else {
          try { await navigator.clipboard.writeText(link); setMessage('Enlace copiado.', 'success'); } catch (_) {}
        }
      });
    }
  }

  function injectLauncher() {
    const cloudActions = document.querySelector('#tt-cloud-account .tt-cloud-actions');
    if (!cloudActions || cloudActions.querySelector('[data-open-collaboration]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tt-cloud-secondary tt-collab-launcher';
    button.dataset.openCollaboration = '1';
    button.textContent = '👥 Miembros y permisos';
    button.addEventListener('click', () => setOpen(true));
    cloudActions.prepend(button);
  }

  function handleInviteEntry() {
    const params = new URLSearchParams(root.location.search || '');
    if (!params.get('invite')) return;
    const cloudPanel = document.querySelector('#tt-cloud-panel');
    const cloudBody = document.querySelector('#tt-cloud-account .tt-cloud-body');
    const trigger = document.querySelector('#tt-cloud-account .tt-cloud-trigger');
    if (collab.getUserId()) return;
    if (cloudPanel) cloudPanel.hidden = false;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (cloudBody && !cloudBody.querySelector('.tt-invite-login-note')) {
      const note = document.createElement('div');
      note.className = 'tt-cloud-message is-info tt-invite-login-note';
      note.textContent = 'Te invitaron a un grupo. Iniciá sesión o creá una cuenta y la invitación se aplicará automáticamente.';
      cloudBody.prepend(note);
    }
  }

  const observer = new MutationObserver(() => {
    injectLauncher();
    handleInviteEntry();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  closeButton.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', event => { if (event.target === overlay) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  root.addEventListener('tercer-tiempo-collaboration-change', () => {
    injectLauncher();
    if (!overlay.hidden) render().catch(showFatal);
  });
  root.addEventListener('tercer-tiempo-invite-error', event => {
    const msg = event.detail?.message || 'No se pudo aceptar la invitación.';
    root.alert(msg);
  });

  injectLauncher();
  root.setTimeout?.(() => { injectLauncher(); handleInviteEntry(); }, 700);
})(typeof globalThis !== 'undefined' ? globalThis : window);
