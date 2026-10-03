'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@tricking/ui';

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: LocaleErrorProps) {
  const t = useTranslations('states');
  const tActions = useTranslations('actions');

  useEffect(() => {
    // Solo el digest, nunca el mensaje ni el stack del error, para no exponer internos.
    console.error(error.digest ?? 'unexpected error');
  }, [error]);

  return (
    <ErrorState
      title={t('errorTitle')}
      description={t('errorDescription')}
      action={
        <button
          type="button"
          onClick={reset}
          className="rounded-field bg-primary px-4 py-2 font-medium text-primary-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {tActions('retry')}
        </button>
      }
    />
  );
}
