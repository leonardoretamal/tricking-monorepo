'use client';

import { Download, Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';

import { PROGRESS_VERSION, progressStateSchema } from '@/lib/progress-schemas';
import { useProgressStore } from '@/lib/progress-store';

const EXPORT_FILE_NAME = 'tricking-progress.json';
const FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function ProgressExport() {
  const t = useTranslations('progress');
  const tricks = useProgressStore((state) => state.tricks);
  const replaceAll = useProgressStore((state) => state.replaceAll);
  const clear = useProgressStore((state) => state.clear);
  const hydrate = useProgressStore((state) => state.hydrate);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (confirmOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!confirmOpen && dialog.open) {
      dialog.close();
    }
  }, [confirmOpen]);

  const markedCount = Object.keys(tricks).length;

  const handleExport = (): void => {
    try {
      const payload = {
        version: PROGRESS_VERSION,
        updatedAt: new Date().toISOString(),
        tricks,
      };
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = EXPORT_FILE_NAME;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(t('export.exportSuccess'));
    } catch {
      toast.error(t('export.exportError'));
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.target;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (file === null) {
      return;
    }
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = progressStateSchema.safeParse(parsed);
      if (!result.success) {
        toast.error(t('export.importError'));
        return;
      }
      replaceAll(result.data.tricks);
      toast.success(t('export.importSuccess'));
    } catch {
      toast.error(t('export.readError'));
    }
  };

  const handleClear = (): void => {
    clear();
    setConfirmOpen(false);
    toast.success(t('export.deleteSuccess'));
  };

  return (
    <section className="tb-surface">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="tb-display text-2xl text-base-content">{t('export.title')}</h2>
          <p className="max-w-2xl text-sm text-base-content/70">{t('export.description')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn btn-outline btn-sm ${FOCUS_CLASS}`}
            onClick={handleExport}
            disabled={markedCount === 0}
          >
            <Download aria-hidden="true" className="size-4" />
            {t('export.exportButton')}
          </button>

          <button
            type="button"
            className={`btn btn-outline btn-sm ${FOCUS_CLASS}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload aria-hidden="true" className="size-4" />
            {t('export.importButton')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />

          <button
            type="button"
            className={`btn btn-outline btn-error btn-sm ${FOCUS_CLASS}`}
            onClick={() => setConfirmOpen(true)}
            disabled={markedCount === 0}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            {t('export.deleteButton')}
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="progress-delete-title"
        aria-describedby="progress-delete-description"
        onClose={() => setConfirmOpen(false)}
      >
        <div className="modal-box">
          <h2 id="progress-delete-title" className="text-lg font-semibold text-base-content">
            {t('export.deleteTitle')}
          </h2>
          <p id="progress-delete-description" className="py-4 text-sm text-base-content/80">
            {t('export.deleteDescription')}
          </p>
          <div className="modal-action">
            <button
              type="button"
              className={`btn btn-ghost ${FOCUS_CLASS}`}
              onClick={() => setConfirmOpen(false)}
            >
              {t('export.deleteCancel')}
            </button>
            <button type="button" className={`btn btn-error ${FOCUS_CLASS}`} onClick={handleClear}>
              {t('export.deleteConfirm')}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" aria-label={t('export.deleteCancel')} />
        </form>
      </dialog>
    </section>
  );
}
