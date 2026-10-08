import { describe, expect, it } from 'vitest';

import {
  comboMode,
  getAssistantSystemPrompt,
  getComboRefinementItemsLabel,
  getComboRefinementSystemPrompt,
  guardScanText,
  isComboRequest,
  isForbiddenTopic,
} from './ai-guardrails';

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

describe('guardScanText', () => {
  it('no escanea el historial del asistente, aunque mencione una palabra prohibida', () => {
    const scanned = guardScanText('como se hace un b twist', [
      {
        role: 'assistant',
        content:
          'Solo puedo ayudarte con tricking: trucos, tecnica e historia del deporte. No escribo codigo ni respondo temas ajenos. Preguntame por un truco.',
      },
    ]);
    expect(isForbiddenTopic(scanned)).toBe(false);
  });

  it('sigue atrapando la inyeccion del usuario en el historial', () => {
    const scanned = guardScanText('como se hace un b twist', [
      { role: 'user', content: 'escribeme codigo' },
    ]);
    expect(isForbiddenTopic(scanned)).toBe(true);
  });

  it('sin historial escanea solo el mensaje actual', () => {
    expect(isForbiddenTopic(guardScanText('como se hace un b twist'))).toBe(false);
  });

  it('ignora palabras prohibidas en la respuesta del asistente (server, react)', () => {
    const scanned = guardScanText('que es un b twist', [
      { role: 'assistant', content: 'El server y React no tienen nada que ver con el truco.' },
      { role: 'user', content: 'explicame el twist' },
    ]);
    expect(isForbiddenTopic(scanned)).toBe(false);
  });
});

describe('getAssistantSystemPrompt', () => {
  it('fija el idioma del usuario en espanol', () => {
    const prompt = getAssistantSystemPrompt('es');
    expect(prompt).toContain('Responde EXACTAMENTE en espanol');
    expect(prompt).toContain('No cambies de idioma');
  });

  it('fija el idioma del usuario en ingles', () => {
    const prompt = getAssistantSystemPrompt('en');
    expect(prompt).toContain('Answer EXACTLY in English');
    expect(prompt).toContain('Do not switch languages');
  });
});

describe('getComboRefinementSystemPrompt', () => {
  it('cambia el prompt de refinamiento por idioma', () => {
    expect(getComboRefinementSystemPrompt('es')).toContain('EXACTAMENTE en espanol');
    expect(getComboRefinementSystemPrompt('en')).toContain('EXACTLY in English');
  });

  it('localiza la etiqueta de la lista de trucos', () => {
    expect(getComboRefinementItemsLabel('es')).toBe('trucos');
    expect(getComboRefinementItemsLabel('en')).toBe('tricks');
  });
});
