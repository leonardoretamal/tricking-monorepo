import { describe, expect, it } from 'vitest';

import { howToDetailSchema } from './how-to';

const validDetail = {
  version: 1,
  summary: 'Giro hacia atras con patada.',
  before: { prerequisites: 'Dominar el back handspring.', space: 'Colchoneta amplia.' },
  body: {
    feet: 'Empuje con la punta.',
    legs: 'Piernas juntas en el aire.',
    arms: 'Brazos abiertos para el giro.',
    gaze: 'Mira por encima del hombro.',
    torso: 'Torso compacto.',
  },
  steps: [{ title: 'Carrera', body: 'Toma impulso en linea recta.' }],
  landing: 'Aterriza con las rodillas flexionadas.',
};

describe('howToDetailSchema', () => {
  it('acepta un detalle v1 minimo y completa los arreglos opcionales', () => {
    const parsed = howToDetailSchema.parse(validDetail);
    expect(parsed.version).toBe(1);
    expect(parsed.mistakes).toEqual([]);
    expect(parsed.tips).toEqual([]);
    expect(parsed.terms).toEqual([]);
    expect(parsed.prereqNotes).toEqual({});
  });

  it('conserva errores, tips, terminos y notas de prerequisito', () => {
    const parsed = howToDetailSchema.parse({
      ...validDetail,
      mistakes: ['No girar los hombros antes de tiempo.'],
      tips: ['Mantén la mirada fija en el punto de aterrizaje.'],
      terms: [{ term: 'b-twist', meaning: 'Backflip con giro de 360.' }],
      prereqNotes: { backHandspring: 'Debe salir recto y con fuerza.' },
    });
    expect(parsed.mistakes).toHaveLength(1);
    expect(parsed.prereqNotes.backHandspring).toBe('Debe salir recto y con fuerza.');
  });

  it('rechaza una version distinta', () => {
    expect(howToDetailSchema.safeParse({ ...validDetail, version: 2 }).success).toBe(false);
  });

  it('rechaza un detalle sin resumen', () => {
    const withoutSummary: Record<string, unknown> = { ...validDetail };
    delete withoutSummary.summary;
    expect(howToDetailSchema.safeParse(withoutSummary).success).toBe(false);
  });

  it('rechaza un cuerpo incompleto', () => {
    const result = howToDetailSchema.safeParse({
      ...validDetail,
      body: { feet: 'x', legs: 'y', arms: 'z', gaze: 'w' },
    });
    expect(result.success).toBe(false);
  });

  it('rechaza pasos vacios', () => {
    expect(howToDetailSchema.safeParse({ ...validDetail, steps: [] }).success).toBe(false);
  });
});
