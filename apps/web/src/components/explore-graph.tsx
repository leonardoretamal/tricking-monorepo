'use client';

import { useQuery } from '@tanstack/react-query';
import { ONE_DAY_MS, SEVEN_DAYS_MS } from '@tricking/shared';
import { EmptyState, ErrorState, LoadingState, TrickListSkeleton } from '@tricking/ui';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { fetchGraph } from '@/lib/graph-api';
import { type GraphEdgeItem, type GraphFilters, type GraphNodeItem } from '@/lib/graph-schemas';
import { SECTIONS, isSection } from '@/lib/sections';
import { ExploreFilters } from './explore-filters';
import type { GraphCanvasEdge, GraphCanvasNode } from './explore-graph-canvas';
import { ExploreNodePanel } from './explore-node-panel';

// Grafo navegable de la Explore Page. Los nodos son trucos con una disposicion estable
// por seccion (columnas), las aristas salen del backend y el panel lateral muestra el
// resumen sin cambiar de ruta. El render es 3D con three.js; el lienzo se carga solo en
// el cliente (next/dynamic) para no meter three en el resto de las paginas. La cache del
// grafo es agresiva: se persiste con el persister de localStorage del monorepo.

// three.js se carga unicamente cuando la pagina Explorar monta el lienzo.
const ExploreGraphCanvas = dynamic(() => import('./explore-graph-canvas'), { ssr: false });

// La pagina pide un conjunto acotado para que la vista ajustada se lea: el default de la
// API (DEFAULT_GRAPH_NODES de graph-schemas) no se toca.
const EXPLORE_GRAPH_NODES = 80;

// Layout en grid ancho: cada seccion es una banda apilada de arriba hacia abajo y dentro
// de la banda los trucos fluyen de izquierda a derecha. El numero de columnas se calcula
// para que el grid tenga un aspecto ancho cercano al del contenedor; si fuera fijo y
// chico el layout quedaria alto y angosto y la camara ajustaria por el alto, dejando el
// ancho vacio.
const ITEM_GAP = 48;
const ROW_GAP = 18;
const BAND_GAP = 10;
const TARGET_ASPECT = 1.6;
const MIN_COLS = 6;
const MAX_COLS = 28;

const EMPTY_NODES: GraphNodeItem[] = [];

const EDGE_STROKE: Record<GraphEdgeItem['kind'], string> = {
  prereq: 'var(--color-secondary)',
  next: 'var(--color-primary)',
  stance: 'var(--color-muted)',
  variation: 'var(--color-info)',
};

