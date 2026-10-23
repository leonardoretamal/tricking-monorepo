'use client';

import { useCallback, useEffect, useRef } from 'react';

import { isSection } from '@/lib/sections';
import {
  TRICKS_VIEW_VERSION,
  loadTricksViewState,
  saveTricksViewState,
  type TricksViewFilters,
  type TricksViewState,
} from '@/lib/tricks-view-state';

// Recuerda filtros y posicion del listado de trucos entre la ida al detalle y la vuelta.
// Lee y escribe solo por el wrapper de storage; el estado es por ruta y caduca a los 30 dias.

const SAVE_DEBOUNCE_MS = 300;
const SCROLL_RESTORE_ATTEMPTS = 3;
const SCROLL_RESTORE_TOLERANCE_PX = 2;

const FILTER_QUERY_KEYS = [
  'q',
  'section',
  'sub',
  'difficulty',
  'sort',
  'page',
  'pageSize',
] as const;

// Acepta el elemento o la referencia del contenedor. La referencia es preferible cuando el
// elemento aparece despues del primer render (listado virtualizado), porque se resuelve en
// el momento de leer, ya con el DOM montado.
export type TricksViewScrollTarget =
  HTMLElement | { readonly current: HTMLElement | null } | null | undefined;

export interface UseTricksViewStateOptions {
  pathname: string;
  filters: TricksViewFilters;
  applyFilter: (patch: Partial<TricksViewFilters>) => void;
  queryReady: boolean;
  scrollElement?: TricksViewScrollTarget;
}

function resolveScrollElement(target: TricksViewScrollTarget): HTMLElement | null {
  if (target === null || target === undefined) {
    return null;
  }
  if ('current' in target) {
    return target.current;
  }
  return target;
}

// El listado virtualizado tiene su propio contenedor con scroll; el listado normal usa el
// scroll de la ventana. Se distingue por el desborde real del elemento.
function isScrollContainer(element: HTMLElement | null): element is HTMLElement {
  return element !== null && element.scrollHeight > element.clientHeight + 1;
}

function readScroll(target: TricksViewScrollTarget): number {
  const element = resolveScrollElement(target);
  if (isScrollContainer(element)) {
    return element.scrollTop;
  }
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.scrollY;
}

function writeScroll(target: TricksViewScrollTarget, top: number): void {
  const element = resolveScrollElement(target);
  if (isScrollContainer(element)) {
    element.scrollTop = top;
    return;
  }
  if (typeof window !== 'undefined') {
    window.scrollTo({ top, behavior: 'auto' });
  }
}

function hasOwnFiltersInUrl(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return FILTER_QUERY_KEYS.some((key) => params.has(key));
}

function toFilterPatch(state: TricksViewState): Partial<TricksViewFilters> {
  const patch: Partial<TricksViewFilters> = {
    sort: state.sort,
    page: state.page,
    pageSize: state.pageSize,
  };
  if (state.q !== undefined && state.q !== '') {
    patch.q = state.q;
  }
  if (state.section !== undefined && isSection(state.section)) {
    patch.section = state.section;
  }
  if (state.sub !== undefined && state.sub !== '') {
    patch.sub = state.sub;
  }
  if (state.difficulty !== undefined) {
    patch.difficulty = state.difficulty;
  }
  return patch;
}

function filterPatchDiffers(
  patch: Partial<TricksViewFilters>,
  current: TricksViewFilters,
): boolean {
  return (
    (patch.q ?? '') !== (current.q ?? '') ||
    (patch.section ?? '') !== (current.section ?? '') ||
    (patch.sub ?? '') !== (current.sub ?? '') ||
    (patch.difficulty ?? -1) !== (current.difficulty ?? -1) ||
    (patch.sort ?? '') !== current.sort ||
    (patch.page ?? 0) !== current.page ||
    (patch.pageSize ?? 0) !== current.pageSize
  );
}

