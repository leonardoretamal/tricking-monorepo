import { describe, expect, it } from 'vitest';

import { VIRTUALIZE_THRESHOLD, columnsForWidth, shouldVirtualize } from './trick-grid';

describe('shouldVirtualize', () => {
  it('no virtualiza las paginas de 100 elementos', () => {
    expect(shouldVirtualize(100)).toBe(false);
  });

  it('no virtualiza justo en el umbral', () => {
    expect(VIRTUALIZE_THRESHOLD).toBe(200);
    expect(shouldVirtualize(200)).toBe(false);
  });

  it('virtualiza recien por encima del umbral', () => {
    expect(shouldVirtualize(201)).toBe(true);
  });

  it('no virtualiza listas vacias', () => {
    expect(shouldVirtualize(0)).toBe(false);
  });
});

describe('columnsForWidth', () => {
  it('usa una columna por debajo de 640', () => {
    expect(columnsForWidth(639)).toBe(1);
  });

  it('usa una columna con ancho cero', () => {
    expect(columnsForWidth(0)).toBe(1);
  });

  it('usa dos columnas desde 640', () => {
    expect(columnsForWidth(640)).toBe(2);
  });

  it('usa dos columnas hasta 1023', () => {
    expect(columnsForWidth(1023)).toBe(2);
  });

  it('usa tres columnas desde 1024', () => {
    expect(columnsForWidth(1024)).toBe(3);
  });
});
