import {
  loadCatalogSample,
  loadComboTricks,
  loadNextTrickSuggestions,
  searchContextForAssistant,
  type AssistantContext,
} from '@tricking/db';
import { NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';

import { callChatCompletionWithFallback, getClientIp, type ChatMessage } from '@/lib/ai-client';
import {
  comboMode,
  getAssistantSystemPrompt,
  isComboRequest,
  isForbiddenTopic,
  normalizeGuardText,
} from '@/lib/ai-guardrails';
import { getAiDailyCap, getAiProviders } from '@/lib/ai-providers';
import { buildComboFromPool, buildFreeCatalogChain, loadComboPool } from '@/lib/combo-builder';
import type { ComboLength } from '@/lib/combo-schemas';
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

// Todos los textos que el asistente genera en el servidor, resueltos por locale. Cubre
// las respuestas visibles (rechazo, sin proveedor, pregunta de combinacion, encabezados
// de combinacion) y las etiquetas e intro del andamiaje que se le pasa al modelo
// (contexto del catalogo, trucos conocidos, sugerencias, muestra aleatoria). El prompt
// de sistema no vive aqui: se construye por locale en ai-guardrails.ts.
interface AssistantChatText {
  refusal: string;
  notConfigured: string;
  comboAsk: string;
  comboKnownIntro: string;
  comboFreeIntro: string;
  contextIntro: string;
  contextEmpty: string;
  trickLabel: string;
  sectionLabel: string;
  difficultyLabel: string;
  descriptionLabel: string;
  howToLabel: string;
  gazeLabel: string;
  warningLabel: string;
  transitionLabel: string;
  knownIntro: string;
  knownMore: string;
  suggestionsIntro: string;
  catalogSampleIntro: string;
}

const FALLBACK_TEXT: Record<Locale, AssistantChatText> = {
  es: {
    refusal:
      'Solo puedo ayudarte con tricking: trucos, técnica e historia del deporte. No escribo código ni respondo temas ajenos. Pregúntame por un truco.',
    notConfigured:
      'El asistente de IA no está configurado en este entorno. Puedes seguir usando el catálogo y el generador de combinaciones.',
    comboAsk:
      '¿La quieres con los trucos que ya tienes o una combinación libre con trucos del catálogo?',
    comboKnownIntro: 'Combinación con los trucos que ya tienes:',
    comboFreeIntro: 'Combinación libre con trucos del catálogo:',
    contextIntro: 'Contexto del catálogo (úsalo solo si es relevante):',
    contextEmpty: '- Sin resultados en el catálogo para esta pregunta.',
    trickLabel: 'Truco',
    sectionLabel: 'sección',
    difficultyLabel: 'dificultad',
    descriptionLabel: 'descripción',
    howToLabel: 'cómo se hace',
    gazeLabel: 'Tip de mirada',
    warningLabel: 'advertencia',
    transitionLabel: 'Transición',
    knownIntro:
      'Trucos que el usuario YA tiene (no se los expliques desde cero ni los recomiendes como nuevos):',
    knownMore: 'y {count} más',
    suggestionsIntro:
      'Trucos del catálogo que PUEDES recomendar (continuaciones reales de lo que ya sabe). NO recomiendes ningún truco que no esté en esta lista ni en el contexto del catálogo:',
    catalogSampleIntro:
      'Muestra aleatoria del catálogo para una combinación libre (puedes elegir trucos de aquí). Solo nombres reales:',
  },
  en: {
    refusal:
      'I can only help with tricking: tricks, technique and the history of the sport. I do not write code or answer unrelated topics. Ask me about a trick.',
    notConfigured:
      'The AI assistant is not configured in this environment. You can still use the catalog and the combo generator.',
    comboAsk:
      'Do you want it with the tricks you already have or a free combo with catalog tricks?',
    comboKnownIntro: 'Combo with the tricks you already have:',
    comboFreeIntro: 'Free combo with catalog tricks:',
    contextIntro: 'Catalog context (use it only if relevant):',
    contextEmpty: '- No results in the catalog for this question.',
    trickLabel: 'Trick',
    sectionLabel: 'section',
    difficultyLabel: 'difficulty',
    descriptionLabel: 'description',
    howToLabel: 'how to do it',
    gazeLabel: 'Gaze tip',
    warningLabel: 'warning',
    transitionLabel: 'Transition',
    knownIntro:
      'Tricks the user ALREADY has (do not explain them from scratch or recommend them as new):',
    knownMore: 'and {count} more',
    suggestionsIntro:
      'Catalog tricks you MAY recommend (real follow-ups to what the user knows). Do NOT recommend any trick that is not in this list or the catalog context:',
    catalogSampleIntro:
      'Random catalog sample for a free combo (you may pick tricks from here). Real names only:',
  },
};

// Interpola placeholders simples `{clave}`. Se usa para textos con contadores (por
// ejemplo "{count} más"), sin acoplar la carga de traducciones a valores dinamicos.
function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

// Carga los textos del chat y del andamiaje del prompt en el idioma del cliente. Si
// falta una clave o el namespace no existe, cae al texto bilingue de respaldo.
async function loadChatText(locale: Locale): Promise<AssistantChatText> {
  try {
    const chat = await getTranslations({ locale, namespace: 'assistant.chat' });
    const prompt = await getTranslations({ locale, namespace: 'assistant.prompt' });
    const text: AssistantChatText = {
      refusal: chat('refusal'),
      notConfigured: chat('notConfigured'),
      comboAsk: chat('comboAsk'),
      comboKnownIntro: chat('comboKnownIntro'),
      comboFreeIntro: chat('comboFreeIntro'),
      contextIntro: prompt('contextIntro'),
      contextEmpty: prompt('contextEmpty'),
      trickLabel: prompt('trickLabel'),
      sectionLabel: prompt('sectionLabel'),
      difficultyLabel: prompt('difficultyLabel'),
      descriptionLabel: prompt('descriptionLabel'),
      howToLabel: prompt('howToLabel'),
      gazeLabel: prompt('gazeLabel'),
      warningLabel: prompt('warningLabel'),
      transitionLabel: prompt('transitionLabel'),
      knownIntro: prompt('knownIntro'),
      knownMore: prompt('knownMore'),
      suggestionsIntro: prompt('suggestionsIntro'),
      catalogSampleIntro: prompt('catalogSampleIntro'),
    };
    if (Object.values(text).some((value) => value.trim() === '')) {
      return FALLBACK_TEXT[locale];
    }
    return text;
  } catch {
    return FALLBACK_TEXT[locale];
  }
}

// Palabras vacias que se quitan antes de buscar en el catalogo, para que "que es un
// corkscrew? responde breve" busque "corkscrew" y no falle por los terminos de relleno.
const SEARCH_STOPWORDS = new Set([
  'que',
  'qué',
  'cual',
  'cuales',
  'como',
  'es',
  'son',
  'un',
  'una',
  'unos',
  'unas',
  'el',
  'la',
  'los',
  'las',
  'de',
  'del',
  'al',
  'y',
  'o',
  'para',
  'por',
  'con',
  'sin',
  'en',
  'se',
  'su',
  'responde',
  'respuesta',
  'breve',
  'explica',
  'explicame',
  'dime',
  'sobre',
  'the',
  'what',
  'which',
  'how',
  'is',
  'are',
  'an',
  'of',
  'to',
  'and',
  'or',
  'for',
  'with',
  'about',
  'tell',
  'me',
  'explain',
  'short',
  'answer',
]);

function buildSearchQuery(message: string): string {
  const tokens = normalizeGuardText(message)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !SEARCH_STOPWORDS.has(token));
  const query = tokens.join(' ');
  return query === '' ? message : query;
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

function buildContextBlock(
  context: AssistantContext,
  locale: Locale,
  text: AssistantChatText,
): string {
  const lines: string[] = [text.contextIntro];
  const empty =
    context.tricks.length === 0 &&
    context.gazeTips.length === 0 &&
    context.transitions.length === 0;
  if (empty) {
    lines.push(text.contextEmpty);
    return lines.join('\n');
  }

  for (const trick of context.tricks) {
    const meta: string[] = [];
    if (trick.section !== null) {
      meta.push(`${text.sectionLabel} ${trick.section}`);
    }
    if (trick.difficulty !== null) {
      meta.push(`${text.difficultyLabel} ${trick.difficulty}/5`);
    }
    const suffix = meta.length > 0 ? ` (${meta.join(', ')})` : '';
    lines.push(`- ${text.trickLabel}: ${trick.name}${suffix}`);
    const detail = pickText(locale, trick.description, trick.descriptionEs);
    if (detail !== null) {
      lines.push(`  ${text.descriptionLabel}: ${detail}`);
    }
    const howTo = pickText(locale, trick.howTo, trick.howToEs);
    if (howTo !== null) {
      lines.push(`  ${text.howToLabel}: ${howTo}`);
    }
  }

  for (const tip of context.gazeTips) {
    lines.push(`- ${text.gazeLabel} (${tip.trickType}, ${tip.phase}): ${tip.instruction}`);
    if (tip.warning !== null && tip.warning.trim() !== '') {
      lines.push(`  ${text.warningLabel}: ${tip.warning.trim()}`);
    }
  }

  for (const transition of context.transitions) {
    const detail = pickText(locale, transition.description, transition.descriptionEs) ?? '';
    lines.push(
      `- ${text.transitionLabel}: ${transition.name}${detail.trim() === '' ? '' : ` - ${detail.trim()}`}`,
    );
  }

  return lines.join('\n');
}

// Bloque con los trucos que el usuario ya tiene. Personaliza la respuesta (por ejemplo
// "que aprendo despues") sin recomendar lo que ya domina. Se acota para no inflar el
// prompt. Solo incluye trucos existentes en el catalogo.
async function buildKnownTricksBlock(
  knownTrickIds: string[],
  text: AssistantChatText,
): Promise<string> {
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
  const tail = extra > 0 ? ` ${fillTemplate(text.knownMore, { count: extra })}` : '';
  return `${text.knownIntro} ${shown.join(', ')}${tail}.`;
}

// Sugerencias REALES del catalogo para anclar las recomendaciones: continuaciones
// (`next`) de los trucos que el usuario ya tiene. El asistente debe recomendar solo entre
// estos trucos (o los del contexto), nunca inventar nombres.
async function buildSuggestionsBlock(
  knownTrickIds: string[],
  text: AssistantChatText,
): Promise<string> {
  const unique = [...new Set(knownTrickIds)];
  if (unique.length === 0) {
    return '';
  }
  const suggestions = await loadNextTrickSuggestions(unique, 20);
  if (suggestions.length === 0) {
    return '';
  }
  const shown = suggestions.map((trick) => {
    const meta: string[] = [];
    if (trick.section !== null) {
      meta.push(trick.section);
    }
    if (trick.difficulty !== null) {
      meta.push(`${text.difficultyLabel} ${trick.difficulty}/5`);
    }
    return meta.length > 0 ? `${trick.name} (${meta.join(', ')})` : trick.name;
  });
  return `${text.suggestionsIntro} ${shown.join(', ')}.`;
}

// Muestra aleatoria del catalogo para que el asistente pueda armar una "combinacion
// libre" con trucos reales, no solo los que el usuario ya conoce.
async function buildCatalogSampleBlock(text: AssistantChatText): Promise<string> {
  const sample = await loadCatalogSample(40);
  if (sample.length === 0) {
    return '';
  }
  const names = sample.map((trick) => trick.name);
  return `${text.catalogSampleIntro} ${names.join(', ')}.`;
}

// Arma una combinacion del lado del servidor con el generador determinista, que usa SOLO
// trucos del catalogo (con los que el usuario ya tiene o una muestra aleatoria). Asi el
// asistente nunca inventa nombres de trucos en las combinaciones.
async function buildComboAnswer(
  mode: 'known' | 'free',
  knownTrickIds: string[],
  text: AssistantChatText,
): Promise<string | null> {
  const length: ComboLength = 'medium';
  let steps: { name: string }[];
  if (mode === 'known') {
    const ids = [...new Set(knownTrickIds)];
    if (ids.length < 2) {
      return null;
    }
    const pool = await loadComboPool({ knownTrickIds: ids, length });
    steps = buildComboFromPool(pool, length).steps;
  } else {
    // Libre: cadena coherente siguiendo las relaciones `next` del catalogo.
    steps = await buildFreeCatalogChain(length);
  }
  if (steps.length < 2) {
    return null;
  }
  const lines = steps.map((step, index) => `${index + 1}. ${step.name}`);
  const intro = mode === 'known' ? text.comboKnownIntro : text.comboFreeIntro;
  return `${intro}\n${lines.join('\n')}`;
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

    // Combinaciones: se resuelven del lado del servidor con trucos reales del catalogo.
    // Si el usuario no aclaro el tipo, se le pregunta antes de armar nada. No necesitan IA.
    if (isComboRequest(message)) {
      const mode = comboMode(message);
      if (mode === 'ask') {
        logger.info({ traceId, comboMode: mode }, 'asistente: combinacion sin modo aclarado');
        return NextResponse.json({
          answer: text.comboAsk,
          configured: providers.length > 0,
          provider: null,
        });
      }
      const comboAnswer = await buildComboAnswer(mode, knownTrickIds ?? [], text);
      if (comboAnswer !== null) {
        logger.info({ traceId, comboMode: mode }, 'asistente: combinacion generada del catalogo');
        return NextResponse.json({
          answer: comboAnswer,
          configured: providers.length > 0,
          provider: null,
        });
      }
    }

    if (providers.length === 0) {
      logger.info({ traceId, locale, configured: false }, 'asistente: sin proveedor configurado');
      return NextResponse.json({ answer: text.notConfigured, configured: false, provider: null });
    }

    const context = await searchContextForAssistant(
      buildSearchQuery(message),
      ASSISTANT_CONTEXT_ITEMS,
      locale,
    );
    const knownBlock = await buildKnownTricksBlock(knownTrickIds ?? [], text);
    const suggestionsBlock = await buildSuggestionsBlock(knownTrickIds ?? [], text);
    const comboBlock = isComboRequest(message) ? await buildCatalogSampleBlock(text) : '';

    const messages: ChatMessage[] = [{ role: 'system', content: getAssistantSystemPrompt(locale) }];
    if (knownBlock !== '') {
      messages.push({ role: 'system', content: knownBlock });
    }
    if (suggestionsBlock !== '') {
      messages.push({ role: 'system', content: suggestionsBlock });
    }
    if (comboBlock !== '') {
      messages.push({ role: 'system', content: comboBlock });
    }
    messages.push({ role: 'system', content: buildContextBlock(context, locale, text) });
    for (const item of history ?? []) {
      messages.push({ role: item.role, content: item.content });
    }
    messages.push({ role: 'user', content: message });

    const result = await callChatCompletionWithFallback(
      providers,
      messages,
      traceId,
      ASSISTANT_MAX_TOKENS,
      getAiDailyCap(),
    );
    if (!result.ok) {
      if (result.reason === 'capped') {
        logger.warn({ traceId }, 'asistente: tope diario de todos los proveedores alcanzado');
        return NextResponse.json({ error: 'daily_cap', traceId }, { status: 429 });
      }
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
