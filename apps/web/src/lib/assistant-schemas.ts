import { z } from 'zod';

// Contratos del asistente de IA acotado a tricking (Fase 22). Modulo cliente-seguro:
// solo depende de Zod, sin importar @tricking/db.

export const ASSISTANT_MESSAGE_MIN = 1;
export const ASSISTANT_MESSAGE_MAX = 1000;
export const ASSISTANT_HISTORY_MAX = 6;
export const ASSISTANT_HISTORY_ITEM_MAX = 2000;
export const ASSISTANT_KNOWN_TRICKS_MAX = 600;
export const ASSISTANT_TRICK_ID_MAX = 120;

export const CHAT_ROLES = ['user', 'assistant'] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const chatMessageSchema = z.object({
  role: z.enum(CHAT_ROLES),
  content: z.string().trim().min(1).max(ASSISTANT_HISTORY_ITEM_MAX),
});

export const assistantRequestSchema = z.object({
  message: z.string().trim().min(ASSISTANT_MESSAGE_MIN).max(ASSISTANT_MESSAGE_MAX),
  locale: z.enum(['es', 'en']),
  history: z.array(chatMessageSchema).max(ASSISTANT_HISTORY_MAX).optional(),
  // Trucos que el usuario ya tiene (progreso local). El cliente los envia para que el
  // asistente personalice y no recomiende lo que ya domina. El servidor los valida y
  // solo usa los que existen en el catalogo.
  knownTrickIds: z
    .array(z.string().trim().min(1).max(ASSISTANT_TRICK_ID_MAX))
    .max(ASSISTANT_KNOWN_TRICKS_MAX)
    .optional(),
});

export const assistantResponseSchema = z.object({
  answer: z.string(),
  configured: z.boolean(),
});

export const assistantErrorSchema = z.object({
  error: z.string().optional(),
  traceId: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
