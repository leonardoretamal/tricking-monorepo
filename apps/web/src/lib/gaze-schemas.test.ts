import { describe, expect, it } from 'vitest';

import {
  gazeSummariesResponseSchema,
  gazeTipTypeDetailSchema,
  gazeTypeColor,
  gazeTypeRank,
  paginatedGazeTipsSchema,
} from './gaze-schemas';

describe('gazeSchemas', () => {
  it('valida un listado paginado de tips', () => {
    const parsed = paginatedGazeTipsSchema.parse({
      items: [
        {
          id: 1,
          trickType: 'backward',
          phase: 'inicio',
          label: null,
          instruction: 'Mira al frente.',
          warning: null,
          order: 10,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 24,
      totalPages: 1,
    });
    expect(parsed.items[0]?.instruction).toBe('Mira al frente.');
  });

  it('valida los resumenes destacados', () => {
    const parsed = gazeSummariesResponseSchema.parse({
      items: [{ id: 1, kind: 'idea_clave', content: 'Texto', order: 10 }],
    });
    expect(parsed.items[0]?.kind).toBe('idea_clave');
  });

  it('valida el detalle de un tipo con sus destinos', () => {
    const parsed = gazeTipTypeDetailSchema.parse({
      trickType: 'backward',
      label: 'Hacia atrás',
      phases: [{ phase: 'inicio', tips: [] }],
      targets: [{ targetKind: 'section', targetSlug: 'backward' }],
    });
    expect(parsed.targets[0]?.targetSlug).toBe('backward');
  });

  it('resuelve color y orden por tipo', () => {
    expect(gazeTypeColor('vertical-kicks')).toBe('tb-cat-kicks');
    expect(gazeTypeColor('desconocido')).toBe('tb-cat-basics');
    expect(gazeTypeRank('vertical-kicks')).toBeLessThan(gazeTypeRank('desconocido'));
  });
});
