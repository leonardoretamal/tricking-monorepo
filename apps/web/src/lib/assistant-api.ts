import {
  assistantErrorSchema,
  assistantResponseSchema,
  type AssistantRequest,
  type AssistantResponse,
} from './assistant-schemas';
import {
  comboErrorSchema,
  comboResponseSchema,
  type ComboRequest,
  type ComboResponse,
} from './combo-schemas';

// Cliente HTTP del asistente y del generador de combinaciones (Fase 22). Valida con Zod
// lo que devuelve el backend y expone errores por codigo, sin propagar mensajes crudos.

export class AssistantApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = 'AssistantApiError';
    this.code = code;
    this.status = status;
  }
}

async function readErrorCode(
  response: Response,
  schema: typeof assistantErrorSchema,
  fallback: string,
): Promise<string> {
  try {
    const parsed = schema.safeParse(await response.json());
    if (parsed.success && parsed.data.error !== undefined) {
      return parsed.data.error;
    }
  } catch {
    // Se usa el codigo generico.
  }
  return fallback;
}

export async function askAssistant(
  payload: AssistantRequest,
  signal?: AbortSignal,
): Promise<AssistantResponse> {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new AssistantApiError(
      await readErrorCode(response, assistantErrorSchema, 'assistant_request_failed'),
      response.status,
    );
  }

  return assistantResponseSchema.parse(await response.json());
}

export async function generateCombo(
  payload: ComboRequest,
  signal?: AbortSignal,
): Promise<ComboResponse> {
  const response = await fetch('/api/combos/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new AssistantApiError(
      await readErrorCode(response, comboErrorSchema, 'combo_request_failed'),
      response.status,
    );
  }

  return comboResponseSchema.parse(await response.json());
}