export function useTricksViewState({
  pathname,
  filters,
  applyFilter,
  queryReady,
  scrollElement,
}: UseTricksViewStateOptions): void {
  const filtersRef = useRef(filters);
  const pathnameRef = useRef(pathname);
  const scrollTargetRef = useRef<TricksViewScrollTarget>(scrollElement);
  const queryReadyRef = useRef(queryReady);
  const restoredRef = useRef(false);
  const pendingScrollRef = useRef<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstFiltersRunRef = useRef(true);

  useEffect(() => {
    filtersRef.current = filters;
    pathnameRef.current = pathname;
    scrollTargetRef.current = scrollElement;
    queryReadyRef.current = queryReady;
  }, [filters, pathname, scrollElement, queryReady]);

  const persist = useCallback(() => {
    const current = filtersRef.current;
    // Mientras hay una restauracion pendiente se conserva la posicion guardada: si la
    // escritura llega antes de que la lista pinte, leer el scroll real daria cero y
    // borraria la posicion que se queria recuperar.
    const pendingScroll = pendingScrollRef.current;
    const state: TricksViewState = {
      version: TRICKS_VIEW_VERSION,
      pathname: pathnameRef.current,
      q: current.q,
      section: current.section,
      sub: current.sub,
      difficulty: current.difficulty,
      sort: current.sort,
      page: current.page,
      pageSize: current.pageSize,
      scrollY: pendingScroll ?? readScroll(scrollTargetRef.current),
      savedAt: Date.now(),
    };
    saveTricksViewState(state);
  }, []);

  const scheduleSave = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      persist();
    }, SAVE_DEBOUNCE_MS);
  }, [persist]);

  // Restaura una sola vez por montaje. Si la URL ya trae filtros propios (por ejemplo al
  // volver atras) manda la URL y no se pisa; el scroll solo se restaura cuando los filtros
  // guardados coinciden con los de la URL.
  useEffect(() => {
    if (restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    if (typeof window === 'undefined') {
      return;
    }
    const saved = loadTricksViewState(pathname);
    if (saved === null) {
      return;
    }
    const patch = toFilterPatch(saved);
    const sameFilters = !filterPatchDiffers(patch, filtersRef.current);
    if (hasOwnFiltersInUrl()) {
      if (sameFilters) {
        pendingScrollRef.current = saved.scrollY;
      }
      return;
    }
    if (!sameFilters) {
      applyFilter(patch);
    }
    pendingScrollRef.current = saved.scrollY;
    // applyFilter cambia con cada render; el guard de restoredRef evita bucles.
  }, [pathname, applyFilter]);

  // Restaura el scroll recien cuando la lista ya tiene datos. El primer frame confirma que
  // no arranco una recarga (por ejemplo al reaplicar filtros) para no saltar con la lista
  // anterior; despues hace hasta dos reintentos cortos, sin esperas fijas.
  useEffect(() => {
    if (!queryReady) {
      return;
    }
    const target = pendingScrollRef.current;
    if (target === null) {
      return;
    }

    let attempts = 0;
    let frame = 0;
    const apply = () => {
      attempts += 1;
      writeScroll(scrollElement, target);
      const current = readScroll(scrollElement);
      if (
        attempts < SCROLL_RESTORE_ATTEMPTS &&
        target > 0 &&
        Math.abs(current - target) > SCROLL_RESTORE_TOLERANCE_PX
      ) {
        frame = requestAnimationFrame(apply);
      }
    };
    frame = requestAnimationFrame(() => {
      if (!queryReadyRef.current || pendingScrollRef.current === null) {
        return;
      }
      pendingScrollRef.current = null;
      apply();
    });
    return () => cancelAnimationFrame(frame);
  }, [queryReady, scrollElement]);

  // Guarda en cada cambio real de filtros. El primer render solo registra el estado
  // inicial: todavia puede haber una restauracion pendiente.
  useEffect(() => {
    if (firstFiltersRunRef.current) {
      firstFiltersRunRef.current = false;
      return;
    }
    scheduleSave();
  }, [
    filters.q,
    filters.section,
    filters.sub,
    filters.difficulty,
    filters.sort,
    filters.page,
    filters.pageSize,
    scheduleSave,
  ]);

  // El scroll no burbujea, pero la fase de captura en window alcanza a los contenedores
  // internos (listado virtualizado); ademas se escucha el elemento cuando ya existe.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleScroll = () => scheduleSave();
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    const element = resolveScrollElement(scrollElement);
    if (element !== null) {
      element.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
      if (element !== null) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollElement, scheduleSave]);

  // Al desmontar (por ejemplo al entrar al detalle) se vuelca la escritura pendiente para
  // no perder la posicion si el usuario se fue antes del debounce.
  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        persist();
      }
    },
    [persist],
  );
}
