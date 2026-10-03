// @vitest-environment jsdom
import { clearAll, writeEntry } from '@tricking/shared';
import { afterEach, describe, expect, it } from 'vitest';

import { queryPersister } from './query-persister';

afterEach(() => {
  clearAll();
});

describe('queryPersister', () => {
  it('restaura un cliente persistido con la forma esperada', async () => {
    writeEntry('query-cache', {
      timestamp: 1,
      buster: 'v1',
      clientState: { mutations: [], queries: [] },
    });

    const restored = await queryPersister.restoreClient();
    expect(restored?.buster).toBe('v1');
  });

  it('descarta un valor con forma invalida', async () => {
    writeEntry('query-cache', { foo: 'bar' });
    expect(await queryPersister.restoreClient()).toBeUndefined();
  });

  it('elimina el cliente persistido', async () => {
    writeEntry('query-cache', {
      timestamp: 1,
      buster: 'v1',
      clientState: { mutations: [], queries: [] },
    });
    await queryPersister.removeClient();
    expect(await queryPersister.restoreClient()).toBeUndefined();
  });
});
