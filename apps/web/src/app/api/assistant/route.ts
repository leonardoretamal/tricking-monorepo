import { loadComboTricks, searchContextForAssistant, type AssistantContext } from '@tricking/db';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

import {
  callChatCompletionWithFallback,
  consumeAiDailyBudget,
  getClientIp,
  type ChatMessage,
} from '@/lib/ai-client';
import { ASSISTANT_SYSTEM_PROMPT, isForbiddenTopic } from '@/lib/ai-guardrails';
import { getAiDailyCap, getAiProviders } from '@/lib/ai-providers';
import { assistantRequestSchema } from '@/lib/assistant-schemas';
import { logger, newTraceId } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

// Asistente de IA acotado a tricking (Fase 22). Solo responde sobre trucos, tecnica e
// historia del deporte. El pre-filtro de temas prohibidos corre antes de llamar al
// modelo; sin AI_API_KEY degrada con un aviso y no rompe.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ASSISTANT_RATE_LIMIT = 12;
const ASSISTANT_RATE_WINDOW_MS = 60_000;
const ASSISTANT_CONTEXT_ITEMS = 8;
const ASSISTANT_MAX_TOKENS = 500;
const ASSISTANT_MAX_ANSWER_CHARS = 4000;
const ASSISTANT_KNOWN_TRICKS_IN_PROMPT = 80;

type Locale = 'es' | 'en';

interface AssistantChatText {
  refusal: string;
  notConfigured: string;
}

const FALLBACK_TEXT: Record<Locale, AssistantChatText> = {
  es: {
    refusal:
      'Solo puedo ayudarte con tricking: trucos, técnica e historia del deporte. No escribo código ni respondo temas ajenos. Pregúntame por un truco.',
    notConfigured:
      'El asistente de IA no está configurado en este entorno. Puedes seguir usando el catálogo y el generador de combinaciones.',
  },
  en: {
    refusal:
      'I can only help with tricking: tricks, technique and the history of the sport. I do not write code or answer unrelated topics. Ask me about a trick.',
    notConfigured:
      'The AI assistant is not configured in this environment. You can still use the catalog and the combo generator.',
  },
};

async function loadChatText(locale: Locale): Promise<AssistantChatText> {
  try {
    const t = await getTranslations({ locale, namespace: 'assistant.chat' });
    const refusal = t('refusal');
    const notConfigured = t('notConfigured');
    if (refusal.trim() === '' || notConfigured.trim() === '') {
      return FALLBACK_TEXT[locale];
    }
    return { refusal, notConfigured };
  } catch {
    return FALLBACK_TEXT[locale];
  }
}

