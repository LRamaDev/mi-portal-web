(() => {
  'use strict';

  let togetherMode = false;

  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function isTogetherActive() {
    const shell = document.querySelector('#app-shell');
    const pill = document.querySelector('#active-profile');
    if (!shell || shell.hidden || !pill) return false;
    return pill.textContent.includes(' + ');
  }

  function ensureTogetherNote() {
    const actions = document.querySelector('.hero-actions');
    if (!actions) return null;
    let note = document.querySelector('#together-mode-note');
    if (!note) {
      note = document.createElement('p');
      note.id = 'together-mode-note';
      note.className = 'together-mode-note';
      note.innerHTML = '<strong>Modo juntas:</strong> los diagnósticos y simulacros se hacen desde cada perfil individual. Acá pueden practicar alternando turnos.';
      actions.insertAdjacentElement('afterend', note);
    }
    return note;
  }

  function ensureTrainingNote() {
    const examPanel = document.querySelector('.exam-panel');
    if (!examPanel) return null;
    let note = document.querySelector('#together-training-note');
    if (!note) {
      note = document.createElement('div');
      note.id = 'together-training-note';
      note.className = 'together-training-note';
      note.innerHTML = '<strong>Práctica compartida</strong><span>Elijan Matemática o Lengua y la app alternará los turnos. Los simulacros completos quedan reservados para los perfiles individuales.</span>';
      examPanel.insertAdjacentElement('beforebegin', note);
    }
    return note;
  }

  function syncTogetherUi() {
    togetherMode = isTogetherActive();

    const recommended = document.querySelector('#start-recommended');
    const diagnostic = document.querySelector('#start-diagnostic');
    const welcomeCopy = document.querySelector('#welcome-copy');
    const examPanel = document.querySelector('.exam-panel');
    const heroNote = ensureTogetherNote();
    const trainingNote = ensureTrainingNote();

    if (recommended) recommended.textContent = togetherMode ? 'Elegir qué entrenar' : 'Empezar entrenamiento';
    if (diagnostic) diagnostic.hidden = togetherMode;
    if (heroNote) heroNote.hidden = !togetherMode;
    if (trainingNote) trainingNote.hidden = !togetherMode;
    if (examPanel) examPanel.hidden = togetherMode;

    if (togetherMode && welcomeCopy) {
      welcomeCopy.textContent = 'Practiquen juntas alternando turnos. El progreso de cada respuesta se atribuye al perfil que corresponde.';
    }
  }

  function bindTogetherActions() {
    const recommended = document.querySelector('#start-recommended');
    const diagnostic = document.querySelector('#start-diagnostic');

    recommended?.addEventListener('click', event => {
      if (!togetherMode) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const trainingNav = document.querySelector('.nav-button[data-nav="entrenar"]') || document.querySelector('.mobile-nav [data-nav="entrenar"]');
      trainingNav?.click();
    }, true);

    diagnostic?.addEventListener('click', event => {
      if (!togetherMode) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast('El diagnóstico es individual. Elegí uno de los dos perfiles para hacerlo.');
    }, true);
  }

  function watchProfileChanges() {
    const shell = document.querySelector('#app-shell');
    const pill = document.querySelector('#active-profile');
    if (!shell || !pill) return;

    const observer = new MutationObserver(syncTogetherUi);
    observer.observe(shell, { attributes: true, attributeFilter: ['hidden'] });
    observer.observe(pill, { childList: true, characterData: true, subtree: true });

    document.querySelectorAll('#profile-switch, #active-profile').forEach(button => {
      button.addEventListener('click', () => window.setTimeout(syncTogetherUi, 0));
    });
  }

  function injectStyles() {
    if (document.querySelector('#v6-4-together-styles')) return;
    const style = document.createElement('style');
    style.id = 'v6-4-together-styles';
    style.textContent = `
      .together-mode-note{margin:12px 0 0;padding:10px 12px;border-left:3px solid #7d68b8;border-radius:8px;background:#f7f3ff;color:#5e5277;font-size:.88rem;line-height:1.45}
      .together-training-note{display:grid;gap:4px;margin:18px 0;padding:16px 18px;border:1px solid #d8cfee;border-radius:16px;background:linear-gradient(145deg,#fff,#f8f4ff);color:#5d5174}
      .together-training-note strong{color:#4d3d70;font-size:1rem}.together-training-note span{font-size:.9rem;line-height:1.45}
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    bindTogetherActions();
    watchProfileChanges();
    syncTogetherUi();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
