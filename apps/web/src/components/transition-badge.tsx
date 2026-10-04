'use client';

import { useTranslations } from 'next-intl';

import { normalizeTransitionGroup, transitionGroupColorClass } from '@/lib/transition-groups';

interface TransitionBadgeProps {
  group: string | null;
}

export function TransitionBadge({ group }: TransitionBadgeProps) {
  const t = useTranslations('transitions');
  const bucket = normalizeTransitionGroup(group);
  const label = t(`groups.${bucket}`);

  return (
    <span
      className={`badge tb-badge ${transitionGroupColorClass(bucket)}`}
      aria-label={t('badgeAria', { group: label })}
    >
      {label}
    </span>
  );
}
