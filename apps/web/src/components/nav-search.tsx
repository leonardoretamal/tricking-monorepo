'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';

const SEARCH_INPUT_ID = 'nav-search-input';
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

// Busqueda en la navbar (Fase 12). El input navega a /search?q= con debounce de 400 ms
// (dentro del rango de 300 a 500 ms). En movil se colapsa a un icono que abre el input;
// en escritorio el input esta siempre visible. Operable por teclado (Enter y Escape).
export function NavSearch() {
  const tActions = useTranslations('actions');
  const tSearch = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastNavigatedRef = useRef('');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const navigate = (q: string) => {
    lastNavigatedRef.current = q;
    const href = `/search?q=${encodeURIComponent(q)}`;
    if (pathname === '/search') {
      router.replace(href);
    } else {
      router.push(href);
    }
  };

  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_QUERY_LENGTH || lastNavigatedRef.current === q) {
      return;
    }
    const handle = setTimeout(() => navigate(q), DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // navigate depende de pathname y router; el guard por lastNavigatedRef evita repetir.
  }, [value, pathname, router]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const q = value.trim();
      if (q.length >= MIN_QUERY_LENGTH) {
        navigate(q);
      }
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <form role="search" aria-label={tActions('search')} className="flex items-center">
      <button
        type="button"
        className="btn btn-ghost btn-square btn-sm md:hidden"
        aria-label={tActions('search')}
        aria-expanded={open}
        aria-controls={SEARCH_INPUT_ID}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Search aria-hidden="true" className="size-5" />
        )}
      </button>

      <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
        {tSearch('inputLabel')}
      </label>
      <input
        id={SEARCH_INPUT_ID}
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tSearch('inputPlaceholder')}
        className={`input input-bordered input-sm w-40 lg:w-56 ${open ? 'block' : 'hidden'} md:block`}
      />
    </form>
  );
}
