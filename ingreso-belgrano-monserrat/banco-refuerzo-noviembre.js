(() => {
  'use strict';
  // Se encadena después del ampliador de octubre, sin sustituir los ejercicios existentes.
  const previousFetch = window.fetch.bind(window);
  const sourceUrl = './data/ejercicios-refuerzo-noviembre.json?v=6.23.1';
  let additionsPromise;

  function loadAdditions() {
    if (!additionsPromise) {
      additionsPromise = previousFetch(sourceUrl).then(async response => {
        if (!response.ok) throw new Error('No se pudo cargar el refuerzo de noviembre');
        const data = await response.json();
        if (!Array.isArray(data.ejercicios) || data.ejercicios.length !== 12) throw new Error('Refuerzo incompleto');
        if (new Set(data.ejercicios.map(e => e.id)).size !== 12) throw new Error('IDs repetidos');
        return data.ejercicios;
      }).catch(error => {
        additionsPromise = null; // Permite reintento en otra carga
        throw error;
      });
    }
    return additionsPromise;
  }

  window.fetch = async function novemberBankFetch(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (url !== './data/ejercicios.json' && !url.endsWith('/data/ejercicios.json')) return previousFetch(input, init);
    const response = await previousFetch(input, init);
    if (!response.ok) return response;
    try {
      const [data, additions] = await Promise.all([response.clone().json(), loadAdditions()]);
      const existing = new Set((data.ejercicios || []).map(e => e.id));
      data.ejercicios = [...(data.ejercicios || []), ...additions.filter(e => !existing.has(e.id))];
      return new Response(JSON.stringify(data), {
        status: response.status, statusText: response.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (error) {
      console.error('[Refuerzo noviembre] Se conserva el banco previo:', error);
      return response;
    }
  };
})();
