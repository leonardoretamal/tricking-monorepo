// Secciones de trucos derivadas de la clasificacion de Loopkicks. La lista espeja
// TRICK_SECTIONS de @tricking/db; los literales coinciden para que los tipos sean
// compatibles al pasar la seccion a las consultas del backend.

export const SECTIONS = ['vertical-kicks', 'backward', 'forward', 'inside', 'outside'] as const;

export type Section = (typeof SECTIONS)[number];

export const DEFAULT_SECTION: Section = 'vertical-kicks';

// Subfiltros por seccion, con los mismos slugs que Loopkicks usa en su sitio. El
// listado general no muestra subfiltro: solo aplica dentro de una seccion.
export const SUBCATEGORIES = {
  'vertical-kicks': ['pop', 'cheat', 'swing'],
  backward: ['backflip', 'gainer', 'full', 'corkscrew'],
  forward: ['frontflip', 'webster', 'janitor'],
  inside: ['butterfly', 'aerial', 'masterswing', 'wrap', 'tak'],
  outside: ['raiz', 'doubleleg', 'spyder', 'lotus', 'sideflip'],
} as const satisfies Record<Section, readonly string[]>;

export type Subcategory = (typeof SUBCATEGORIES)[Section][number];

// Todos los slugs en un solo arreglo, para validar el parametro sin conocer la seccion.
export const ALL_SUBCATEGORIES: readonly Subcategory[] = Object.values(SUBCATEGORIES).flat();

export function isSection(value: string): value is Section {
  return (SECTIONS as readonly string[]).includes(value);
}

export function isSubcategory(value: string): value is Subcategory {
  return (ALL_SUBCATEGORIES as readonly string[]).includes(value);
}

export function subcategoriesForSection(section: Section): readonly Subcategory[] {
  return SUBCATEGORIES[section];
}

export function isSubcategoryForSection(section: Section, value: string): boolean {
  return (SUBCATEGORIES[section] as readonly string[]).includes(value);
}
