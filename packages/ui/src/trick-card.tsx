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
}

export function TrickCard({
  name,
  description,
  difficulty,
  difficultyLabel,
  categories,
  href,
}: TrickCardProps) {
  const hasBadges = difficulty !== undefined || (categories?.length ?? 0) > 0;

  return (
    <article className="card h-full border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">
          {href ? (
            <a
              href={href}
              className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {name}
            </a>
          ) : (
            name
          )}
        </h2>
        {description ? (
          <p className="line-clamp-2 text-sm text-base-content/70">{description}</p>
        ) : null}
        {hasBadges ? (
          <div className="card-actions flex-wrap items-center gap-2">
            {difficulty !== undefined ? (
              <span
                className={`badge tb-badge tb-difficulty-${difficulty}`}
                aria-label={difficultyLabel}
                title={difficultyLabel}
              >
                {difficulty}
              </span>
            ) : null}
            {categories?.map((category) => (
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
    </article>
  );
}
