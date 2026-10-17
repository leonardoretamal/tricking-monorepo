import { describe, expect, it } from 'vitest';

import { videoSchema, videosResponseSchema } from './video-schemas';

const baseVideo = {
  id: 1,
  trickId: 'tornado',
  url: 'https://example.com/video.mp4',
  mime: 'video/mp4',
  durationSeconds: 12,
  source: 'external',
  provider: 'youtube',
  embedUrl: 'https://www.youtube-nocookie.com/embed/abc',
  author: 'Canal',
  title: 'Tutorial de tornado',
  kind: 'iframe',
  aspect: '16:9',
};

describe('videoSchemas', () => {
  it('acepta un video demo y completa role/language por defecto', () => {
    const parsed = videoSchema.parse(baseVideo);
    expect(parsed.role).toBe('demo');
    expect(parsed.language).toBeNull();
  });

  it('acepta un tutorial en espanol con proveedor tiktok', () => {
    const parsed = videoSchema.parse({
      ...baseVideo,
      provider: 'tiktok',
      aspect: '9:16',
      role: 'tutorial',
      language: 'es',
    });
    expect(parsed.role).toBe('tutorial');
    expect(parsed.language).toBe('es');
    expect(parsed.aspect).toBe('9:16');
  });

  it('rechaza un proveedor desconocido', () => {
    expect(videoSchema.safeParse({ ...baseVideo, provider: 'vimeo2' }).success).toBe(false);
  });

  it('rechaza un idioma fuera de es/en', () => {
    expect(videoSchema.safeParse({ ...baseVideo, language: 'pt' }).success).toBe(false);
  });

  it('valida la respuesta con items', () => {
    const parsed = videosResponseSchema.parse({ items: [baseVideo], traceId: 'abc' });
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.kind).toBe('iframe');
  });
});
