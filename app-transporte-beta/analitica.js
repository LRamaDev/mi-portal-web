(function () {
  'use strict';

  /*
   * Configuración de la Beta:
   * Pegá aquí el ID de medición de la propiedad GA4, por ejemplo: G-ABC1234567.
   * Mientras quede vacío, no se carga ningún recurso externo ni se registra nada.
   */
  var MEASUREMENT_ID = '';

  function enabled() {
    return /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID);
  }

  function start() {
    if (!enabled() || typeof document === 'undefined') return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    script.onload = function () {
      window.gtag('js', new Date());
      window.gtag('config', MEASUREMENT_ID, {
        anonymize_ip: true,
        transport_type: 'beacon'
      });
    };
    (document.head || document.documentElement).appendChild(script);
  }

  window.ERSePAnalytics = {
    enabled: enabled,
    trackSearch: function (data) {
      if (!enabled() || typeof window.gtag !== 'function') return;
      data = data || {};
      window.gtag('event', 'busqueda_realizada', {
        event_category: 'busqueda_servicios',
        method: data.method || 'guiada',
        results_count: Number(data.resultsCount) || 0,
        time_mode: data.timeMode || 'all'
      });
    }
  };

  start();
}());
