import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

type ErrorStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

// Estado de error reutilizable. role="alert" para anuncio accesible y superficie
// del sistema visual con acento en el color de error del tema.
export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-box border border-error/30 bg-error/10 px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full border border-error/30 bg-base-200/60 text-error"
      >
        <TriangleAlert className="size-7" />
      </span>
      <h2 className="tb-display text-xl text-base-content sm:text-2xl">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
