import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

// Estado vacio reutilizable. Superficie del sistema visual, icono en un disco
// suave y titular en tipografia display. No introduce textos nuevos.
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="tb-surface flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full border border-border bg-base-300/60 text-primary"
      >
        <Inbox className="size-7" />
      </span>
      <h2 className="tb-display text-xl text-base-content sm:text-2xl">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
