import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-box border border-border bg-base-200 px-6 py-12 text-center">
      <Inbox aria-hidden="true" className="size-8 text-muted" />
      <h2 className="text-lg font-semibold text-base-content">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