function pickText(locale: Locale, english: string | null, spanish: string | null): string | null {
  const primary = locale === 'es' ? spanish : english;
  const fallback = locale === 'es' ? english : spanish;
  const value = primary ?? fallback;
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function buildContextBlock(context: AssistantContext, locale: Locale): string {
  const lines: string[] = ['Contexto del catalogo (usalo solo si es relevante):'];
  const empty =
    context.tricks.length === 0 &&
    context.gazeTips.length === 0 &&
    context.transitions.length === 0;
  if (empty) {
    lines.push('- Sin resultados en el catalogo para esta pregunta.');
    return lines.join('\n');
  }

  for (const trick of context.tricks) {
    const meta: string[] = [];
    if (trick.section !== null) {
      meta.push(`seccion ${trick.section}`);
    }
    if (trick.difficulty !== null) {
      meta.push(`dificultad ${trick.difficulty}/5`);
    }
    const suffix = meta.length > 0 ? ` (${meta.join(', ')})` : '';
    lines.push(`- Truco: ${trick.name}${suffix}`);
    const detail = pickText(locale, trick.description, trick.descriptionEs);
    if (detail !== null) {
      lines.push(`  descripcion: ${detail}`);
    }
    const howTo = pickText(locale, trick.howTo, trick.howToEs);
    if (howTo !== null) {
      lines.push(`  como se hace: ${howTo}`);
    }
  }

  for (const tip of context.gazeTips) {
    lines.push(`- Tip de mirada (${tip.trickType}, ${tip.phase}): ${tip.instruction}`);
    if (tip.warning !== null && tip.warning.trim() !== '') {
      lines.push(`  advertencia: ${tip.warning.trim()}`);
    }
  }

  for (const transition of context.transitions) {
    const detail = transition.descriptionEs ?? '';
    lines.push(
      `- Transicion: ${transition.name}${detail.trim() === '' ? '' : ` - ${detail.trim()}`}`,
    );
  }

  return lines.join('\n');
}

// Bloque con los trucos que el usuario ya tiene. Personaliza la respuesta (por ejemplo
// "que aprendo despues") sin recomendar lo que ya domina. Se acota para no inflar el
// prompt. Solo incluye trucos existentes en el catalogo.
async function buildKnownTricksBlock(knownTrickIds: string[], locale: Locale): Promise<string> {
  const unique = [...new Set(knownTrickIds)];
  if (unique.length === 0) {
    return '';
  }
  const known = await loadComboTricks(unique);
  if (known.length === 0) {
    return '';
  }
  const shown = known.slice(0, ASSISTANT_KNOWN_TRICKS_IN_PROMPT).map((trick) => trick.name);
  const extra = known.length - shown.length;
  const tail = extra > 0 ? (locale === 'es' ? ` y ${extra} mas` : ` and ${extra} more`) : '';
  const intro =
    locale === 'es'
      ? 'Trucos que el usuario YA tiene (no se los expliques desde cero ni los recomiendes como nuevos):'
      : 'Tricks the user ALREADY has (do not explain them from scratch or recommend them as new):';
  return `${intro} ${shown.join(', ')}${tail}.`;
}

export async function POST(request: Request) {
  const traceId = newTraceId();
  const startedAt = Date.now();

  try {
    const ip = getClientIp(request);
    const limit = await checkRateLimit(`assistant:${ip}`, {
      limit: ASSISTANT_RATE_LIMIT,
      windowMs: ASSISTANT_RATE_WINDOW_MS,
    });
    if (!limit.success) {
      logger.warn({ traceId }, 'asistente: rate limit excedido');
      return NextResponse.json({ error: 'rate_limited', traceId }, { status: 429 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const parsed = assistantRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const { message, locale, history, knownTrickIds } = parsed.data;
    const text = await loadChatText(locale);
    const providers = getAiProviders();

    // Pre-filtro: se revisa el mensaje y el historial. Una peticion ajena se rechaza
    // sin llamar al modelo (no gasta tokens ni el tope diario).
    const scanned = [message, ...(history ?? []).map((item) => item.content)].join('\n');
    if (isForbiddenTopic(scanned)) {
      logger.info({ traceId, locale, blocked: true }, 'asistente: tema ajeno rechazado');
      return NextResponse.json({
        answer: text.refusal,
        configured: providers.length > 0,
        provider: null,
      });
    }

    if (providers.length === 0) {
      logger.info({ traceId, locale, configured: false }, 'asistente: sin proveedor configurado');
      return NextResponse.json({ answer: text.notConfigured, configured: false, provider: null });
    }

    const withinBudget = await consumeAiDailyBudget(getAiDailyCap());
    if (!withinBudget) {
      logger.warn({ traceId }, 'asistente: tope diario alcanzado');
      return NextResponse.json({ error: 'daily_cap', traceId }, { status: 429 });
    }

    const context = await searchContextForAssistant(message, ASSISTANT_CONTEXT_ITEMS, locale);
    const knownBlock = await buildKnownTricksBlock(knownTrickIds ?? [], locale);

    const messages: ChatMessage[] = [{ role: 'system', content: ASSISTANT_SYSTEM_PROMPT }];
    if (knownBlock !== '') {
      messages.push({ role: 'system', content: knownBlock });
    }
    messages.push({ role: 'system', content: buildContextBlock(context, locale) });
    for (const item of history ?? []) {
      messages.push({ role: item.role, content: item.content });
    }
    messages.push({ role: 'user', content: message });

    const result = await callChatCompletionWithFallback(
      providers,
      messages,
      traceId,
      ASSISTANT_MAX_TOKENS,
    );
    if (result === null) {
      logger.error({ traceId }, 'asistente: ningun proveedor devolvio una respuesta valida');
      return NextResponse.json({ error: 'upstream_error', traceId }, { status: 502 });
    }

    const safeAnswer = result.answer.slice(0, ASSISTANT_MAX_ANSWER_CHARS);

    logger.info(
      {
        traceId,
        locale,
        provider: result.provider.id,
        tricks: context.tricks.length,
        gazeTips: context.gazeTips.length,
        transitions: context.transitions.length,
        latencyMs: Date.now() - startedAt,
      },
      'asistente: respuesta generada',
    );

    return NextResponse.json({
      answer: safeAnswer,
      configured: true,
      provider: result.provider.name,
    });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'asistente: fallo inesperado',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
