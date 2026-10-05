import { z } from 'zod';

import type { AiProviderConfig } from './ai-providers';
import { logger } from './logger';
import { checkRateLimit } from './rate-limit';

// Cliente HTTP de los proveedores de IA (Fase 22). Se llama a un endpoint compatible con
// OpenAI por `fetch`; prohibido usar un SDK de proveedor. La API key solo vive en el
// servidor y nunca se registra en logs. El asistente prueba los proveedores configurados
// en orden y usa el primero que responde.

export const AI_REQUEST_TIMEOUT_MS = 20_000;
export const AI_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

// IP del cliente respetando proxies y Cloudflare. Sin cabeceras utiles devuelve
// 'unknown'; el limitador en memoria agrupa esos casos en un mismo cubo.
export function getClientIp(request: Request): string {
  const cloudflare = request.headers.get('cf-connecting-ip');
  if (cloudflare !== null && cloudflare.trim() !== '') {
    return cloudflare.trim();
  }
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null) {
    const first = forwarded.split(',')[0]?.trim();
    if (first !== undefined && first !== '') {
      return first;
    }
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp !== null && realIp.trim() !== '' ? realIp.trim() : 'unknown';
}

// Tope diario compartido por instalacion, ademas del rate limit por IP. Reutiliza el
// limitador existente (Upstash con degradacion a memoria).
export async function consumeAiDailyBudget(dailyCap: number): Promise<boolean> {
  const result = await checkRateLimit('ai-daily', {
    limit: dailyCap,
    windowMs: AI_DAILY_WINDOW_MS,
  });
  return result.success;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const chatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable(),
        }),
      }),
    )
    .min(1),
});

// Llama a UN proveedor y devuelve el texto de la primera respuesta, o null si falla,
// responde vacio o la forma no es la esperada. Nunca propaga el error crudo ni registra
// el prompt, la respuesta ni la clave.
export async function callChatCompletion(
  provider: AiProviderConfig,
  messages: ChatMessage[],
  traceId: string,
  maxTokens: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn(
        {
          traceId,
          provider: provider.id,
          status: response.status,
          latencyMs: Date.now() - startedAt,
        },
        'asistente: el proveedor de IA respondio con error',
      );
      return null;
    }

    const parsed = chatCompletionSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.warn(
        { traceId, provider: provider.id, latencyMs: Date.now() - startedAt },
        'asistente: respuesta invalida',
      );
      return null;
    }

    const content = parsed.data.choices[0]?.message.content?.trim() ?? '';
    if (content === '') {
      return null;
    }

    return content;
  } catch (error) {
    logger.warn(
      {
        traceId,
        provider: provider.id,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'unknown',
      },
      'asistente: fallo la llamada al proveedor de IA',
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Prueba los proveedores en orden y devuelve la primera respuesta valida junto con el
// proveedor que la produjo. Si todos fallan, devuelve null. Asi, si una IA deja de
// funcionar, la app cae a la siguiente sin quedarse sin asistente.
export async function callChatCompletionWithFallback(
  providers: AiProviderConfig[],
  messages: ChatMessage[],
  traceId: string,
  maxTokens: number,
): Promise<{ answer: string; provider: AiProviderConfig } | null> {
  for (const provider of providers) {
    const answer = await callChatCompletion(provider, messages, traceId, maxTokens);
    if (answer !== null) {
      return { answer, provider };
    }
    logger.warn(
      { traceId, provider: provider.id },
      'asistente: proveedor agotado, se prueba el siguiente',
    );
  }
  return null;
}
