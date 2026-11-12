import { apiClient } from '@/services/api';
import type {
  BalanceHistoryFilters,
  BalanceSummary,
  BalanceTransaction,
} from '@gym/shared/types';
import type { DepositValues } from '@gym/shared/validation/balance';

export const balanceService = {
  summary: (
    clientId?: string,
    cursor?: string,
    filters: BalanceHistoryFilters = {}
  ) => {
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (cursor) params.set('cursor', cursor);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.minAmount !== undefined) {
      params.set('minAmount', String(filters.minAmount));
    }
    if (filters.maxAmount !== undefined) {
      params.set('maxAmount', String(filters.maxAmount));
    }
    const query = params.toString();
    return apiClient.get<BalanceSummary>(
      query ? `/balance?${query}` : '/balance'
    );
  },
  deposit: (input: DepositValues) =>
    apiClient.post<BalanceTransaction>('/balance/deposit', input),
};
