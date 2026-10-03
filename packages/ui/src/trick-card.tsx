export interface TrickCardProps {
  name: string;
  description?: string;
  difficulty?: number;
  categories?: string[];
  href?: string;
  locale?: string;
}

export function TrickCard({ name, description, difficulty, categories, href }: TrickCardProps) {
  const hasBadges = difficulty !== undefined || (categories?.length ?? 0) > 0;

  return (
    <article className="card border border-base-300 bg-base-100 shadow-sm">
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
          <div className="card-actions flex-wrap gap-2">
            {difficulty !== undefined ? (
              <span className="badge badge-outline">{difficulty}</span>
            ) : null}
            {categories?.map((category) => (
              <span key={category} className="badge badge-outline">
                {category}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
