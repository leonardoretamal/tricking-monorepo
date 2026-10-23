import { describe, expect, it } from 'vitest';

import { tricksQuerySchema } from './api-schemas';

describe('tricksQuerySchema', () => {
  it('acepta un subfiltro valido para la seccion', () => {
    const parsed = tricksQuerySchema.safeParse({ section: 'vertical-kicks', subcategory: 'pop' });
    expect(parsed.success).toBe(true);
  });

  it('rechaza un subfiltro de otra seccion', () => {
    const parsed = tricksQuerySchema.safeParse({ section: 'backward', subcategory: 'pop' });
    expect(parsed.success).toBe(false);
  });

  it('rechaza un subfiltro desconocido', () => {
    const parsed = tricksQuerySchema.safeParse({ subcategory: 'patada' });
    expect(parsed.success).toBe(false);
  });

  it('acepta un subfiltro valido aunque no venga la seccion', () => {
    const parsed = tricksQuerySchema.safeParse({ subcategory: 'sideflip' });
    expect(parsed.success).toBe(true);
  });

  it('completa los valores por defecto del listado', () => {
    const parsed = tricksQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sort).toBe('name-asc');
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.pageSize).toBe(24);
    }
  });
});
