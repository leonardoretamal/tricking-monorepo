import { describe, expect, it } from 'vitest';

import { comboMode, isComboRequest } from './ai-guardrails';

describe('isComboRequest', () => {
  it('reconoce una peticion explicita de combinacion', () => {
    expect(isComboRequest('hazme una combinacion')).toBe(true);
  });

  it('reconoce una respuesta de modo libre aunque no diga combinacion', () => {
    expect(isComboRequest('libre')).toBe(true);
    expect(isComboRequest('random')).toBe(true);
  });

  it('reconoce una respuesta de modo con los trucos del usuario', () => {
    expect(isComboRequest('con los que tengo')).toBe(true);
    expect(isComboRequest('mis trucos')).toBe(true);
  });

  it('no confunde una pregunta normal de truco', () => {
    expect(isComboRequest('como hago un b-twist')).toBe(false);
  });

  it('no clasifica frases ajenas que contienen cualquier, invent o random', () => {
    expect(isComboRequest('puedo entrenar en cualquier lugar')).toBe(false);
    expect(isComboRequest('puedo inventar mis propios trucos')).toBe(false);
    expect(isComboRequest('me gusta el entrenamiento random de la tarde')).toBe(false);
  });
});

describe('comboMode', () => {
  it('mapea las respuestas libres a free', () => {
    expect(comboMode('libre')).toBe('free');
    expect(comboMode('random')).toBe('free');
  });

  it('mapea las respuestas del usuario a known', () => {
    expect(comboMode('con los que tengo')).toBe('known');
    expect(comboMode('mis trucos')).toBe('known');
  });

  it('deja sin modo una pregunta normal de truco', () => {
    expect(comboMode('como hago un b-twist')).toBe('ask');
  });

  it('no interpreta libre dentro de una frase larga ajena', () => {
    expect(comboMode('tengo poco tiempo libre para entrenar hoy')).toBe('ask');
  });
});
