import { apiClient } from '@/api/client';
import type { BalanceHistoryFilters, BalanceSummary } from '@gym/shared/types';

export const balanceService = {
  // Filters are optional and combine with paging; `undefined` ones are left out of the request.
  summary: (cursor?: string, filters: BalanceHistoryFilters = {}) =>
    apiClient.get<BalanceSummary>('/balance', {
      cursor,
      from: filters.from,
      to: filters.to,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
    }),
};
