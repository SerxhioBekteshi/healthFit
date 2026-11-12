import React from 'react';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import { balanceFilterProblems } from '@/utils/filters';
import type { BalanceHistoryFilters } from '@gym/shared/types';

interface BalanceFiltersProps {
  value: BalanceHistoryFilters;
  onChange: (next: BalanceHistoryFilters) => void;
}

// Date range and amount range of the transaction history.
export const BalanceFilters: React.FC<BalanceFiltersProps> = ({
  value,
  onChange,
}) => {
  const problems = balanceFilterProblems(value);

  const setDate =
    (key: 'from' | 'to') =>
    (event: React.ChangeEvent<HTMLInputElement>): void =>
      onChange({ ...value, [key]: event.target.value || undefined });

  const setAmount =
    (key: 'minAmount' | 'maxAmount') =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const raw = event.target.value;
      const amount = Number(raw);
      onChange({
        ...value,
        [key]:
          raw === '' || Number.isNaN(amount) || amount < 0 ? undefined : amount,
      });
    };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="balance-filter-from" label={t('From date')}>
          <input
            id="balance-filter-from"
            type="date"
            className={fieldInputClass}
            value={value.from ?? ''}
            onChange={setDate('from')}
          />
        </FormField>
        <FormField id="balance-filter-to" label={t('To date')}>
          <input
            id="balance-filter-to"
            type="date"
            className={fieldInputClass}
            value={value.to ?? ''}
            onChange={setDate('to')}
          />
        </FormField>
        <FormField id="balance-filter-min" label={t('Min amount')}>
          <input
            id="balance-filter-min"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder="0"
            className={fieldInputClass}
            value={value.minAmount ?? ''}
            onChange={setAmount('minAmount')}
          />
        </FormField>
        <FormField id="balance-filter-max" label={t('Max amount')}>
          <input
            id="balance-filter-max"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            placeholder={t('Any')}
            className={fieldInputClass}
            value={value.maxAmount ?? ''}
            onChange={setAmount('maxAmount')}
          />
        </FormField>
      </div>
      {problems.dates || problems.amounts ? (
        <p role="alert" className="text-xs text-danger">
          {problems.dates ?? problems.amounts}
        </p>
      ) : (
        <p className="text-xs text-bone/45">
          {t('Amounts match money in and money out alike.')}
        </p>
      )}
    </>
  );
};
