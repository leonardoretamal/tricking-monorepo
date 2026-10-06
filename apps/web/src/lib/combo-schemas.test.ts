import { describe, expect, it } from 'vitest';

import {
  COMBO_MAX_SAVED,
  comboRequestSchema,
  combosStateSchema,
  savedComboSchema,
} from './combo-schemas';
import { SECTIONS } from './sections';

const validRequest = { knownTrickIds: ['aerial', 'btwist'], length: 'medium', locale: 'es' };

const step = { trickId: 'aerial', name: 'Aerial', section: 'inside', difficulty: 3 };
const validCombo = {
  id: 'c1',
  title: 'Combo',
  status: 'draft',
  steps: [step, step],
  createdAt: '2026-10-06T00:00:00.000Z',
  updatedAt: '2026-10-06T00:00:00.000Z',
};

describe('comboRequestSchema', () => {
  it('exige el locale', () => {
    const { locale, ...withoutLocale } = validRequest;
    void locale;
    expect(comboRequestSchema.safeParse(withoutLocale).success).toBe(false);
  });

  it('rechaza un locale fuera de es/en', () => {
    expect(comboRequestSchema.safeParse({ ...validRequest, locale: 'fr' }).success).toBe(false);
  });

  it('acepta varias secciones', () => {
    const parsed = comboRequestSchema.safeParse({
      ...validRequest,
      sections: ['backward', 'inside'],
    });
    expect(parsed.success).toBe(true);
  });

  it('rechaza una seccion desconocida', () => {
    expect(comboRequestSchema.safeParse({ ...validRequest, sections: ['nope'] }).success).toBe(
      false,
    );
  });

  it('rechaza mas secciones que las existentes', () => {
    const parsed = comboRequestSchema.safeParse({
      ...validRequest,
      sections: [...SECTIONS, ...SECTIONS],
    });
    expect(parsed.success).toBe(false);
  });
});

describe('savedComboSchema', () => {
  it('acepta una combinacion valida', () => {
    expect(savedComboSchema.safeParse(validCombo).success).toBe(true);
  });

  it('exige al menos dos pasos', () => {
    expect(savedComboSchema.safeParse({ ...validCombo, steps: [step] }).success).toBe(false);
  });

  it('rechaza un estado desconocido', () => {
    expect(savedComboSchema.safeParse({ ...validCombo, status: 'otro' }).success).toBe(false);
  });
});

describe('combosStateSchema', () => {
  const build = (count: number) =>
    Array.from({ length: count }, (_, index) => ({ ...validCombo, id: `c${index}` }));

  it('acepta hasta el tope duro', () => {
    const state = { version: 1, updatedAt: validCombo.createdAt, combos: build(COMBO_MAX_SAVED) };
    expect(combosStateSchema.safeParse(state).success).toBe(true);
  });

  it('rechaza mas del tope duro', () => {
    const state = {
      version: 1,
      updatedAt: validCombo.createdAt,
      combos: build(COMBO_MAX_SAVED + 1),
    };
    expect(combosStateSchema.safeParse(state).success).toBe(false);
  });
});
