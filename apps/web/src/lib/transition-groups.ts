// Grupos de transiciones segun la clasificacion conceptual de Loopkicks. El backend
// devuelve unified, singular o sequential (o null); "other" agrupa las que no tienen
// grupo para no ocultar contenido del listado.

export const TRANSITION_GROUPS = ['unified', 'singular', 'sequential'] as const;

export type TransitionGroup = (typeof TRANSITION_GROUPS)[number];

export const TRANSITION_GROUP_BUCKETS = ['unified', 'singular', 'sequential', 'other'] as const;

export type TransitionGroupBucket = (typeof TRANSITION_GROUP_BUCKETS)[number];

export function normalizeTransitionGroup(group: string | null): TransitionGroupBucket {
  return group === 'unified' || group === 'singular' || group === 'sequential' ? group : 'other';
}

const GROUP_COLOR_CLASS: Record<TransitionGroupBucket, string> = {
  unified: 'tb-cat-transitions',
  singular: 'tb-cat-kicks',
  sequential: 'tb-cat-twists',
  other: 'tb-cat-basics',
};

export function transitionGroupColorClass(bucket: TransitionGroupBucket): string {
  return GROUP_COLOR_CLASS[bucket];
}
