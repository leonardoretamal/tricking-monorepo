'use client';

import { EmptyState, ErrorState, LoadingState } from '@tricking/ui';
import { Copy, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import { AssistantApiError, generateCombo } from '@/lib/assistant-api';
import {
  COMBO_LENGTHS,
  isComboLength,
  type ComboLength,
  type ComboResponse,
} from '@/lib/combo-schemas';
import { useProgressStore } from '@/lib/progress-store';
import { SECTIONS, type Section } from '@/lib/sections';

// Generador de combinaciones (Fase 22). Lee el progreso del usuario desde el store del
// navegador y envia SOLO los ids de los trucos marcados como aprendidos; el servidor
// nunca lee localStorage. El resultado es deterministico y se puede regenerar rotando el
// orden de los ids enviados.

type GeneratorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; code: string }
  | { status: 'success'; data: ComboResponse };

const SECTION_KEYS: Record<Section, string> = {
  'vertical-kicks': 'verticalKicks',
  backward: 'backward',
  forward: 'forward',
  inside: 'inside',
  outside: 'outside',
};

const DIFFICULTIES = ['0', '1', '2', '3', '4', '5'] as const;
type DifficultyChoice = 'any' | (typeof DIFFICULTIES)[number];

function rotate(ids: string[], offset: number): string[] {
  if (ids.length === 0) {
    return ids;
  }
  const index = ((offset % ids.length) + ids.length) % ids.length;
  return [...ids.slice(index), ...ids.slice(0, index)];
}

export function ComboGenerator() {
  const t = useTranslations('assistant.combos');
  const tNav = useTranslations('nav');

  const hydrate = useProgressStore((state) => state.hydrate);
  const tricks = useProgressStore((state) => state.tricks);

  const [length, setLength] = useState<ComboLength>('medium');
  const [section, setSection] = useState<Section | 'all'>('all');
  const [maxDifficulty, setMaxDifficulty] = useState<DifficultyChoice>('any');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<GeneratorState>({ status: 'idle' });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Se considera "conocido" solo el truco marcado como aprendido; "quiero" o "en
  // progreso" no habilitan el generador.
  const learnedIds = useMemo(
    () =>
      Object.entries(tricks)
        .filter(([, status]) => status === 'learned')
        .map(([id]) => id),
    [tricks],
  );
  const learnedKey = learnedIds.join(',');

  useEffect(() => {
    if (learnedIds.length === 0) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    generateCombo(
      {
        knownTrickIds: rotate(learnedIds, attempt),
        length,
        ...(section === 'all' ? {} : { section }),
        ...(maxDifficulty === 'any' ? {} : { maxDifficulty: Number(maxDifficulty) }),
      },
      controller.signal,
    )
      .then((data) => {
        setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: 'error',
          code: error instanceof AssistantApiError ? error.code : 'unknown',
        });
      });

    return () => controller.abort();
  }, [learnedIds, learnedKey, length, section, maxDifficulty, attempt]);

  const copy = async (): Promise<void> => {
    if (state.status !== 'success') {
      return;
    }
    const text = state.data.steps.map((step, index) => `${index + 1}. ${step.name}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  if (learnedIds.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-base-content">{t('heading')}</h2>
          <p className="max-w-2xl text-sm text-base-content/70">{t('intro')}</p>
        </header>
        <EmptyState
          title={t('noTricksTitle')}
          description={t('noTricksDescription')}
          action={
            <Link href="/tricks" className="btn btn-primary btn-sm">
              {t('noTricksAction')}
            </Link>
          }
        />
      </div>
    );
  }

  const errorText =
    state.status === 'error'
      ? state.code === 'rate_limited'
        ? t('rateLimited')
        : state.code === 'daily_cap'
          ? t('dailyLimit')
          : t('errorDescription')
      : '';

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-base-content">{t('heading')}</h2>
        <p className="max-w-2xl text-sm text-base-content/70">{t('intro')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="combo-length" className="text-sm font-medium text-base-content">
            {t('length')}
          </label>
          <select
            id="combo-length"
            className="select select-bordered w-full"
            value={length}
            onChange={(event) => {
              if (isComboLength(event.target.value)) {
                setLength(event.target.value);
              }
            }}
          >
            {COMBO_LENGTHS.map((value) => (
              <option key={value} value={value}>
                {t(`lengths.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="combo-section" className="text-sm font-medium text-base-content">
            {t('section')}
          </label>
          <select
            id="combo-section"
            className="select select-bordered w-full"
            value={section}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'all') {
                setSection('all');
                return;
              }
              const found = SECTIONS.find((item) => item === value);
              if (found !== undefined) {
                setSection(found);
              }
            }}
          >
            <option value="all">{t('sections.all')}</option>
            {SECTIONS.map((value) => (
              <option key={value} value={value}>
                {tNav(SECTION_KEYS[value])}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="combo-difficulty" className="text-sm font-medium text-base-content">
            {t('maxDifficulty')}
          </label>
          <select
            id="combo-difficulty"
            className="select select-bordered w-full"
            value={maxDifficulty}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'any') {
                setMaxDifficulty('any');
                return;
              }
              const found = DIFFICULTIES.find((item) => item === value);
              if (found !== undefined) {
                setMaxDifficulty(found);
              }
            }}
          >
            <option value="any">{t('difficulties.any')}</option>
            {DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setAttempt((value) => value + 1)}
          disabled={state.status === 'loading'}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {state.status === 'loading' ? t('generating') : t('regenerate')}
        </button>
        {state.status === 'success' && state.data.steps.length >= 2 ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void copy()}>
            <Copy aria-hidden="true" className="size-4" />
            {t('copy')}
          </button>
        ) : null}
      </div>

      {state.status === 'loading' ? <LoadingState label={t('generating')} /> : null}

      {state.status === 'error' ? (
        <ErrorState
          title={t('errorTitle')}
          description={errorText}
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t('retry')}
            </button>
          }
        />
      ) : null}

      {state.status === 'success' && state.data.steps.length < 2 ? (
        <EmptyState title={t('emptyResultTitle')} description={t('emptyResultDescription')} />
      ) : null}

      {state.status === 'success' && state.data.steps.length >= 2 ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-base-content/60">
            {state.data.source === 'ai' ? t('sourceAi') : t('sourceDeterministic')}
            {state.data.source === 'ai' && state.data.provider
              ? ` · ${t('providerLabel', { name: state.data.provider })}`
              : ''}
          </p>
          <ol className="flex flex-col gap-2">
            {state.data.steps.map((step, index) => {
              const sectionSlug = step.section ?? 'vertical-kicks';
              return (
                <li
                  key={`${step.trickId}-${index}`}
                  className="flex flex-wrap items-center gap-3 rounded-box border border-base-300 p-3"
                >
                  <span className="badge badge-neutral">
                    {t('stepLabel', { number: index + 1 })}
                  </span>
                  <Link
                    href={`/tricks/${sectionSlug}/${step.trickId}`}
                    className="link link-hover font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {step.name}
                  </Link>
                  {step.difficulty !== null ? (
                    <span
                      className="badge badge-outline"
                      aria-label={t('difficultyLabel', { value: step.difficulty })}
                      title={t('difficultyLabel', { value: step.difficulty })}
                    >
                      {step.difficulty}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
