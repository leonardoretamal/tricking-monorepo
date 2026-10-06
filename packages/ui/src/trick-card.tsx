import type { ReactNode } from 'react';

import { categoryColorClass, type CategoryColor } from './category-color';

export interface TrickCardCategory {
  label: string;
  color?: CategoryColor;
}

export interface TrickCardProps {
  name: string;
  description?: string;
  difficulty?: number;
  difficultyLabel?: string;
  categories?: TrickCardCategory[];
  href?: string;
  /**
   * Ranura opcional para acciones de la tarjeta (por ejemplo, el control de progreso).
   * Se renderiza en un pie separado por un borde, fuera del enlace del titulo, para no
   * anidar botones dentro de un ancla.
   */
  footer?: ReactNode;
}

// Tarjeta de truco del catalogo. Superficie del design system, acento de color por
// categoria, badges de dificultad y categoria, y nombre con peso display. Cuando hay
// `href`, el titulo es un enlace que cubre toda la tarjeta (patron de enlace estirado)
// y el pie opcional queda por encima para seguir siendo operable.
export function TrickCard({
  name,
  description,
  difficulty,
  difficultyLabel,
  categories,
  href,
  footer,
}: TrickCardProps) {
  const accent = categories?.find((category) => category.color !== undefined)?.color;

  return (
    <article className="tb-surface tb-surface-hover relative flex h-full flex-col overflow-hidden">
      {accent ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-1 ${categoryColorClass(accent)} bg-current`}
        />
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="tb-display text-xl leading-none text-base-content">
            {href ? (
              <a
                href={href}
                className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {name}
              </a>
            ) : (
              name
            )}
          </h2>
          {difficulty !== undefined ? (
            <span
              className={`badge tb-badge tb-difficulty-${difficulty}`}
              aria-label={difficultyLabel ?? String(difficulty)}
              title={difficultyLabel ?? String(difficulty)}
            >
              {difficulty}
            </span>
          ) : null}
        </div>

        {description ? (
          <p className="line-clamp-2 text-sm text-base-content/70">{description}</p>
        ) : null}

        {categories && categories.length > 0 ? (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            {categories.map((category) => (
              <span
                key={category.label}
                className={
                  category.color
                    ? `badge tb-badge ${categoryColorClass(category.color)}`
                    : 'badge badge-outline'
                }
              >
                {category.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {footer ? (
        <div className="relative z-10 border-t border-border bg-base-300/40 px-4 py-2">
          {footer}
        </div>
      ) : null}
    </article>
  );
}
