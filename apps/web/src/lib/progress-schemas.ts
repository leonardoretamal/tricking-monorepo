import { z } from 'zod';

// Schema cliente-seguro del progreso del usuario (Fase 21). No importa de
// `@tricking/db` para no arrastrar el driver de Neon al bundle del navegador.

export const TRICK_PROGRESS_STATUSES = ['learned', 'in_progress', 'want'] as const;

export const trickProgressStatusSchema = z.enum(TRICK_PROGRESS_STATUSES);

export type TrickProgressStatus = z.infer<typeof trickProgressStatusSchema>;

export const PROGRESS_STORAGE_KEY = 'progress';
export const PROGRESS_VERSION = 1 as const;

export const progressStateSchema = z.object({
  version: z.literal(PROGRESS_VERSION),
  updatedAt: z.string(),
  tricks: z.record(z.string(), trickProgressStatusSchema),
});

export type ProgressState = z.infer<typeof progressStateSchema>;

export type ProgressTricks = ProgressState['tricks'];

export const EMPTY_PROGRESS: ProgressState = {
  version: PROGRESS_VERSION,
  updatedAt: '1970-01-01T00:00:00.000Z',
  tricks: {},
};
