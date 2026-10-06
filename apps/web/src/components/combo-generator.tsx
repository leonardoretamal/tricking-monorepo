'use client';

import { EmptyState, ErrorState, LoadingState } from '@tricking/ui';
import { Copy, RefreshCw, Save } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Link } from '@/i18n/navigation';
import { AssistantApiError, generateCombo } from '@/lib/assistant-api';
import {
  COMBO_MAX_SAVED,
  isComboLength,
  COMBO_LENGTHS,
  type ComboLength,
  type ComboLocale,
  type ComboResponse,
} from '@/lib/combo-schemas';
import { useComboStore } from '@/lib/combo-store';
import { useProgressStore } from '@/lib/progress-store';
import { SECTIONS, type Section } from '@/lib/sections';

// Generador de combinaciones (Fase 22, actualizado en la Fase 41). Lee el progreso del
// usuario desde el store del navegador y envia SOLO los ids de los trucos marcados como
// aprendidos; el servidor nunca lee localStorage. La generacion es a demanda (boton
// Generar / Regenerar), no al montar ni al cambiar los filtros.

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

const FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const CHIP_BASE = `btn btn-sm ${FOCUS_CLASS}`;
const CHIP_ON = 'border border-primary bg-primary/15 text-base-content';
const CHIP_OFF = 'btn-outline text-base-content/80';

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
  const currentLocale = useLocale();
  // El contrato del generador solo admite es/en; cualquier otro valor cae a es.
  const locale: ComboLocale = currentLocale === 'en' ? 'en' : 'es';

  const hydrate = useProgressStore((state) => state.hydrate);
  const tricks = useProgressStore((state) => state.tricks);

  const combos = useComboStore((state) => state.combos);
  const hydrateCombos = useComboStore((state) => state.hydrate);
  const addCombo = useComboStore((state) => state.addCombo);

  const [length, setLength] = useState<ComboLength>('medium');
  // [] significa "Todas" (sin restriccion); un subconjunto es el filtro explicito.
  const [sections, setSections] = useState<Section[]>([]);
  const [maxDifficulty, setMaxDifficulty] = useState<DifficultyChoice>('any');
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<GeneratorState>({ status: 'idle' });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    hydrate();
    hydrateCombos();
  }, [hydrate, hydrateCombos]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Se considera "conocido" solo el truco marcado como aprendido; "quiero" o "en
  // progreso" no habilitan el generador.
  const learnedIds = useMemo(
    () =>
      Object.entries(tricks)
        .filter(([, status]) => status === 'learned')
        .map(([id]) => id),
    [tricks],
  );

  useEffect(() => {
    if (learnedIds.length === 0) {
      abortRef.current?.abort();
      setState({ status: 'idle' });
    }
  }, [learnedIds.length]);

  const allSectionsSelected = sections.length === 0;

  const toggleSection = (section: Section): void => {
    setSections((current) => {
      const next = current.includes(section)
        ? current.filter((item) => item !== section)
        : SECTIONS.filter((item) => item === section || current.includes(item));
      // Con las 5 individuales marcadas, vuelve "Todas" y las individuales se desmarcan.
      return next.length === SECTIONS.length ? [] : next;
    });
  };

  const toggleAll = (): void => {
    setSections([]);
  };

  const runGeneration = (): void => {
    if (learnedIds.length === 0) {
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const rotation = attempt;
    setAttempt((value) => value + 1);
    setState({ status: 'loading' });

    generateCombo(
      {
        knownTrickIds: rotate(learnedIds, rotation),
        length,
        locale,
        ...(allSectionsSelected ? {} : { sections }),
        ...(maxDifficulty === 'any' ? {} : { maxDifficulty: Number(maxDifficulty) }),
      },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data });
        }
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
  };

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

  const atSaveLimit = combos.length >= COMBO_MAX_SAVED;

  const save = (): void => {
    if (state.status !== 'success') {
      return;
    }
    const saved = addCombo({
      title: t('savedDefaultTitle', { number: combos.length + 1 }),
      status: 'draft',
      steps: state.data.steps.map((step) => ({
        trickId: step.trickId,
        name: step.name,
        section: step.section,
        difficulty: step.difficulty,
      })),
    });
    if (saved) {
      toast.success(t('saved'));
    } else {
      toast.error(t('saveLimitReached'));
    }
  };

  if (learnedIds.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="tb-display text-2xl text-base-content">{t('heading')}</h2>
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
        <h2 className="tb-display text-2xl text-base-content">{t('heading')}</h2>
        <p className="max-w-2xl text-sm text-base-content/70">{t('intro')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
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

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-base-content">{t('section')}</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${CHIP_BASE} ${allSectionsSelected ? CHIP_ON : CHIP_OFF}`}
            aria-pressed={allSectionsSelected}
            onClick={toggleAll}
          >
            {t('sections.all')}
          </button>
          {SECTIONS.map((value) => {
            const active = sections.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${CHIP_BASE} ${active ? CHIP_ON : CHIP_OFF}`}
                aria-pressed={active}
                onClick={() => toggleSection(value)}
              >
                {tNav(SECTION_KEYS[value])}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`btn btn-primary btn-sm ${FOCUS_CLASS}`}
          onClick={runGeneration}
          disabled={state.status === 'loading'}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {state.status === 'loading'
            ? t('generating')
            : state.status === 'idle'
              ? t('generate')
              : t('regenerate')}
        </button>
        {state.status === 'success' && state.data.steps.length >= 2 ? (
          <>
            <button
              type="button"
              className={`btn btn-outline btn-sm ${FOCUS_CLASS}`}
              onClick={() => void copy()}
            >
              <Copy aria-hidden="true" className="size-4" />
              {t('copy')}
            </button>
            <button
              type="button"
              className={`btn btn-outline btn-sm ${FOCUS_CLASS}`}
              onClick={save}
              disabled={atSaveLimit}
              title={atSaveLimit ? t('saveLimitReached') : undefined}
            >
              <Save aria-hidden="true" className="size-4" />
              {t('save')}
            </button>
          </>
        ) : null}
      </div>

      {state.status === 'success' && atSaveLimit ? (
        <p className="text-sm text-base-content/70" role="status">
          {t('saveLimitReached')}
        </p>
      ) : null}

      {state.status === 'idle' ? (
        <p className="text-sm text-base-content/70">{t('idleDescription')}</p>
      ) : null}

      {state.status === 'loading' ? <LoadingState label={t('generating')} /> : null}

      {state.status === 'error' ? (
        <ErrorState
          title={t('errorTitle')}
          description={errorText}
          action={
            <button
              type="button"
              className={`btn btn-primary btn-sm ${FOCUS_CLASS}`}
              onClick={runGeneration}
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
                  className="tb-surface flex flex-wrap items-center gap-3 p-3"
                >
                  <span className="badge badge-neutral">
                    {t('stepLabel', { number: index + 1 })}
                  </span>
                  <Link
                    href={`/tricks/${sectionSlug}/${step.trickId}`}
                    className="link link-hover font-medium transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {step.name}
                  </Link>
                  {step.difficulty !== null ? (
                    <span
                      className={`badge tb-badge tb-difficulty-${step.difficulty}`}
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
