import { describe, expect, it } from 'vitest';

import { paginatedTricksSchema, trickDetailSchema } from './trick-schemas';

const listItem = {
  id: 'tornado',
  name: 'Tornado',
  description: null,
  descriptionEs: null,
  difficulty: 3,
  section: 'vertical-kicks',
  loopkicksSlug: 'tornado',
  categories: ['VERT_KICK'],
};

describe('trickSchemas', () => {
  it('acepta una pagina valida e ignora claves desconocidas', () => {
    const parsed = paginatedTricksSchema.parse({
      items: [listItem],
      total: 1,
      page: 1,
      pageSize: 24,
      totalPages: 1,
      traceId: 'abc',
    });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.name).toBe('Tornado');
  });

  it('rechaza una pagina sin total', () => {
    const result = paginatedTricksSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });

  it('valida el detalle con relaciones', () => {
    const parsed = trickDetailSchema.parse({
      ...listItem,
      howTo: null,
      howToEs: 'Paso el peso y giro.',
      loopkicksNotes: 'An Arabian starts with a backflip.',
      loopkicksNotesEs: 'Un Arabian empieza con un backflip.',
      kojoTechniques: [],
      prereqs: [{ id: 'tornado', name: 'Tornado', difficulty: 3, section: 'vertical-kicks' }],
      nextTricks: [],
    });
    expect(parsed.prereqs[0]?.id).toBe('tornado');
    expect(parsed.howToEs).toBe('Paso el peso y giro.');
  });
});
