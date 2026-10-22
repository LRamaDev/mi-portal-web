(() => {
  'use strict';
  const previousFetch = window.fetch.bind(window);
  const sourceUrl = './data/ejercicios-prioridades-octubre.json?v=6.21.0';
  let additionsPromise;

  function loadAdditions() {
    if (!additionsPromise) {
      additionsPromise = previousFetch(sourceUrl).then(async response => {
        if (!response.ok) throw new Error('No se pudo cargar la ampliación del banco');
        const data = await response.json();
        if (!Array.isArray(data.ejercicios) || data.ejercicios.length !== 102) throw new Error('Banco de octubre incompleto');
        return data.ejercicios;
      }).catch(error => {
        additionsPromise = null;
        throw error;
      });
    }
    return additionsPromise;
  }

  window.fetch = async function prioritiesBankFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url !== './data/ejercicios.json' && !url.endsWith('/data/ejercicios.json')) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const [data, additions] = await Promise.all([response.clone().json(), loadAdditions()]);
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      data.version = 21;
      data.ejercicios = [...(data.ejercicios || []), ...additions.filter(e => !existing.has(e.id))];
      return new Response(JSON.stringify(data), {
        status: response.status, statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('[Banco de octubre] Se conserva el banco anterior:', error);
      return response;
    }
  };
})();
