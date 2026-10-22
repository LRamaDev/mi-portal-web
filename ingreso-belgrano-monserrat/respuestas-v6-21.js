(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.IngresoAnswers = api;
})(function () {
  'use strict';

  const gcd = (a, b) => b === 0n ? a : gcd(b, a % b);
  const equal = (a, b) => a.n * b.d === b.n * a.d;

  function fraction(text) {
    const match = text.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    if (!match || match[1].length > 100 || match[2].length > 100) return null;
    const n = BigInt(match[1]);
    const d = BigInt(match[2]);
    return d > 0n ? { n, d, fraction: true } : null;
  }

  function decimal(text) {
    if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(text) || text.length > 100) return null;
    const [whole, tail = ''] = text.replace(',', '.').split('.');
    const sign = whole.startsWith('-') ? -1n : 1n;
    return { n: sign * BigInt(whole.replace(/^[+-]/, '') + tail), d: 10n ** BigInt(tail.length) };
  }

  function candidates(text) {
    const rational = fraction(text);
    if (rational) return [rational];
    const result = [];
    const plain = decimal(text);
    if (plain) result.push(plain);
    // También admite la escritura argentina de miles: 18.475 y 28.570,20.
    if (/^[+-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(text)) {
      const grouped = decimal(text.replace(/\./g, ''));
      if (grouped) result.push(grouped);
    }
    return result;
  }

  function cleanUnit(answer, rule) {
    let text = String(answer ?? '').trim().toLocaleLowerCase('es');
    if (rule.moneda) text = text.replace(/^\$\s*/, '');
    for (const unit of [...(rule.unidades || [])].sort((a, b) => b.length - a.length)) {
      if (text.endsWith(unit)) {
        text = text.slice(0, -unit.length).trim();
        break;
      }
    }
    return text.replace(/\s+/g, '');
  }

  // null permite que las actividades históricas con respuesta textual conserven
  // su corrector. Las reglas nuevas comparan números exactamente, sin redondeo.
  function check(exercise, answer) {
    const rule = exercise.validacion;
    const legacyInterval = exercise.respuestaRacionalEntre;
    if (legacyInterval || rule?.tipo === 'intervalo') {
      const interval = legacyInterval || rule;
      const value = fraction(String(answer ?? '').trim());
      if (!value) return false;
      const [ln, ld] = interval.mayorQue.map(BigInt);
      const [un, ud] = interval.menorQue.map(BigInt);
      return value.n * ld > ln * value.d && value.n * ud < un * value.d &&
        (!interval.irreducible || gcd(value.n < 0n ? -value.n : value.n, value.d) === 1n);
    }
    if (rule?.tipo !== 'numero') return null;
    const expected = candidates(rule.valor)[0];
    if (!expected) return false;
    return candidates(cleanUnit(answer, rule)).some(value =>
      equal(value, expected) && (!rule.irreducible ||
        (value.fraction && gcd(value.n < 0n ? -value.n : value.n, value.d) === 1n))
    );
  }

  return { check };
});
