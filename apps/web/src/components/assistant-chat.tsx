'use client';

import { ErrorState } from '@tricking/ui';
import { Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState, type FormEvent } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { AssistantApiError, askAssistant } from '@/lib/assistant-api';
import type { ChatMessage } from '@/lib/assistant-schemas';

// Render de la respuesta del asistente en Markdown (react-markdown + remark-gfm). No se
// habilita HTML crudo: react-markdown lo ignora por defecto y no se agrega rehype-raw.
// Los enlaces salen a pestana nueva sin opener y las imagenes se descartan para no cargar
// recursos externos. El estilo con Tailwind respeta el tema (sin colores sueltos).
const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  img: () => null,
};

// Chat del asistente (Fase 22). El historial vive solo en memoria del componente: no se
// persiste en localStorage. Resuelve los tres estados (carga, error y exito) y muestra
// el aviso de degradacion cuando el backend no tiene proveedor de IA configurado.

interface UiMessage {
  role: 'user' | 'assistant';
  content: string;
  // Nombre del proveedor de IA que respondio este mensaje (badge). Null si no aplica.
  provider?: string | null;
}

const MAX_HISTORY = 6;

interface AssistantChatProps {
  // Ids de los trucos que el usuario ya tiene (progreso local). El chat los envia para
  // personalizar la respuesta. Es opcional: sin progreso el chat funciona igual.
  knownTrickIds?: string[];
}

export function AssistantChat({ knownTrickIds = [] }: AssistantChatProps) {
  const t = useTranslations('assistant.chat');
  const rawLocale = useLocale();
  const locale = rawLocale === 'en' ? 'en' : 'es';

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const lastAttempt = useRef('');

  const send = async (text: string, history: UiMessage[]): Promise<void> => {
    setPending(true);
    setErrorCode(null);
    const withUser: UiMessage[] = [...history, { role: 'user', content: text }];
    setMessages(withUser);
    setInput('');

    try {
      const payload: ChatMessage[] = history
        .slice(-MAX_HISTORY)
        .map((item) => ({ role: item.role, content: item.content }));
      const response = await askAssistant({
        message: text,
        locale,
        history: payload,
        ...(knownTrickIds.length > 0 ? { knownTrickIds } : {}),
      });
      setMessages([
        ...withUser,
        { role: 'assistant', content: response.answer, provider: response.provider },
      ]);
      if (!response.configured) {
        setNotConfigured(true);
      }
    } catch (error) {
      setErrorCode(error instanceof AssistantApiError ? error.code : 'unknown');
      toast.error(t('errorDescription'));
      setMessages(withUser);
    } finally {
      setPending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const text = input.trim();
    if (text === '' || pending) {
      return;
    }
    lastAttempt.current = text;
    void send(text, messages);
  };

  const retry = (): void => {
    const text = lastAttempt.current;
    if (text === '' || pending) {
      return;
    }
    const last = messages[messages.length - 1];
    const base = last?.role === 'user' ? messages.slice(0, -1) : messages;
    void send(text, base);
  };

  const errorText =
    errorCode === 'rate_limited'
      ? t('rateLimited')
      : errorCode === 'daily_cap'
        ? t('dailyLimit')
        : t('errorDescription');

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="tb-display text-2xl text-base-content">{t('heading')}</h2>
        <p className="max-w-2xl text-sm text-base-content/70">{t('intro')}</p>
      </header>

      {notConfigured ? (
        <div role="status" className="alert alert-warning text-sm">
          {t('notConfigured')}
        </div>
      ) : null}

      <div aria-live="polite" className="flex flex-col gap-3">
        {messages.length === 0 && !pending ? (
          <p className="text-sm text-base-content/70">{t('empty')}</p>
        ) : null}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === 'user'
                ? 'tb-surface p-3'
                : 'rounded-box border border-primary/30 bg-primary/5 p-3'
            }
          >
            <span className="tb-eyebrow flex items-center gap-2 text-base-content/60">
              {message.role === 'user' ? t('you') : t('assistant')}
              {message.role === 'assistant' && message.provider ? (
                <span
                  className="badge tb-badge tb-cat-transitions badge-sm normal-case"
                  aria-label={t('providerBadge', { name: message.provider })}
                >
                  {message.provider}
                </span>
              ) : null}
            </span>
            {message.role === 'user' ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-base-content">
                {message.content}
              </p>
            ) : (
              <div className="mt-1 space-y-2 text-sm text-base-content [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-base-300 [&_code]:px-1 [&_code]:py-0.5 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-base-300 [&_pre]:p-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {pending ? (
          <p role="status" className="text-sm text-base-content/60">
            {t('sending')}
          </p>
        ) : null}
      </div>

      {errorCode !== null ? (
        <ErrorState
          title={t('errorTitle')}
          description={errorText}
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={retry}>
              {t('retry')}
            </button>
          }
        />
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="assistant-message" className="text-sm font-medium text-base-content">
          {t('inputLabel')}
        </label>
        <textarea
          id="assistant-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={t('inputPlaceholder')}
          disabled={pending}
          className="textarea textarea-bordered w-full"
        />
        <button
          type="submit"
          className="btn btn-primary self-end"
          disabled={pending || input.trim() === ''}
        >
          <Send aria-hidden="true" className="size-4" />
          {pending ? t('sending') : t('send')}
        </button>
      </form>
    </div>
  );
}
