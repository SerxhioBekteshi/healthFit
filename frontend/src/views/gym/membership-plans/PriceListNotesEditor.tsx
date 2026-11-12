import React, { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import { MAX_PRICE_LIST_NOTES } from '@gym/shared/validation/price-lists';

interface PriceListNotesEditorProps {
  notes: string[];
  isSaving: boolean;
  error: string | null;
  onSave: (notes: string[]) => Promise<void>;
}

// Short lines shown under the price list, e.g. "Subscription at any hour of the day".
export const PriceListNotesEditor: React.FC<PriceListNotesEditorProps> = ({
  notes,
  isSaving,
  error,
  onSave,
}) => {
  const [draft, setDraft] = useState<string[]>(notes);

  const signature = JSON.stringify(notes);
  useEffect(() => {
    setDraft(notes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const cleaned = draft.map((line) => line.trim()).filter(Boolean);
  const changed = JSON.stringify(cleaned) !== signature;

  const save = async (): Promise<void> => {
    try {
      await onSave(cleaned);
    } catch {
      // The error is shown below through the error prop.
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-5">
      <ul className="space-y-2">
        {draft.map((line, index) => (
          <li key={index} className="flex gap-2">
            <input
              className={fieldInputClass}
              value={line}
              maxLength={160}
              aria-label={t('Note {{n}}', { n: index + 1 })}
              onChange={(event) =>
                setDraft((current) =>
                  current.map((item, position) =>
                    position === index ? event.target.value : item
                  )
                )
              }
            />
            <Button
              variant="ghost"
              icon="trash"
              aria-label={t('Remove note {{n}}', { n: index + 1 })}
              onClick={() =>
                setDraft((current) =>
                  current.filter((_, position) => position !== index)
                )
              }
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          icon="plus"
          disabled={draft.length >= MAX_PRICE_LIST_NOTES}
          onClick={() => setDraft((current) => [...current, ''])}
        >
          {t('Add note')}
        </Button>
        <Button loading={isSaving} disabled={!changed} onClick={save}>
          {changed ? t('Save notes') : t('Saved')}
        </Button>
      </div>

      {error ? <Alert className="mt-4">{error}</Alert> : null}
    </div>
  );
};
