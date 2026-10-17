'use client';

import type { HowToDetail } from '@tricking/shared';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

// Render del "como se hace" detallado (contrato HowToDetail v1, Fase 45). Muestra el
// resumen, la preparacion, los ejes del cuerpo, el paso a paso, el aterrizaje, los errores,
// los tips y el glosario. Si el truco no tiene detalle estructurado, cae al resumen de
// texto plano de siempre para no dejar la seccion vacia.

// Secciones que el detalle puede omitir cuando ya se muestran en otro bloque de la pagina
// (por ejemplo, el resumen arriba junto al video), para no repetir contenido.
export type TrickHowToSection = 'summary' | 'before';

interface TrickHowToProps {
  detail: HowToDetail | null | undefined;
  fallback: string | null;
  omit?: ReadonlyArray<TrickHowToSection>;
}

const BODY_KEYS = ['feet', 'legs', 'arms', 'gaze', 'torso'] as const;

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="tb-eyebrow">{title}</h3>
      {children}
    </section>
  );
}

export function TrickHowTo({ detail, fallback, omit = [] }: TrickHowToProps) {
  const t = useTranslations('tricks');

  if (detail === null || detail === undefined) {
    return (
      <p className="text-base leading-relaxed text-base-content/80">
        {fallback ?? t('detail.noHowTo')}
      </p>
    );
  }

  const showSummary = !omit.includes('summary');
  const showBefore = !omit.includes('before');
  const hasMistakes = detail.mistakes.length > 0;
  const hasTips = detail.tips.length > 0;
  const hasTerms = detail.terms.length > 0;

  return (
    <div className="flex flex-col gap-7">
      {showSummary ? (
        <p className="text-base leading-relaxed text-base-content/90">{detail.summary}</p>
      ) : null}

      {showBefore ? (
        <Block title={t('detail.howToSections.before')}>
          <dl className="flex flex-col gap-3 rounded-box border border-border bg-base-300/40 p-4">
            <div className="flex flex-col gap-0.5">
              <dt className="text-sm font-semibold text-base-content">
                {t('detail.howToSections.prerequisites')}
              </dt>
              <dd className="text-sm leading-relaxed text-base-content/75">
                {detail.before.prerequisites}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-sm font-semibold text-base-content">
                {t('detail.howToSections.space')}
              </dt>
              <dd className="text-sm leading-relaxed text-base-content/75">
                {detail.before.space}
              </dd>
            </div>
          </dl>
        </Block>
      ) : null}

      <Block title={t('detail.howToSections.body')}>
        <dl className="grid gap-4 sm:grid-cols-2">
          {BODY_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-0.5">
              <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                {t(`detail.howToSections.${key}`)}
              </dt>
              <dd className="text-sm leading-relaxed text-base-content/80">{detail.body[key]}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title={t('detail.howToSections.steps')}>
        <ol className="flex flex-col gap-4">
          {detail.steps.map((step, index) => (
            <li key={`${step.title}-${String(index)}`} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-sm font-semibold text-primary"
              >
                {index + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-medium text-base-content">
                  <span className="sr-only">
                    {`${t('detail.howToSections.stepLabel', { number: index + 1 })}: `}
                  </span>
                  {step.title}
                </p>
                <p className="text-sm leading-relaxed text-base-content/80">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block title={t('detail.howToSections.landing')}>
        <p className="text-sm leading-relaxed text-base-content/80">{detail.landing}</p>
      </Block>

      {hasMistakes ? (
        <Block title={t('detail.howToSections.mistakes')}>
          <ul className="flex flex-col gap-2">
            {detail.mistakes.map((mistake) => (
              <li key={mistake} className="flex gap-2 text-sm leading-relaxed text-base-content/80">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-error" />
                {mistake}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {hasTips ? (
        <Block title={t('detail.howToSections.tips')}>
          <ul className="flex flex-col gap-2">
            {detail.tips.map((tip) => (
              <li key={tip} className="flex gap-2 text-sm leading-relaxed text-base-content/80">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-secondary"
                />
                {tip}
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      {hasTerms ? (
        <Block title={t('detail.howToSections.terms')}>
          <dl className="flex flex-col gap-3">
            {detail.terms.map((term) => (
              <div key={term.term} className="flex flex-col gap-0.5">
                <dt className="text-sm font-semibold text-base-content">{term.term}</dt>
                <dd className="text-sm leading-relaxed text-base-content/75">{term.meaning}</dd>
              </div>
            ))}
          </dl>
        </Block>
      ) : null}
    </div>
  );
}
