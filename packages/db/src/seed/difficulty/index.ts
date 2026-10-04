import { backward } from './backward';
import { forward } from './forward';
import { inside } from './inside';
import { outside } from './outside';
import type { SectionDifficulty } from './types';
import { verticalKicks } from './vertical-kicks';

// Dificultad combinada de todas las secciones curadas. Gana el ultimo valor si un
// truco apareciera en dos secciones (no deberia: la seccion es unica por truco).
export const DIFFICULTY_BY_TRICK: SectionDifficulty = {
  ...verticalKicks,
  ...backward,
  ...forward,
  ...inside,
  ...outside,
};
