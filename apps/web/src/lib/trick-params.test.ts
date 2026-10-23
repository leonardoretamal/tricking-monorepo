import { describe, expect, it } from 'vitest';

import { parseTrickFilters } from './trick-params';

describe('parseTrickFilters', () => {
  it('aplica valores por defecto con searchParams vacios', () => {
    expect(parseTrickFilters({})).toEqual({
      q: undefined,
      difficulty: undefined,
      sort: 'name-asc',
      page: 1,
      pageSize: 24,
    });
  });

  it('normaliza difficulty fuera de rango', () => {
    expect(parseTrickFilters({ difficulty: '9' }).difficulty).toBeUndefined();
    expect(parseTrickFilters({ difficulty: '3' }).difficulty).toBe(3);
  });

  it('normaliza un sort invalido al valor por defecto', () => {
    expect(parseTrickFilters({ sort: 'precio' }).sort).toBe('name-asc');
    expect(parseTrickFilters({ sort: 'difficulty-desc' }).sort).toBe('difficulty-desc');
  });

  it('normaliza pageSize no permitido', () => {
    expect(parseTrickFilters({ pageSize: '50' }).pageSize).toBe(24);
    expect(parseTrickFilters({ pageSize: '100' }).pageSize).toBe(100);
  });

  it('toma el primer valor cuando el parametro es un arreglo', () => {
    expect(parseTrickFilters({ q: ['tornado', 'otro'] }).q).toBe('tornado');
  });

  it('acepta un subfiltro valido cuando no hay seccion', () => {
    expect(parseTrickFilters({ sub: 'corkscrew' }).sub).toBe('corkscrew');
  });

  it('descarta un subfiltro desconocido', () => {
    expect(parseTrickFilters({ sub: 'patada' }).sub).toBeUndefined();
  });

  it('acepta el subfiltro que pertenece a la seccion del query', () => {
    expect(parseTrickFilters({ section: 'vertical-kicks', sub: 'cheat' }).sub).toBe('cheat');
  });

  it('descarta el subfiltro que no pertenece a la seccion del query', () => {
    expect(parseTrickFilters({ section: 'backward', sub: 'cheat' }).sub).toBeUndefined();
  });

  it('valida contra la seccion de la ruta cuando llega como pista', () => {
    expect(parseTrickFilters({ sub: 'gainer' }, 'backward').sub).toBe('gainer');
    expect(parseTrickFilters({ sub: 'gainer' }, 'inside').sub).toBeUndefined();
  });
});
