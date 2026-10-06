'use client';

import { DEFAULT_SCRIPT_ID, Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useLocale, useTranslations } from 'next-intl';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from 'react';
import { toast } from 'sonner';

import { usePathname } from '@/i18n/navigation';
import { FeedbackApiError, submitFeedback } from '@/lib/feedback-api';
import {
  FEEDBACK_MESSAGE_MAX,
  FEEDBACK_MESSAGE_MIN,
  FEEDBACK_TYPES,
  feedbackFormSchema,
} from '@/lib/feedback-schemas';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type FieldName = 'type' | 'name' | 'email' | 'message';

type CaptchaStatus = 'loading' | 'ready' | 'error' | 'expired';

type CaptchaFailureKind = 'script' | 'widget';

interface FormState {
  type: string;
  name: string;
  email: string;
  message: string;
  honeypot: string;
}

const INITIAL_VALUES: FormState = {
  type: 'sugerencia',
  name: '',
  email: '',
  message: '',
  honeypot: '',
};

interface ParseIssueResult {
  success: boolean;
  error?: { issues: readonly { message: string }[] };
}

function firstIssueMessage(result: ParseIssueResult): string | null {
  if (result.success) {
    return null;
  }
  return result.error?.issues[0]?.message ?? 'generic';
}

export function FeedbackForm() {
  const t = useTranslations('feedback');
  const locale = useLocale();
  const pathname = usePathname();

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState<CaptchaStatus>('loading');
  const [captchaFailureKind, setCaptchaFailureKind] = useState<CaptchaFailureKind | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const translateError = (key: string): string => {
    try {
      return t(`errors.${key}`);
    } catch {
      return t('errors.generic');
    }
  };

  const clearCaptchaError = (): void => {
    setErrors((previous) => {
      if (previous.captcha === undefined) {
        return previous;
      }
      const next = { ...previous };
      delete next.captcha;
      return next;
    });
  };

  const handleCaptchaSuccess = (token: string): void => {
    setTurnstileToken(token);
    setCaptchaStatus('ready');
    setCaptchaFailureKind(null);
    clearCaptchaError();
  };

  const handleCaptchaFailure = (
    status: 'error' | 'expired',
    kind: CaptchaFailureKind = 'widget',
  ): void => {
    setTurnstileToken('');
    setCaptchaStatus(status);
    setCaptchaFailureKind(kind);
  };

  const handleCaptchaRetry = (): void => {
    if (captchaFailureKind === 'script') {
      const script = document.getElementById(DEFAULT_SCRIPT_ID);
      script?.parentNode?.removeChild(script);
    }
    setTurnstileToken('');
    setCaptchaStatus('loading');
    setCaptchaFailureKind(null);
    clearCaptchaError();
    turnstileRef.current?.reset();
    setTurnstileKey((previous) => previous + 1);
  };

  const validateField = (field: FieldName, value: string): void => {
    let key: string | null;
    if (field === 'message') {
      key =
        value.trim() === ''
          ? 'required'
          : firstIssueMessage(feedbackFormSchema.shape.message.safeParse(value));
    } else if (field === 'name') {
      key = firstIssueMessage(feedbackFormSchema.shape.name.safeParse(value));
    } else if (field === 'email') {
      key = firstIssueMessage(feedbackFormSchema.shape.email.safeParse(value));
    } else {
      key = firstIssueMessage(feedbackFormSchema.shape.type.safeParse(value));
    }
    setErrors((previous) => {
      const next = { ...previous };
      if (key === null) {
        delete next[field];
      } else {
        next[field] = key;
      }
      return next;
    });
  };

  const handleBlur =
    (field: FieldName) =>
    (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      validateField(field, event.target.value);
    };

  const handleChange =
    (field: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setValues((previous) => ({ ...previous, [field]: value }));
      if (errors[field] !== undefined) {
        validateField(field, value);
      }
    };

  const resetForm = (): void => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setSuccess(false);
    setTurnstileToken('');
    setCaptchaStatus('loading');
    setCaptchaFailureKind(null);
    setFormStartedAt(Date.now());
    turnstileRef.current?.reset();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const payload = {
      type: values.type,
      name: values.name,
      email: values.email,
      message: values.message,
      page: pathname,
      locale: locale === 'en' ? 'en' : 'es',
      honeypot: values.honeypot,
      formStartedAt,
      turnstileToken,
    };

    const parsed = feedbackFormSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && next[field] === undefined) {
          next[field] = issue.message;
        }
      }
      if (values.message.trim() === '') {
        next.message = 'required';
      }
      setErrors(next);
      return;
    }

    if (TURNSTILE_SITE_KEY !== undefined && TURNSTILE_SITE_KEY !== '' && turnstileToken === '') {
      setErrors((previous) => ({ ...previous, captcha: 'captchaRequired' }));
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setSubmitting(true);

    try {
      await submitFeedback(
        {
          type: values.type,
          name: values.name,
          email: values.email,
          message: values.message,
          page: pathname,
          locale: locale === 'en' ? 'en' : 'es',
          honeypot: values.honeypot,
          formStartedAt,
          turnstileToken,
        },
        controller.signal,
      );
      setErrors({});
      setSuccess(true);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      const code = error instanceof FeedbackApiError ? error.message : 'submit_failed';
      const key =
        code === 'rate_limited'
          ? 'rateLimited'
          : code === 'captcha_failed'
            ? 'captchaRequired'
            : 'generic';
      toast.error(translateError(key));
      turnstileRef.current?.reset();
      setTurnstileToken('');
      setCaptchaStatus('loading');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="tb-surface max-w-xl">
        <div className="flex flex-col gap-4 p-6" role="status">
          <h2 className="tb-display text-2xl text-base-content">{t('successTitle')}</h2>
          <p className="text-base-content/80">{t('successDescription')}</p>
          <div className="flex">
            <button type="button" className="btn btn-primary" onClick={resetForm}>
              {t('sendAnother')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const valueError = (field: FieldName): string | undefined => errors[field];

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="tb-surface flex max-w-xl flex-col gap-5 p-5 sm:p-6"
    >
      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="feedback-type">
        <span>
          {t('typeLabel')}{' '}
          <span className="text-error" aria-hidden="true">
            *
          </span>
        </span>
        <select
          id="feedback-type"
          className="select select-bordered"
          value={values.type}
          onChange={handleChange('type')}
          onBlur={handleBlur('type')}
          aria-invalid={valueError('type') !== undefined}
          aria-describedby={valueError('type') !== undefined ? 'feedback-type-error' : undefined}
          required
        >
          {FEEDBACK_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </select>
        {valueError('type') !== undefined ? (
          <p id="feedback-type-error" role="alert" className="text-sm text-error">
            {translateError(valueError('type') ?? 'generic')}
          </p>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="feedback-name">
        <span>{t('nameLabel')}</span>
        <input
          id="feedback-name"
          type="text"
          className="input input-bordered"
          value={values.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          placeholder={t('namePlaceholder')}
          autoComplete="name"
          aria-invalid={valueError('name') !== undefined}
          aria-describedby={valueError('name') !== undefined ? 'feedback-name-error' : undefined}
        />
        {valueError('name') !== undefined ? (
          <p id="feedback-name-error" role="alert" className="text-sm text-error">
            {translateError(valueError('name') ?? 'generic')}
          </p>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="feedback-email">
        <span>{t('emailLabel')}</span>
        <input
          id="feedback-email"
          type="email"
          className="input input-bordered"
          value={values.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          aria-invalid={valueError('email') !== undefined}
          aria-describedby={valueError('email') !== undefined ? 'feedback-email-error' : undefined}
        />
        {valueError('email') !== undefined ? (
          <p id="feedback-email-error" role="alert" className="text-sm text-error">
            {translateError(valueError('email') ?? 'generic')}
          </p>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="feedback-message">
        <span>
          {t('messageLabel')}{' '}
          <span className="text-error" aria-hidden="true">
            *
          </span>
        </span>
        <textarea
          id="feedback-message"
          className="textarea textarea-bordered min-h-32"
          value={values.message}
          onChange={handleChange('message')}
          onBlur={handleBlur('message')}
          placeholder={t('messagePlaceholder')}
          aria-invalid={valueError('message') !== undefined}
          aria-describedby={
            valueError('message') !== undefined ? 'feedback-message-error' : 'feedback-message-hint'
          }
          required
        />
        <span id="feedback-message-hint" className="text-xs text-base-content/60">
          {t('messageHint', { min: FEEDBACK_MESSAGE_MIN, max: FEEDBACK_MESSAGE_MAX })}
        </span>
        {valueError('message') !== undefined ? (
          <p id="feedback-message-error" role="alert" className="text-sm text-error">
            {translateError(valueError('message') ?? 'generic')}
          </p>
        ) : null}
      </label>

      <div
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="feedback-company">{t('honeypotLabel')}</label>
        <input
          id="feedback-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={(event) =>
            setValues((previous) => ({ ...previous, honeypot: event.target.value }))
          }
        />
      </div>

      {TURNSTILE_SITE_KEY !== undefined && TURNSTILE_SITE_KEY !== '' ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">{t('captchaLabel')}</span>
          <Turnstile
            key={turnstileKey}
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            options={{ theme: 'auto' }}
            scriptOptions={{ onError: () => handleCaptchaFailure('error', 'script') }}
            onWidgetLoad={() =>
              setCaptchaStatus((previous) =>
                previous === 'error' || previous === 'expired' ? previous : 'ready',
              )
            }
            onSuccess={handleCaptchaSuccess}
            onExpire={() => handleCaptchaFailure('expired')}
            onTimeout={() => handleCaptchaFailure('error')}
            onUnsupported={() => handleCaptchaFailure('error')}
            onError={() => handleCaptchaFailure('error')}
          />
          {captchaStatus === 'error' || captchaStatus === 'expired' ? (
            <div
              className="flex flex-col gap-2 rounded-box border border-warning/40 bg-warning/10 p-3"
              role="alert"
            >
              <p className="text-sm font-medium text-base-content">
                {t(captchaStatus === 'expired' ? 'captchaExpiredTitle' : 'captchaErrorTitle')}
              </p>
              <p className="text-xs text-base-content/70">
                {t(
                  captchaStatus === 'expired'
                    ? 'captchaExpiredDescription'
                    : 'captchaErrorDescription',
                )}
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm self-start"
                onClick={handleCaptchaRetry}
              >
                {t('captchaRetry')}
              </button>
            </div>
          ) : null}
          {errors.captcha !== undefined ? (
            <p id="feedback-captcha-error" role="alert" className="text-sm text-error">
              {translateError(errors.captcha)}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-base-content/60">{t('privacyNote')}</p>

      <div className="flex justify-start">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner loading-sm" aria-hidden="true" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </button>
      </div>
    </form>
  );
}
