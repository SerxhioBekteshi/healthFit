import React from 'react';
import { FormField, fieldInputClass } from '@/components/common/FormField';
import { t } from '@/i18n';
import { membershipStatusLabels } from '@/utils/constants/labels';
import { membershipFilterProblem } from '@/utils/filters';
import type {
  MembershipHistoryFilters,
  MembershipStatus,
} from '@gym/shared/types';

interface MembershipHistoryFiltersProps {
  value: MembershipHistoryFilters;
  onChange: (next: MembershipHistoryFilters) => void;
}

const statuses = Object.keys(membershipStatusLabels) as MembershipStatus[];

// Status and the period a membership was running in.
export const MembershipHistoryFiltersForm: React.FC<
  MembershipHistoryFiltersProps
> = ({ value, onChange }) => {
  const problem = membershipFilterProblem(value);

  const setDate =
    (key: 'from' | 'to') =>
    (event: React.ChangeEvent<HTMLInputElement>): void =>
      onChange({ ...value, [key]: event.target.value || undefined });

  return (
    <>
      <FormField id="membership-filter-status" label={t('Status')}>
        <select
          id="membership-filter-status"
          className={fieldInputClass}
          value={value.status ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              status: (event.target.value || undefined) as
                MembershipStatus | undefined,
            })
          }
        >
          <option value="">{t('All statuses')}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {membershipStatusLabels[status]}
            </option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="membership-filter-from" label={t('Running from')}>
          <input
            id="membership-filter-from"
            type="date"
            className={fieldInputClass}
            value={value.from ?? ''}
            onChange={setDate('from')}
          />
        </FormField>
        <FormField id="membership-filter-to" label={t('Running until')}>
          <input
            id="membership-filter-to"
            type="date"
            className={fieldInputClass}
            value={value.to ?? ''}
            onChange={setDate('to')}
          />
        </FormField>
      </div>
      {problem ? (
        <p role="alert" className="text-xs text-danger">
          {problem}
        </p>
      ) : (
        <p className="text-xs text-bone/45">
          {t('Shows memberships that were running at any time in this period.')}
        </p>
      )}
    </>
  );
};
