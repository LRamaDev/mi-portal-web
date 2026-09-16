(function initTercerTiempoPermissionGuard(root) {
  const collab = root.TercerTiempoCollaboration;
  if (!collab?.configured || typeof document === 'undefined') return;

  const LOCK_ATTR = 'data-tt-permission-lock';
  let scheduled = false;
  let toastTimer = null;

  const labelFor = capability => ({
    manage: 'Sólo el propietario o un administrador puede hacer esto.',
    organize: 'Necesitás permiso de Organizador para modificar los equipos de este partido.',
    result: 'Necesitás permiso de Colaborador de partido para cargar o editar el resultado.',
    thirdTime: 'Necesitás permiso de Responsable de tercer tiempo para modificar los gastos.'
  }[capability] || 'No tenés permiso para modificar esta sección.');

  const notify = capability => {
    let toast = document.getElementById('tt-permission-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tt-permission-toast';
      toast.className = 'tt-permission-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = labelFor(capability);
    toast.hidden = false;
    root.clearTimeout?.(toastTimer);
    toastTimer = root.setTimeout?.(() => { toast.hidden = true; }, 3000);
  };

  const lock = (element, capability) => {
    if (!element || element.closest('#tt-collab-shell') || element.closest('#tt-cloud-account')) return;
    if (!element.hasAttribute(LOCK_ATTR)) {
      element.dataset.ttWasDisabled = element.disabled ? '1' : '0';
    }
    element.setAttribute(LOCK_ATTR, capability);
    element.classList.add('tt-permission-locked');
    if ('disabled' in element) element.disabled = true;
    element.setAttribute('aria-disabled', 'true');
    if (!element.title) element.title = labelFor(capability);
  };

  const unlock = element => {
    if (!element?.hasAttribute?.(LOCK_ATTR)) return;
    if ('disabled' in element && element.dataset.ttWasDisabled !== '1') element.disabled = false;
    element.removeAttribute(LOCK_ATTR);
    element.removeAttribute('aria-disabled');
    element.classList.remove('tt-permission-locked');
    delete element.dataset.ttWasDisabled;
    if (element.title === labelFor('manage') || element.title === labelFor('organize') || element.title === labelFor('result') || element.title === labelFor('thirdTime')) {
      element.removeAttribute('title');
    }
  };

  const applyToSelector = (selector, capability, allowed, filter = null) => {
    document.querySelectorAll(selector).forEach(element => {
      if (filter && !filter(element)) return;
      if (allowed) unlock(element);
      else lock(element, capability);
    });
  };

  const buttonTextMatches = (element, pattern) => pattern.test(String(element.textContent || '').trim());

  function apply() {
    scheduled = false;
    const context = collab.getContext();
    if (!context) return;
    const caps = context.capabilities || {};

    // Gestión permanente del grupo y del plantel.
    applyToSelector('.roster-toolbar .inline-form input, .roster-toolbar .inline-form button, .player-card .edit-button', 'manage', caps.manage);
    applyToSelector('.group-form input, .group-form select, .group-form textarea, .group-form button, .group-create-form input, .group-create-form select, .group-create-form button', 'manage', caps.manage);
    applyToSelector('.tt-history-delete', 'manage', caps.manage);
    applyToSelector('.inline-form', 'manage', caps.manage, form => {
      const input = form.querySelector('input[aria-label="Nombres para sumar al partido"], input[aria-label="Nombres para sumar al plantel"]');
      return Boolean(input);
    });
    document.querySelectorAll('.inline-form').forEach(form => {
      const isAddPeople = Boolean(form.querySelector('input[aria-label="Nombres para sumar al partido"], input[aria-label="Nombres para sumar al plantel"]'));
      if (!isAddPeople) return;
      form.querySelectorAll('input,button').forEach(element => caps.manage ? unlock(element) : lock(element, 'manage'));
    });

    // Organización rotativa del partido: convocados existentes, equipos, nombres y formación.
    applyToSelector('.participant-picker[aria-label="Jugadores del partido"] button', 'organize', caps.organize);
    applyToSelector('.team-builder-start button, .team-builder-actions button, .team-player button, .lineup-controls select, .team-name-field input', 'organize', caps.organize);

    // Resultado, goleadores, figura y crónica.
    document.querySelectorAll('button').forEach(button => {
      if (buttonTextMatches(button, /^(Registrar partido|Editar resultado|Editar este resultado)$/i)) {
        caps.result ? unlock(button) : lock(button, 'result');
      }
    });
    const resultGrid = document.querySelector('.result-score-grid');
    const resultSheet = resultGrid?.closest('.sheet');
    if (resultSheet) {
      resultSheet.querySelectorAll('input,select,textarea,button').forEach(element => {
        if (element.classList.contains('sheet-close')) return;
        caps.result ? unlock(element) : lock(element, 'result');
      });
    }

    // Tercer tiempo: los demás pueden consultar el reparto, pero no modificar gastos.
    applyToSelector('#expense-form input, #expense-form select, #expense-form textarea, #expense-form button, .expense-row .expense-action, .alias-section input', 'thirdTime', caps.thirdTime);

    document.body.dataset.ttGroupRole = context.role || 'player';
  }

  const scheduleApply = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  };

  document.addEventListener('click', event => {
    const locked = event.target.closest(`[${LOCK_ATTR}]`);
    if (!locked) return;
    const capability = locked.getAttribute(LOCK_ATTR);
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    notify(capability);
  }, true);

  document.addEventListener('submit', event => {
    const locked = event.target.querySelector?.(`[${LOCK_ATTR}]`);
    if (!locked) return;
    event.preventDefault();
    event.stopPropagation();
    notify(locked.getAttribute(LOCK_ATTR));
  }, true);

  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  root.addEventListener('tercer-tiempo-collaboration-change', scheduleApply);
  root.addEventListener('tercer-tiempo-collaboration-ready', scheduleApply);
  scheduleApply();
})(typeof globalThis !== 'undefined' ? globalThis : window);
