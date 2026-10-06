'use client';

import { EmptyState } from '@tricking/ui';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ComboEditor } from '@/components/combo-editor';
import {
  COMBO_MAX_SAVED,
  COMBO_STATUS_LABEL_KEY,
  type ComboStatus,
  type SavedCombo,
} from '@/lib/combo-schemas';
import { useComboStore } from '@/lib/combo-store';

// Listado de combinaciones guardadas (Fase 28) con edicion, exportacion a texto plano y
// borrado con modal de confirmacion. Se monta en /progress; se hidrata del store local.

const FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const STATUS_BADGE: Record<ComboStatus, string> = {
  draft: 'badge-ghost',
  practicing: 'badge-warning',
  mastered: 'badge-success',
};

function comboToText(combo: SavedCombo): string {
  const lines: string[] = [combo.title];
  if (combo.description !== undefined && combo.description.trim() !== '') {
    lines.push(combo.description.trim());
  }
  lines.push('');
  combo.steps.forEach((step, index) => {
    lines.push(`${index + 1}. ${step.name}`);
    if (step.note !== undefined && step.note.trim() !== '') {
      lines.push(`   ${step.note.trim()}`);
    }
  });
  return lines.join('\n');
}

function fileNameFor(combo: SavedCombo): string {
  const slug = combo.title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug === '' ? 'combo' : slug}.txt`;
}

export function ComboList() {
  const t = useTranslations('progress.savedCombos');
  const combos = useComboStore((state) => state.combos);
  const hydrate = useComboStore((state) => state.hydrate);
  const removeCombo = useComboStore((state) => state.removeCombo);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (deletingId !== null && !dialog.open) {
      dialog.showModal();
    }
    if (deletingId === null && dialog.open) {
      dialog.close();
    }
  }, [deletingId]);

  const editingCombo = editingId !== null ? (combos.find((c) => c.id === editingId) ?? null) : null;
  const deletingCombo =
    deletingId !== null ? (combos.find((c) => c.id === deletingId) ?? null) : null;

  const handleExport = (combo: SavedCombo): void => {
    try {
      const blob = new Blob([`${comboToText(combo)}\n`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileNameFor(combo);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(t('exported'));
    } catch {
      toast.error(t('exportError'));
    }
  };

  const confirmDelete = (): void => {
    if (deletingId !== null) {
      if (editingId === deletingId) {
        setEditingId(null);
      }
      removeCombo(deletingId);
      toast.success(t('deleted'));
    }
    setDeletingId(null);
  };

  return (
    <section className="tb-surface">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h2 className="tb-display text-2xl text-base-content">{t('title')}</h2>
            <p className="max-w-2xl text-sm text-base-content/70">{t('description')}</p>
          </div>
          <span className="text-sm text-base-content/70">
            {t('counter', { count: combos.length, max: COMBO_MAX_SAVED })}
          </span>
        </div>

        {combos.length === 0 ? (
          <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {combos.map((combo) => (
              <li
                key={combo.id}
                className="flex flex-col gap-2 rounded-box border border-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-base-content">{combo.title}</h3>
                  <span className={`badge ${STATUS_BADGE[combo.status]}`}>
                    {t(`statuses.${COMBO_STATUS_LABEL_KEY[combo.status]}`)}
                  </span>
                  <span className="text-xs text-base-content/60">
                    {t('stepsCount', { count: combo.steps.length })}
                  </span>
                </div>
                {combo.description !== undefined && combo.description.trim() !== '' ? (
                  <p className="text-sm text-base-content/70">{combo.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`btn btn-outline btn-sm ${FOCUS_CLASS}`}
                    onClick={() => setEditingId(combo.id)}
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                    {t('edit')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline btn-sm ${FOCUS_CLASS}`}
                    onClick={() => handleExport(combo)}
                  >
                    <Download aria-hidden="true" className="size-4" />
                    {t('export')}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-outline btn-error btn-sm ${FOCUS_CLASS}`}
                    onClick={() => setDeletingId(combo.id)}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                    {t('delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {combos.length >= COMBO_MAX_SAVED ? (
          <p className="text-sm text-base-content/70" role="status">
            {t('limitReached')}
          </p>
        ) : null}

        {editingCombo !== null ? (
          <ComboEditor combo={editingCombo} onClose={() => setEditingId(null)} />
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="combo-delete-title"
        aria-describedby="combo-delete-description"
        onClose={() => setDeletingId(null)}
      >
        <div className="modal-box">
          <h2 id="combo-delete-title" className="text-lg font-semibold text-base-content">
            {t('deleteTitle')}
          </h2>
          <p id="combo-delete-description" className="py-4 text-sm text-base-content/80">
            {deletingCombo !== null && deletingCombo.title.trim() !== ''
              ? t('deleteDescriptionNamed', { title: deletingCombo.title })
              : t('deleteDescription')}
          </p>
          <div className="modal-action">
            <button
              type="button"
              className={`btn btn-ghost ${FOCUS_CLASS}`}
              onClick={() => setDeletingId(null)}
            >
              {t('deleteCancel')}
            </button>
            <button
              type="button"
              className={`btn btn-error ${FOCUS_CLASS}`}
              onClick={confirmDelete}
            >
              {t('deleteConfirm')}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" aria-label={t('deleteCancel')} />
        </form>
      </dialog>
    </section>
  );
}
