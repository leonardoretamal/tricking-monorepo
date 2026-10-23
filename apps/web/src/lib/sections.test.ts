import { describe, expect, it } from 'vitest';

import {
  ALL_SUBCATEGORIES,
  DEFAULT_SECTION,
  SECTIONS,
  SUBCATEGORIES,
  isSection,
  isSubcategory,
  isSubcategoryForSection,
  subcategoriesForSection,
} from './sections';

describe('secciones', () => {
  it('declara las cinco secciones del catalogo', () => {
    expect(SECTIONS).toEqual(['vertical-kicks', 'backward', 'forward', 'inside', 'outside']);
    expect(DEFAULT_SECTION).toBe('vertical-kicks');
  });

  it('reconoce solo secciones conocidas', () => {
    expect(isSection('backward')).toBe(true);
    expect(isSection('backflip')).toBe(false);
  });
});

describe('subcategorias', () => {
  it('cubre todas las secciones con sus subfiltros', () => {
    expect(subcategoriesForSection('vertical-kicks')).toEqual(['pop', 'cheat', 'swing']);
    expect(subcategoriesForSection('backward')).toEqual([
      'backflip',
      'gainer',
      'full',
      'corkscrew',
    ]);
    expect(subcategoriesForSection('forward')).toEqual(['frontflip', 'webster', 'janitor']);
    expect(subcategoriesForSection('inside')).toEqual([
      'butterfly',
      'aerial',
      'masterswing',
      'wrap',
      'tak',
    ]);
    expect(subcategoriesForSection('outside')).toEqual([
      'raiz',
      'doubleleg',
      'spyder',
      'lotus',
      'sideflip',
    ]);
  });

  it('junta los veinte slugs sin repetir', () => {
    expect(ALL_SUBCATEGORIES).toHaveLength(20);
    expect(new Set(ALL_SUBCATEGORIES).size).toBe(20);
    for (const section of SECTIONS) {
      expect(SUBCATEGORIES[section].length).toBeGreaterThan(0);
    }
  });

  it('reconoce un slug global aunque no se conozca la seccion', () => {
    expect(isSubcategory('corkscrew')).toBe(true);
    expect(isSubcategory('patada')).toBe(false);
  });

  it('valida el slug contra su seccion', () => {
    expect(isSubcategoryForSection('vertical-kicks', 'pop')).toBe(true);
    expect(isSubcategoryForSection('backward', 'pop')).toBe(false);
    expect(isSubcategoryForSection('outside', 'sideflip')).toBe(true);
    expect(isSubcategoryForSection('outside', 'webster')).toBe(false);
  });
});
