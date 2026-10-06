import type { ReactNode } from 'react';

import { normalizeTransitionGroup, type TransitionGroupBucket } from '@/lib/transition-groups';

interface TransitionGroupDiagramProps {
  group: string | null;
  label: string;
  caption: string;
}

const GROUND_Y = 88;
const FOOT_RADIUS = 12;

function foot(cx: number, cy: number, dashed = false): ReactNode {
  return (
    <circle
      key={`${cx}-${cy}`}
      cx={cx}
      cy={cy}
      r={FOOT_RADIUS}
      fill={dashed ? 'none' : 'currentColor'}
      stroke="currentColor"
      strokeWidth={dashed ? 2 : 0}
      strokeDasharray={dashed ? '4 3' : undefined}
    />
  );
}

// El modelo de transiciones es conceptual, no pares origen-destino. El diagrama
// representa cuantos pies tocan el suelo al aterrizar y al despegar segun el grupo:
// unified son dos y dos, singular es uno, sequential es uno despues del otro.
function feetFor(bucket: TransitionGroupBucket): { landing: ReactNode[]; takeoff: ReactNode[] } {
  if (bucket === 'unified') {
    return { landing: [foot(58, 72), foot(86, 72)], takeoff: [foot(154, 72), foot(182, 72)] };
  }
  if (bucket === 'sequential') {
    return { landing: [foot(54, 78), foot(84, 62)], takeoff: [foot(156, 62), foot(186, 78)] };
  }
  if (bucket === 'singular') {
    return { landing: [foot(70, 72)], takeoff: [foot(170, 72)] };
  }
  return { landing: [foot(70, 72, true)], takeoff: [foot(170, 72, true)] };
}

export function TransitionGroupDiagram({ group, label, caption }: TransitionGroupDiagramProps) {
  const bucket = normalizeTransitionGroup(group);
  const { landing, takeoff } = feetFor(bucket);

  return (
    <figure className="tb-surface flex flex-col items-center gap-3 p-4">
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 240 104"
        className="h-24 w-full max-w-sm text-primary"
        fill="none"
      >
        <line
          x1="20"
          y1={GROUND_Y}
          x2="220"
          y2={GROUND_Y}
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {landing}
        {takeoff}
        <line
          x1="100"
          y1="40"
          x2="132"
          y2="40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="142,40 130,34 130,46" fill="currentColor" />
      </svg>
      <figcaption className="text-center text-xs text-base-content/70">{caption}</figcaption>
    </figure>
  );
}
