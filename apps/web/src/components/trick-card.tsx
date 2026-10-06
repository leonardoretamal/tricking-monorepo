'use client';

import { TrickCard as BaseTrickCard, type TrickCardCategory } from '@tricking/ui';
import { useLocale } from 'next-intl';

import { ProgressControl } from '@/components/progress-control';

// Envoltorio de la tarjeta de truco a nivel app: reutiliza la TrickCard de
// packages/ui y le suma el control de progreso (Fase 21). El control va en el pie de
// la propia tarjeta, fuera del enlace del titulo, para no anidar botones dentro de un
// ancla. El href se localiza con el locale actual para que el enlace estirado del
// titulo navegue a la ruta con prefijo de idioma.
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
  const locale = useLocale();
  const localizedHref = href.startsWith('/') ? `/${locale}${href}` : href;

  return (
    <BaseTrickCard
      href={localizedHref}
      name={name}
      description={description}
      difficulty={difficulty}
      difficultyLabel={difficultyLabel}
      categories={categories}
      footer={<ProgressControl trickId={trickId} compact />}
    />
  );
}
