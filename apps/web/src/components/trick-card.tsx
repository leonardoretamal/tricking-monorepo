'use client';

import { TrickCard as BaseTrickCard, type TrickCardCategory } from '@tricking/ui';

import { ProgressControl } from '@/components/progress-control';
import { Link } from '@/i18n/navigation';

// Envoltorio de la tarjeta de truco a nivel app: reutiliza la TrickCard de
// packages/ui y le suma el control de progreso (Fase 21). El control vive FUERA
// del enlace de navegacion para no anidar botones dentro de un ancla.
export interface TrickCardProps {
  trickId: string;
  href: string;
  name: string;
  description?: string;
  difficulty?: number;
  difficultyLabel?: string;
  categories?: TrickCardCategory[];
}

export function TrickCard({
  trickId,
  href,
  name,
  description,
  difficulty,
  difficultyLabel,
  categories,
}: TrickCardProps) {
  return (
    <div className="flex h-full flex-col gap-2">
      <Link
        href={href}
        className="block flex-1 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <BaseTrickCard
          name={name}
          description={description}
          difficulty={difficulty}
          difficultyLabel={difficultyLabel}
          categories={categories}
        />
      </Link>
      <ProgressControl trickId={trickId} compact />
    </div>
  );
}
