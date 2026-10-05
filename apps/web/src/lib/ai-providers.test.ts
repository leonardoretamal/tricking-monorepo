import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAiDailyCap, getAiProviders } from './ai-providers';

afterEach(() => {
  vi.unstubAllEnvs();
});

function clearKeys(): void {
  vi.stubEnv('AI_GROQ_API_KEY', '');
  vi.stubEnv('AI_NVIDIA_API_KEY', '');
  vi.stubEnv('AI_OPENROUTER_API_KEY', '');
}

describe('getAiProviders', () => {
  it('devuelve vacio sin keys configuradas', () => {
    clearKeys();
    expect(getAiProviders()).toEqual([]);
  });

  it('ignora placeholders', () => {
    clearKeys();
    vi.stubEnv('AI_GROQ_API_KEY', 'change-me');
    expect(getAiProviders()).toEqual([]);
  });

  it('incluye solo los proveedores con key real, en orden de registro', () => {
    clearKeys();
    vi.stubEnv('AI_GROQ_API_KEY', 'gsk_real');
    vi.stubEnv('AI_NVIDIA_API_KEY', 'nv_real');

    expect(getAiProviders().map((provider) => provider.id)).toEqual(['groq', 'nvidia']);
  });

  it('respeta AI_PROVIDER_ORDER', () => {
    clearKeys();
    vi.stubEnv('AI_GROQ_API_KEY', 'gsk_real');
    vi.stubEnv('AI_NVIDIA_API_KEY', 'nv_real');
    vi.stubEnv('AI_PROVIDER_ORDER', 'nvidia,groq');

    expect(getAiProviders().map((provider) => provider.id)).toEqual(['nvidia', 'groq']);
  });

  it('permite override de modelo', () => {
    clearKeys();
    vi.stubEnv('AI_GROQ_API_KEY', 'gsk_real');
    vi.stubEnv('AI_GROQ_MODEL', 'mi-modelo');

    expect(getAiProviders()[0]?.model).toBe('mi-modelo');
  });

  it('agrega el proveedor propio con la variable heredada AI_API_KEY', () => {
    clearKeys();
    vi.stubEnv('AI_API_KEY', 'sk_real');
    vi.stubEnv('AI_PROVIDER_NAME', 'Mi proveedor');

    const providers = getAiProviders();
    expect(providers.map((provider) => provider.id)).toEqual(['custom']);
    expect(providers[0]?.name).toBe('Mi proveedor');
  });

  it('ignora OpenRouter si el modelo no termina en :free (candado anti-cobro)', () => {
    clearKeys();
    vi.stubEnv('AI_OPENROUTER_API_KEY', 'or_real');
    vi.stubEnv('AI_OPENROUTER_MODEL', 'openai/gpt-4o');

    expect(getAiProviders().map((provider) => provider.id)).not.toContain('openrouter');
  });

  it('incluye OpenRouter con un modelo :free', () => {
    clearKeys();
    vi.stubEnv('AI_OPENROUTER_API_KEY', 'or_real');
    vi.stubEnv('AI_OPENROUTER_MODEL', 'nvidia/nemotron-3-ultra-550b-a55b:free');

    expect(getAiProviders().map((provider) => provider.id)).toContain('openrouter');
  });
});

describe('getAiDailyCap', () => {
  it('usa 200 por defecto (por proveedor)', () => {
    vi.stubEnv('AI_DAILY_REQUEST_CAP', '');
    expect(getAiDailyCap()).toBe(200);
  });

  it('respeta un valor valido', () => {
    vi.stubEnv('AI_DAILY_REQUEST_CAP', '50');
    expect(getAiDailyCap()).toBe(50);
  });
});
