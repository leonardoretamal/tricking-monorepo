import type { TrickFilters } from '@/components/trick-browser';
import { isSection, isSubcategory, isSubcategoryForSection, type Section } from './sections';

const SORTS = ['name-asc', 'name-desc', 'difficulty-asc', 'difficulty-desc'] as const;
const PAGE_SIZES = [24, 48, 100];
const DEFAULT_PAGE_SIZE = 24;

// Los filtros parseados agregan `sub` (subfiltro de la seccion). El tipo vive aca para no
// depender de que `TrickFilters` ya declare el campo.
export type ParsedTrickFilters = TrickFilters & { sub?: string };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIntInRange(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

// El subfiltro solo es valido si existe y, cuando se conoce la seccion, si pertenece a
// ella. En las paginas de seccion la seccion viene de la ruta y llega como `sectionHint`.
function parseSubcategory(
  value: string | undefined,
  section: Section | undefined,
): string | undefined {
  if (value === undefined || !isSubcategory(value)) {
    return undefined;
  }
  if (section === undefined) {
    return value;
  }
  return isSubcategoryForSection(section, value) ? value : undefined;
}

// Normaliza los searchParams de la URL a filtros validos. Un valor invalido cae al
// valor por defecto en vez de romper la vista.
export function parseTrickFilters(
  searchParams: Record<string, string | string[] | undefined>,
  sectionHint?: Section,
): ParsedTrickFilters {
  const qRaw = first(searchParams.q)?.trim();
  const sectionRaw = first(searchParams.section);
  const subRaw = first(searchParams.sub);
  const difficultyRaw = first(searchParams.difficulty);
  const sortRaw = first(searchParams.sort);
  const pageSizeRaw = parseIntInRange(first(searchParams.pageSize), 1, 100, DEFAULT_PAGE_SIZE);
  const section = sectionRaw !== undefined && isSection(sectionRaw) ? sectionRaw : undefined;

  return {
    q: qRaw && qRaw !== '' ? qRaw : undefined,
    section,
    sub: parseSubcategory(subRaw, section ?? sectionHint),
    difficulty:
      difficultyRaw !== undefined && /^[0-5]$/.test(difficultyRaw)
        ? Number(difficultyRaw)
        : undefined,
    sort: SORTS.find((candidate) => candidate === sortRaw) ?? 'name-asc',
    page: parseIntInRange(first(searchParams.page), 1, 100000, 1),
    pageSize: PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE,
  };
}
