import type {
  BalanceHistoryFilters,
  MembershipHistoryFilters,
} from '@gym/shared/types';
import { t } from '@/i18n';

export const countFilters = (filters: object): number =>
  Object.values(filters).filter((value) => value !== undefined).length;

export const balanceFilterProblems = (
  filters: BalanceHistoryFilters
): { dates?: string; amounts?: string } => ({
  dates:
    filters.from && filters.to && filters.from > filters.to
      ? t('The start date is after the end date.')
      : undefined,
  amounts:
    filters.minAmount !== undefined &&
    filters.maxAmount !== undefined &&
    filters.minAmount > filters.maxAmount
      ? t('The minimum is above the maximum.')
      : undefined,
});

// An inverted range would only be rejected by the API, so it is left out of the request.
export const sendableBalanceFilters = (
  filters: BalanceHistoryFilters
): BalanceHistoryFilters => {
  const problems = balanceFilterProblems(filters);
  return {
    ...filters,
    ...(problems.dates ? { from: undefined, to: undefined } : {}),
    ...(problems.amounts ? { minAmount: undefined, maxAmount: undefined } : {}),
  };
};

export const membershipFilterProblem = (
  filters: MembershipHistoryFilters
): string | undefined =>
  filters.from && filters.to && filters.from > filters.to
    ? t('The start date is after the end date.')
    : undefined;

export const sendableMembershipFilters = (
  filters: MembershipHistoryFilters
): MembershipHistoryFilters =>
  membershipFilterProblem(filters)
    ? { ...filters, from: undefined, to: undefined }
    : filters;
