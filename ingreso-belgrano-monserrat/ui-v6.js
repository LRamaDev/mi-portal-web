(() => {
  'use strict';

  function mountRoadmap() {
    const home = document.querySelector('[data-view="inicio"]');
    const hero = home?.querySelector('.hero-panel');
    if (!home || !hero || home.querySelector('.study-roadmap')) return;

    const roadmap = document.createElement('section');
    roadmap.className = 'study-roadmap';
    roadmap.setAttribute('aria-label', 'Ruta de estudio recomendada');
    roadmap.innerHTML = `
      <div class="study-roadmap-head">
        <div>
          <p class="eyebrow">Tu ruta de estudio</p>
          <h3>Primero descubrir, después entrenar y por último simular</h3>
          <p>No hace falta hacer todo el mismo día. La app va ajustando el recorrido según tus respuestas.</p>
        </div>
      </div>
      <div class="study-roadmap-grid">
        <article class="road-step"><span class="road-number">1</span><strong>Diagnóstico</strong><p>Sirve para saber qué temas ya están firmes y cuáles necesitan práctica.</p></article>
        <article class="road-step"><span class="road-number">2</span><strong>Entrenamiento</strong><p>Vas a recibir más ejercicios de lo que te cuesta, sin dejar de repasar lo que ya sabés.</p></article>
        <article class="road-step"><span class="road-number">3</span><strong>Simulacro</strong><p>Se parece más a una situación de ingreso: sin pistas y con corrección al final.</p></article>
      </div>`;
    hero.insertAdjacentElement('afterend', roadmap);
  }

  function mountGuide() {
    const training = document.querySelector('[data-view="entrenar"]');
    const heading = training?.querySelector('.page-heading');
    if (!training || !heading || training.querySelector('.quick-guide')) return;

    const guide = document.createElement('details');
    guide.className = 'quick-guide';
    guide.innerHTML = `
      <summary>¿Cómo conviene usar esta sección?</summary>
      <div class="quick-guide-content">
        <p><strong>Práctica:</strong> podés usar pistas y recibís devolución inmediata. Hacé las cuentas, esquemas o textos en el cuaderno.</p>
        <p><strong>Simulacro:</strong> no hay pistas ni corrección durante el recorrido. El resultado aparece recién al final.</p>
        <p><strong>Si algo resulta raro:</strong> usá “¿Cómo fue?” y marcá si fue fácil, difícil o confuso. Eso nos ayuda a mejorar la página.</p>
      </div>`;
    heading.insertAdjacentElement('afterend', guide);
  }

  function improveLabels() {
    document.querySelectorAll('.exam-button').forEach(button => {
      const school = button.dataset.simSchool;
      const area = button.dataset.simArea;
      const label = `${school === 'belgrano' ? 'Manuel Belgrano' : 'Monserrat'} · ${area === 'matematica' ? 'Matemática' : 'Lengua'} · simulacro sobre 100 puntos`;
      button.setAttribute('aria-label', label);
    });
  }

  function init() {
    mountRoadmap();
    mountGuide();
    improveLabels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
