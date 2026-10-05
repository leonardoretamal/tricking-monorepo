'use client';

import { MessageCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AssistantChat } from '@/components/assistant-chat';
import { usePathname } from '@/i18n/navigation';
import { useProgressStore } from '@/lib/progress-store';

// Asistente de tricking como burbuja flotante (Fase 22). La burbuja se transforma en el
// chat: al abrir, el boton se desvanece y el panel crece desde la misma esquina. No abre
// una seccion nueva. El historial vive solo en memoria del componente y se pierde al
// recargar (no se persiste ni se guarda en la base). Lee los trucos que el usuario ya
// tiene del progreso local para personalizar las respuestas.
export function AssistantBubble() {
  const t = useTranslations('assistant');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const hydrate = useProgressStore((state) => state.hydrate);
  const tricks = useProgressStore((state) => state.tricks);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const knownTrickIds = useMemo(
    () =>
      Object.entries(tricks)
        .filter(([, status]) => status === 'learned')
        .map(([id]) => id),
    [tricks],
  );

  // Foco: al abrir va al campo de texto; al cerrar vuelve al boton. Escape cierra.
  useEffect(() => {
    if (open) {
      document.getElementById('assistant-message')?.focus();
    } else if (wasOpen.current) {
      buttonRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Se oculta en el panel de administracion, que ya tiene sus propios controles.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return null;
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? t('bubble.close') : t('bubble.open')}
        aria-expanded={open}
        aria-controls="assistant-bubble-panel"
        onClick={() => setOpen((value) => !value)}
        className={`btn btn-secondary btn-sm fixed bottom-16 right-5 z-40 gap-2 shadow-lg transition-all duration-150 ${
          open ? 'pointer-events-none scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
        tabIndex={open ? -1 : 0}
      >
        <MessageCircle aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">{t('title')}</span>
      </button>

      <div
        id="assistant-bubble-panel"
        role="dialog"
        aria-label={t('title')}
        aria-hidden={!open}
        className={
          open
            ? 'tb-bubble-panel fixed bottom-16 right-5 z-50 flex max-h-[75vh] w-[min(88vw,24rem)] flex-col overflow-hidden rounded-box border border-border bg-base-100 shadow-2xl'
            : 'hidden'
        }
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-base-content">{t('title')}</h2>
          <button
            type="button"
            aria-label={t('bubble.close')}
            onClick={() => setOpen(false)}
            className="btn btn-ghost btn-square btn-xs"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-3">
          <AssistantChat knownTrickIds={knownTrickIds} />
        </div>
      </div>
    </>
  );
}
