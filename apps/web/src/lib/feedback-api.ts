import {
  feedbackErrorSchema,
  feedbackMutationResponseSchema,
  paginatedFeedbackSchema,
  type FeedbackQuery,
  type FeedbackStatus,
  type PaginatedFeedbackResponse,
} from './feedback-schemas';

async function readErrorCode(response: Response, fallback: string): Promise<string> {
  try {
    const parsed = feedbackErrorSchema.safeParse(await response.json());
    if (parsed.success && parsed.data.error) {
      return parsed.data.error;
    }
  } catch {
    // Se usa el codigo generico.
  }
  return fallback;
}

// Clientes HTTP del feedback (Fase 18). Validan la respuesta con Zod. Las peticiones
// de administracion llevan el token en la cabecera x-feedback-admin-token.

export const FEEDBACK_ADMIN_HEADER = 'x-feedback-admin-token';

export interface FeedbackSubmission {
  type: string;
  name: string;
  email: string;
  message: string;
  page: string;
  locale: string;
  honeypot: string;
  formStartedAt: number;
  turnstileToken: string;
}

export class FeedbackApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'FeedbackApiError';
    this.status = status;
  }
}

export async function submitFeedback(
  payload: FeedbackSubmission,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    throw new FeedbackApiError(await readErrorCode(response, 'submit_failed'), response.status);
  }
  feedbackMutationResponseSchema.parse(await response.json());
}

export async function fetchFeedback(
  query: FeedbackQuery,
  token: string,
  signal?: AbortSignal,
): Promise<PaginatedFeedbackResponse> {
  const params = new URLSearchParams();
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.type) {
    params.set('type', query.type);
  }
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));

  const response = await fetch(`/api/feedback?${params.toString()}`, {
    headers: { [FEEDBACK_ADMIN_HEADER]: token },
    signal,
  });
  if (!response.ok) {
    throw new FeedbackApiError('feedback_request_failed', response.status);
  }
  return paginatedFeedbackSchema.parse(await response.json());
}

export async function updateFeedbackStatus(
  id: number,
  status: FeedbackStatus,
  token: string,
): Promise<void> {
  const response = await fetch(`/api/feedback/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      [FEEDBACK_ADMIN_HEADER]: token,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new FeedbackApiError('status_update_failed', response.status);
  }
  feedbackMutationResponseSchema.parse(await response.json());
}

export async function deleteFeedback(id: number, token: string): Promise<void> {
  const response = await fetch(`/api/feedback/${id}`, {
    method: 'DELETE',
    headers: { [FEEDBACK_ADMIN_HEADER]: token },
  });
  if (!response.ok) {
    throw new FeedbackApiError('delete_failed', response.status);
  }
  feedbackMutationResponseSchema.parse(await response.json());
}