function useColorMode(): 'light' | 'dark' {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const read = () => {
      setMode(document.documentElement.dataset.theme === 'tricking-dark' ? 'dark' : 'light');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}

function findNeighbor(
  current: { id: string; x: number; y: number },
  positions: Map<string, { x: number; y: number }>,
  direction: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown',
): string | null {
  let best: { id: string; score: number } | null = null;
  for (const [id, position] of positions) {
    if (id === current.id) {
      continue;
    }
    const dx = position.x - current.x;
    const dy = position.y - current.y;
    let primary: number;
    let secondary: number;
    if (direction === 'ArrowRight') {
      if (dx <= 0) continue;
      primary = dx;
      secondary = Math.abs(dy);
    } else if (direction === 'ArrowLeft') {
      if (dx >= 0) continue;
      primary = -dx;
      secondary = Math.abs(dy);
    } else if (direction === 'ArrowDown') {
      // La Y de three crece hacia arriba; "abajo" en pantalla es una Y menor.
      if (dy >= 0) continue;
      primary = -dy;
      secondary = Math.abs(dx);
    } else {
      if (dy <= 0) continue;
      primary = dy;
      secondary = Math.abs(dx);
    }
    const score = primary + secondary * 2;
    if (best === null || score < best.score) {
      best = { id, score };
    }
  }
  return best?.id ?? null;
}

interface ExploreGraphProps {
  initial: GraphFilters;
}

export function ExploreGraph({ initial }: ExploreGraphProps) {
  const t = useTranslations('explore');
  const router = useRouter();
  const pathname = usePathname();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  const colorMode = useColorMode();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filters = initial;
  const hasActiveFilters =
    filters.section !== undefined ||
    filters.category !== undefined ||
    filters.difficulty !== undefined ||
    filters.stance !== undefined;

  const query = useQuery({
    queryKey: ['graph', filters],
    queryFn: ({ signal }) => fetchGraph({ ...filters, maxNodes: EXPLORE_GRAPH_NODES }, signal),
    // Cache agresivo: el grafo cambia poco. El persister del monorepo acota la copia en
    // localStorage a un dia; el gcTime largo mantiene el dato en memoria de la sesion.
    staleTime: ONE_DAY_MS,
    gcTime: SEVEN_DAYS_MS,
  });

  const applyFilters = useCallback(
    (patch: Partial<GraphFilters>) => {
      const next: GraphFilters = { ...filters, ...patch };
      const params = new URLSearchParams();
      if (next.section !== undefined) params.set('section', next.section);
      if (next.category !== undefined) params.set('category', next.category);
      if (next.difficulty !== undefined) params.set('difficulty', String(next.difficulty));
      if (next.stance !== undefined) params.set('stance', next.stance);
      const qs = params.toString();
      router.replace(qs !== '' ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const data = query.data;
  const graphNodes = data?.nodes ?? EMPTY_NODES;

  // Si el nodo seleccionado deja de existir (por ejemplo al cambiar un filtro), se
  // limpia la seleccion para no dejar un aria-pressed ni un panel colgando.
  useEffect(() => {
    if (selectedId !== null && !graphNodes.some((node) => node.id === selectedId)) {
      setSelectedId(null);
    }
  }, [graphNodes, selectedId]);

  // Disposicion determinista y horizontal: cada seccion es una banda apilada de arriba
  // hacia abajo (en el orden de SECTIONS mas 'other') y dentro de la banda los trucos
  // fluyen de izquierda a derecha. El numero de columnas se deriva del total de nodos
  // para que el grid sea ancho; la Y de three crece hacia arriba, por eso las bandas van
  // en Y negativa. No depende de la seleccion para que el lienzo no se reconstruya.
  const layout = useMemo(() => {
    const groups = new Map<string, GraphNodeItem[]>();
    for (const node of graphNodes) {
      // Una seccion desconocida (fuera de SECTIONS) se agrupa como 'other' para que el
      // nodo no quede fuera del orden de bandas y desaparezca del lienzo y de la capa
      // accesible.
      const key = node.section !== null && isSection(node.section) ? node.section : 'other';
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(node);
      } else {
        groups.set(key, [node]);
      }
    }

    const columns = Math.min(
      MAX_COLS,
      Math.max(MIN_COLS, Math.round(Math.sqrt(Math.max(graphNodes.length, 1) * TARGET_ASPECT))),
    );

    const order = [...SECTIONS, 'other'];
    const nodes: GraphCanvasNode[] = [];
    const positions = new Map<string, { x: number; y: number }>();
    let bandTop = 0;
    for (const key of order) {
      const group = groups.get(key);
      if (!group) {
        continue;
      }
      const rows = Math.ceil(group.length / columns);
      for (const [index, node] of group.entries()) {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = column * ITEM_GAP;
        const y = -(bandTop + row * ROW_GAP);
        positions.set(node.id, { x, y });
        nodes.push({
          id: node.id,
          name: node.name,
          x,
          y,
          z: 0,
          difficulty: node.difficulty,
          categories: node.categories,
        });
      }
      bandTop += rows * ROW_GAP + BAND_GAP;
    }

    return { nodes, positions };
  }, [graphNodes]);

  const canvasEdges = useMemo<GraphCanvasEdge[]>(() => data?.edges ?? [], [data?.edges]);

  const selectedNode = graphNodes.find((node) => node.id === selectedId) ?? null;

  const handleFlowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const;
    const direction = arrowKeys.find((key) => key === event.key);
    if (direction === undefined || !(event.target instanceof HTMLElement)) {
      return;
    }
    const nodeId = event.target.dataset.nodeId;
    const currentPosition = nodeId !== undefined ? layout.positions.get(nodeId) : undefined;
    if (nodeId === undefined || currentPosition === undefined) {
      return;
    }
    event.preventDefault();
    const neighbor = findNeighbor({ id: nodeId, ...currentPosition }, layout.positions, direction);
    if (neighbor !== null) {
      const target = flowRef.current?.querySelector<HTMLElement>(
        `[data-node-id="${CSS.escape(neighbor)}"]`,
      );
      target?.focus();
    }
  };

  const legendItems: { kind: GraphEdgeItem['kind']; label: string }[] = [
    { kind: 'prereq', label: t('legend.prereq') },
    { kind: 'next', label: t('legend.next') },
    { kind: 'stance', label: t('legend.stance') },
    { kind: 'variation', label: t('legend.variation') },
  ];

  const hasNodes = data !== undefined && graphNodes.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <ExploreFilters
        filters={filters}
        onChange={applyFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="flex flex-col gap-2">
        <p className="text-sm text-base-content/70" aria-live="polite">
          {data !== undefined
            ? graphNodes.length === 0
              ? t('results.none')
              : t('results.range', { shown: graphNodes.length, total: data.total })
            : null}
        </p>
        {data?.truncated === true ? (
          <p className="text-xs text-warning">{t('results.truncated', { max: data.maxNodes })}</p>
        ) : null}
      </div>

      <div className="tb-surface relative h-[65vh] min-h-[420px] overflow-hidden">
        {!mounted ? (
          <div className="p-4">
            <TrickListSkeleton items={3} />
          </div>
        ) : null}

        {mounted && query.isPending ? (
          <div className="flex h-full items-center justify-center">
            <LoadingState label={t('states.loading')} />
          </div>
        ) : null}

        {mounted && query.isError ? (
          <div className="p-4">
            <ErrorState
              title={t('states.errorTitle')}
              description={t('states.errorDescription')}
              action={
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => query.refetch()}
                >
                  {t('states.retry')}
                </button>
              }
            />
          </div>
        ) : null}

        {mounted && data !== undefined && graphNodes.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={hasActiveFilters ? t('states.emptyFilteredTitle') : t('states.emptyTitle')}
              description={
                hasActiveFilters
                  ? t('states.emptyFilteredDescription')
                  : t('states.emptyDescription')
              }
            />
          </div>
        ) : null}

        {mounted && hasNodes ? (
          <div
            ref={flowRef}
            role="group"
            aria-label={t('graph.label')}
            className="relative h-full"
            onKeyDown={handleFlowKeyDown}
          >
            <ExploreGraphCanvas
              nodes={layout.nodes}
              edges={canvasEdges}
              selectedId={selectedId}
              colorMode={colorMode}
              onSelect={handleSelect}
              onDeselect={clearSelection}
            />
            {/* Capa DOM accesible: un control focusable por nodo. Va oculta a la vista
                con sr-only (nunca display:none) para seguir siendo focusable y visible
                para Playwright; la seleccion con puntero la resuelve el raycasting. */}
            {layout.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                data-node-id={node.id}
                aria-label={node.name}
                aria-pressed={node.id === selectedId}
                onClick={() => handleSelect(node.id)}
                className="sr-only pointer-events-none"
              />
            ))}
            <ExploreNodePanel node={selectedNode} onClose={clearSelection} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-base-content/60">{t('graph.hint')}</p>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-base-content/70">
          {legendItems.map((item) => (
            <li key={item.kind} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block w-6"
                style={{
                  borderTopColor: EDGE_STROKE[item.kind],
                  borderTopStyle:
                    item.kind === 'stance' || item.kind === 'variation' ? 'dashed' : 'solid',
                  borderTopWidth: 2,
                }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
