// Secciones de trucos derivadas de la clasificacion de Loopkicks. La lista espeja
// TRICK_SECTIONS de @tricking/db; los literales coinciden para que los tipos sean
// compatibles al pasar la seccion a las consultas del backend.

export const SECTIONS = ['vertical-kicks', 'backward', 'forward', 'inside', 'outside'] as const;

export type Section = (typeof SECTIONS)[number];

export const DEFAULT_SECTION: Section = 'vertical-kicks';

export function isSection(value: string): value is Section {
  return (SECTIONS as readonly string[]).includes(value);
}

// Clave de traduccion dentro del namespace `nav` (common.json).
export const SECTION_NAV_KEY: Record<Section, string> = {
  'vertical-kicks': 'verticalKicks',
  backward: 'backward',
  forward: 'forward',
  inside: 'inside',
  outside: 'outside',
};
