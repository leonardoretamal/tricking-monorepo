import { z } from 'zod';

import { logger } from './logger';
import { checkRateLimit } from './rate-limit';

// Cliente HTTP del proveedor de IA (Fase 22). Se llama a un endpoint compatible con
// OpenAI por `fetch`; prohibido usar un SDK de proveedor. La API key solo vive en el
// servidor y nunca se registra en logs.

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  dailyCap: number;
}

export const AI_REQUEST_TIMEOUT_MS = 20_000;
export const AI_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_AI_DAILY_CAP = 200;

const PLACEHOLDER_KEYS = new Set(['change-me', 'changeme', 'your-key-here', 'tu-key-aqui']);

// Devuelve la configuracion solo si hay una API key real. Un placeholder o una variable
// ausente se tratan como "no configurado": el asistente degrada con aviso.
export function getAiConfig(): AiConfig | null {
  const apiKey = process.env.AI_API_KEY?.trim() ?? '';
  if (apiKey === '' || PLACEHOLDER_KEYS.has(apiKey.toLowerCase())) {
    return null;
  }

  const baseUrl = (
    process.env.AI_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai'
  ).replace(/\/+$/, '');
  const model = process.env.AI_MODEL?.trim() || 'gemini-2.5-flash';

  const rawCap = Number.parseInt(process.env.AI_DAILY_REQUEST_CAP?.trim() ?? '', 10);
  const dailyCap = Number.isFinite(rawCap) && rawCap > 0 ? rawCap : DEFAULT_AI_DAILY_CAP;

  return { baseUrl, apiKey, model, dailyCap };
}

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
export async function consumeAiDailyBudget(config: AiConfig): Promise<boolean> {
  const result = await checkRateLimit('ai-daily', {
    limit: config.dailyCap,
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

// Llama al modelo y devuelve el texto de la primera respuesta, o null si el proveedor
// falla, responde vacio o la forma no es la esperada. Nunca propaga el error crudo ni
// registra el prompt, la respuesta ni la clave.
export async function callChatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  traceId: string,
  maxTokens: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn(
        { traceId, status: response.status, latencyMs: Date.now() - startedAt },
        'asistente: el proveedor de IA respondio con error',
      );
      return null;
    }

    const parsed = chatCompletionSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.warn({ traceId, latencyMs: Date.now() - startedAt }, 'asistente: respuesta invalida');
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
