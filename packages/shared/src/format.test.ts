import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber } from './format';

describe('formatDate', () => {
  const reference = new Date('2024-03-15T12:00:00Z');
  const utc = { timeZone: 'UTC' };

  it('formatea en es y en y produce cadenas distintas no vacias', () => {
    const es = formatDate(reference, 'es', utc);
    const en = formatDate(reference, 'en', utc);
    expect(es.length).toBeGreaterThan(0);
    expect(en.length).toBeGreaterThan(0);
    expect(es).not.toBe(en);
  });

  it('acepta Date, numero y cadena equivalentes', () => {
    const fromDate = formatDate(reference, 'en', utc);
    expect(formatDate(reference.getTime(), 'en', utc)).toBe(fromDate);
    expect(formatDate('2024-03-15T12:00:00Z', 'en', utc)).toBe(fromDate);
  });

  it('devuelve cadena vacia ante una fecha invalida', () => {
    expect(formatDate(new Date('no-es-fecha'), 'es')).toBe('');
    expect(formatDate('no-es-fecha', 'en')).toBe('');
  });

  it('devuelve cadena vacia ante un locale invalido', () => {
    expect(formatDate(reference, 'not a locale')).toBe('');
  });
});

describe('formatNumber', () => {
  it('formatea miles en en-US', () => {
    expect(formatNumber(1_234, 'en-US')).toBe('1,234');
  });

  it('produce separadores distintos entre locales', () => {
    expect(formatNumber(1_234, 'en-US')).not.toBe(formatNumber(1_234, 'de-DE'));
  });

  it('devuelve cadena vacia ante valores no finitos', () => {
    expect(formatNumber(Number.NaN, 'es')).toBe('');
    expect(formatNumber(Number.POSITIVE_INFINITY, 'es')).toBe('');
  });
});
