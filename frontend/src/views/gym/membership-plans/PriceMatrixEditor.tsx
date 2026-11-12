import React, { useEffect, useMemo, useState } from 'react';
import {
  buildPriceTable,
  DEFAULT_FREQUENCIES,
  sortFrequencies,
} from '@/components/membership-plans/priceTable';
import { FrequencyHeading } from '@/components/membership-plans/PriceMatrix';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { fieldInputClass } from '@/components/common/FormField';
import { getCurrency, t } from '@/i18n';
import { planTerms, weeklyVisitsLabel } from '@/utils/constants/labels';
import { formatMoney } from '@/utils/format';
import type { MembershipPlan } from '@gym/shared/types';
import type { PriceGridValues } from '@gym/shared/validation/membership-plans';

interface PriceMatrixEditorProps {
  // Plans of the gender being edited, inactive ones included.
  plans: MembershipPlan[];
  isSaving: boolean;
  error: string | null;
  onSave: (cells: PriceGridValues['cells']) => Promise<void>;
}

type CellKey = `${number}:${string}`;

const cellKey = (weeklyVisits: number, type: string): CellKey =>
  `${weeklyVisits}:${type}`;

const OPTIONAL_FREQUENCIES = [1, 2, 7, 0];

// The gym's standard price list as an editable table, shaped like the one members see.
export const PriceMatrixEditor: React.FC<PriceMatrixEditorProps> = ({
  plans,
  isSaving,
  error,
  onSave,
}) => {
  const table = useMemo(
    () =>
      buildPriceTable(plans, {
        minColumns: DEFAULT_FREQUENCIES,
        allTerms: true,
      }),
    [plans]
  );

  const initial = useMemo(() => {
    const values: Record<string, string> = {};
    for (const row of table.rows) {
      for (const [weeklyVisits, cell] of Object.entries(row.cells)) {
        if (cell) {
          values[cellKey(Number(weeklyVisits), row.term.type)] = String(
            cell.plan.price
          );
        }
      }
    }
    return values;
  }, [table]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [extraColumns, setExtraColumns] = useState<number[]>([]);

  // Saved prices coming back from the server replace the local draft.
  const initialSignature = JSON.stringify(initial);
  useEffect(() => {
    setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSignature]);

  const columns = sortFrequencies([...table.columns, ...extraColumns]);
  const addable = OPTIONAL_FREQUENCIES.filter(
    (value) => !columns.includes(value)
  );

  const { changes, invalid } = useMemo(() => {
    const result: PriceGridValues['cells'] = [];
    let hasInvalid = false;
    for (const weeklyVisits of columns) {
      for (const term of planTerms) {
        const key = cellKey(weeklyVisits, term.type);
        const draft = (values[key] ?? '').trim();
        if (draft === (initial[key] ?? '')) continue;
        const price = draft === '' ? null : Number(draft);
        if (price !== null && (Number.isNaN(price) || price < 0)) {
          hasInvalid = true;
          continue;
        }
        result.push({ weeklyVisits, type: term.type, price });
      }
    }
    return { changes: result, invalid: hasInvalid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, initial, columns.join(',')]);

  const priceOf = (weeklyVisits: number, type: string): number | null => {
    const draft = (values[cellKey(weeklyVisits, type)] ?? '').trim();
    const price = draft === '' ? NaN : Number(draft);
    return Number.isNaN(price) ? null : price;
  };

  const save = async (): Promise<void> => {
    try {
      await onSave(changes);
    } catch {
      // The error is shown below through the error prop.
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr>
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase leading-snug tracking-[0.16em] text-bone/45">
                {t('Subscription')}
                <br />
                {t('per term')}
              </th>
              {columns.map((weeklyVisits) => (
                <th key={weeklyVisits} className="px-2 py-4 text-center">
                  <FrequencyHeading weeklyVisits={weeklyVisits} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planTerms.map((term) => (
              <tr key={term.type}>
                <th
                  scope="row"
                  className="border-t border-white/10 px-6 py-3 font-display text-lg text-bone"
                >
                  {term.label}
                </th>
                {columns.map((weeklyVisits) => {
                  const key = cellKey(weeklyVisits, term.type);
                  const edited = (values[key] ?? '') !== (initial[key] ?? '');
                  const price = priceOf(weeklyVisits, term.type);
                  const monthly = priceOf(weeklyVisits, 'monthly');
                  const saving =
                    term.months > 1 && price !== null && monthly !== null
                      ? monthly * term.months - price
                      : 0;
                  return (
                    <td
                      key={key}
                      className="border-t border-white/10 px-1.5 py-2.5 text-center"
                    >
                      <input
                        type="number"
                        min={0}
                        step={100}
                        inputMode="numeric"
                        placeholder="—"
                        value={values[key] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        aria-label={t(
                          '{{term}}, {{frequency}}, price in {{currency}}',
                          {
                            term: term.label,
                            frequency: weeklyVisitsLabel(weeklyVisits),
                            currency: getCurrency(),
                          }
                        )}
                        className={`${fieldInputClass} text-center font-semibold tabular-nums ${
                          edited ? 'border-signal/60' : ''
                        }`}
                      />
                      <span className="mt-1 block h-3.5 text-[0.65rem] font-medium text-signal">
                        {saving > 0
                          ? t('save {{amount}}', {
                              amount: formatMoney(saving),
                            })
                          : ''}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
        <div className="flex items-center gap-3 text-xs text-bone/50">
          <span>{t('Leave a price empty to take it off the list.')}</span>
          {addable.length > 0 ? (
            <select
              aria-label={t('Add a weekly frequency')}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-bone"
              value=""
              onChange={(event) => {
                const value = Number(event.target.value);
                setExtraColumns((current) => [...current, value]);
              }}
            >
              <option value="">{t('+ Add frequency')}</option>
              {addable.map((value) => (
                <option key={value} value={value}>
                  {weeklyVisitsLabel(value)}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={changes.length === 0 || isSaving}
            onClick={() => setValues(initial)}
          >
            {t('Discard')}
          </Button>
          <Button
            loading={isSaving}
            disabled={changes.length === 0 || invalid}
            onClick={save}
          >
            {changes.length === 0
              ? t('Saved')
              : changes.length === 1
                ? t('Save 1 change')
                : t('Save {{n}} changes', { n: changes.length })}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="px-6 pb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
    </div>
  );
};
