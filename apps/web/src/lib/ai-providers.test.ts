import { afterEach, describe, expect, it, vi } from 'vitest';

import { getAiDailyCap, getAiProviders } from './ai-providers';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAiProviders', () => {
  it('devuelve vacio sin keys configuradas', () => {
    vi.stubEnv('AI_GEMINI_API_KEY', '');
    vi.stubEnv('AI_GROQ_API_KEY', '');
    expect(getAiProviders()).toEqual([]);
  });

  it('ignora placeholders', () => {
    vi.stubEnv('AI_GEMINI_API_KEY', 'change-me');
    expect(getAiProviders()).toEqual([]);
  });

  it('incluye solo los proveedores con key real, en orden de registro', () => {
    vi.stubEnv('AI_GROQ_API_KEY', 'gsk_real');
    vi.stubEnv('AI_GEMINI_API_KEY', 'gm_real');
    vi.stubEnv('AI_NVIDIA_API_KEY', '');

    const ids = getAiProviders().map((provider) => provider.id);
    expect(ids).toEqual(['gemini', 'groq']);
  });

  it('respeta AI_PROVIDER_ORDER', () => {
    vi.stubEnv('AI_GEMINI_API_KEY', 'gm_real');
    vi.stubEnv('AI_GROQ_API_KEY', 'gsk_real');
    vi.stubEnv('AI_PROVIDER_ORDER', 'groq,gemini');

    expect(getAiProviders().map((provider) => provider.id)).toEqual(['groq', 'gemini']);
  });

  it('permite override de modelo', () => {
    vi.stubEnv('AI_GEMINI_API_KEY', 'gm_real');
    vi.stubEnv('AI_GEMINI_MODEL', 'gemini-custom');

    expect(getAiProviders()[0]?.model).toBe('gemini-custom');
  });

  it('agrega el proveedor propio con la variable heredada AI_API_KEY', () => {
    vi.stubEnv('AI_GEMINI_API_KEY', '');
    vi.stubEnv('AI_API_KEY', 'sk_real');
    vi.stubEnv('AI_PROVIDER_NAME', 'Mi proveedor');

    const providers = getAiProviders();
    expect(providers.map((provider) => provider.id)).toEqual(['custom']);
    expect(providers[0]?.name).toBe('Mi proveedor');
  });

  it('ignora OpenRouter si el modelo no termina en :free (candado anti-cobro)', () => {
    vi.stubEnv('AI_OPENROUTER_API_KEY', 'or_real');
    vi.stubEnv('AI_OPENROUTER_MODEL', 'openai/gpt-4o');

    expect(getAiProviders().map((provider) => provider.id)).not.toContain('openrouter');
  });

  it('incluye OpenRouter con un modelo :free', () => {
    vi.stubEnv('AI_OPENROUTER_API_KEY', 'or_real');
    vi.stubEnv('AI_OPENROUTER_MODEL', 'meta-llama/llama-3.3-70b-instruct:free');

    expect(getAiProviders().map((provider) => provider.id)).toContain('openrouter');
  });
});

describe('getAiDailyCap', () => {
  it('usa 200 por defecto', () => {
    vi.stubEnv('AI_DAILY_REQUEST_CAP', '');
    expect(getAiDailyCap()).toBe(200);
  });

  it('respeta un valor valido', () => {
    vi.stubEnv('AI_DAILY_REQUEST_CAP', '50');
    expect(getAiDailyCap()).toBe(50);
  });
});
