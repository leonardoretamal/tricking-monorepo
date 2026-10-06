'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';

import {
  COMBO_STATUSES,
  COMBO_STATUS_LABEL_KEY,
  type ComboStatus,
  type SavedCombo,
  type SavedComboStep,
} from '@/lib/combo-schemas';
import { useComboStore } from '@/lib/combo-store';

// Editor tipo nota de una combinacion guardada (Fase 28). Lista numerada de pasos con
// reordenar por teclado y nota por paso, mas titulo, descripcion y estado. Guarda con el
// store local; valida titulo y longitudes antes de persistir, con error debajo del input.

const FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// Topes que deben coincidir con savedComboSchema (combo-schemas.ts). No se cambian aqui.
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 500;
const NOTE_MAX = 500;

type TitleError = 'required' | 'tooLong';

function titleErrorFor(value: string): TitleError | null {
  if (value.trim() === '') {
    return 'required';
  }
  if (value.length > TITLE_MAX) {
    return 'tooLong';
  }
  return null;
}

export interface ComboEditorProps {
  combo: SavedCombo;
  onClose: () => void;
}

export function ComboEditor({ combo, onClose }: ComboEditorProps) {
  const t = useTranslations('progress.savedCombos');
  const updateCombo = useComboStore((state) => state.updateCombo);

  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const titleErrorId = useId();
  const descriptionErrorId = useId();

  const [title, setTitle] = useState(combo.title);
  const [description, setDescription] = useState(combo.description ?? '');
  const [status, setStatus] = useState<ComboStatus>(combo.status);
  const [steps, setSteps] = useState<SavedComboStep[]>(combo.steps);
  const [titleError, setTitleError] = useState<TitleError | null>(null);
  const [descriptionError, setDescriptionError] = useState(false);
  const [noteErrorIndex, setNoteErrorIndex] = useState<number | null>(null);

  const moveStep = (index: number, direction: -1 | 1): void => {
    const target = index + direction;
    if (target < 0 || target >= steps.length) {
      return;
    }
    setSteps((current) => {
      const next = [...current];
      const from = next[index];
      const to = next[target];
      if (from === undefined || to === undefined) {
        return current;
      }
      next[index] = to;
      next[target] = from;
      return next;
    });
  };

  const setNote = (index: number, note: string): void => {
    setSteps((current) =>
      current.map((step, position) => (position === index ? { ...step, note } : step)),
    );
    if (noteErrorIndex === index && note.length <= NOTE_MAX) {
      setNoteErrorIndex(null);
    }
  };

  const handleSave = (): void => {
    const nextTitleError = titleErrorFor(title);
    const nextDescriptionError = description.length > DESCRIPTION_MAX;
    const badNote = steps.findIndex((step) => (step.note?.length ?? 0) > NOTE_MAX);

    setTitleError(nextTitleError);
    setDescriptionError(nextDescriptionError);
    setNoteErrorIndex(badNote === -1 ? null : badNote);

    if (nextTitleError !== null || nextDescriptionError || badNote !== -1) {
      return;
    }

    const ok = updateCombo(combo.id, { title: title.trim(), description, status, steps });
    if (ok) {
      toast.success(t('saved'));
      onClose();
    } else {
      toast.error(t('saveError'));
    }
  };

  return (
    <div className="tb-surface flex flex-col gap-4 p-4 sm:p-5">
      <h3 className="tb-display text-xl text-base-content">{t('editorTitle')}</h3>

      <div className="flex flex-col gap-1">
        <label htmlFor={titleId} className="text-sm font-medium text-base-content">
          {t('titleLabel')}
        </label>
        <input
          id={titleId}
          type="text"
          className={`input input-bordered w-full ${titleError !== null ? 'input-error' : ''}`}
          value={title}
          maxLength={TITLE_MAX}
          placeholder={t('titlePlaceholder')}
          aria-invalid={titleError !== null}
          aria-describedby={titleError !== null ? titleErrorId : undefined}
          onChange={(event) => {
            const value = event.target.value;
            setTitle(value);
            if (titleError !== null && titleErrorFor(value) === null) {
              setTitleError(null);
            }
          }}
          onBlur={() => setTitleError(titleErrorFor(title))}
        />
        {titleError !== null ? (
          <p id={titleErrorId} role="alert" className="text-sm text-error">
            {titleError === 'required' ? t('titleRequired') : t('titleTooLong')}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={descriptionId} className="text-sm font-medium text-base-content">
          {t('descriptionLabel')}
        </label>
        <textarea
          id={descriptionId}
          className={`textarea textarea-bordered w-full ${descriptionError ? 'textarea-error' : ''}`}
          rows={2}
          value={description}
          maxLength={DESCRIPTION_MAX}
          aria-invalid={descriptionError}
          aria-describedby={descriptionError ? descriptionErrorId : undefined}
          onChange={(event) => {
            const value = event.target.value;
            setDescription(value);
            if (descriptionError && value.length <= DESCRIPTION_MAX) {
              setDescriptionError(false);
            }
          }}
          onBlur={() => setDescriptionError(description.length > DESCRIPTION_MAX)}
        />
        {descriptionError ? (
          <p id={descriptionErrorId} role="alert" className="text-sm text-error">
            {t('descriptionTooLong')}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={statusId} className="text-sm font-medium text-base-content">
          {t('statusLabel')}
        </label>
        <select
          id={statusId}
          className="select select-bordered w-full sm:w-64"
          value={status}
          onChange={(event) => {
            const found = COMBO_STATUSES.find((item) => item === event.target.value);
            if (found !== undefined) {
              setStatus(found);
            }
          }}
        >
          {COMBO_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`statuses.${COMBO_STATUS_LABEL_KEY[value]}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-base-content">{t('stepsLabel')}</span>
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => {
            const noteId = `combo-step-note-${combo.id}-${index}`;
            const noteErrorId = `combo-step-note-error-${combo.id}-${index}`;
            const hasNoteError = noteErrorIndex === index;
            return (
              <li
                key={`${step.trickId}-${index}`}
                className="flex flex-col gap-2 rounded-box border border-border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-neutral">{index + 1}</span>
                  <span className="font-medium text-base-content">{step.name}</span>
                  {step.difficulty !== null && step.difficulty !== undefined ? (
                    <span className={`badge tb-badge tb-difficulty-${step.difficulty}`}>
                      {step.difficulty}
                    </span>
                  ) : null}
                  <div className="ms-auto flex items-center gap-1">
                    <button
                      type="button"
                      className={`btn btn-ghost btn-xs ${FOCUS_CLASS}`}
                      onClick={() => moveStep(index, -1)}
                      disabled={index === 0}
                      aria-label={t('moveUp', { name: step.name })}
                      title={t('moveUp', { name: step.name })}
                    >
                      <ArrowUp aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-ghost btn-xs ${FOCUS_CLASS}`}
                      onClick={() => moveStep(index, 1)}
                      disabled={index === steps.length - 1}
                      aria-label={t('moveDown', { name: step.name })}
                      title={t('moveDown', { name: step.name })}
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </div>
                <input
                  id={noteId}
                  type="text"
                  className={`input input-bordered input-sm w-full ${hasNoteError ? 'input-error' : ''}`}
                  value={step.note ?? ''}
                  maxLength={NOTE_MAX}
                  placeholder={t('notePlaceholder')}
                  aria-label={t('noteLabel', { name: step.name })}
                  aria-invalid={hasNoteError}
                  aria-describedby={hasNoteError ? noteErrorId : undefined}
                  onChange={(event) => setNote(index, event.target.value)}
                  onBlur={() => {
                    if ((step.note?.length ?? 0) > NOTE_MAX) {
                      setNoteErrorIndex(index);
                    }
                  }}
                />
                {hasNoteError ? (
                  <p id={noteErrorId} role="alert" className="text-sm text-error">
                    {t('noteTooLong')}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn btn-primary btn-sm ${FOCUS_CLASS}`}
          onClick={handleSave}
        >
          {t('save')}
        </button>
        <button type="button" className={`btn btn-ghost btn-sm ${FOCUS_CLASS}`} onClick={onClose}>
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
