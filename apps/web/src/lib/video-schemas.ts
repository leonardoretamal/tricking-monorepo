import { z } from 'zod';

// Esquemas del endpoint /api/videos (Fase 14). El cliente valida con Zod lo que recibe y
// lo que se rehidrata desde el cache persistido. `source` indica de donde sale la URL:
// 'r2' cuando el video vive en el bucket, 'external' cuando se cae a la fuente original.

export const videoSchema = z.object({
  id: z.number(),
  trickId: z.string().nullable(),
  url: z.string(),
  mime: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  source: z.enum(['r2', 'external']),
});

export const videosResponseSchema = z.object({
  items: z.array(videoSchema),
});

export const videoQuerySchema = z.object({
  trickId: z.string().trim().min(1).max(120),
});

export type Video = z.infer<typeof videoSchema>;
export type VideosResponse = z.infer<typeof videosResponseSchema>;
