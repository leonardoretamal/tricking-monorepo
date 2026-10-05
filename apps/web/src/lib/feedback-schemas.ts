import { z } from 'zod';

// Contratos del feedback (Fase 18). Modulo cliente-seguro: no importa @tricking/db
// para no arrastrar el driver de Neon al bundle del navegador. Las listas de tipos y
// estados estan duplicadas a proposito desde packages/db/src/queries/feedback.ts y
// deben mantenerse sincronizadas.

export const FEEDBACK_TYPES = ['sugerencia', 'error', 'contenido', 'otro'] as const;
export const FEEDBACK_STATUSES = ['nuevo', 'leido', 'respondido', 'archivado'] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const DEFAULT_FEEDBACK_PAGE_SIZE = 20;
export const MAX_FEEDBACK_PAGE_SIZE = 100;

export const FEEDBACK_MESSAGE_MIN = 10;
export const FEEDBACK_MESSAGE_MAX = 2000;
export const FEEDBACK_MIN_FILL_MS = 2500;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Quita etiquetas y bloques ejecutables del mensaje antes de guardarlo. Evita que se
// almacene o se reenvie HTML o scripts; conserva los saltos de linea del usuario.
export function sanitizeMessage(value: string): string {
  const withoutMarkup = value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, '');

  let result = '';
  for (const char of withoutMarkup) {
    const code = char.codePointAt(0) ?? 0;
    // Conserva tabulador, salto de linea y retorno de carro; descarta el resto de
    // caracteres de control.
    if (code >= 32 || code === 9 || code === 10 || code === 13) {
      result += char;
    }
  }
  return result.trim();
}

const optionalNameSchema = z.string().trim().max(80, 'nameMax').optional();

const optionalEmailSchema = z
  .string()
  .trim()
  .max(120, 'emailMax')
  .refine((value) => value === '' || EMAIL_PATTERN.test(value), { message: 'emailInvalid' })
  .optional();

export const feedbackFormSchema = z.object({
  type: z.enum(FEEDBACK_TYPES, 'typeInvalid'),
  name: optionalNameSchema,
  email: optionalEmailSchema,
  message: z
    .string()
    .trim()
    // El saneo va ANTES de medir: asi un mensaje que queda vacio o corto tras
    // quitarle HTML no pasa la validacion (no se guarda feedback vacio).
    .transform(sanitizeMessage)
    .pipe(
      z.string().min(FEEDBACK_MESSAGE_MIN, 'messageMin').max(FEEDBACK_MESSAGE_MAX, 'messageMax'),
    ),
  page: z.string().trim().max(300, 'pageMax').optional(),
  locale: z.enum(['es', 'en']).optional(),
  honeypot: z.string().max(0, 'honeypot').optional(),
  formStartedAt: z.coerce.number().int().nonnegative(),
  turnstileToken: z.string().max(4096).optional(),
});

export type FeedbackFormValues = z.input<typeof feedbackFormSchema>;

// El cuerpo del POST publico usa exactamente el mismo contrato que el formulario.
export const feedbackSubmitSchema = feedbackFormSchema;

export const feedbackQuerySchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  type: z.enum(FEEDBACK_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_FEEDBACK_PAGE_SIZE)
    .default(DEFAULT_FEEDBACK_PAGE_SIZE),
});

export type FeedbackQuery = z.infer<typeof feedbackQuerySchema>;

export const feedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
});

export const feedbackItemSchema = z.object({
  id: z.number(),
  type: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  message: z.string(),
  page: z.string().nullable(),
  locale: z.string().nullable(),
  userAgent: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paginatedFeedbackSchema = z.object({
  items: z.array(feedbackItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
  traceId: z.string().optional(),
});

export const feedbackMutationResponseSchema = z.object({
  ok: z.boolean(),
  traceId: z.string().optional(),
});

export const feedbackErrorSchema = z.object({
  error: z.string().optional(),
  traceId: z.string().optional(),
});

export type FeedbackItemResponse = z.infer<typeof feedbackItemSchema>;
export type PaginatedFeedbackResponse = z.infer<typeof paginatedFeedbackSchema>;

export function isFeedbackType(value: string): value is FeedbackType {
  return (FEEDBACK_TYPES as readonly string[]).includes(value);
}

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}
