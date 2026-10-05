import { Resend } from 'resend';

import enMessages from '../../messages/en/feedback.json';
import esMessages from '../../messages/es/feedback.json';
import { logger } from './logger';

// Aviso por correo de cada feedback nuevo (Fase 18). Tolerante a fallos: si falta
// configuracion o el proveedor falla, no se interrumpe el guardado. La plantilla vive
// en los archivos de i18n. Los logs llevan trace_id y el id del feedback, nunca el
// mensaje, el correo del remitente ni la API key.

type FeedbackLocale = 'es' | 'en';

interface EmailTemplate {
  subject: string;
  intro: string;
  typeLabel: string;
  nameLabel: string;
  emailLabel: string;
  pageLabel: string;
  localeLabel: string;
  dateLabel: string;
  messageLabel: string;
  anonymous: string;
  footer: string;
}

const TEMPLATES: Record<FeedbackLocale, EmailTemplate> = {
  es: esMessages.feedback.email,
  en: enMessages.feedback.email,
};

const TYPE_LABELS: Record<FeedbackLocale, Record<string, string>> = {
  es: { ...esMessages.feedback.types },
  en: { ...enMessages.feedback.types },
};

export interface FeedbackNotificationInput {
  id: number;
  type: string;
  name: string | null;
  email: string | null;
  message: string;
  page: string | null;
  locale: string | null;
  createdAt: Date;
}

function resolveLocale(locale: string | null): FeedbackLocale {
  return locale === 'en' ? 'en' : 'es';
}

export async function sendFeedbackNotification(
  input: FeedbackNotificationInput,
  traceId: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FEEDBACK_FROM_EMAIL;
  const to = process.env.FEEDBACK_NOTIFY_EMAIL;

  if (!apiKey || !from || !to) {
    logger.warn(
      { traceId, feedbackId: input.id },
      'correo de feedback no configurado: se omite el aviso',
    );
    return false;
  }

  const locale = resolveLocale(input.locale);
  const template = TEMPLATES[locale];
  const typeLabel = TYPE_LABELS[locale][input.type] ?? input.type;

  const lines = [
    template.intro,
    '',
    `${template.typeLabel}: ${typeLabel}`,
    `${template.nameLabel}: ${input.name ?? template.anonymous}`,
    `${template.emailLabel}: ${input.email ?? template.anonymous}`,
    `${template.pageLabel}: ${input.page ?? '-'}`,
    `${template.localeLabel}: ${locale}`,
    `${template.dateLabel}: ${input.createdAt.toISOString()}`,
    '',
    `${template.messageLabel}:`,
    input.message,
    '',
    template.footer.replace('{id}', String(input.id)),
  ];

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: template.subject.replace('{type}', typeLabel),
      text: lines.join('\n'),
    });
    logger.info({ traceId, feedbackId: input.id, locale }, 'aviso de feedback enviado');
    return true;
  } catch (error) {
    logger.error(
      {
        traceId,
        feedbackId: input.id,
        error: error instanceof Error ? error.message : 'unknown',
      },
      'fallo el envio del aviso de feedback',
    );
    return false;
  }
}
