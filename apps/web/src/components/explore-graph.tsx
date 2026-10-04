'use client';

import '@xyflow/react/dist/style.css';

import { useQuery } from '@tanstack/react-query';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { ONE_DAY_MS, SEVEN_DAYS_MS } from '@tricking/shared';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  TrickListSkeleton,
  categoryBadgeColor,
  categoryColorClass,
} from '@tricking/ui';
import { useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { fetchGraph } from '@/lib/graph-api';
import {
  DEFAULT_GRAPH_NODES,
  type GraphEdgeItem,
  type GraphFilters,
  type GraphNodeItem,
} from '@/lib/graph-schemas';
import { SECTIONS } from '@/lib/sections';
import { ExploreFilters } from './explore-filters';
import { ExploreNodePanel } from './explore-node-panel';

// Grafo navegable de la Explore Page. Los nodos son trucos con una disposicion estable
// por seccion (columnas), las aristas salen del backend y el panel lateral muestra el
// resumen sin cambiar de ruta. La cache del grafo es agresiva: se persiste con el
// persister de localStorage del monorepo (ver query-persister.ts).

const NODE_WIDTH = 190;
const NODE_HEIGHT = 68;
const COLUMN_GAP = 56;
const ROW_GAP = 24;

const EDGE_STROKE: Record<GraphEdgeItem['kind'], string> = {
  prereq: 'var(--color-secondary)',
  next: 'var(--color-primary)',
  stance: 'var(--color-muted)',
  variation: 'var(--color-info)',
};

type CategoryLabel = {
  slug: string;
  label: string;
  className: string;
};

type TrickNodeData = {
  name: string;
  isSelected: boolean;
  difficultyLabel: string | null;
  difficultyClassName: string | null;
  categoryLabels: CategoryLabel[];
  onSelect: (id: string) => void;
};

type TrickFlowNode = Node<TrickNodeData, 'trick'>;

function difficultyClass(level: number): string {
  const clamped = Math.min(5, Math.max(0, Math.round(level)));
  return `tb-difficulty-${clamped}`;
}

function TrickNode({ id, data }: NodeProps<TrickFlowNode>) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-node-id={id}
      aria-pressed={data.isSelected}
      aria-label={data.name}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          data.onSelect(id);
        }
      }}
      className={`w-[190px] cursor-pointer rounded-box border bg-base-200 px-3 py-2 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        data.isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'
      }`}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <p className="truncate text-sm font-semibold text-base-content">{data.name}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {data.difficultyLabel !== null && data.difficultyClassName !== null ? (
          <span
            className={`tb-badge inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${data.difficultyClassName}`}
          >
            {data.difficultyLabel}
          </span>
        ) : null}
        {data.categoryLabels.map((category) => (
          <span
            key={category.slug}
            className={`tb-badge inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${category.className}`}
          >
            {category.label}
          </span>
        ))}
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

const nodeTypes = { trick: TrickNode };

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
      if (dy <= 0) continue;
      primary = dy;
      secondary = Math.abs(dx);
    } else {
      if (dy >= 0) continue;
      primary = -dy;
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
  const tTricks = useTranslations('tricks');
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
    queryFn: ({ signal }) => fetchGraph({ ...filters, maxNodes: DEFAULT_GRAPH_NODES }, signal),
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
  const graphNodes = data?.nodes ?? [];

  const layout = useMemo(() => {
    const groups = new Map<string, GraphNodeItem[]>();
    for (const node of graphNodes) {
      const key = node.section ?? 'other';
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(node);
      } else {
        groups.set(key, [node]);
      }
    }

    const order = [...SECTIONS, 'other'];
    const nodes: TrickFlowNode[] = [];
    const positions = new Map<string, { x: number; y: number }>();
    let column = 0;
    for (const key of order) {
      const group = groups.get(key);
      if (!group) {
        continue;
      }
      for (const [row, node] of group.entries()) {
        const position = {
          x: column * (NODE_WIDTH + COLUMN_GAP),
          y: row * (NODE_HEIGHT + ROW_GAP),
        };
        positions.set(node.id, position);
        const categoryLabels: CategoryLabel[] = node.categories.flatMap((slug) => {
          const color = categoryBadgeColor(slug);
          if (!color) {
            return [];
          }
          return [
            { slug, label: tTricks(`categories.${slug}`), className: categoryColorClass(color) },
          ];
        });
        nodes.push({
          id: node.id,
          type: 'trick',
          position,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          data: {
            name: node.name,
            isSelected: node.id === selectedId,
            difficultyLabel:
              node.difficulty !== null
                ? tTricks(`difficulty.${Math.min(5, Math.max(0, Math.round(node.difficulty)))}`)
                : null,
            difficultyClassName: node.difficulty !== null ? difficultyClass(node.difficulty) : null,
            categoryLabels,
            onSelect: handleSelect,
          },
        });
      }
      column += 1;
    }

    return { nodes, positions };
  }, [graphNodes, selectedId, handleSelect, tTricks]);

  const edges = useMemo<Edge[]>(
    () =>
      (data?.edges ?? []).map((edge) => {
        const style: CSSProperties = {
          stroke: EDGE_STROKE[edge.kind],
          strokeWidth: 1.5,
        };
        if (edge.kind === 'stance' || edge.kind === 'variation') {
          style.strokeDasharray = '5 4';
        }
        return {
          id: `${edge.kind}:${edge.source}->${edge.target}`,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          animated: edge.kind === 'next',
          style,
        };
      }),
    [data?.edges],
  );

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

      <div className="relative h-[65vh] min-h-[420px] overflow-hidden rounded-box border border-border bg-base-200">
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
            className="h-full"
            onKeyDown={handleFlowKeyDown}
          >
            <ReactFlow
              nodes={layout.nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => handleSelect(node.id)}
              onPaneClick={() => setSelectedId(null)}
              colorMode={colorMode}
              nodesDraggable={false}
              nodesConnectable={false}
              nodesFocusable={false}
              edgesFocusable={false}
              elementsSelectable
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.2}
              maxZoom={1.6}
              onlyRenderVisibleElements
            >
              <Background gap={20} />
              <Controls showInteractive={false} />
            </ReactFlow>
            <ExploreNodePanel node={selectedNode} onClose={() => setSelectedId(null)} />
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
