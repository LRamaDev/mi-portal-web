(function installTercerTiempoV4(root) {
  const storage = root.TercerTiempoStorage;
  if (typeof document === 'undefined' || !storage) return;

  const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es-AR');
  let scheduled = false;
  let matchStep = null;

  const icon = (name) => {
    const icons = {
      more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
      receipt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/></svg>',
      users: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M17 7a3 3 0 0 1 0 6M17 16a5 5 0 0 1 4 4"/></svg>',
      shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z"/></svg>',
      cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 8.5 4.5 4.5 0 0 0 7 18z"/></svg>'
    };
    return icons[name] || icons.more;
  };

  const navButtons = () => Array.from(document.querySelectorAll('.nav-button'));
  const findNavButton = label => navButtons().find(button => normalize(button.textContent).includes(normalize(label)));
  const currentViewLabel = () => normalize(navButtons().find(button => button.classList.contains('is-active'))?.textContent || '');

  const clickNav = label => {
    const button = findNavButton(label);
    if (!button) return false;
    button.click();
    root.scrollTo?.({ top: 0, behavior: 'smooth' });
    return true;
  };

  function ensureMoreSheet() {
    if (document.getElementById('tt-v4-more-sheet')) return document.getElementById('tt-v4-more-sheet');
    const overlay = document.createElement('div');
    overlay.id = 'tt-v4-more-sheet';
    overlay.className = 'tt-v4-sheet-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="tt-v4-sheet" role="dialog" aria-modal="true" aria-labelledby="tt-v4-more-title">
        <div class="tt-v4-sheet-handle" aria-hidden="true"></div>
        <div class="tt-v4-sheet-head">
          <div><small>Más opciones</small><h2 id="tt-v4-more-title">Todo lo demás, cuando lo necesitás</h2></div>
          <button type="button" class="tt-v4-sheet-close" aria-label="Cerrar">×</button>
        </div>
        <div class="tt-v4-more-grid">
          <button type="button" data-v4-nav="Jugadores"><span class="tt-v4-more-icon">${icon('users')}</span><span><strong>Plantel</strong><small>Jugadores y perfiles</small></span></button>
          <button type="button" data-v4-nav="Grupo"><span class="tt-v4-more-icon">${icon('shield')}</span><span><strong>Grupo e historial</strong><small>Configuración, partidos y estadísticas</small></span></button>
          <button type="button" data-v4-account><span class="tt-v4-more-icon">${icon('cloud')}</span><span><strong>Cuenta y nube</strong><small>Sincronización entre dispositivos</small></span></button>
          <a href="../tercer-tiempo-beta-v3/" class="tt-v4-classic-link"><span>↩</span><span><strong>Versión V3</strong><small>Volver a la interfaz anterior</small></span></a>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    const close = () => { overlay.hidden = true; document.body.classList.remove('tt-v4-sheet-open'); };
    overlay.querySelector('.tt-v4-sheet-close').addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.querySelectorAll('[data-v4-nav]').forEach(button => button.addEventListener('click', () => {
      close();
      clickNav(button.dataset.v4Nav);
    }));
    overlay.querySelector('[data-v4-account]').addEventListener('click', () => {
      close();
      document.querySelector('#tt-cloud-account .tt-cloud-trigger')?.click();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !overlay.hidden) close(); });
    return overlay;
  }

  const openMore = () => {
    const overlay = ensureMoreSheet();
    overlay.hidden = false;
    document.body.classList.add('tt-v4-sheet-open');
  };

  function mountNavigation() {
    const buttons = navButtons();
    if (!buttons.length) return;
    const hosts = [...new Set(buttons.map(button => button.parentElement).filter(Boolean))];
    const active = currentViewLabel();

    hosts.forEach(host => {
      host.classList.add('tt-v4-nav-host');
      Array.from(host.querySelectorAll('.nav-button')).forEach(button => {
        const label = normalize(button.textContent);
        button.classList.toggle('tt-v4-hidden-nav', label.includes('jugadores') || label.includes('grupo'));
      });

      let more = host.querySelector('[data-v4-more]');
      if (!more) {
        more = document.createElement('button');
        more.type = 'button';
        more.className = 'nav-button tt-v4-more-button';
        more.dataset.v4More = '1';
        more.innerHTML = `<span class="icon tt-v4-nav-icon">${icon('more')}</span><span>Más</span>`;
        more.addEventListener('click', openMore);
        host.appendChild(more);
      }
      more.classList.toggle('is-active', active.includes('jugadores') || active.includes('grupo'));
    });
  }

  function mountVersionBadge() {
    const brand = document.querySelector('.topbar .brand');
    if (!brand || document.getElementById('tt-v4-badge')) return;
    const badge = document.createElement('span');
    badge.id = 'tt-v4-badge';
    badge.className = 'tt-v4-badge';
    badge.textContent = 'V4 · Beta UI';
    badge.title = 'Nueva experiencia visual de Tercer Tiempo';
    brand.appendChild(badge);
  }

  function stateSummary() {
    const state = storage.load();
    const group = state.groups?.find(item => item.id === state.activeGroupId) || state.groups?.[0];
    if (!group) return null;
    const players = (state.players || []).filter(player => player.groupId === group.id && player.active);
    const session = (state.draftSessions || []).find(item => item.groupId === group.id);
    return { group, activePlayers: players.length, participants: session?.participantIds?.length || 0, hasTeams: Boolean(session?.teamAssignments) };
  }

  function mountHomeHero() {
    const dashboard = document.querySelector('.home-dashboard');
    if (!dashboard) return;
    let hero = document.querySelector('.tt-v4-home-intro');
    const summary = stateSummary();
    if (!summary) return;

    if (!hero) {
      hero = document.createElement('section');
      hero.className = 'tt-v4-home-intro';
      dashboard.parentElement.insertBefore(hero, dashboard);
    }
    hero.innerHTML = `
      <div class="tt-v4-home-copy">
        <span class="tt-v4-eyebrow">Grupo activo</span>
        <h1>${summary.group.name || 'Tercer Tiempo'}</h1>
        <p>${summary.activePlayers} jugadores activos · ${summary.participants ? `${summary.participants} convocados` : 'partido todavía sin convocados'}</p>
      </div>
      <div class="tt-v4-home-actions">
        <button type="button" class="tt-v4-primary" data-v4-go-match>${summary.participants ? 'Continuar partido' : 'Organizar partido'}</button>
        <button type="button" class="tt-v4-secondary" data-v4-go-third>Tercer tiempo</button>
      </div>`;
    hero.querySelector('[data-v4-go-match]').addEventListener('click', () => clickNav('Partido'));
    hero.querySelector('[data-v4-go-third]').addEventListener('click', () => clickNav('Tercer tiempo'));
  }

  function inferMatchStep() {
    const summary = stateSummary();
    if (!summary || summary.participants === 0) return 1;
    if (!summary.hasTeams) return 2;
    return 2;
  }

  function applyMatchStep(step) {
    matchStep = Math.max(1, Math.min(3, Number(step) || 1));
    document.documentElement.dataset.v4MatchStep = String(matchStep);
    const roster = document.querySelector('.match-layout .card:first-child');
    const team = document.querySelector('.team-builder-card');
    const post = document.querySelector('.post-match-actions');
    roster?.classList.toggle('tt-v4-step-hidden', matchStep !== 1);
    team?.classList.toggle('tt-v4-step-hidden', matchStep !== 2);
    post?.classList.toggle('tt-v4-step-hidden', matchStep !== 3);
    document.querySelectorAll('[data-v4-step]').forEach(button => {
      const isActive = Number(button.dataset.v4Step) === matchStep;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'step' : 'false');
    });
    root.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  function mountMatchStepper() {
    const layout = document.querySelector('.match-layout');
    const team = document.querySelector('.team-builder-card');
    const post = document.querySelector('.post-match-actions');
    if (!layout || !team || !post) return;

    let stepper = document.querySelector('.tt-v4-stepper');
    if (!stepper) {
      stepper = document.createElement('nav');
      stepper.className = 'tt-v4-stepper';
      stepper.setAttribute('aria-label', 'Etapas del partido');
      stepper.innerHTML = `
        <button type="button" data-v4-step="1"><span>1</span><strong>Convocados</strong></button>
        <button type="button" data-v4-step="2"><span>2</span><strong>Equipos</strong></button>
        <button type="button" data-v4-step="3"><span>3</span><strong>Después</strong></button>`;
      layout.parentElement.insertBefore(stepper, layout);
      stepper.querySelectorAll('[data-v4-step]').forEach(button => button.addEventListener('click', () => applyMatchStep(button.dataset.v4Step)));
    }

    const roster = layout.querySelector('.card:first-child');
    if (roster && !roster.querySelector('[data-v4-next-teams]')) {
      const actions = document.createElement('div');
      actions.className = 'tt-v4-step-actions';
      actions.innerHTML = '<button type="button" class="tt-v4-primary" data-v4-next-teams>Continuar a equipos →</button>';
      roster.appendChild(actions);
      actions.querySelector('button').addEventListener('click', () => applyMatchStep(2));
    }
    if (!team.querySelector('[data-v4-next-post]')) {
      const actions = document.createElement('div');
      actions.className = 'tt-v4-step-actions';
      actions.innerHTML = '<button type="button" class="tt-v4-secondary" data-v4-next-post>Después del partido →</button>';
      team.appendChild(actions);
      actions.querySelector('button').addEventListener('click', () => applyMatchStep(3));
    }
    if (!post.querySelector('[data-v4-back-team]')) {
      const actions = document.createElement('div');
      actions.className = 'tt-v4-step-actions is-back';
      actions.innerHTML = '<button type="button" class="tt-v4-ghost" data-v4-back-team>← Volver a equipos</button>';
      post.insertBefore(actions, post.firstChild);
      actions.querySelector('button').addEventListener('click', () => applyMatchStep(2));
    }

    if (matchStep === null) matchStep = inferMatchStep();
    applyMatchStep(matchStep);
  }

  function enhanceThirdTime() {
    if (!currentViewLabel().includes('tercer tiempo')) return;
    const main = document.querySelector('.main-content');
    if (!main || main.querySelector('.tt-v4-section-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'tt-v4-section-banner';
    banner.innerHTML = '<span>🍻</span><div><small>Módulo autónomo</small><strong>Tercer tiempo</strong><p>Participantes, gastos y cuentas sin necesidad de registrar un partido.</p></div>';
    const first = main.firstElementChild;
    if (first) main.insertBefore(banner, first); else main.appendChild(banner);
  }

  function cleanSectionBanners() {
    const label = currentViewLabel();
    if (!label.includes('tercer tiempo')) document.querySelectorAll('.tt-v4-section-banner').forEach(node => node.remove());
  }

  function refresh() {
    document.body.classList.add('tt-v4');
    document.documentElement.classList.add('tt-v4-root');
    mountNavigation();
    mountVersionBadge();
    cleanSectionBanners();
    const label = currentViewLabel();
    if (label.includes('inicio')) mountHomeHero();
    if (label.includes('partido')) mountMatchStepper();
    if (label.includes('tercer tiempo')) enhanceThirdTime();
  }

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || root.setTimeout)(() => {
      scheduled = false;
      refresh();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  root.addEventListener?.('tercer-tiempo-cloud-update', schedule);
  root.addEventListener?.('tercer-tiempo-auth-change', schedule);
  document.addEventListener('DOMContentLoaded', schedule);
  schedule();

  root.TercerTiempoV4UI = { refresh, openMore, applyMatchStep, clickNav };
})(typeof globalThis !== 'undefined' ? globalThis : window);
