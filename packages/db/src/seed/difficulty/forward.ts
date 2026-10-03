import type { SectionDifficulty } from './types';

// Fase 5: forward tricks. Los 20 trucos de la seccion forward de Loopkicks.
// Regla de la propuesta inicial (ajustable por el usuario):
// - Base por giro o mortal: aerial, front tuck, layout, pike y punch front -> 2;
//   front full, weber y gainer -> 3; doble full o doble giro -> 5; roll o
//   handspring -> 1; cartwheel -> 2; janitor (base butterfly) -> 2.
// - Variante compuesta +1 (knife, double, gyro, hyper, turbo, shuriken, feilong,
//   sidekick, rodeo, paraknife, wackknife, hawkeye, twist, doubleleg, round, switch).
// - Tope 5.
export const forward: SectionDifficulty = {
  '360CartwheelTwist': 3,
  diveRoll: 1,
  frontAxe: 2,
  frontHalf: 3,
  frontHandspring: 1,
  frontPike: 2,
  frontTuck: 2,
  frontXOut: 2,
  handcuff360DiveRoll: 3,
  janitorFlip: 2,
  janitorScissorTwist: 3,
  janitorTwist: 3,
  rodeoJanitorTwist: 4,
  russianFront: 2,
  supermanFront: 2,
  webster: 3,
  websterAxe: 3,
  websterHalf: 3,
  websterHyperhook: 4,
  websterXOut: 3,
};
