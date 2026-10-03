import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

type ErrorStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-box border border-error/30 bg-error/10 px-6 py-10 text-center"
    >
      <TriangleAlert aria-hidden="true" className="size-8 text-error" />
      <h2 className="text-lg font-semibold text-base-content">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
