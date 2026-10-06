'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

// Acordeon accesible reutilizable. Funciona controlado (expandedIds + onExpandedChange)
// o no controlado (defaultExpandedIds). Cada encabezado es un boton con aria-expanded y
// aria-controls; cada panel es una region con aria-labelledby. Se navega con las flechas,
// Home y End; Enter y Espacio alternan el panel. El foco siempre es visible.

export interface AccordionItem {
  id: string;
  header: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (expandedIds: string[]) => void;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
}

export function Accordion({
  items,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  expandLabel,
  collapseLabel,
  className,
}: AccordionProps) {
  const baseId = useId();
  const [internalExpanded, setInternalExpanded] = useState<string[]>(() => [
    ...(defaultExpandedIds ?? []),
  ]);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);

  const isControlled = expandedIds !== undefined;
  const expanded = isControlled ? [...expandedIds] : internalExpanded;

  const commit = (next: string[]) => {
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
  };

  const toggle = (id: string) => {
    commit(expanded.includes(id) ? expanded.filter((value) => value !== id) : [...expanded, id]);
  };

  const focusAt = (index: number) => {
    if (items.length === 0) {
      return;
    }
    const clamped = (index + items.length) % items.length;
    triggers.current[clamped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isOpen = expanded.includes(item.id);
        const triggerId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id} className="border-b border-border last:border-b-0">
            <h3 className="m-0">
              <button
                type="button"
                id={triggerId}
                ref={(element) => {
                  triggers.current[index] = element;
                }}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex w-full items-center justify-between gap-3 rounded-field px-4 py-4 text-left text-base font-medium text-base-content transition-colors hover:bg-base-300/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isOpen ? 'text-primary' : ''
                }`}
              >
                <span className="min-w-0 flex-1">{item.header}</span>
                {expandLabel || collapseLabel ? (
                  <span className="sr-only">
                    {isOpen ? (collapseLabel ?? expandLabel) : (expandLabel ?? collapseLabel)}
                  </span>
                ) : null}
                <ChevronDown
                  aria-hidden="true"
                  className={`size-5 shrink-0 transition-transform ${
                    isOpen ? 'rotate-180 text-primary' : 'text-base-content/60'
                  }`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="px-4 pb-4 pt-1 text-sm text-base-content/80"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
