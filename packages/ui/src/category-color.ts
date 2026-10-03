// Colores de categoria segun docs/docs-agents/design.md. Las clases viven en el
// globals.css de apps/web y toman el color de las variables del tema.

export type CategoryColor = 'kicks' | 'flips' | 'twists' | 'transitions' | 'basics';

// Solo se muestran como badge las categorias con significado de tipo de truco.
// Las de direccion (BACKWARD, FORWARD, INSIDE, OUTSIDE) ya las representa la seccion
// y las de conteo (SINGLE, DOUBLE, ...) no aportan como badge.
const CATEGORY_BADGE_COLOR: Record<string, CategoryColor> = {
  VERT_KICK: 'kicks',
  TWIST: 'twists',
  FLIP: 'flips',
  GROUNDWORK: 'basics',
  VARIATION: 'transitions',
};

export function categoryBadgeColor(slug: string): CategoryColor | null {
  return CATEGORY_BADGE_COLOR[slug] ?? null;
}

export function categoryColorClass(color: CategoryColor): string {
  return `tb-cat-${color}`;
}
