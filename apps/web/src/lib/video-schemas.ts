import { z } from 'zod';

// Esquemas del endpoint /api/videos (Fase 14, ampliado en las Fases 44 y 45). El cliente
// valida con Zod lo que recibe y lo que se rehidrata desde el cache persistido. `source`
// indica de donde sale la URL: 'r2' cuando el video vive en el bucket, 'external' cuando se
// usa la fuente original. `provider` dice de que plataforma externa viene (loopkicks,
// youtube, vimeo, dailymotion o tiktok), `kind` como se presenta ('file' en <video>,
// 'iframe' con fachada al clic o 'link' como tarjeta) y `aspect` el encuadre (los verticales
// tipo short son '9:16'). `role` separa la ejecucion ('demo') de la explicacion externa
// ('tutorial'); `language` (es/en) solo aplica a los tutoriales.

export const videoProviderSchema = z.enum([
  'loopkicks',
  'youtube',
  'vimeo',
  'dailymotion',
  'tiktok',
]);
export const videoKindSchema = z.enum(['file', 'iframe', 'link']);
export const videoAspectSchema = z.enum(['16:9', '9:16']);
export const videoRoleSchema = z.enum(['demo', 'tutorial']);
export const videoLanguageSchema = z.enum(['es', 'en']);

export const videoSchema = z.object({
  id: z.number(),
  trickId: z.string().nullable(),
  url: z.string(),
  mime: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  source: z.enum(['r2', 'external']),
  provider: videoProviderSchema.nullable(),
  embedUrl: z.string().nullable(),
  author: z.string().nullable(),
  title: z.string().nullable(),
  kind: videoKindSchema,
  aspect: videoAspectSchema,
  // Los detalles cacheados sin `role`/`language` siguen validando con estos valores.
  role: videoRoleSchema.default('demo'),
  language: videoLanguageSchema.nullable().default(null),
});

export const videosResponseSchema = z.object({
  items: z.array(videoSchema),
});

export const videoQuerySchema = z.object({
  trickId: z.string().trim().min(1).max(120),
});

export type Video = z.infer<typeof videoSchema>;
export type VideosResponse = z.infer<typeof videosResponseSchema>;
export type VideoProvider = z.infer<typeof videoProviderSchema>;
export type VideoKind = z.infer<typeof videoKindSchema>;
export type VideoAspect = z.infer<typeof videoAspectSchema>;
export type VideoRole = z.infer<typeof videoRoleSchema>;
export type VideoLanguage = z.infer<typeof videoLanguageSchema>;
