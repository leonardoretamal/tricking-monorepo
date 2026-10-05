export interface RelatedItem {
  href: string;
  label: string;
  badge?: string;
}

export interface RelatedItemsProps {
  title: string;
  items: RelatedItem[];
  emptyLabel: string;
  ariaLabel?: string;
}

// Lista de enlaces relacionados reutilizable en las vistas de detalle (Fase 15). No
// importa next-intl: el llamador entrega los `href` ya localizados, igual que TrickCard.
export function RelatedItems({ title, items, emptyLabel, ariaLabel }: RelatedItemsProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-base-content/60">{emptyLabel}</p>
      ) : (
        <nav aria-label={ariaLabel ?? title}>
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li key={item.href} className="flex items-center gap-1">
                <a
                  href={item.href}
                  className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {item.label}
                </a>
                {item.badge ? (
                  <span className="badge badge-sm tb-badge border border-border bg-base-300 text-base-content/80">
                    {item.badge}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
